/**
 * Vidéo de fond de l'accueil (.hero__bg) : flux HLS via hls.js, chargé à la demande, MP4 de secours.
 * Sorti de main.js tel quel (même comportement) ; main.js décide quand elle doit jouer (play(true/false)).
 */
/**
 * @param {HTMLVideoElement|null} heroBg
 * @param {{ reduced: boolean, covered: () => boolean }} o  covered : vrai quand la vidéo est cachée (fiche ouverte)
 * @returns {(on: boolean) => void}  lecture voulue ou non
 */
export function heroVideo(heroBg, { reduced, covered }) {
  // montage vidéo des projets (3 à 5 s chacun, le caïman en ouverture et en image d'attente) : lu en boucle seulement
  // quand il est visible, jamais avec « réduire les animations » (l'image d'attente reste alors seule)
  // Diffusion adaptative (HLS, 4K → 800p) : le navigateur prend la meilleure qualité que l'écran et la connexion
  // permettent, via hls.js (chargé à la demande ; HLS natif sur les iPhone sans MediaSource). Les MP4 des <source>
  // (render.js) servent sans JavaScript ; pendant le flux, leur src est mis de côté (hls.js pose sa propre <source> ;
  // les balises restent, pour le changement de langue sans rechargement), et rendu s'il échoue.
  let heroStream = null
  const heroBgStream = () => {
    if (heroStream) return heroStream
    const url = heroBg.dataset.hls
    const mp4 = [...heroBg.querySelectorAll('source')]
    const fallback = () => { heroBg.removeAttribute('src'); heroBg.querySelectorAll('source').forEach((x) => { if (!mp4.includes(x)) x.remove() }); mp4.forEach((x) => { x.src = x.dataset.src }); heroBg.load() }
    const native = () => { if (heroBg.canPlayType('application/vnd.apple.mpegurl')) heroBg.src = url }
    if (!url) return (heroStream = Promise.resolve())
    if (!window.MediaSource && !window.ManagedMediaSource) return (heroStream = Promise.resolve(native()))
    return (heroStream = import('hls.js/light').then(({ default: Hls }) => {
      if (!Hls.isSupported()) return native()
      const hls = new Hls({ capLevelToPlayerSize: true, capLevelOnFPSDrop: true, abrEwmaDefaultEstimate: 30e6, enableWorker: false,
        // 10 s d'avance (au lieu de 40 : tout le montage de 27 s, 78 Mo en 2400p, partait dès l'arrivée, même si l'on
        // quittait l'accueil aussitôt) ; la vidéo s'efface au premier défilement
        maxBufferLength: 10, maxMaxBufferLength: 20, backBufferLength: 10,
        // flux en panne : MP4 de secours après deux essais, plutôt qu'une longue attente sur l'image fixe
        fragLoadPolicy: { default: { maxTimeToFirstByteMs: 10000, maxLoadTimeMs: 120000, timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 }, errorRetry: { maxNumRetry: 2, retryDelayMs: 1000, maxRetryDelayMs: 4000 } } } })
      let down = false
      const fail = () => { if (down) return; down = true; heroBg.removeEventListener('error', fail); hls.destroy(); fallback(); heroBgGo() }
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) fail() })
      // qualité plafonnée à 1600p (accord de Johann, 25/11/2026) : le 2400p pesait 2,2 fois plus pour une image sous un
      // voile, qui s'efface au premier défilement
      hls.on(Hls.Events.MANIFEST_PARSED, (_, d) => {
        let cap = -1
        d.levels.forEach((l, i) => { if (l.height <= 1600 && (cap < 0 || l.height > d.levels[cap].height)) cap = i })
        if (cap >= 0) hls.autoLevelCapping = cap
      })
      heroBg.addEventListener('error', fail)
      mp4.forEach((x) => { x.dataset.src = x.getAttribute('src'); x.removeAttribute('src') })
      hls.loadSource(url); hls.attachMedia(heroBg)
    }).catch(native))
  }
  let heroBgWant = false
  // Safari peut refuser un play() lancé pendant le branchement du flux : on relance dès que la vidéo peut jouer,
  // ou, si la lecture automatique est refusée (iPhone en économie d'énergie), au premier geste
  let heroBgRetry = null   // relance en attente (un seul jeu d'écouteurs à la fois)
  const heroBgGo = () => {
    if (!heroBgWant || !heroBg.paused || heroBgRetry) return
    heroBg.preload = 'auto'
    heroBg.play().catch(() => {
      const off = () => { heroBgRetry = null; heroBg.removeEventListener('canplay', again); window.removeEventListener('pointerdown', again); window.removeEventListener('keydown', again) }
      const again = () => { if (!heroBg.paused) return off(); if (heroBgWant) heroBg.play().then(off, () => {}) }
      if (heroBgRetry) return
      heroBgRetry = again
      heroBg.addEventListener('canplay', again); window.addEventListener('pointerdown', again); window.addEventListener('keydown', again)
    })
  }
  const heroBgPlay = (on) => {
    if (!heroBg || !heroBg.play || reduced) return
    on = on && !covered()   // fiche ouverte (opaque, plein écran) : la vidéo est cachée, rien n'est lu ni téléchargé
    heroBgWant = on
    if (on && heroBg.paused && document.documentElement.classList.contains('intro-done')) {
      heroBgStream().then(heroBgGo)
    }
    else if (!on && !heroBg.paused) heroBg.pause()
  }
  return heroBgPlay
}
