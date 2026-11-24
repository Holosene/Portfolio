/**
 * Rendu WebGL du site : une seule toile fixe derrière la page, qui dessine chaque vue [data-gl] à sa place.
 * Chaque vue : l'image (ou plus tard la vidéo) en trame de points, et une lentille qui suit le curseur et montre l'original.
 * L'anneau reprend les couleurs du « o » du logo, en aplat, sans autre effet.
 * Accueil : le S du monogramme en trame de points, le « o » en aplat irisé comme sur le logo ; pas de lentille.
 */

import { DERIV, VERT, FRAG, GLASS } from './gl-shaders.js'
import KIT from '../design/logo-kit/tokens/iris.json'
import { IRIS } from './iris-config.js'
import { FX, hueAt } from './fx-config.js'
import { FLOW } from './flow.js'
import { HERO } from './hero-progress.js'
import { LOGO_TUNE } from './logo-tune.js'
import { S_AXIS, S_WIDTH_REF } from './monogram-path.js'
import { setNameHeart, setNameRhythm, nameHeartDur } from './name-bulge.js'
import { QUALITY } from './quality.js'


// monogramme du kit (viewBox 152.4 150.7 470 576 ; anneau : tokens/iris.json), en unités de 1000 pour sa hauteur
const MONO_VB = [152.4, 150.7, 470, 576], MONO_U = 1000 / MONO_VB[3]
const SDF_PAD = 64, SDF_W = 816 + 2 * SDF_PAD, SDF_H = 1000 + 2 * SDF_PAD   // cartes du S (sdf.mjs) : cadre + marge
const MONO_W = MONO_VB[2] * MONO_U                                                        // ≈ 816
const MONO_O = [(KIT.ring.center[0] - MONO_VB[0]) * MONO_U, (KIT.ring.center[1] - MONO_VB[1]) * MONO_U]   // centre du « o »

const O_OFF = [(MONO_O[0] - MONO_W / 2) / 1000, (MONO_O[1] - 500) / 1000], O_R = KIT.ring.outerRadius * MONO_U / 1000
const BIG_MAX = 420   // px : plafond du gros logo sur les grands écrans
const bigOf = (w, h) => Math.min(BIG_MAX, h * (w < 760 ? 0.34 : 0.46), w * (w < 760 ? 0.38 : 0.6) * 1000 / 816)   // taille du logo au début de l'accueil (mobile : plus petit)
const handoffR = (w, h) => Math.min(53, bigOf(w, h) * O_R * (w < 760 ? 0.9 : 0.75))   // rayon du « o » au relais avec le chargeur (px ; mobile : chargeur un peu plus grand)
/** Rayon du « o » au relais avec le chargeur (px CSS) : connu avant même de créer le contexte WebGL. */
export const loaderRadius = () => handoffR(innerWidth, innerHeight)


export function createGL(canvas, { reduced }) {
  // page sans toile (mentions légales) : rien à dessiner
  const gl = canvas?.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' })
  if (!gl) return null
  gl.getExtension('OES_standard_derivatives')   // fwidth() pour les anneaux du kit (irisRing)
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, type === gl.FRAGMENT_SHADER ? DERIV + src : src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s }
  const prog = gl.createProgram()
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.bindAttribLocation(prog, 0, 'a'); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)
  const U = {}; for (const n of ['uTex', 'uMask', 'uRes', 'uOrigin', 'uImg', 'uPos', 'uDpr', 'uCell', 'uReveal', 'uFade', 'uHasMask', 'uFloor', 'uLv', 'uRadius', 'uLens', 'uLensO', 'uSoft', 'uGlass', 'uEye', 'uMarkXf', 'uBg', 'uMaskB', 'uClip', 'uColor', 'uScr', 'uText', 'uHasText', 'uMono', 'uInk', 'uEdgeFloor', 'uFlow', 'uHal', 'uMaskW', 'uWidthK', 'uTip', 'uMaskA', 'uTipT']) U[n] = gl.getUniformLocation(prog, n)
  gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uMask, 1); gl.uniform1i(U.uText, 3); gl.uniform1i(U.uMaskB, 5)
  gl.uniform1f(U.uHal, FX.halation)
  gl.uniform4f(U.uMono, MONO_W, MONO_O[0], MONO_O[1], 0)
  // texture du flux (unité 6) : 512 × 1, répétée en u, filtrage linéaire, ré-envoyée quand elle change
  const flowTex = gl.createTexture(); let flowVer = -1
  gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, flowTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FLOW.size, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, FLOW.lut)
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v)
  gl.uniform1i(U.uFlow, 6); gl.uniform1i(U.uMaskW, 7); gl.uniform1i(U.uMaskA, 4)
  gl.activeTexture(gl.TEXTURE0)
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.SCISSOR_TEST)

  // fond de page
  // couleurs du thème (--bg, --ink de src/theme.css), relues quand le mode change
  const themeRGB = () => {
    const cs = getComputedStyle(document.documentElement), x = document.createElement('canvas').getContext('2d')
    const rgb = (v) => { x.fillStyle = '#000'; x.fillStyle = v.trim(); const h = x.fillStyle; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) }
    return { bg: rgb(cs.getPropertyValue('--bg')), ink: rgb(cs.getPropertyValue('--ink')) }
  }
  let theme = themeRGB()
  const onTheme = () => { theme = themeRGB() }
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', onTheme)
  // passe « verre » et texture intermédiaire (contenu des vignettes)
  const gProg = gl.createProgram()
  gl.attachShader(gProg, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(gProg, sh(gl.FRAGMENT_SHADER, GLASS)); gl.bindAttribLocation(gProg, 0, 'a'); gl.linkProgram(gProg)
  if (!gl.getProgramParameter(gProg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(gProg))
  const GU = {}; for (const n of ['uFbo', 'uFboSize', 'uRes', 'uOrigin', 'uDpr', 'uRadius', 'uGlass', 'uBg', 'uClip', 'uIrisMix', 'uVivid', 'uEdgeFloor', 'uScrY', 'uScrX', 'uFx', 'uFxZone', 'uSeed', 'uPalHue', 'uPalTone', 'uPalDeg', 'uBgB', 'uBgScroll']) GU[n] = gl.getUniformLocation(gProg, n)
  // passe de l'anneau de la lentille
  // zones floues (fx-config.js) : valeurs envoyées au GPU seulement quand elles changent (réglages, largeur d'écran,
  // défilement pour la graine du grain), aucune allocation par image
  // teintes : 4 positions sur la roue, tirées au hasard à chaque chargement (un quart de tour d'écart environ, pour rester
  // variées), qui dérivent lentement ensemble ; plus de couleurs fixes d'un endroit de l'écran
  const BG = new Float32Array(14 * 4)   // formes du fond (réutilisé à chaque image)
  const SEED_STEP = 48   // px de défilement entre deux tirages du grain (grain fixe à l'arrêt)
  let fxSent = -1, fxW = -1, fxSeed = -1
  const sendFx = () => {
    const small = W < 769
    if (fxSent !== FX.version || fxW !== small) {
      fxSent = FX.version; fxW = small
      gl.uniform2f(GU.uPalTone, FX.palDesat, FX.palDark); gl.uniform4f(GU.uPalDeg, ...FX.pal.map((c) => c.deg))
      // franges : jamais sur mobile ni avec animations réduites ; zones : largeurs des flous CSS (côtés, haut et bas)
      gl.uniform4f(GU.uFx, FX.colorStrength, small || reduced ? 0 : FX.aberration, FX.grain, FX.grainChroma)
      gl.uniform2f(GU.uFxZone, small ? 21 : 96, small ? 90 : 96)   // PC : mêmes 96 px que les bandes de flou CSS
    }
    const ht = reduced ? 0 : performance.now() / 1000   // teintes vivantes (fx-config.js), même horloge que les bandes CSS
    gl.uniform4f(GU.uPalHue, hueAt(0, ht), hueAt(1, ht), hueAt(2, ht), hueAt(3, ht))
    // formes du fond (même image que la toile de fond) : teinte et intensité tassées dans une seule composante
    const bgd = FX.bg
    if (bgd.B && FX.colorStrength > 0) {   // formes du fond : seulement si la colorisation est active
      for (let i = 0; i < 14; i++) { const j = i * 4; BG[j] = bgd.B[j]; BG[j + 1] = bgd.B[j + 1]; BG[j + 2] = bgd.B[j + 2]; BG[j + 3] = Math.floor(Math.min(1, bgd.A[i]) * 99) + bgd.B[j + 3] % 1 }
      gl.uniform4fv(GU.uBgB, BG); gl.uniform1f(GU.uBgScroll, bgd.scroll)
    }
    const seed = reduced ? 0 : Math.floor(scrollY / SEED_STEP) % 97
    if (seed !== fxSeed) { fxSeed = seed; gl.uniform1f(GU.uSeed, seed) }
  }
  const fbo = gl.createFramebuffer(), fboTex = gl.createTexture()
  let fboW = 0, fboH = 0
  function ensureFbo(w, h) {
    if (w <= fboW && h <= fboH) return
    fboW = Math.max(w, fboW); fboH = Math.max(h, fboH)
    gl.activeTexture(gl.TEXTURE2)   // unité réservée à la texture intermédiaire (lue seulement par la passe « verre »)
    gl.bindTexture(gl.TEXTURE_2D, fboTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fboW, fboH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  const newTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t }
  const upload = (t, src) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src) }

  // pointeur (souris, stylet ou doigt), en coordonnées de la fenêtre
  const ptr = { x: -1e4, y: -1e4, t: -1e9, touch: false }
  const move = (x, y, touch) => { ptr.x = x; ptr.y = y; ptr.t = performance.now(); ptr.touch = touch }
  addEventListener('pointermove', (e) => move(e.clientX, e.clientY, e.pointerType === 'touch'), { passive: true })
  // curseur immobile pendant que la page défile : la molette (ou le pavé tactile) et les changements de survol donnent
  // aussi sa position, sans compter comme un mouvement (ptr.t) ; le « o » apparaît dès qu'une vignette passe dessous,
  // même si la souris n'a pas bougé depuis le chargement
  const at = (e) => { if (e.pointerType !== 'touch' && !ptr.touch) { ptr.x = e.clientX; ptr.y = e.clientY } }
  addEventListener('wheel', at, { passive: true })
  addEventListener('pointerover', at, { passive: true })
  // au doigt : tant qu'on appuie sur une vignette (toucher, appui long), elle passe en couleur comme au survol ;
  // un défilement ou un glissement (pointercancel) l'arrête
  addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { move(e.clientX, e.clientY, true); ptr.down = true } }, { passive: true })
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, (e) => { if (e.pointerType === 'touch') ptr.down = false }, { passive: true })
  addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY, true) }, { passive: true })
  addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY, true) }, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => { ptr.t = -1e9 })

  // écran tactile : défilement natif du téléphone (en avance d'une image sur le dessin). Les vignettes n'y sont pas
  // dessinées sur la toile fixe (elles traîneraient d'une image derrière la page) mais copiées dans leur propre image,
  // dans la page ; le logo de l'accueil, fixe pendant sa scène, reste sur la toile
  const detached = matchMedia('(hover: none) and (pointer: coarse)').matches
  const OWN_NEAR = 40, OWN_STEP = 30   // écran tactile : bords où la position compte (px), pas de mise à jour près d'un bord (ms)
  let order = null
  const pending = []
  let texVer = 0
  // une texture par adresse d'image : les copies d'une vignette (piste sans fin, main.js : cinq jeux de cartes) partagent
  // celle de l'original au lieu de décoder et d'envoyer la même image cinq fois (temps bloqué au chargement, mémoire GPU)
  const texByUrl = new Map()
  // niveaux d'une image (choix de Johann : chaque vignette va du noir pur au blanc pur) : lumière au 1er et au 99e
  // centile, mesurée sur une réduction 64 × 64 (même formule que lum() du shader)
  const lvCv = new OffscreenCanvas(64, 64), lvCx = lvCv.getContext('2d', { willReadFrequently: true })
  const levels = (src) => {
    try {
      lvCx.clearRect(0, 0, 64, 64); lvCx.drawImage(src, 0, 0, 64, 64)
      const d = lvCx.getImageData(0, 0, 64, 64).data, h = new Uint32Array(256)
      for (let i = 0; i < d.length; i += 4) h[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])]++
      const n = d.length / 4, at = (q) => { let c = 0; for (let k = 0; k < 256; k++) { c += h[k]; if (c >= q * n) return k / 255 } return 1 }
      const lo = at(0.01), hi = at(0.99)
      return hi - lo > 0.05 ? [lo, hi] : [0, 1]
    } catch { return [0, 1] }
  }
  const sendNext = () => {
    while (pending.length && !(!pending[0].mark && document.documentElement.classList.contains('intro-lock'))) {
      const v = pending.shift(), src = v.src
      // image changée avec le mode pendant son attente (chargement en cours) : renvoyée à la fin de ce chargement (son
      // écouteur load, plus haut), jamais envoyée à moitié chargée
      if (!src || (!v.video && !(src.complete && src.naturalWidth))) continue
      const key = v.video ? '' : src.currentSrc || src.src
      let e = key && texByUrl.get(key)
      const hit = !!e && e.img[0] > 0
      if (!hit) {
        if (key) { e = { tex: e?.tex || newTex(), img: null }; texByUrl.set(key, e) }
        upload(key ? e.tex : v.tex, src)
        if (key) { e.img = [src.naturalWidth, src.naturalHeight]; e.lv = levels(src) }
      }
      if (key) { v.tex = e.tex; v.lv = e.lv }
      v.img = key ? e.img : [src.videoWidth || src.naturalWidth, src.videoHeight || src.naturalHeight]; v.ready = v.img[0] > 0
      texVer++   // image renvoyée (ex. vignette changée avec le mode) : la toile doit être redessinée
      if (!hit) break   // un seul envoi réel par image affichée (pas de saccade) ; les copies déjà en mémoire suivent aussitôt
    }
  }
  const views = [...document.querySelectorAll('[data-gl]')].map((el) => {
    const v = { el, tex: newTex(), img: null, video: el.querySelector('video'), ready: false, seen: 0, glass: 0, color: el.hasAttribute('data-color'), text: el.dataset.text || '', textTex: null, textKey: '',
      mark: el.dataset.gl === 'mark', cell: +el.dataset.cell || 7,
      radius: +el.dataset.radius || 0, pos: (el.dataset.pos || '0.5 0.5').split(' ').map(Number), clip: el.closest('[data-clip]'), fade: el.dataset.gl === 'panel', mask: null, maskKey: '' }
    const src = v.video || el.querySelector('img')
    // envoi au GPU : en file, une image par image affichée (pas de saccade), le logo de l'accueil d'abord ; pendant le
    // chargeur et l'intro, seul le logo (les vignettes, plus bas, attendent la fin de l'intro)
    const push = () => { v.src = src; if (v.mark) pending.unshift(v); else pending.push(v) }
    // image : décodée d'abord hors du fil principal (decode()), l'envoi au GPU ne fait plus que la copier
    const done = v.video ? push : () => src.decode().catch(() => {}).then(push)
    if (v.video) v.video.addEventListener('loadeddata', done, { once: true })
    else if (src.complete && src.naturalWidth) done()
    else { src.loading = 'eager'; src.addEventListener('load', done, { once: true }) }
    return v
  })
  // vignettes qui existent en deux versions (fond clair / fond sombre, data-dark) : l'image suit le mode du site ; la
  // texture actuelle reste affichée jusqu'à ce que la nouvelle image soit chargée, puis elle est renvoyée au GPU
  const themed = views.filter((v) => v.src?.dataset?.dark || v.el.querySelector('img[data-dark]'))
  const syncThemeImages = () => {
    const dark = theme.bg[0] + theme.bg[1] + theme.bg[2] < 1.5
    for (const v of themed) {
      const img = v.el.querySelector('img'), source = v.el.querySelector('source')
      const set = (el, attr) => { if (!el?.dataset.dark) return false; el.dataset.light ||= el.getAttribute(attr); const want = dark ? el.dataset.dark : el.dataset.light; if (el.getAttribute(attr) === want) return false; el.setAttribute(attr, want); return true }
      const a = set(source, 'srcset'), b = set(img, 'src')
      if ((a || b) && v.tex) img.addEventListener('load', () => { v.src ||= img; if (!pending.includes(v)) pending.push(v) }, { once: true })
    }
  }
  if (themed.length) { syncThemeImages(); new MutationObserver(syncThemeImages).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeImages) }
  if (!views.length) return null
  const hasMark = views.some((v) => v.mark)

  // masque du monogramme en espace local (816 × 1000) : le S en rouge, le « o » en vert. Dessiné une fois ;
  // le placement, la taille et la rotation sont appliqués dans le shader (uMarkXf).
  // champ de distance signée du monogramme (brand/tools/sdf.mjs), chargé une fois ; son canal B (S, ±64 unités) est aussi
  // gardé côté CPU : distance du curseur au S (renflement au survol)
  // boule automatique : la boule du survol, menée le long de l'axe du S (monogram-path.js) de son extrémité du haut à
  // celle du bas ; une deuxième boule part dès que la première est arrivée (elle s'efface vite en bas), puis une pause, en boucle. Le curseur reprend
  // la main dès qu'il approche du S. Rythme d'un cœur au repos (70 bpm : « boum » à 0, « boum » à 0,35 du cycle, repos
  // jusqu'au suivant), ralenti 2,7 fois pour que chaque passage reste lisible. Chaque boule du S se prolonge dans le nom
  // (accueil et pied de page) : une vague part quand elle a fait nameAt de sa course, deux boules du centre vers les deux
  // bouts du nom, à la même vitesse à l'écran que celle du S (name-bulge.js) ; deux vagues, comme les deux boules du S,
  // puis le repos (name : durée minimale d'une vague dans le cycle). Durées en ms
  const TRACE = { pass: 900, gap: -80, nameAt: 0.6, name: 1000, pause: 1400, delay: 3500 }
  { const n1 = TRACE.nameAt * TRACE.pass, n2 = TRACE.pass + TRACE.gap + n1
    setNameRhythm({ n1, n2, name: TRACE.name, pause: TRACE.pause, delay: 400 }) }   // le nom seul (S rangé) : même rythme
  const AXL = [0]; for (let i = 1; i < S_AXIS.length; i++) AXL.push(AXL[i - 1] + Math.hypot(S_AXIS[i][0] - S_AXIS[i - 1][0], S_AXIS[i][1] - S_AXIS[i - 1][1]))
  const axisAt = (u) => {   // point de l'axe à la fraction u de sa longueur
    const L = Math.min(1, Math.max(0, u)) * AXL[AXL.length - 1]; let i = 1
    while (i < AXL.length - 1 && AXL[i] < L) i++
    const k = (L - AXL[i - 1]) / (AXL[i] - AXL[i - 1] || 1), a = S_AXIS[i - 1], b = S_AXIS[i]
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  }
  // front de l'apparition du S (position le long du tracé) selon son avancement
  // point de l'axe et tangente à la position f le long du tracé (fraction de sa longueur ; au-delà des bouts, le
  // prolongement des segments extrêmes, comme la carte de position : sdf.mjs)
  const tipAt = (f) => {
    const L = f * AXL[AXL.length - 1]; let i = 1
    while (i < AXL.length - 1 && AXL[i] < L) i++
    const a = S_AXIS[i - 1], b = S_AXIS[i], sl = AXL[i] - AXL[i - 1] || 1, k = (L - AXL[i - 1]) / sl
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, (b[0] - a[0]) / sl, (b[1] - a[1]) / sl]
  }
  const revealFront = (r) => -0.09 + 1.18 * r   // avant le haut du S → après son bas (le bout rond naît et sort en entier)
  let traceT0 = null, cycA = 0, cycL = 0, tracePass = 0, heroPT = -1e9, heroPL = 0, sbOn = false, sbFade = false
  const ss01 = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x) }
  let sdfB = null   // demi-épaisseur moyenne du S : S_WIDTH_REF (calculée d'avance par brand/tools/sdf.mjs)
  const widthRef = S_WIDTH_REF
  const sdS = (x, y) => {
    if (!sdfB) return -64
    const X = Math.round(x + SDF_PAD), Y = Math.round(y + SDF_PAD)   // carte : cadre du monogramme + marge
    return X < 0 || Y < 0 || X >= SDF_W || Y >= SDF_H ? -64 : sdfB[Y * SDF_W + X] * 128 / 255 - 64
  }
  function maskFor(v) {
    if (v.maskB !== undefined) return v.maskReady
    v.maskB = null
    const im = new Image()
    v.maskReady = new Promise((done) => { im.onload = im.onerror = done })
    im.addEventListener('load', () => {
      const t = newTex()
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
      upload(t, im)
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL)
      v.maskB = t
      try {
        const c = document.createElement('canvas'); c.width = SDF_W; c.height = SDF_H
        const x = c.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' }); x.drawImage(im, 0, 0)
        const d = x.getImageData(0, 0, SDF_W, SDF_H).data, bch = new Uint8Array(SDF_W * SDF_H)
        for (let i = 0; i < bch.length; i++) bch[i] = d[i * 4 + 2]
        sdfB = bch
      } catch { /* sans lecture possible : pas de renflement */ }
    })
    const markSrc = new URL(document.querySelector('.brand__mark').src), sdfUrl = new URL('monogram-sdf.png', markSrc)
    sdfUrl.search = markSrc.search   // même version que le logo (?v=, render.js) : jamais l'ancienne carte en cache
    im.src = sdfUrl.href
    // carte d'épaisseur du S (contraste d'épaisseur, LOGO_TUNE) ; sa moyenne dans le S : S_WIDTH_REF (monogram-path.js)
    const iw = new Image()
    let wDone; const wReady = new Promise((r) => { wDone = r; iw.onerror = r })
    iw.addEventListener('load', () => {
      const t = newTex()
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
      upload(t, iw)
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL)
      v.maskW = t
      wDone()
    })
    const wUrl = new URL('monogram-width.png', markSrc); wUrl.search = markSrc.search
    iw.src = wUrl.href
    // position le long du S en 16 bits (apparition du S)
    const ia = new Image()
    let aDone; const aReady = new Promise((r) => { aDone = r; ia.onerror = r })
    ia.addEventListener('load', () => {
      const t = newTex()
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
      upload(t, ia)
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL)
      v.maskA = t; aDone()
    })
    const aUrl = new URL('monogram-along.png', markSrc); aUrl.search = markSrc.search
    ia.src = aUrl.href
    // logo prêt quand les deux cartes le sont : il apparaît d'emblée avec son épaisseur de base (LOGO_TUNE), sans saut
    v.maskReady = Promise.all([v.maskReady, wReady, aReady])
    return v.maskReady
  }
  /** Placement du monogramme. Arrivée (ms depuis la fin du chargeur) : le « o » prend exactement la place de l'anneau
   *  du chargeur (rayon handoffR, centre de la fenêtre), à la vitesse où celui-ci grandissait, et continue de grandir sur
   *  place en ralentissant ; puis, seulement quand le S apparaît, le monogramme glisse jusqu'à sa position.
   *  Ensuite le défilement p le ramène à sa place dans la composition (au-dessus du nom). Renvoie aussi l'apparition du S. */
  const GROW = IRIS.intro.grow, SHIFT = IRIS.intro.shift, REVEAL_K = IRIS.intro.reveal   // apparition du S : 1,6 × le glissement
  function markXf(w, h, p, ms, slot, oc, dock) {
    const k = (a, b) => Math.min(1, Math.max(0, (p - a) / (b - a))), e = (x) => 1 - Math.pow(1 - x, 3)
    const io = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2)
    const big = bigOf(w, h)
    // fin : à sa place dans la composition de l'accueil (.hero__slot, au-dessus du nom et de la présentation)
    const q = e(k(0, 0.54))   // le logo rejoint sa place (même découpage que main.js : scène sans temps mort)
    let size = big + (slot.h - big) * q
    // repos du gros logo : placé pour que son « o » soit exactement à la hauteur du centre de l'écran (là où le chargeur
    // passe le relais) : au relais, le « o » ne glisse que vers la droite, sans descendre
    const cy0 = h / 2 - O_OFF[1] * big
    let cx = w / 2 + (slot.x - w / 2) * q, cy = cy0 + (slot.y - cy0) * q
    // après la scène de l'accueil : en continuant de défiler, le logo monte avec la page (il reste à sa place dans la
    // composition : aucun mouvement propre vers le haut) ; m va de 0 à 1 exactement quand cette montée amène son centre
    // à la hauteur du petit logo de la barre. Seules sa taille et sa position horizontale s'ajustent au fil du
    // défilement, pour qu'il s'emboîte dans le petit logo au moment où il l'atteint (dock : repère de la vue)
    // réduction exponentielle : presque rien au début, de plus en plus vite, exactement la taille du petit logo à m = 1
    if (dock && dock.m > 0) {
      const d = (Math.pow(2, 10 * dock.m) - 1) / 1023
      cx += (dock.x - cx) * d; size += (dock.h - size) * d
    }
    if (ms >= GROW + SHIFT * REVEAL_K) return [cx, cy, size, 0, 1]
    // croissance : décélération seule (le chargeur arrive en accélérant à la même vitesse : aucun arrêt au relais)
    const gx = Math.min(1, Math.max(0, ms / GROW)), g = 1 - Math.pow(1 - gx, 3), c = io((ms - GROW) / SHIFT)
    const s0 = handoffR(w, h) / O_R, sz = s0 + (size - s0) * g
    const ox = oc[0] - O_OFF[0] * sz, oy = oc[1] - O_OFF[1] * sz   // monogramme placé pour que son « o » soit centré en oc
    // apparition du S (gl.js, shader) : commence avec le glissement et dure un peu plus, le temps de suivre tout le tracé
    const rv = Math.min(1, Math.max(0, (ms - GROW) / (SHIFT * REVEAL_K))), r = rv * rv * (3 - 2 * rv)
    return [ox + (cx - ox) * c, oy + (cy - oy) * c, sz, 0, r]
  }

  // texte net d'une vignette, redessiné à la taille exacte de la vignette et à la densité de l'écran
  function textFor(v, w, h) {
    const key = `${Math.round(w)}x${Math.round(h)}@${dpr}:${document.fonts?.status}`
    if (v.textKey === key) return
    const c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
    const x = c.getContext('2d'); x.scale(dpr, dpr)
    const fs = Math.round(Math.min(w * 0.13, h * 0.2))
    x.font = `500 ${fs}px Archivo, sans-serif`
    try { x.fontStretch = 'expanded' } catch {}
    x.letterSpacing = `${(-0.04 * fs).toFixed(1)}px`
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'
    x.fillText(v.text, w / 2, h / 2)
    v.textTex ??= newTex()
    gl.bindTexture(gl.TEXTURE_2D, v.textTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
    v.textKey = key
  }

  let W = 0, H = 0, dpr = 1, cellScale = 1, lastSY = 0, scrollT = -1e9, docked = false, markDom = false, heroHi = hasMark, centerV = null, floatA = 0
  // renflement du S (uEye) : balle qui suit le curseur avec un léger retard (unités du monogramme), ampleur 0 à 1
  const bulge = { x: 0, y: 0, a: 0 }, BULGE_A = 34, BULGE_R = 62
  const PX_BUDGET = 2880 * 1800   // pixels de la toile au plus, au-delà de 2× (zoom du navigateur)
  const brandMark = document.querySelector('.topbar .brand')
  const heroEl = document.querySelector('.hero'), dockVals = {}
  const setDock = (k, v) => { if (dockVals[k] !== v) { dockVals[k] = v; heroEl.style.setProperty(k, v) } }   // seulement si la valeur change
  const DOCK_CSS = CSS.supports('animation-timeline: scroll()')
  function resize() {
    W = innerWidth; H = canvas.clientHeight || innerHeight   // toile en 100lvh (CSS) : jamais plus courte que l'écran
    // résolution : jusqu'à 2× comme toujours (1,75× sur téléphone) ; au-delà, la densité réelle de l'écran tant que la toile
    // ne dépasse pas le budget de pixels d'un écran 2880 × 1800. Zoom du navigateur (Cmd +) : la zone visible rapetisse
    // et la densité monte d'autant ; la toile garde le même nombre de pixels mais reste nette comme le texte et les SVG
    // (avant : plafond à 2×, logo et vignettes agrandis, flous)
    const phone = W < 760 && matchMedia('(pointer: coarse)').matches
    // téléphone : 1,75× pour les vignettes (coût) ; mais tant que le gros logo de l'accueil est dessiné ici (heroHi), la
    // densité réelle de l'écran (3× sur iPhone, jusqu'à 4× sur Android) : sinon la toile est agrandie par le navigateur et ses bords sont flous
    dpr = Math.min(devicePixelRatio || 1, phone ? (heroHi ? 4 : 1.75) : Math.max(2, Math.min(8, Math.sqrt(PX_BUDGET / Math.max(1, W * H)))), QUALITY.maxDpr)
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
  }
  resize(); addEventListener('resize', resize)

  // une seule lentille pour toute la page : elle suit le pointeur de près (sans dépassement), apparaît sur les cartes
  const lens = { x: 0, y: 0, s: 0, init: false }
  // fondu intérieur de l'anneau (choix de Johann, voir CLAUDE.md) : largeur en part du rayon de la loupe ; la loupe se
  // resserre d'autant et garde tout son effet à l'intérieur
  const SOFT_W = 0.11
  const hoverDevice = matchMedia('(hover: hover)').matches
  // suivi amorti ; à moins de 1e-4 de la cible (invisible), la valeur s'y pose : une scène immobile est vraiment immobile
  const follow = (a, b, tau, dt) => { const v = a + (b - a) * (1 - Math.exp(-dt / tau)); return Math.abs(b - v) < 1e-4 ? b : v }

  let last = performance.now()
  // ?debug=perf : temps GPU par image (moyenne de 60 images), et temps JavaScript ; ?fx=0 coupe les zones floues
  // colorées pour comparer. Le temps GPU demande EXT_disjoint_timer_query (Chrome, Firefox ; pas Safari ni iOS).
  const perfOn = new URLSearchParams(location.search).get('debug') === 'perf'
  const tq = perfOn ? gl.getExtension('EXT_disjoint_timer_query') : null
  const perfQ = [], perfGpu = [], perfJs = []
  let perfEl = null
  if (perfOn) { perfEl = document.createElement('div'); perfEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;padding:6px 10px;border-radius:8px;background:rgb(0 0 0 / .8);color:#fff;font:12px/1.4 ui-monospace,monospace;pointer-events:none'; document.body.append(perfEl) }
  // contexte perdu (pilote GPU réinitialisé, mise en veille, trop de contextes) : repli sur les images de la page,
  // comme sans WebGL ; la toile est cachée, plus rien n'y est dessiné
  let lost = false
  canvas.addEventListener('webglcontextlost', () => {
    lost = true
    const r = document.documentElement
    r.classList.remove('has-gl', 'lens-on'); canvas.style.display = 'none'
    views.forEach((v) => { if (v.cv) v.cv.style.display = 'none' })
  })
  function frame(now) {
    if (lost) return
    if (!perfOn) return draw(now)
    const q = tq?.createQueryEXT(); if (q) tq.beginQueryEXT(tq.TIME_ELAPSED_EXT, q)
    const t0 = performance.now(); draw(now); perfJs.push(performance.now() - t0)
    if (q) { tq.endQueryEXT(tq.TIME_ELAPSED_EXT); perfQ.push(q) }
    while (tq && perfQ.length && tq.getQueryObjectEXT(perfQ[0], tq.QUERY_RESULT_AVAILABLE_EXT)) {
      const q0 = perfQ.shift(); if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) perfGpu.push(tq.getQueryObjectEXT(q0, tq.QUERY_RESULT_EXT) / 1e6); tq.deleteQueryEXT(q0)
    }
    if (perfJs.length >= 60) {
      const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length
      perfEl.textContent = `GPU ${perfGpu.length ? avg(perfGpu).toFixed(2) + ' ms' : 'non mesurable ici'} · JS ${avg(perfJs).toFixed(2)} ms · zones floues ${FX.colorStrength || FX.grain ? 'actives' : 'coupées (?fx=0)'}`
      perfJs.length = 0; perfGpu.length = 0
    }
  }
  let halSent = -1, lastSig = null
  function draw(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    // gros logo dessiné par la toile (ni relayé par l'image pendant sa montée, ni posé dans la barre) : pleine densité
    const wantHi = hasMark && !markDom && !docked
    // retour à 1,75× seulement une fois le défilement arrêté : changer la taille de la toile pendant le geste ferait un à-coup
    if (wantHi !== heroHi && (wantHi || now - scrollT > 300)) { heroHi = wantHi; resize() }
    if (canvas.width !== Math.round(innerWidth * dpr)) resize()
    sendNext()
    let flowNeeded = lens.s > 0.01
    if (document.documentElement.classList.contains('fiche-open')) {
      // fiche projet ouverte : le curseur reste toujours visible ; la toile, cachée par la fiche, est vidée une fois
      if (lens.hidden) { document.documentElement.classList.remove('lens-on'); lens.hidden = false }
      lens.s = 0
      FLOW.glNeeds = false
      if (lastSig !== null) { gl.viewport(0, 0, canvas.width, canvas.height); gl.scissor(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); lastSig = null }
      return
    }
    // la lentille : visible quand le pointeur est sur une carte (pas sur l'accueil)
    const small = W < 600
    // anneau de la lentille (20 nov. 2026 : agrandi de 7 %, 95 → 102 px, mobile 76 → 81 ; trait affiné, 14/88 → 10/88 du
    // rayon ; couleurs du kit)
    const Ro = small ? 81 : 102, Ri = Ro - Ro * 10 / 88
    let over = null
    for (const v of views) {
      if (v.mark || !v.ready) continue
      const b = v.el.getBoundingClientRect(), cr = v.clip?.getBoundingClientRect()
      if (ptr.x >= b.left && ptr.x <= b.right && ptr.y >= b.top && ptr.y <= b.bottom && (!cr || (ptr.x > cr.left && ptr.x < cr.right))) { over = v; break }
    }
    // sur un bouton ou un lien d'interface (flèches de la piste, barre du haut…) : pas de lentille, le curseur reste visible
    const onCtl = !!over && !!document.elementFromPoint(ptr.x, ptr.y)?.closest('button, .btn, .work__nav, .topbar, [role="button"]')
    // entre deux vignettes de la même piste (l'espace qui les sépare) : le « o » reste affiché un instant, il ne
    // clignote pas en passant de l'une à l'autre
    if (over) { lens.view = over; lens.overT = now }
    else if (lens.view && now - (lens.overT || -1e9) < 160) {
      const cr = lens.view.clip?.getBoundingClientRect(), b = lens.view.el.getBoundingClientRect()
      if (cr && ptr.x > cr.left && ptr.x < cr.right && ptr.y >= b.top && ptr.y <= b.bottom) over = lens.view
    }
    // pendant le défilement (et 200 ms après), pas de survol : les vignettes qui passent sous un curseur immobile ne
    // s'allument pas l'une après l'autre (clignotement)
    // (seul un vrai mouvement compte : la fin du défilement doux, au sous-pixel, ne bloque plus la lentille) ;
    // si la souris bouge, la lentille apparaît tout de suite, même pendant le défilement
    if (Math.abs(scrollY - lastSY) > 1) scrollT = now
    lastSY = scrollY
    // le « o » suit le curseur même pendant le défilement (il passe tout de suite d'une vignette à l'autre) ; la vignette
    // dessous passe en couleur au même moment
    const show = !!over && !onCtl && !ptr.touch   /* au doigt : pas de « o » (pas de curseur à remplacer) */ && !document.documentElement.classList.contains('fiche-open')
    if (!lens.init || (lens.s < 0.02 && show)) { lens.x = ptr.x; lens.y = ptr.y; lens.init = true }
    if (reduced) { lens.x = ptr.x; lens.y = ptr.y; lens.s = show ? 1 : 0 }
    else { lens.x = follow(lens.x, ptr.x, 0.035, dt); lens.y = follow(lens.y, ptr.y, 0.035, dt); lens.s = follow(lens.s, show ? 1 : 0, 0.09, dt) }
    const sc = lens.s < 0.005 ? 0 : 1 - Math.pow(1 - lens.s, 2)
    // curseur agité sur la roue : vitesse du pointeur (px/s), 0 à 1 vers 1800 px/s, lissée ; le flux accélère (flow.js)
    { const pv = lens.px === undefined || !dt ? 0 : Math.hypot(ptr.x - lens.px, ptr.y - lens.py) / dt
      lens.px = ptr.x; lens.py = ptr.y
      const ag = show && !reduced ? Math.min(1, pv / 1800) : 0
      FLOW.agitate = follow(FLOW.agitate, ag, ag > FLOW.agitate ? 0.12 : 0.6, dt) }
    // le « o » remplace le curseur : flèche masquée partout tant que le « o » est affiché (souris uniquement)
    const hide = sc > 0.02 && hoverDevice && !ptr.touch && !onCtl   // tant que le « o » est visible, sauf sur un bouton
    if (hide !== lens.hidden) { document.documentElement.classList.toggle('lens-on', hide); lens.hidden = hide }

    order ??= detached ? [...views.filter((v) => !v.mark), ...views.filter((v) => v.mark)] : views   // tactile : vignettes d'abord, logo ensuite
    // Une image n'est redessinée que si quelque chose a changé : toutes les valeurs qui décident du dessin sont relevées
    // d'abord (phase 1, sans rien dessiner), puis comparées à celles de l'image précédente. Identiques : rien n'est
    // envoyé au GPU, la toile garde l'image déjà affichée (exactement la même). Sinon, dessin complet (phase 2).
    const light = theme.bg[0] + theme.bg[1] + theme.bg[2] > 1.5
    const sig = [texVer, canvas.width, canvas.height, dpr, cellScale, FX.version, ...theme.bg, ...theme.ink, sc, sc > 0 ? lens.x : 0, sc > 0 ? lens.y : 0, views.indexOf(lens.view),
      FX.colorStrength > 0 || FX.grain > 0 ? now : 0, Math.floor(scrollY / SEED_STEP)]
    // écran tactile : ni le toucher ni l'appui n'allument une vignette ; c'est la vignette affichée au centre de l'écran
    // (la plus proche du centre, partie visible seulement) qui passe en couleur avec son bord irisé. Petite marge (32 px)
    // avant de changer de vignette, pour qu'elle ne clignote pas entre deux vignettes à égale distance.
    if (!hoverDevice) {
      let best = null, bestD = Infinity, curD = Infinity
      for (const v of views) {
        if (v.mark || !v.ready) continue
        const b = v.el.getBoundingClientRect(), cr = v.clip?.getBoundingClientRect()
        const l = Math.max(b.left, cr ? cr.left : 0, 0), r = Math.min(b.right, cr ? cr.right : W, W)
        const t = Math.max(b.top, 0), bo = Math.min(b.bottom, H)
        if (r - l < b.width * 0.5 || bo - t < b.height * 0.5) continue   // moins de la moitié visible : pas candidate
        const d = Math.hypot((l + r) / 2 - W / 2, (t + bo) / 2 - H / 2)
        if (d < bestD) { bestD = d; best = v }
        if (v === centerV) curD = d
      }
      if (!best || curD === Infinity || bestD < curD - 32) centerV = best
    }
    const jobs = []
    for (const v of order) {
      const b = v.el.getBoundingClientRect()
      if (!v.ready || b.bottom < 0 || b.top > H || b.right < 0 || b.left > W || b.width < 2) continue
      const cr = v.clip?.getBoundingClientRect()
      if (cr && (b.right < cr.left || b.left > cr.right)) continue
      if (v.video && !v.video.paused && v.video.readyState >= 2) { upload(v.tex, v.video); sig.push(NaN) }   // nouvelle image de la vidéo : toujours redessiner
      if (!v.seen) { if (!document.documentElement.classList.contains('is-loaded')) continue; v.seen = now }
      const w = b.width, h = b.height
      const reveal = 1   // vignettes : trame toujours complète (plus d'apparition ni de disparition en noir)
      if (v.mark) { maskFor(v); if (!v.maskB) continue }
      // la vignette sous le « o » passe en couleur en même temps que lui (aussi pendant le défilement : tout de suite)
      const hov = !v.mark && (hoverDevice
        ? show && v === over && ptr.x >= b.left && ptr.x <= b.right && ptr.y >= b.top && ptr.y <= b.bottom && (!cr || (ptr.x > cr.left && ptr.x < cr.right))
        : v === centerV)   // écran tactile : la vignette au centre de l'écran (plus haut)
      v.glass = reduced ? (hov ? 1 : 0) : follow(v.glass, hov ? 1 : 0, hov ? 0.16 : 0.12, dt)
      let xf = null
      if (v.mark) {
        const hero = v.el.closest('.hero'), hr = hero.getBoundingClientRect(), sr = hero.querySelector('.hero__slot').getBoundingClientRect()
        const p = HERO.p   // avancée de la scène (freinée sur écran tactile : hero-progress.js)
        const slot = { x: sr.left - b.left + sr.width / 2, y: sr.top - b.top + sr.height / 2, h: sr.height }
        // animations réduites : pas de scène de défilement, le logo est d'emblée à sa place (au-dessus du nom)
        // place du petit logo de la barre ; le logo y arrive quand la vue a remonté de (hauteur du logo posé − barre)
        const br = brandMark?.getBoundingClientRect()
        let dock = null
        if (br?.height) {
          const by = br.top + br.height / 2, m = Math.min(1, Math.max(0, -b.top / Math.max(1, slot.y - by)))
          dock = { x: br.left + br.width / 2 - b.left, y: by - b.top, h: br.height, m }
          // arrivé : le petit logo de la barre (identique) prend le relais
          // pas avant la fin de l'animation d'accueil (le petit logo et la barre n'existent pas encore)
          if (document.documentElement.classList.contains('intro-done') && (m >= 1) !== docked) { docked = m >= 1; document.documentElement.classList.toggle('brand-on', docked); if (docked) document.documentElement.classList.add('bar-on') }
        }
        // posé dans la barre : le petit logo de la barre (image du kit, au-dessus de la toile) a pris le relais au même pixel ;
        // le logo WebGL, entièrement caché dessous, n'est plus dessiné (ni le flux de sa roue calculé)
        if (docked && document.documentElement.classList.contains('brand-on')) { FLOW.hoverTarget = 0; continue }
        // écran tactile : le défilement est fait par le système (natif), le logo WebGL le suivrait avec une image de retard
        // (à-coups). Pendant la montée vers la barre, c'est donc l'image du kit placée dans la page (.hero__mark, dans
        // .hero__slot) qui est montrée : elle défile nativement avec la page ; le script ne règle que sa taille et sa position
        // horizontale (variables --dock-x / --dock-s, styles.css). Avant le relais, la roue du « o » s'est posée sur la roue
        // fixe du kit (FLOW.calm, plus bas) : le passage de la toile à l'image ne se voit pas.
        if (!hoverDevice && !reduced) FLOW.calm = 1 - Math.min(1, Math.max(0, (p - 0.86) / 0.12))
        if (!hoverDevice && !reduced && dock && dock.m > 0 && p >= 0.999) {
          // copie de l'image du logo hors de la scène collante (.hero__dock, styles.css), posée sur l'emplacement du logo.
          // Là où le navigateur sait lier une animation au défilement, la montée vers la barre est jouée par lui (CSS,
          // au rythme du doigt) : on ne lui donne que les positions de défilement de départ et d'arrivée et la taille et le
          // décalage finaux. Sinon (anciens navigateurs), le script règle la taille et le décalage à chaque image.
          const d = (Math.pow(2, 10 * dock.m) - 1) / 1023, y0 = scrollY + b.top
          setDock('--dock-l', (sr.left - hr.left).toFixed(1) + 'px'); setDock('--dock-t', (sr.top - hr.top).toFixed(1) + 'px')
          setDock('--dock-w', sr.width.toFixed(1) + 'px'); setDock('--dock-h', sr.height.toFixed(1) + 'px')
          if (DOCK_CSS) {
            setDock('--dock-y0', y0.toFixed(1) + 'px'); setDock('--dock-y1', (y0 + slot.y - (dock.y + b.top)).toFixed(1) + 'px')
            setDock('--dock-dx', (dock.x - slot.x).toFixed(1) + 'px'); setDock('--dock-ds', (dock.h / slot.h).toFixed(4))
          } else {
            setDock('--dock-x', ((dock.x - slot.x) * d).toFixed(2) + 'px')
            setDock('--dock-s', ((slot.h + (dock.h - slot.h) * d) / slot.h).toFixed(4))
          }
          if (!markDom) { markDom = true; document.documentElement.classList.add('mark-dom') }
          FLOW.hoverTarget = 0; continue
        }
        if (markDom) { markDom = false; document.documentElement.classList.remove('mark-dom') }
        flowNeeded = true
        xf = markXf(w, h, reduced ? 1 : p, reduced ? 1e9 : import.meta.env.DEV && window.__introMs != null ? window.__introMs : now - v.seen, slot, [innerWidth / 2 - b.left, innerHeight / 2 - b.top], dock)
        // gros logo à l'arrêt : il flotte doucement (lente houle verticale, légère dérive horizontale, deux périodes
        // sans multiple commun : le mouvement ne se répète pas à l'identique). Translation seule : jamais de rotation de la
        // roue. Le flottement s'installe en ~1 s quand la page est immobile et s'efface vite dès qu'elle défile, dès que le
        // logo part vers la barre (dock) et pendant l'animation d'arrivée : le relais du chargeur et l'emboîtement dans le
        // petit logo restent au pixel près
        const still = !reduced && xf[4] >= 1 && now - scrollT > 450 && !(dock && dock.m > 0) && document.documentElement.classList.contains('intro-done')
        floatA = follow(floatA, still ? 1 : 0, still ? 0.9 : 0.12, dt)
        if (floatA > 1e-3) {
          const s = now / 1000, a = floatA * Math.min(xf[2], 520)
          xf = [xf[0] + Math.sin(s * 2 * Math.PI / 9.1) * 0.006 * a, xf[1] + Math.sin(s * 2 * Math.PI / 5.3) * 0.018 * a, xf[2], xf[3], xf[4]]
        }
        // survol du « o » (souris) : la couleur sous le curseur s'élargit (flow.js) ; position du curseur sur la roue, dans la
        // même convention que flowColor (u : 0 en bas, sens horaire)
        { const oR = O_R * xf[2] * 1.3, ox = b.left + xf[0] + O_OFF[0] * xf[2], oy = b.top + xf[1] + O_OFF[1] * xf[2]
          const dx = ptr.x - ox, dy = ptr.y - oy
          FLOW.hoverTarget = hoverDevice && !ptr.touch && !reduced && Math.hypot(dx, dy) < oR ? 1 : 0
          FLOW.hoverX = ox; FLOW.hoverY = oy
          if (FLOW.hoverTarget) FLOW.hoverU = (((Math.atan2(dy, dx) * 180 / Math.PI + 90 - 180) / 360) % 1 + 1) % 1 }
        // survol du S : position du curseur en unités du monogramme ; la balle n'agit que sur le tracé ou tout près
        // (distance au S : carte lue une fois sur le CPU) ; sur le « o », seul son effet de couleur joue
        { const u = xf[2] / 1000; let tx = (ptr.x - b.left - xf[0]) / u + MONO_W / 2, ty = (ptr.y - b.top - xf[1]) / u + 500
          // réduction au défilement (le gros logo rejoint sa place au-dessus du nom, markXf) : tant que la scène avance, la
          // boule parcourt le S au rythme de la réduction (même avancée q que markXf : du haut du S en grand au bas du S
          // posé ; en remontant, elle repart vers le haut). Elle prend le pas sur le survol (curseur resté sur le logo
          // pendant qu'on fait défiler à la molette) et sur le battement, qui reprend après son délai
          if (Math.abs(p - heroPL) > 1e-5) { heroPT = now; heroPL = p }
          const sq = 1 - Math.pow(1 - Math.min(1, Math.max(0, p / 0.54)), 3)
          const scrollBall = !reduced && xf[4] >= 1 && !!v.maskW && sq > 0.003 && sq < 0.997 && now - heroPT < 350
          // survol : seulement 0,7 s après la fin de la boule du défilement (pas de saut de la boule vers le curseur)
          const hov = !scrollBall && now - heroPT > 350 + 700 && hoverDevice && !ptr.touch && !reduced && !FLOW.hoverTarget && xf[4] >= 1 && sdS(tx, ty) > -BULGE_R * 0.5
          // boule automatique (hors survol) : position le long de l'axe, vitesse douce (départ et arrivée ralentis)
          let auto = false, autoEnv = 1
          if (!reduced && xf[4] >= 1 && v.maskW) {
            traceT0 ??= now + TRACE.delay
            if (hov) traceT0 = Math.max(traceT0, now + TRACE.delay)   // survol : le cycle attend que le curseur parte
            // deuxième boule : elle part un peu avant l'arrivée de la première (gap < 0), qui s'efface vite en bas ; vagues
            // du nom : n1 et n2, pendant la course de chaque boule du S
            const s2 = TRACE.pass + TRACE.gap, n1 = TRACE.nameAt * TRACE.pass, n2 = s2 + n1
            // cycle : sa longueur (selon la course des boules du nom) est fixée à son début, pour que les vagues ne sautent
            // pas quand la taille du nom ou du S change
            const tc = now - traceT0, cycOf = () => n2 + Math.max(TRACE.name, nameHeartDur()) + TRACE.pause
            if (tc < 0) cycL = 0
            else { if (!cycL) { cycA = 0; cycL = cycOf() } while (tc - cycA >= cycL) { cycA += cycL; cycL = cycOf() } }
            const m = tc < 0 ? -1 : tc - cycA
            const pass = m < 0 ? 0 : m >= s2 && m < s2 + TRACE.pass ? 2 : m < TRACE.pass ? 1 : 0
            const k = pass === 2 ? (m - s2) / TRACE.pass : pass === 1 ? m / TRACE.pass : -1
            if (!hov && k >= 0) {
              const [ax, ay] = axisAt(0.5 - 0.5 * Math.cos(Math.PI * k))
              // nouvelle boule : elle naît en haut du S (le reste de la précédente, presque effacé, disparaît)
              if (pass !== tracePass) { bulge.x = ax; bulge.y = ay; if (bulge.a < 0.35) bulge.a = 0 }
              // ampleur : enveloppe lente le long de la course (montée sur 40 %, retombée de 45 % à 88 %) ; nulle bien
              // avant le départ de la boule suivante : la boule rétrécit doucement, jamais d'extinction d'un coup
              tx = ax; ty = ay; auto = true; autoEnv = ss01(k / 0.4) * (1 - ss01((k - 0.45) / 0.43))
            }
            tracePass = hov ? 0 : pass
            // battement du nom (accueil et pied de page) : ses deux vagues, chacune à la suite d'une boule du S
            // (moment du cycle, sa longueur, et vitesse moyenne de la boule du S, px/ms)
            setNameHeart(scrollBall ? -1 : m, cycL, AXL[AXL.length - 1] * xf[2] / 1000 / TRACE.pass)
            if (scrollBall) {
              traceT0 = Math.max(traceT0, now + TRACE.delay); tracePass = 0
              ;[tx, ty] = axisAt(sq); auto = true; autoEnv = 1
            }
          } else setNameHeart(-1, 0)
          const near = hov || auto
          // début du défilement : une boule déjà là (survol, battement) s'éteint d'abord sur place, sans glisser vers sa
          // nouvelle place ; la boule du défilement naît ensuite là où elle doit être dans le S
          if (scrollBall && !sbOn) { sbOn = true; sbFade = bulge.a > 0.02 && Math.hypot(tx - bulge.x, ty - bulge.y) > 30 }
          if (!scrollBall) sbOn = sbFade = false
          if (sbFade && bulge.a < 0.02) { sbFade = false; bulge.a = 0 }
          if (sbFade) { tx = bulge.x; ty = bulge.y }
          if (bulge.a < 0.01) { bulge.x = tx; bulge.y = ty }   // nouvelle entrée : la balle part du curseur
          bulge.x = follow(bulge.x, tx, 0.07, dt); bulge.y = follow(bulge.y, ty, 0.07, dt)
          // boule du défilement : son ampleur suit sa place dans le S comme celle du battement suit le temps (elle naît en
          // haut du S, s'efface avant d'atteindre le bas, dans un sens comme dans l'autre), au rythme du défilement
          const sEnv = scrollBall ? ss01(sq / 0.25) * (1 - ss01((sq - 0.8) / 0.15)) : 0
          // (toujours en douceur : une boule ne gonfle ni ne dégonfle jamais d'un coup)
          bulge.a = sbFade ? follow(bulge.a, 0, 0.14, dt) : scrollBall ? follow(bulge.a, sEnv, sEnv > bulge.a ? 0.12 : 0.14, dt)
            : hov ? follow(bulge.a, 1, 0.2, dt) : auto ? follow(bulge.a, autoEnv, 0.06, dt) : follow(bulge.a, 0, 0.35, dt)
          sig.push(bulge.x, bulge.y, bulge.a, LOGO_TUNE.contrast, v.maskW ? 1 : 0) }

      }
      if (v.text) sig.push(`${Math.round(w)}x${Math.round(h)}@${dpr}:${document.fonts?.status}`)
      // écran tactile : la vignette est copiée dans sa propre image, qui défile toute seule avec la page. Son dessin ne
      // dépend de sa position que près des bords (verre liquide : haut et bas de l'écran, côtés de la piste, ~40 px).
      // Loin des bords (OWN_NEAR), position « canonique » : bouger ne la redessine pas. Près d'un bord : position réelle,
      // mise à jour au plus toutes les OWN_STEP ms (30 images/s au lieu de 60) ; la copie, elle, suit la page à chaque image
      let px = b.left, py = b.top, cl = cr ? cr.left : 0, crr = cr ? cr.right : 0
      if (detached && !v.mark) {
        const nearY = b.top < OWN_NEAR || b.bottom > H - OWN_NEAR
        const nearX = !!cr && (b.left - cr.left < OWN_NEAR || cr.right - b.right < OWN_NEAR)
        if (!nearY) py = (H - h) / 2
        if (!nearX) { px = (W - w) / 2; cl = px - 1e4; crr = px + w + 1e4 }
        if (nearX || nearY) {
          const moved = px !== v.ownPx || py !== v.ownPy || cl !== v.ownCl
          if (moved && v.ownT !== undefined && now - v.ownT < OWN_STEP && v.ownPx !== undefined) { px = v.ownPx; py = v.ownPy; cl = v.ownCl; crr = v.ownCr }
          else if (moved) v.ownT = now
        }
        v.ownPx = px; v.ownPy = py; v.ownCl = cl; v.ownCr = crr
      }
      v.drawPos = [px, py, cl, crr]
      sig.push(views.indexOf(v), px, py, w, h, cl, crr, v.glass, v.color ? 1 : 0, ...(xf || []))
      jobs.push({ v, b, cr, w, h, reveal, xf, glassy: v.radius > 0 })
    }
    if (flowNeeded || sc > 0) sig.push(FLOW.version)   // roue « flux » : logo de l'accueil et anneau de la lentille
    const same = lastSig && lastSig.length === sig.length && sig.every((x, k) => x === lastSig[k])
    lastSig = sig
    FLOW.glNeeds = flowNeeded   // ni logo ni lentille à l'écran : le flux se met en pause
    if (same) return

    gl.viewport(0, 0, canvas.width, canvas.height); gl.scissor(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    // roue « flux » : nouvelle texture calculée pour cette image (flow.js) → envoyée au GPU
    // (rattachée à l'unité 6, puis l'unité 0 redevient active : une texture créée ensuite ne doit pas prendre la place
    // de celle du flux)
    gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, flowTex)
    if (FLOW.version !== flowVer) { flowVer = FLOW.version; gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FLOW.size, 1, gl.RGBA, gl.UNSIGNED_BYTE, FLOW.lut) }
    gl.activeTexture(gl.TEXTURE0)
    for (const { v, b, cr, w, h, reveal, xf, glassy } of jobs) {
      const pw = Math.round(w * dpr), ph = Math.round(h * dpr)
      const own = detached && !v.mark   // vignette dessinée dans sa propre image (écran tactile), voir plus bas
      let x0 = own ? 0 : Math.round(b.left * dpr), y0 = own ? 0 : Math.round((H - b.bottom) * dpr)
      const sx = x0, sy = y0
      gl.useProgram(prog)
      if (halSent !== FX.version) { halSent = FX.version; gl.uniform1f(U.uHal, FX.halation) }
      if (glassy) {
        // passe 1 : le contenu de la vignette dans la texture intermédiaire
        ensureFbo(pw, ph)
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        x0 = 0; y0 = 0
        gl.viewport(0, 0, pw, ph); gl.scissor(0, 0, pw, ph)
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
      } else {
        gl.viewport(x0, y0, pw, ph)
        gl.scissor(Math.max(0, x0), Math.max(0, y0), pw, ph)
      }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, v.tex)
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, v.mask || v.tex)
      if (v.maskB) { gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, v.maskB) }
      if (v.maskW) { gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, v.maskW) }
      if (v.maskA) { gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, v.maskA) }
      gl.uniform2f(U.uRes, w, h); gl.uniform2f(U.uOrigin, x0, y0); gl.uniform2f(U.uImg, v.img[0], v.img[1]); gl.uniform2f(U.uPos, v.pos[0], v.pos[1])
      gl.uniform1f(U.uEdgeFloor, theme.bg[0] + theme.bg[1] + theme.bg[2] > 1.5 ? 1 : 0.12)   // clair : pas d'effacement (flou CSS aux bords)
      gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uCell, v.mark ? 6 : v.cell * (W >= 769 ? 1 / 1.15 : 1) * Math.min(1, Math.max(0.45, W / 1100)) * cellScale   /* PC : un cran plus fin (÷ 1,15) ; trame proportionnelle à la largeur d'écran (mobile : 0,45) */)
      gl.uniform1f(U.uReveal, reveal); gl.uniform1f(U.uFade, v.fade ? 1 : 0); gl.uniform1f(U.uHasMask, v.mark ? 1 : 0)
      gl.uniform1f(U.uFloor, v.mark ? 0.6 : 0); gl.uniform2f(U.uLv, ...(v.lv || [0, 1])); gl.uniform1f(U.uRadius, glassy ? 1 : 0)
      // texte de la vignette (unité 3) ; sans texte, l'unité est vidée : elle ne doit jamais désigner la texture dans
      // laquelle on dessine (sinon la passe est refusée : « feedback loop »)
      if (v.text) textFor(v, w, h)
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, v.text ? v.textTex : null)
      gl.uniform1f(U.uHasText, v.text ? 1 : 0)
      gl.uniform1f(U.uColor, v.color ? 1 : v.glass)   // au survol : la trame passe en couleur (fondu)
      const [dpx, dpy, dcl, dcr] = v.drawPos || [b.left, b.top, cr ? cr.left : 0, cr ? cr.right : 0]
      gl.uniform4f(U.uScr, dpx, dpy, W, H)
      if (cr) gl.uniform4f(U.uClip, dcl - dpx, dcr - dpx, W < 769 ? 21 : 80, 0)
      else gl.uniform4f(U.uClip, 0, 0, 0, 0)
      // intérieur de la lentille : l'image d'origine de cette vue (l'anneau est dessiné après, par-dessus tout)
      gl.uniform3f(U.uLens, lens.x - b.left, lens.y - b.top, v !== lens.view ? 0 : (Ri + 1) * sc); gl.uniform1f(U.uLensO, Ro * sc); gl.uniform1f(U.uSoft, (Ri + 1) * sc * SOFT_W); gl.uniform1f(U.uGlass, v.glass)
      if (v.mark) {
        gl.uniform3f(U.uInk, ...theme.ink)
        gl.uniform4f(U.uMarkXf, xf[0], xf[1], xf[2], xf[3]); gl.uniform1f(U.uReveal, xf[4])   // le S apparaît pendant le glissement
        { const f = revealFront(xf[4]), [px, py, tx, ty] = tipAt(f); gl.uniform4f(U.uTip, px, py, f, AXL[AXL.length - 1]); gl.uniform2f(U.uTipT, v.maskA ? tx : 0, v.maskA ? ty : 0) }
        // ampleur en cloche douce (montée et retombée sans à-coup)
        gl.uniform4f(U.uEye, bulge.x, bulge.y, BULGE_A * bulge.a * bulge.a * (3 - 2 * bulge.a), BULGE_R)
        gl.uniform2f(U.uWidthK, v.maskW ? LOGO_TUNE.contrast - 1 : 0, v.maskW ? widthRef : 0)   // y = 0 : carte pas encore chargée
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (glassy) {
        // passe 2 : le bord de verre, qui réfracte ce contenu, sur la toile
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(sx, sy, pw, ph); gl.scissor(Math.max(0, sx), Math.max(0, sy), pw, ph)
        gl.useProgram(gProg)
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, fboTex)
        gl.uniform1i(GU.uFbo, 2); gl.uniform2f(GU.uFboSize, fboW, fboH)
        gl.uniform2f(GU.uRes, w, h); gl.uniform2f(GU.uOrigin, sx, sy); gl.uniform1f(GU.uDpr, dpr)
        // irisé du verre : une seule intensité (pas de changement au survol) ; plus présent sur fond clair
        gl.uniform1f(GU.uRadius, v.radius); gl.uniform1f(GU.uGlass, v.glass * (light ? 0.95 : 0.6));   // bord neutre au repos, irisé au survol
        gl.uniform1f(GU.uVivid, light ? 1 : 0); gl.uniform1f(GU.uEdgeFloor, light ? 1 : 0.12)
        v.irisMix ??= [Math.random(), Math.random() < 0.5 ? -1 : 1, 4 + Math.floor(Math.random() * 4)]   // tirée une fois par vignette
        gl.uniform3f(GU.uIrisMix, ...v.irisMix)
        gl.uniform2f(GU.uScrY, dpy, H); gl.uniform2f(GU.uScrX, dpx, W)
        sendFx()
        if (cr) gl.uniform4f(GU.uClip, dcl - dpx, dcr - dpx, W < 769 ? 21 : 80, 0)
        else gl.uniform4f(GU.uClip, 0, 0, 0, 0)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      if (own) {
        // écran tactile : la vignette, dessinée dans le coin de la toile, est copiée dans sa propre image, placée dans la
        // page : elle défile avec la page (défilement natif du téléphone), sans aucun décalage ; le coin est ensuite effacé
        if (!v.cv) { v.cv = Object.assign(document.createElement('canvas'), { className: 'gl-card' }); v.cv.setAttribute('aria-hidden', 'true'); v.el.append(v.cv); v.cx = v.cv.getContext('2d') }
        if (v.cv.width !== pw || v.cv.height !== ph) { v.cv.width = pw; v.cv.height = ph } else v.cx.clearRect(0, 0, pw, ph)
        v.cx.drawImage(canvas, 0, canvas.height - ph, pw, ph, 0, 0, pw, ph)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.scissor(0, 0, pw, ph); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
      }
    }
  }
  document.documentElement.classList.add('has-gl')
  // le logo de l'accueil est prêt (champ de distance chargé dès le départ) : le chargeur attend ce moment, sans quoi le
  // logo manquerait quelques images juste après lui
  const ready = Promise.all(views.filter((v) => v.mark).map(maskFor))
  // pour le chargeur : rayon du « o » au relais, rayon visé par la croissance, durée de la croissance
  const intro = () => ({ r0: handoffR(innerWidth, innerHeight), r1: bigOf(innerWidth, innerHeight) * O_R, grow: GROW })
  // taille des points de la trame des vignettes (flèches gauche / droite du clavier)
  const setCellScale = (f) => { cellScale = Math.min(2.5, Math.max(0.5, cellScale * f)) }
  return { frame, ready, intro, setCellScale }
}
