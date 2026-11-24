/**
 * Sources des shaders de la toile principale (gl.js) : trame de points, lentille et logo (FRAG), passe « verre » des
 * vignettes (GLASS). Texte seulement, aucun état : séparé de gl.js pour la lisibilité (même contenu, mêmes chaînes).
 */
import { GLASS_GLSL } from './glass.js'
import KIT_IRIS from '../design/logo-kit/src/iris.glsl?raw'

// roue du logo-kit (source de vérité) : irisColor(p), irisRing(p, Ro) ; irisAt(t) pour une position t sur le cercle
// (0 = en haut, sens horaire, y vers le bas). fwidth vient de OES_standard_derivatives (repli : 1 px).
export const IRIS_GLSL = `#ifndef GL_OES_standard_derivatives
#define fwidth(x) (1.0)
#endif
${KIT_IRIS}
vec3 irisAt(float t) { float a = t * 6.2831853; return irisColor(vec2(sin(a), -cos(a))); }`
export const DERIV = '#extension GL_OES_standard_derivatives : enable\n'

export const VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`


export const FRAG = `precision highp float;
uniform sampler2D uTex;
uniform sampler2D uMask;
uniform vec2 uRes;      // taille de la vue (px CSS)
uniform vec2 uOrigin;   // coin bas gauche de la vue sur la toile (px écran)
uniform vec2 uImg;      // taille de l'image source
uniform vec2 uPos;      // cadrage de l'image (0 à 1, comme object-position ; 0,5 = centré), data-pos sur la vignette
uniform float uDpr;
uniform float uCell;    // pas de la trame (px CSS)
uniform float uReveal;  // 0 : points absents, 1 : trame complète
uniform float uFade;    // fondu des bords haut et bas
uniform float uHasMask;
uniform sampler2D uMaskB;  // champ de distance signée du monogramme
uniform sampler2D uMaskA;  // position le long du S en 16 bits (monogram-along.png : r octet fort, g octet faible)
uniform sampler2D uMaskW;  // demi-épaisseur locale du S (monogram-width.png, unités × 255 / 80)
uniform vec2 uWidthK;      // contraste d'épaisseur du S : coefficient − 1 (0 : tel quel), demi-épaisseur moyenne (unités)
uniform float uFloor;   // taille minimale des points dans le masque
uniform vec2 uLv;       // niveaux de l'image (lumière du point le plus sombre et du plus clair) : étirés de noir à blanc
uniform float uRadius;  // coins arrondis (0 : aucun)
uniform vec3 uLens;     // centre (px CSS), rayon intérieur
uniform float uLensO;   // rayon extérieur de l'anneau
uniform float uSoft;    // largeur (px) du fondu intérieur de l'anneau
uniform float uGlass;   // survol d'une carte : bord de verre (0 à 1)
uniform vec4 uClip;     // piste horizontale : bords gauche et droit (px, dans la vue), largeur du fondu
uniform sampler2D uText; // texte net de la vignette (alpha), à la résolution de l'écran
uniform float uHasText;
uniform float uColor;   // 1 : points de la couleur de l'image (dégradé « En cours »)
uniform vec4 uScr;      // coin haut gauche de la vue à l'écran (px), taille de l'écran (px)
uniform vec4 uMarkXf;   // accueil : monogramme, centre (px), hauteur (px), rotation (rad)
uniform vec4 uTip;      // apparition du S : point de l'axe au front (unités), front (position le long du tracé), longueur du tracé
uniform vec2 uTipT;     // tangente de l'axe au front (unitaire ; nulle : carte de position pas encore chargée)
uniform vec4 uEye;      // renflement du S au survol : centre (unités du monogramme), ampleur (unités), rayon (unités)
uniform vec3 uInk;      // encre du thème (S du monogramme)
uniform float uEdgeFloor; // opacité au ras des bords latéraux de la piste (0 en clair : effacement complet)
uniform float uHal;      // halation (fx-config.js)
uniform vec4 uMono;     // monogramme : largeur (unités), centre du « o » (unités), inutilisé
uniform sampler2D uFlow; // roue animée « flux » (texture 1D du kit, partagée avec le chargeur)

vec2 cover(vec2 p) {
  float s = max(uRes.x / uImg.x, uRes.y / uImg.y);
  vec2 size = uImg * s;
  return clamp((p - (uRes - size) * uPos) / size, 0.001, 0.999);
}
float hash(vec2 c) { return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453); }
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float vnoise(vec2 x) {
  vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
${IRIS_GLSL}
// couleur de la roue « flux » en p (relatif au centre, y vers le bas) : même convention d'angle que irisColor
vec3 flowColor(vec2 p) { float u = fract((degrees(atan(p.y, p.x)) + 90.0 - 180.0) / 360.0); return texture2D(uFlow, vec2(u, 0.5)).rgb; }

${GLASS_GLSL}
// trame en un point : un point par cellule, sa taille suit la lumière de l'image (couleur prémultipliée, alpha).
// off : décalage de la lecture de l'image seulement (la grille de points reste en place : réfraction sans traînées)
vec4 halftoneS(vec2 p, vec2 off) {
  float aa = 0.9 / uDpr;
  if (uHasMask > 0.5) {
    // accueil : le monogramme du kit en aplat (S à l'encre du thème, « o » : roue du kit)
    float upx = uMarkXf.z / 1000.0;                       // px par unité
    vec2 lp = (p - uMarkXf.xy) / upx + vec2(uMono.x * 0.5, 500.0);
    // champ de distance : cadre du monogramme (816 × 1000 unités) plus une marge de 64 unités tout autour (944 × 1128 px,
    // 1 px par unité) : le S frôle le haut et la gauche du cadre, et le renflement ou le contraste d'épaisseur le font
    // déborder ; la marge garde partout la vraie distance (pas de bord aplati ni de pointes). Au-delà : rien
    if (lp.x < -64.0 || lp.y < -64.0 || lp.x > 880.0 || lp.y > 1064.0) return vec4(0.0);
    vec2 muv = (lp + 64.0) / vec2(944.0, 1128.0);
    // champ de distance signée (monogram-sdf.png, en unités, positif dedans ; S en r, « o » en g) : le contour est
    // anticrénelé au pixel de l'écran, net à toutes les tailles (pas d'image du logo agrandie)
    vec4 dc = texture2D(uMaskB, muv);
    float sdS = dc.r * 32.0 - 4.0, sdO = dc.g * 32.0 - 4.0;
    // contour du S déplacé (en unités) : contraste d'épaisseur et renflement au survol
    float shift = 0.0;
    // contraste d'épaisseur : chaque endroit du tracé rapproche (coefficient < 1) ou éloigne (> 1) sa demi-épaisseur de
    // la moyenne ; à 0, toutes les épaisseurs sont égales. Sur l'axe du tracé, la distance au bord vaut la demi-épaisseur
    // locale h : la nouvelle vaut h + (k − 1)(h − moyenne). Carte d'épaisseur lissée : le contour reste continu
    vec4 wc = texture2D(uMaskW, muv);
    // renflement du S sous le curseur (balle qui passe dans un collant) : le tracé s'épaissit localement, en cloche
    // autour de la balle
    float bul = 0.0;
    if (uEye.z > 0.01) { vec2 bd = lp - uEye.xy; bul = uEye.z * exp(-dot(bd, bd) / (2.0 * uEye.w * uEye.w)); shift += bul; }
    if (uWidthK.x != 0.0) {
      // hors du trait, la carte d'épaisseur saute d'une branche du S à l'autre (creux) : un bord renflé qui l'atteint
      // ferait une cassure. Au renflement, au-delà de 6 unités du bord (le contour au repos n'y va jamais), l'épaisseur
      // est lue en revenant vers le bord le long de la pente du champ large (canal B)
      float wr = wc.r, dB = dc.b * 128.0 - 64.0;
      if (bul > 0.01 && dB < -6.0) {
        vec2 ex = vec2(1.0 / 944.0, 0.0), ey = vec2(0.0, 1.0 / 1128.0);
        vec2 g = vec2(texture2D(uMaskB, muv + ex).b - texture2D(uMaskB, muv - ex).b, texture2D(uMaskB, muv + ey).b - texture2D(uMaskB, muv - ey).b);
        float gl = length(g);
        if (gl > 1e-6) wr = texture2D(uMaskW, muv + g / gl * (-dB - 6.0) / vec2(944.0, 1128.0)).r;
      }
      shift += uWidthK.x * (wr * 80.0 - uWidthK.y);
    }
    // apparition du S (uReveal de 0 à 1, après la croissance du « o ») : le S se forme en suivant son tracé, de haut en
    // bas (position le long du tracé : canal B de la carte d'épaisseur, sdf.mjs). Derrière le front, le tracé naît de
    // son axe et prend son épaisseur, avec une boule qui le gonfle un instant au-delà (comme le renflement du survol)
    if (uReveal < 1.0 && uWidthK.y <= 0.0) shift -= 50.0 * (1.0 - uReveal);   // carte pas encore chargée : simple poussée
    // champ du bord déplacé : dedans, le champ précis (R, −4 à 28) ; dehors, la seule distance extérieure de la carte
    // d'épaisseur (G, jusqu'à 64 unités, arrondie dans les creux du S, codée en racine pour être fine près du bord :
    // sdf.mjs). Les deux valent 0 sur le contour ; aucun fondu entre eux (deux pentes différentes mêlées plissaient le
    // bord poussé : petits crans). Au-delà, le champ large (canal B, ±64 unités)
    if (abs(shift) > 0.02) {
      float sdF;
      if (sdS > 20.0) sdF = mix(sdS, dc.b * 128.0 - 64.0, smoothstep(20.0, 27.5, sdS));   // loin dedans : fondu vers le champ large (R plafonne à 28)
      else if (uWidthK.y > 0.0 && wc.g < 0.995) sdF = sdS >= 0.0 ? sdS : -wc.g * wc.g * 64.0;   // dehors : le seul champ G (pas de fondu entre deux champs de pentes différentes : il plissait le bord)
      else sdF = sdS > -3.9 ? sdS : dc.b * 128.0 - 64.0;
      sdS = sdF + shift;
    }
    // apparition du S (uReveal < 1, après la croissance du « o ») : le tracé pousse de son extrémité du haut vers celle du
    // bas en suivant son axe (position le long du tracé en 16 bits : monogram-along.png, sdf.mjs). Le S est coupé au
    // front (a : distance au front le long du tracé, positive derrière) par une intersection arrondie : les deux coins
    // de la coupe prennent le rayon de la demi-épaisseur locale, le bout devient un demi-disque, sans col ni bosse et
    // jamais plus large que le trait. Le front part d'avant le haut du S et finit après son bas
    if (uReveal < 1.0 && uWidthK.y > 0.0 && dot(uTipT, uTipT) > 0.5) {
      vec2 al = texture2D(uMaskA, muv).rg;
      float a = (uTip.z - ((al.r * 65280.0 + al.g * 255.0) / 65535.0 * 1.2 - 0.1)) * uTip.w;
      // près du front, la coupe est la droite perpendiculaire à l'axe au point du front (uTip.xy, tangente uTipT) : une vraie
      // distance, exacte et droite ; plus loin le long du tracé (autres boucles du S qui passeraient près de cette droite),
      // la position le long du tracé seule. Fondu entre les deux là où elles coïncident (au voisinage du front, dans le trait)
      float hw0 = wc.r * 80.0, ap = dot(lp - uTip.xy, uTipT);
      a = mix(a, -ap, smoothstep(2.4 * hw0 + 10.0, 1.4 * hw0 + 4.0, abs(a)));
      float r = clamp(0.9 * (wc.r * 80.0 + uWidthK.x * (wc.r * 80.0 - uWidthK.y)), 2.0, 60.0);
      sdS = max(r, min(sdS, a)) - length(max(vec2(r - sdS, r - a), 0.0));
      shift = 1.0;                                           // anticrénelage selon la pente réelle (plus bas)
    }
    bool isO = sdO > sdS;
    float sd = max(sdS, sdO);
    // le champ de distance s'arrête à −4 unités : au-delà (valeur plafonnée), on est franchement dehors, même quand le
    // logo est si petit que 4 unités font moins d'un demi-pixel (sinon tout son rectangle se teinterait)
    // bord déplacé (contraste, renflement, apparition) : dans les creux, le champ arrondi monte moins vite qu'une vraie
    // distance ; la largeur de l'anticrénelage suit sa pente réelle (fwidth), sinon le bord y deviendrait flou
    float gs = abs(shift) > 0.02 ? clamp(fwidth(sdS) * upx * uDpr * 0.75, 0.3, 1.0) : 1.0;
    float cov = clamp(sd * upx * uDpr / (isO ? 1.0 : gs) + 0.5, 0.0, 1.0) * step(-3.9, sd);   // (renflement : sd déjà relevé, la règle tient)
    if (cov < 0.001) return vec4(0.0);
    // aplat exact du kit (comme design/logo-kit/ref) : S à l'encre du thème, « o » : roue du kit ; bords nets, sans halo
    // roue du « o » : animation « flux » du kit (les couleurs respirent, rien ne tourne ; au repos : la roue finale)
    vec3 g = isO ? flowColor(lp - uMono.yz) : uInk;
    float shapeRev = 1.0;   // apparition du S : par la poussée (plus haut), sans fondu
    float al = cov * shapeRev;
    return vec4(g * cov * shapeRev, al);
  }
  vec2 cell = floor(p / uCell);
  vec2 c = (cell + 0.5) * uCell;
  float l = lum(texture2D(uTex, cover(c + off)).rgb);
  l = clamp((l - uLv.x) / max(uLv.y - uLv.x, 0.05), 0.0, 1.0);   // toujours toute la plage : le plus sombre en noir, le plus clair en blanc
  if (uHasText > 0.5) l = max(l, texture2D(uText, (c + off) / uRes).a);   // texte de la vignette : fait partie de l'image
  float m = 1.0;
  float inWord = 0.0;
  float inO = 0.0;
  if (uHasMask > 0.5) {
    // accueil : le monogramme entier en points (S en r, « o » en g), placé et tourné par le défilement ;
    vec2 d = c - uMarkXf.xy; float cs = cos(uMarkXf.w), sn = sin(uMarkXf.w);
    vec2 lc = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y) / uMarkXf.z;
    vec2 muv = lc / vec2(uMono.x / 1000.0, 1.0) + 0.5;
    vec4 mk = (muv.x > 0.0 && muv.x < 1.0 && muv.y > 0.0 && muv.y < 1.0) ? texture2D(uMask, muv) : vec4(0.0);
    inWord = max(mk.r, mk.g); inO = mk.g; m = inWord;
    l = 0.85;   // logo fixe : points de taille régulière
  }
  float edge = 1.0;
  if (uFade > 0.5) edge = smoothstep(0.0, 0.2 * uRes.y, c.y) * smoothstep(0.0, 0.2 * uRes.y, uRes.y - c.y);
  float rnd = hash(cell);
  float rev = smoothstep(rnd * 0.6, rnd * 0.6 + 0.4, uReveal);
  if (uHasMask > 0.5 && inO > 0.5) rev = 1.0;   // accueil : le « o » est là dès le départ (il vient du chargeur)
  float kk = max(sqrt(clamp(l * 1.2, 0.0, 1.0)), uFloor * inWord) * m;
  float r = uCell * 0.49 * kk * rev * edge;
  float dotA = (1.0 - smoothstep(r - aa, r + aa, length(p - c))) * clamp(r / aa, 0.0, 1.0);
  vec3 dc = mix(vec3(mix(0.2, 0.95, clamp(l * 1.1, 0.0, 1.0))), min(texture2D(uTex, cover(c + off)).rgb * 1.25, 1.0), uColor);   // uColor : 0 gris, 1 couleur
  if (uHasMask > 0.5) {
    // le « o » : points irisés (la couleur tourne lentement) ; le S : points blancs
    float cs = cos(uMarkXf.w), sn = sin(uMarkXf.w);
    vec2 ol = (uMono.yz - vec2(uMono.x * 0.5, 500.0)) / 1000.0 * uMarkXf.z;
    vec2 oc = uMarkXf.xy + vec2(cs * ol.x - sn * ol.y, sn * ol.x + cs * ol.y);
    vec2 ep = c - oc;
    vec3 ic = irisColor(ep);
    dc = mix(vec3(mix(0.7, 1.0, l)), ic * mix(0.8, 1.05, l), step(0.5, inO));
  }
  return vec4(dc * dotA, dotA);
}
vec4 halftone(vec2 p) { return halftoneS(p, vec2(0.0)); }
// distance signée au rectangle aux coins arrondis de la carte (négative à l'intérieur)
float sdCard(vec2 p) {
  vec2 q = abs(p - uRes * 0.5) - (uRes * 0.5 - uRadius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
}
// bord intérieur du verre : même rectangle, rentré de w, coins toujours arrondis (rayon conservé)
float sdInner(vec2 p, float w) {
  float r = uRadius + w * 0.6;                       // rayon intérieur plus grand : la courbe reste douce
  vec2 q = abs(p - uRes * 0.5) - (uRes * 0.5 - w - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// lentille du curseur en un point q (couleur de fond base) : image d’origine nette, anneau du kit
vec3 withLens(vec2 q, vec3 base) {
  float aa = 0.9 / uDpr;
  float R = uLens.z;
  vec3 col = base;
  if (R > 0.5) {
    vec2 lp = q - uLens.xy;
    float d = length(lp);
    if (d < uLensO + 2.0) {
      vec2 le = lp;
      // intérieur de l'anneau : l'image d'origine, nette, sans effet de loupe (ni déformation, ni flou, ni teinte :
      // choix de Johann, 21 novembre 2026)
      vec2 c0 = uLens.xy;
      vec3 orig = texture2D(uTex, cover(c0 + le)).rgb;
      if (uHasText > 0.5) orig = mix(orig, vec3(1.0), texture2D(uText, (c0 + le) / uRes).a);
      float inner = 1.0 - smoothstep(R - aa, R + aa, d);
      col = mix(col, orig, inner);
      // anneau (de R − 1 à uLensO), couleurs du kit, dessiné DANS la vue : coupé par le bord de la vignette et déformé avec
      // elle par le verre de ses bords (comme le 4 novembre). Bord extérieur anticrénelé sur un pixel d'écran exact
      // (1 / dpr) ; bord intérieur fondu en dégradé (uSoft, choix de Johann : voir CLAUDE.md)
      float aw = 1.0 / uDpr, wIn = aw * 0.5 + uSoft;
      float rin = smoothstep(R - 1.0 - wIn, R - 1.0 + aw * 0.5, d);
      float ring = smoothstep(uLensO + aw * 0.5, uLensO - aw * 0.5, d) * rin * rin * (3.0 - 2.0 * rin);
      col = mix(col, flowColor(lp), ring);
    }
  }
  return col;
}

void main() {
  vec2 p = (gl_FragCoord.xy - uOrigin) / uDpr;
  p.y = uRes.y - p.y;
  float aa = 0.9 / uDpr;

  // verre liquide : près des bords de l'écran (haut, bas) et de la piste (gauche, droite), l'image est aspirée vers
  // l'intérieur (on lit l'image plus loin du bord). Aux bords gauche et droit, la vignette perd aussi de la hauteur (passe verre).
  float EDGE = uScr.z < 769.0 ? 90.0 : 80.0;   // PC : marge d'aspiration réduite   // haut et bas de l'écran (mobile : × 0,75, comme les autres largeurs d'effet)
  vec2 sc = uScr.xy + p;
  float wT = 1.0 - smoothstep(0.0, EDGE, sc.y), wB = 1.0 - smoothstep(0.0, EDGE, uScr.w - sc.y);
  float wL = 0.0, wR = 0.0;
  if (uClip.z > 0.0) { wL = 1.0 - smoothstep(uClip.x, uClip.x + uClip.z, p.x); wR = smoothstep(uClip.y - uClip.z, uClip.y, p.x); }   // côtés : largeur uClip.z (120 px, 28 px sur mobile)
  vec2 suck = vec2(0.0);   // plus d'aspiration du contenu (retirée) ; seule la forme des vignettes rétrécit près des bords
  // halation : l'aspiration varie lentement d'un endroit à l'autre (± uHal), le sombre bave de façon irrégulière
  suck *= 1.0 + uHal * sin(sc.x * 0.031 + sc.y * 0.017) * sin(sc.y * 0.027 - sc.x * 0.013);

  // autour de l'anneau du curseur, la trame est légèrement écartée (perturbation des points)
  vec2 hp = p;
  if (uLens.z > 0.5) {
    vec2 lq = p - uLens.xy; float dl = length(lq);
    float g = exp(-max(dl - uLensO, 0.0) / (uLensO * 0.22)) * step(uLensO, dl);   // très forte sur la lisière, décroissance exponentielle
    hp = p - lq / max(dl, 1.0) * g * uCell * 1.6;
  }
  vec4 h = halftoneS(hp, suck);
  vec3 col = h.rgb; float a = h.a;
  col = withLens(p, col); if (uLens.z > 0.5 && length(p - uLens.xy) < uLensO + 1.0) a = 1.0;


  // bords latéraux fondus de la piste (vues sans verre ; sinon la passe « verre » s'en charge)
  if (uClip.z > 0.0 && uRadius < 0.5) { float f = (uEdgeFloor + (1.0 - uEdgeFloor) * pow(smoothstep(uClip.x, uClip.x + uClip.z, p.x) * (1.0 - smoothstep(uClip.y - uClip.z, uClip.y, p.x)), 0.6)); col *= f; a *= f; }
  gl_FragColor = vec4(col, a);
}`

// Passe « verre » des vignettes : lit le contenu déjà dessiné (trame, lentille, aspiration) dans une texture
// intermédiaire, et le réfracte dans l'épaisseur du bord. Tout ce qui passe sous le verre est déformé de la même façon.
export const GLASS = `precision highp float;
uniform sampler2D uFbo;
uniform vec2 uFboSize;  // taille de la texture intermédiaire (px écran)
uniform vec2 uRes;      // taille de la vignette (px CSS)
uniform vec2 uOrigin;
uniform float uDpr;
uniform float uRadius;
uniform float uGlass;   // survol (0 à 1) : couleurs irisées et séparation des couleurs
uniform float uBg;
uniform vec3 uIrisMix;  // disposition propre à chaque vignette : décalage (tours), sens (±1), répétitions sur le tour
uniform float uVivid;   // 0 : couleurs telles quelles (sombre), 1 : plus franches (clair)
uniform float uEdgeFloor;
uniform vec4 uClip;
uniform vec2 uScrY;   // haut de la vignette à l'écran, hauteur de l'écran (px CSS)
uniform vec2 uScrX;   // gauche de la vignette à l'écran, largeur de l'écran (px CSS)
// zones floues (fx-config.js) : force de la couleur, aberration, grain, part colorée du grain ; largeur des zones
// (côtés de la piste, haut et bas de l'écran : celles des flous CSS) ; graine du grain (ne change qu'au défilement)
uniform vec4 uFx;
uniform vec2 uFxZone;
uniform float uSeed;
uniform vec4 uBgB[14];  // formes du fond (backdrop.js) : centre (px CSS ; y dans la page), rayon, teinte + 100 × intensité arrondie
uniform float uBgScroll; // défilement du fond (px CSS)
uniform vec4 uPalHue;   // 4 positions sur la roue du kit (tirées au hasard au chargement, dérivent lentement)
uniform vec2 uPalTone;  // désaturation, luminosité des teintes (sourdes, sombres)
uniform vec4 uPalDeg;   // angle de chaque teinte (degrés, 0 : droite, sens horaire)
${IRIS_GLSL}
const float PI2 = 6.2831853;
const vec3 LUMA = vec3(0.299, 0.587, 0.114);
const float DARK_GRAIN = 0.7;      // thème sombre : grain réduit de 30 %
const float DARK_TINT_GAIN = 2.4;  // thème sombre : les clairs prennent la teinte, éclaircie (le noir reste noir)
// bruit de tramage « interleaved gradient noise » (Jimenez) : réparti comme un bruit bleu, sans texture, au pixel physique
float ign(vec2 q) { return fract(52.9829189 * fract(dot(q, vec2(0.06711056, 0.00583715)))); }
// teinte selon l'angle autour du centre de l'écran (corrigé du format), interpolation douce et cyclique
// teinte sourde à partir d'une position sur la roue du kit : désaturée puis assombrie
vec3 tintOf(float h) { vec3 c = irisAt(h); return mix(c, vec3(dot(c, LUMA)), uPalTone.x) * uPalTone.y; }
// teinte du fond à cet endroit : moyenne des couleurs des formes du fond, pondérée comme dans backdrop.js ; .w : présence
vec4 bgAt(vec2 sp) {
  vec2 w = sp + vec2(0.0, uBgScroll);
  vec3 c = vec3(0.0); float sum = 0.0;
  for (int i = 0; i < 14; i++) {
    vec4 b = uBgB[i];
    float a = floor(b.w) / 100.0, h = fract(b.w);
    vec2 d = (w - b.xy) / max(b.z, 1.0);
    float k = a * exp(-dot(d, d));
    c += irisAt(h) * k; sum += k;
  }
  return vec4(c / max(sum, 1e-4), sum);
}
vec3 palAt(vec2 sp) {
  vec2 d = (sp - vec2(uScrX.y, uScrY.y) * 0.5) / vec2(uScrX.y, uScrY.y);
  float a = mod(degrees(atan(d.y, d.x)), 360.0);
  vec4 g = uPalDeg;
  vec3 c0 = tintOf(uPalHue.x), c1 = tintOf(uPalHue.y), c2 = tintOf(uPalHue.z), c3 = tintOf(uPalHue.w);
  if (a < g.y) return mix(c0, c1, smoothstep(g.x, g.y, a));
  if (a < g.z) return mix(c1, c2, smoothstep(g.y, g.z, a));
  if (a < g.w) return mix(c2, c3, smoothstep(g.z, g.w, a));
  return mix(c3, c0, smoothstep(g.w, 360.0 + g.x, a));
}
float sdCard(vec2 p) {
  vec2 q = abs(p - uRes * 0.5) - (uRes * 0.5 - uRadius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
}
float sdInner(vec2 p, float w) {
  float r = uRadius + w * 0.6;
  vec2 q = abs(p - uRes * 0.5) - (uRes * 0.5 - w - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
vec3 at(vec2 q) {
  q = clamp(q, vec2(0.5), uRes - 0.5);
  vec4 c = texture2D(uFbo, vec2(q.x, uRes.y - q.y) * uDpr / uFboSize);
  return c.rgb + vec3(uBg) * (1.0 - c.a);
}
void main() {
  vec2 p = (gl_FragCoord.xy - uOrigin) / uDpr;
  p.y = uRes.y - p.y;
  // masque des zones floues m : 0 au net, 1 au ras du bord (côtés de la piste, haut et bas de l'écran)
  vec2 sp = vec2(uScrX.x + p.x, uScrY.x + p.y);   // position du point à l'écran (px CSS)
  float m = max(1.0 - smoothstep(0.0, uFxZone.y, sp.y), 1.0 - smoothstep(0.0, uFxZone.y, uScrY.y - sp.y));
  if (uClip.z > 0.0) m = max(m, max(1.0 - smoothstep(uClip.x, uClip.x + uFxZone.x, p.x), smoothstep(uClip.y - uFxZone.x, uClip.y, p.x)));
  // aspiration aux bords, même principe des quatre côtés (décroissance exponentielle, forte au ras du bord seulement) :
  // - bords gauche et droit de la piste : la vignette perd de la hauteur (jusqu'à 8 % sur PC, 12 % sur mobile) ;
  // - haut et bas de l'écran : elle perd de la largeur, dans la même proportion et sur la même zone ;
  // contour de verre compris ; son contenu est comprimé d'autant (on lit plus loin de l'axe médian)
  float sqz = 1.0, sqx = 1.0;
  float scrY = uScrY.x + p.y;   // position du point à l'écran (px CSS, depuis le haut)
  if (uClip.z > 0.0) {
    float trackW = uClip.y - uClip.x;
    float zone = trackW < 769.0 ? 0.075 * trackW : min(75.0, 0.14 * trackW);   // portée : PC 110 px au plus ; mobile, zone étroite
    float k = trackW < 769.0 ? 0.12 : 0.08;
    float d = max(0.0, min(p.x - uClip.x, uClip.y - p.x));             // distance au bord le plus proche de la piste
    sqz = 1.0 - 0.8 * k * exp(-d / (0.28 * zone));   // côtés : un peu moins fort (PC 6,4 %, mobile 9,6 %)
    float dy = max(0.0, min(scrY, uScrY.y - scrY));                     // distance au haut ou au bas de l'écran
    sqx = 1.0 - (k / 1.5) * exp(-dy / (0.28 * zone));   // haut et bas : force ÷ 1,5
    p.y = uRes.y * 0.5 + (p.y - uRes.y * 0.5) / sqz;
    p.x = uRes.x * 0.5 + (p.x - uRes.x * 0.5) / sqx;
  }
  float aa = 0.9 / (uDpr * min(sqz, sqx));
  float sd = sdCard(p);
  vec3 col = at(p);
  // aberration chromatique : rouge et bleu lus de part et d'autre, le long du rayon depuis le centre de l'écran (vert en place)
  if (m > 0.001 && uFx.y > 0.0) {
    vec2 dir = normalize(sp - vec2(uScrX.y, uScrY.y) * 0.5 + 1e-4);
    vec2 off = dir * m * uFx.y * uRes.x;
    col.r = at(p + off).r; col.b = at(p - off).b;
  }
  float W = (uClip.z > 0.0 && uClip.z < 25.0) ? 26.0 : 34.0;   // épaisseur du verre (mobile : × 0,75)
  float di = sdInner(p, W);
  float t = di < 0.0 ? 1.0 : clamp(-sd / max(-sd + di, 1e-3), 0.0, 1.0);   // 0 à l'arête, 1 au bord intérieur
  if (t < 1.0) {
    vec2 e = vec2(1.0, 0.0);
    vec2 n = normalize(vec2(sdCard(p + e.xy) - sdCard(p - e.xy) + sdInner(p + e.xy, W) - sdInner(p - e.xy, W),
                            sdCard(p + e.yx) - sdCard(p - e.yx) + sdInner(p + e.yx, W) - sdInner(p - e.yx, W)) + 1e-5);
    float s1 = 1.0 - t;
    // réfraction à la manière du « Liquid Glass » d'Apple : le bord est une lentille convexe (profil en squircle,
    // h(x) = (1 - (1 - x)^4)^(1/4)). Sa pente donne l'angle de la surface ; la loi de Snell (indice 1,5) donne la
    // déviation. Forte au ras de l'arête, nulle à l'intérieur : l'image est comprimée puis grossie vers le bord.
    float x = clamp(t, 0.001, 1.0);
    float h = pow(1.0 - pow(1.0 - x, 4.0), 0.25);
    float slope = pow(1.0 - x, 3.0) / max(pow(h, 3.0), 0.02);          // dh/dx
    float th = atan(slope * 0.9);                                     // angle de la surface
    float tr = asin(sin(th) / 1.5);                                   // angle réfracté
    float bend = W * 1.15 * tan(th - tr);                             // déviation (px)
    vec3 g = at(p - n * bend);                                        // une seule lecture : aucune image dédoublée
    vec2 cp = p - uRes * 0.5;
    // couleurs du bord mêlées : moyenne de trois lectures voisines sur la roue (passages plus fondus d'une teinte à l'autre)
    float ia = uIrisMix.y * (atan(cp.x, -cp.y) / 6.28318) * uIrisMix.z + uIrisMix.x + t * 0.6;
    vec3 ic = (irisAt(ia - 0.07) + irisAt(ia) * 2.0 + irisAt(ia + 0.07)) * 0.25;
    // fond clair : couleurs de la roue plus franches (écart à leur gris de même luminance accentué, jamais plus sombres)
    ic = clamp(mix(vec3(dot(ic, vec3(0.2126, 0.7152, 0.0722))), ic, 1.0 + 0.35 * uVivid), 0.0, 1.0);
    vec3 tint = mix(vec3(1.0), ic, uGlass);
    // la couleur n'est plus appliquée à l'image (sinon une image claire se colore sur toute l'épaisseur du verre) :
    // elle n'est portée que par la lumière du verre, d'une largeur fixe, identique sur image claire ou sombre
    // l'image sous le verre est aussi teintée, plus fort vers l'arête (décroissance rapide : reste fin sur image claire)
    // la couleur décroît de façon exponentielle depuis l'arête : très colorée au ras du bord, vite plus légère vers
    // l'intérieur (épaisseur de couleur fondue)
    float dEdge = max(0.0, -sd);
    float cx = exp(-dEdge / 7.0);
    g = g * mix(vec3(1.0), tint * 1.15, 0.95 * cx) + tint * 0.16 * cx * uGlass;
    float rim = exp(-abs(sd + 1.5) / 1.6);
    // entre-deux : une bande irisée de largeur fixe (≈ 9 px depuis l'arête), même sur image claire
    float band9 = exp(-dEdge / 4.0);   // bande irisée au ras de l'arête, décroissance exponentielle
    g = mix(g, g * tint * 1.15 + tint * 0.12, band9 * 0.45 * uGlass);
    g *= 0.62 + 0.38 * smoothstep(0.0, 0.75, t);       // le verre assombrit un peu (visible sur les images claires)
    vec2 L = normalize(vec2(-0.65, -0.76));
    float facing = dot(n, L);
    float spec = pow(max(facing, 0.0), 2.0) * exp(-abs(sd + 2.0) / 2.2) * 0.95;
    float back = pow(max(-facing, 0.0), 2.0) * exp(-abs(sd + 3.0) / 3.0) * 0.35;
    g += mix(vec3(1.0), tint, 0.5) * (spec + back);
    g = mix(g, tint, rim * 0.5 * uGlass);                          // liseré irisé fin le long de l'arête
    col = mix(col, g, 1.0 - smoothstep(0.6, 1.0, t));
  }
  // zones floues : gradient map pondérée par le flou. Clair : les sombres prennent la teinte, les blancs restent blancs ;
  // sombre : l'inverse (les clairs se teintent, le noir reste noir). Puis grain fin, surtout dans les tons moyens.
  if (m > 0.001 && (uFx.x > 0.0 || uFx.z > 0.0)) {   // rien à calculer si la colorisation et le grain sont coupés
    float l = dot(col, LUMA), sl = smoothstep(0.0, 1.0, l);
    vec4 bg = bgAt(sp);   // la teinte vient du fond (elle défile avec lui) ; là où le fond est neutre : teintes mouvantes
    vec3 bgTint = mix(bg.rgb, vec3(dot(bg.rgb, LUMA)), uPalTone.x) * uPalTone.y;
    vec3 tint = mix(palAt(sp), bgTint, smoothstep(0.02, 0.35, bg.w));
    vec3 mapped = uVivid > 0.5 ? mix(tint, vec3(1.0), sl) : mix(vec3(0.0), min(tint * DARK_TINT_GAIN, vec3(1.0)), sl);
    col = mix(col, mapped, m * uFx.x);
    float w = m * (1.0 - abs(l * 2.0 - 1.0)) * uFx.z * (uVivid > 0.5 ? 1.0 : DARK_GRAIN);
    vec2 gq = gl_FragCoord.xy + uSeed * vec2(37.0, 17.0);
    vec3 n = vec3(ign(gq), ign(gq + vec2(13.0, 71.0)), ign(gq + vec2(59.0, 29.0))) - 0.5;
    col = clamp(col + (vec3(n.x) * (1.0 - uFx.w) + n * uFx.w) * w, 0.0, 1.0);
  }
  float a = 1.0 - smoothstep(-aa, aa, sd);
  if (uClip.z > 0.0) a *= (uEdgeFloor + (1.0 - uEdgeFloor) * pow(smoothstep(uClip.x, uClip.x + uClip.z, p.x) * (1.0 - smoothstep(uClip.y - uClip.z, uClip.y, p.x)), 0.6));
  gl_FragColor = vec4(col * a, a);
}`
