/**
 * Captures de contrôle (après chaque étape) : `npm run build` puis `node scripts/shots.mjs <dossier> [cas…]`.
 * Sert dist/ (vite preview), Chromium à part, GPU activé, sans son (?muet), 1440 × 900 à 2×.
 * Cas : accueil (fin de l'intro), vignettes (milieu de page), fiche, mobile, contexte-perdu (WebGL coupé de force),
 * q-low, q-mid. Erreurs de la console relevées dans <dossier>/console.json.
 */
import { preview } from 'vite'
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const DIR = process.argv[2] || 'shots'
const ONLY = process.argv.slice(3)
mkdirSync(DIR, { recursive: true })
const PORT = 4182
const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'silent' })
const BASE = `http://localhost:${PORT}/`
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio'] })
const log = {}
const wantIntro = (p) => p.waitForFunction(() => document.documentElement.classList.contains('intro-done'), null, { timeout: 15000 }).catch(() => {})

async function run(name, { url = '?muet', mobile = false, before, after } = {}) {
  if (ONLY.length && !ONLY.includes(name)) return
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errs = (log[name] = [])
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  await page.goto(BASE + url, { waitUntil: 'load' })
  await wantIntro(page)
  await page.waitForTimeout(1500)
  if (before) await before(page)
  await page.screenshot({ path: `${DIR}/${name}.png` })
  if (after) await after(page, name)
  await ctx.close()
}

const scrollTo = (y) => async (p) => { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(1200) }
const loseAll = async (p) => {
  const n = await p.evaluate(() => {
    let n = 0
    for (const c of document.querySelectorAll('canvas')) {
      let g = null; try { g = c.getContext('webgl') } catch { continue }   // contexte déjà créé (même type) ; toile du chargeur (offscreen) ignorée
      const e = g?.getExtension('WEBGL_lose_context'); if (e) { e.loseContext(); n++ }
    }
    return n
  })
  await p.waitForTimeout(800)
  log['contexte-perdu-n'] = n
}

await run('accueil')
await run('vignettes', { before: scrollTo(2600) })
await run('fiche', { url: '?muet#p-voyageur-1' })
await run('mobile', { mobile: true, before: scrollTo(1800) })
await run('contexte-perdu', { before: async (p) => { await scrollTo(2600)(p); await loseAll(p) } })
await run('q-low', { url: '?muet&q=low', before: scrollTo(2600) })
await run('q-mid', { url: '?muet&q=mid', before: scrollTo(2600) })

writeFileSync(`${DIR}/console.json`, JSON.stringify(log, null, 1))
console.log(JSON.stringify(log))
await browser.close()
await server.httpServer.close()
