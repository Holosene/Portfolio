/**
 * Niveau de qualité du rendu, choisi une fois au chargement.
 *   high : rendu complet, tel que conçu (défaut).
 *   mid  : toile WebGL plafonnée à 1,5 pixel par pixel CSS.
 *   low  : toile WebGL à 1 pixel par pixel CSS, sans fond animé (fond uni du thème, comme sans WebGL).
 * `?q=low|mid|high` dans l'adresse force le niveau (essais, comparaisons).
 *
 * Sans `?q=`, choix automatique selon l'appareil : GPU logiciel ou d'entrée de gamme, peu de mémoire ou de cœurs,
 * économie de données. Les appareils courants (ordinateurs récents, iPhone) restent en « high ».
 */
const AUTO = true   // accord de Johann, 25/11/2026

const LEVELS = {
  high: { name: 'high', maxDpr: Infinity, backdrop: true },
  mid: { name: 'mid', maxDpr: 1.5, backdrop: true },
  low: { name: 'low', maxDpr: 1, backdrop: false },
}

// GPU logiciels ou anciens / d'entrée de gamme (chaîne du pilote, quand le navigateur la donne)
const WEAK_GPU = /swiftshader|llvmpipe|software|basic render|mali-(?:4|t[0-8])|adreno \(tm\) [2-5]\d\d|powervr|intel.*hd graphics (?:[2-5]\d{2,3}\b)|gma/i

function gpuName() {
  try {
    const c = document.createElement('canvas').getContext('webgl')
    if (!c) return null
    const ext = c.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER)
    c.getExtension('WEBGL_lose_context')?.loseContext()   // contexte d'essai rendu tout de suite
    return String(name || '')
  } catch { return '' }
}

export function autoLevel() {
  const nav = navigator
  if (nav.connection?.saveData) return 'low'
  const gpu = gpuName()
  if (gpu === null) return 'low'   // pas de WebGL : le repli sans WebGL s'applique de toute façon
  if (WEAK_GPU.test(gpu)) return 'low'
  const mem = nav.deviceMemory, cores = nav.hardwareConcurrency
  if ((mem && mem <= 2) || (cores && cores <= 2)) return 'low'
  // mémoire connue seulement sous Chrome / Android ; le nombre de cœurs seul ne suffit pas (Safari le plafonne)
  if (mem && mem <= 4) return 'mid'
  return 'high'
}

function pick() {
  let forced = null
  try { forced = new URLSearchParams(location.search).get('q') } catch { /* adresse illisible : niveau par défaut */ }
  if (forced && LEVELS[forced]) return LEVELS[forced]
  return LEVELS[AUTO ? autoLevel() : 'high']
}

export const QUALITY = pick()
document.documentElement.dataset.q = QUALITY.name
