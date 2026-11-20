/**
 * Renflement de JOHANN ARATA (pied de page) (comme le S du logo, gl.js) : une balle épaissit les lettres sous
 * elle, comme une balle qui passe dans un collant. Le dessin est fait par les filtres .bal-rf du SVG (logotype-svg.js) :
 * on n'y règle que la région du filtre et la place de la bosse (autour de la balle), et son ampleur (k3).
 * - survol : la balle suit le curseur avec un léger retard ; elle ne naît que si le curseur lui-même touche une lettre
 *   (pas seulement s'il passe près : sinon elle déformait des lettres qu'on ne touchait pas). Seulement à la souris.
 * - battement (nom tracé du pied de page) : à la suite de chaque boule du S (gl.js, setNameHeart), une vague :
 *   deux boules partent de l'espace entre JOHANN et ARATA et suivent le chemin principal du tracé (name-trace-data.js)
 *   jusqu'aux deux bouts du nom. Deux vagues, comme les deux boules du S (couches 0-1 et 2-3). Aucune boule tant que le
 *   nom n'est pas entier (tracé en cours, ou effacé au défilement).
 * Seulement le petit nom (pied de page) : plus sur le grand nom de l'accueil (design/archives/renflement-grand-nom).
 * Nom tracé une fois entier (.bal-net) ; hors animations réduites.
 */
import { NAME_TRACE } from './name-trace-data.js'

const R_BASE = 78          // rayon de la bosse (unités du dessin ; hauteur des lettres : 344)
const R_MIN_PX = 13   // petit nom (pied de page) : la bosse garde au moins ce rayon à l'écran, sinon elle ne se voit pas
const AMP = 0.55      // ampleur au plus fort (ajoutée à l’alpha adouci, dont le seuil est à 0,62 : environ +40 % d’épaisseur sous la balle)
const R_PAD = 30        // marge de la région du filtre autour de la bosse (≥ 3 × le flou)

let kickAll = null, lastSet = -1e9, speed = 0.4, heartDur = 0
// rythme du battement (gl.js, setNameRhythm) : départ des deux vagues dans le cycle, durée minimale d'une vague, repos,
// délai avant le premier (nom seul)
let rhythm = { n1: 540, n2: 1360, name: 1000, pause: 1400, delay: 400 }
export function setNameRhythm(r) { rhythm = r }
// horloge du battement : début du cycle en cours (null : arrêté) et sa longueur, fixée à son début
let cycA = null, cycL = 0
const cycOf = () => rhythm.n2 + Math.max(rhythm.name, heartDur) + rhythm.pause
/** Battement du nom : moment du cycle du S (ms ; −1 : arrêté), longueur de ce cycle, et vitesse moyenne de la boule du S
 *  à l'écran (px/ms), que suivent les boules du nom. Appelé à chaque image par gl.js tant que le S est affiché ; quand il
 *  ne l'est plus (rangé dans la barre, pied de page), le nom continue sur la même horloge, à la dernière vitesse connue. */
export function setNameHeart(m, L, v) {
  const now = performance.now()
  lastSet = now; if (v > 0) speed = v
  if (m >= 0) { cycA = now - m; cycL = L } else cycA = null
  kickAll?.()
}
// moment du cycle (ms), ou −1
const phase = (now) => {
  if (cycA == null) { if (now - lastSet < 300) return -1; cycA = now + rhythm.delay; cycL = cycOf() }   // S absent : le nom bat seul
  if (now < cycA) return -1
  while (now - cycA >= cycL) { cycA += cycL; cycL = cycOf() }
  return now - cycA
}
/** Durée (ms) de la plus longue course des boules du nom affiché (pour la longueur du cycle, gl.js). */
export const nameHeartDur = () => heartDur
/** Réveille l'animation (nom devenu entier : son battement peut commencer). */
export const wakeNameBulge = () => kickAll?.()

// chemin (points) → position à la fraction f de sa longueur
const along = (pts) => {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return Object.assign((f) => {
    const d = Math.min(1, Math.max(0, f)) * L[L.length - 1]; let i = 1
    while (i < L.length - 1 && L[i] < d) i++
    const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i]
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  }, { len: L[L.length - 1] })
}
const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x) }

export function initNameBulge(svgs) {
  if (!svgs.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const hoverOk = matchMedia('(hover: hover)').matches
  const items = svgs.map((el) => {
    const balls = [...el.querySelectorAll('.bal-r')].map((layer) => {
      const f = el.getElementById(layer.getAttribute('filter').slice(5, -1))
      return { layer, f, img: f?.querySelector('.bal-ri'), k: f?.querySelector('.bal-rk'), x: 0, y: 0, a: 0, shown: false }
    }).filter((b) => b.f && b.img && b.k)
    // battement : noms tracés (accueil, pied de page) ; nom empilé (mobile) : ARATA est décalé sous JOHANN
    const st = el.dataset.empile?.split(' ').map(Number)
    const heart = el.classList.contains('logotype--balayage') && balls.length > 3
      ? [along(NAME_TRACE.paths.johann), along(NAME_TRACE.paths.arata.map(([x, y], i) => st && i > 0 ? [x + st[0], y + st[1]] : [x, y]))]
      : null
    return {
      el, balls, heart, st, waves: [{ s0: -1e9, dur: [1, 1] }, { s0: -1e9, dur: [1, 1] }],
      // lettres du mot (géométrie seule, pour savoir si le curseur en touche une) et leur décalage (nom empilé : ARATA
      // est dans un groupe déplacé sous JOHANN)
      paths: [...el.querySelectorAll('[id^="bal-l-"] path')].map((pa) => {
        const g = pa.parentElement.closest('g[transform]'), m = g?.transform.baseVal.consolidate()?.matrix
        return [pa, m ? m.e : 0, m ? m.f : 0]
      }),
      pt: el.createSVGPoint(),
    }
  }).filter((it) => it.balls.length)
  if (import.meta.env.DEV) window.__bulge = items   // audit (scratch) : avancée des boules du battement image par image
  if (!items.length) return
  const onInk = (it, x, y) => it.paths.some(([pa, dx, dy]) => { it.pt.x = x - dx; it.pt.y = y - dy; return pa.isPointInFill(it.pt) })
  let px = -1e9, py = -1e9, raf = 0, last = 0
  const follow = (a, b, tau, dt) => a + (b - a) * (1 - Math.exp(-dt / tau))
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } }
  kickAll = kick
  if (hoverOk) {
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; kick() }, { passive: true })
    document.documentElement.addEventListener('pointerleave', () => { px = py = -1e9; kick() })
  }
  addEventListener('scroll', kick, { passive: true })

  const radius = (it) => Math.max(R_BASE, R_MIN_PX / (it.el.getScreenCTM()?.a || 1))
  const place = (it, b) => {
    const show = b.a > 0
    if (show !== b.shown) { b.layer.style.display = show ? '' : 'none'; b.shown = show }
    if (!show) return
    const e = b.a * b.a * (3 - 2 * b.a)   // montée et retombée en douceur
    const R = radius(it), PAD = R_PAD
    b.f.setAttribute('x', (b.x - R - PAD).toFixed(1)); b.f.setAttribute('y', (b.y - R - PAD).toFixed(1))
    b.f.setAttribute('width', 2 * (R + PAD)); b.f.setAttribute('height', 2 * (R + PAD))
    b.img.setAttribute('x', (b.x - R).toFixed(1)); b.img.setAttribute('y', (b.y - R).toFixed(1))
    b.img.setAttribute('width', 2 * R); b.img.setAttribute('height', 2 * R)
    b.k.setAttribute('k3', (AMP * e).toFixed(3))
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now
    let busy = false
    for (const it of items) {
      const r = it.el.getBoundingClientRect()
      // nom tracé : entier (bal-net), ou en cours de tracé (tr-on : battement seulement, sur la partie tracée)
      const whole = !it.el.classList.contains('logotype--balayage') || it.el.classList.contains('bal-net')
      // nom pas encore entier (tracé en cours, ou effacé au défilement) : aucune boule ; celles qui passaient dégonflent
      // en douceur (plus rien sur la seule partie tracée : le bord inachevé se déformait)
      // et le nom entièrement à l'écran (rien de coupé par le haut ou le bas de la fenêtre)
      const on = r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && whole
      const [b0] = it.balls
      let tx = b0.x, ty = b0.y, near = false
      if (on && whole && px > r.left - 40 && px < r.right + 40 && py > r.top - 40 && py < r.bottom + 40) {
        const p = new DOMPoint(px, py).matrixTransform(it.el.getScreenCTM().inverse())
        if (onInk(it, p.x, p.y)) { tx = p.x; ty = p.y; near = true }
      }
      // battement : durée de la course de chaque boule (son chemin à l'écran à la vitesse de la boule du S) ; temps
      // depuis le départ de chaque vague, d'après l'horloge du battement
      let ht = [-1, -1], dur = null
      if (on && it.heart) {
        const a = it.el.getScreenCTM()?.a || 1
        dur = it.heart.map((h) => h.len * a / speed); heartDur = Math.max(...dur)
        const m = phase(now)
        if (m >= 0) ht = [rhythm.n1, rhythm.n2].map((n) => m >= n ? m - n : -1)
        busy = true
      }
      // vague en cours : son départ et sa durée sont ceux fixés quand elle est partie. Les horloges du S et du nom se
      // recalent parfois de quelques dizaines de ms : la même vague continue (seul un écart d'au moins 40 % de sa course
      // en fait une nouvelle), sinon la boule repartait en arrière
      const same = (t, w) => Math.abs(it.waves[w].s0 - (now - t)) < 0.4 * Math.max(...it.waves[w].dur)
      const runs = (t, w) => t >= 0 && (same(t, w) ? now - it.waves[w].s0 < Math.max(...it.waves[w].dur) : t < heartDur)
      if (!near && dur && ht.some(runs)) {
        // battement : chaque vague, deux boules du centre vers les deux bouts (départ et arrivée ralentis, comme celles
        // du S) ; leur ampleur monte au départ et retombe avant l'arrivée ; vague finie : ses boules s'éteignent
        ht.forEach((t, w) => {
          // durée fixée au départ de la vague : la vitesse du S (sa taille) change pendant le défilement, et la recalculer
          // à chaque image faisait avancer la boule par à-coups, voire reculer
          const wv = it.waves[w]
          if (t >= 0 && !same(t, w)) { wv.s0 = now - t; wv.dur = dur.slice() }
          if (t >= 0) t = now - wv.s0
          for (let i = 0; i < 2; i++) {
            const b = it.balls[2 * w + i], k = t < 0 ? -1 : t / wv.dur[i]
            const f = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, k)))
            let amp = k < 0 || k >= 1 ? 0 : ss(k / 0.4) * (1 - ss((k - 0.45) / 0.5))   // montée et retombée lentes (jamais d'à-coup)
            ;[b.x, b.y] = it.heart[i](f); b.a = amp; b.prog = k; place(it, b)
          }
        })
        busy = true
        continue
      }
      if (b0.a < 0.01 && near) { b0.x = tx; b0.y = ty }   // nouvelle entrée : la balle part du curseur
      b0.x = follow(b0.x, tx, 0.07, dt); b0.y = follow(b0.y, ty, 0.07, dt)
      b0.a = follow(b0.a, near ? 1 : 0, near ? 0.18 : 0.35, dt)
      if (!near && b0.a < 0.003) b0.a = 0
      place(it, b0)
      // les autres boules (battement) dégonflent en douceur si le survol l'interrompt
      for (const b of it.balls.slice(1)) { b.a = b.a < 0.003 ? 0 : follow(b.a, 0, 0.25, dt); place(it, b); if (b.a > 0) busy = true }
      // en mouvement (balle ou ampleur) : image suivante ; à l'arrêt sous un curseur immobile, rien à recalculer
      if ((near ? 1 - b0.a > 0.002 : b0.a > 0) || Math.hypot(tx - b0.x, ty - b0.y) > 0.5) busy = true
    }
    raf = busy ? requestAnimationFrame(frame) : 0
  }
}
