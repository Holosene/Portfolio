/**
 * Banc de mesure du portfolio (performances), reproductible : `npm run build` puis `node scripts/bench.mjs [sortie.json]`.
 * Sert dist/ (vite preview), le parcourt avec un Chromium à part (Playwright), GPU activé (Metal), sans son (?muet).
 *
 * Mesures :
 * - Core Web Vitals : LCP, CLS (PerformanceObserver), INP (Event Timing, interactions réelles : clics, touches) ;
 * - poids transféré et nombre de requêtes (protocole DevTools, cache vide), au chargement puis après tout le défilement ;
 * - durée d'une image, GPU compris : chaque rappel requestAnimationFrame est chronométré ; à sa fin, un pixel de chaque
 *   toile WebGL qui a dessiné est lu (readPixels attend la fin du travail du GPU ; gl.finish() et les minuteurs GPU ne
 *   sont pas fiables sous Metal) ;
 * - coût de chaque effet : le même parcours, l'effet coupé de l'extérieur (sans toucher au code du site), différence.
 *
 * Écran simulé : 1440 × 900, densité 2 (portable Retina). Chaque mesure d'images est répétée RUNS fois (médiane).
 */
import { preview } from 'vite'
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const OUT = process.argv[2] || 'bench.json'
const ONLY = process.env.BENCH_ONLY || ''   // ex. BENCH_ONLY=effects
const RUNS = +(process.env.BENCH_RUNS || 3)
const NOSYNC = !!process.env.BENCH_NOSYNC   // sans lecture de pixel : temps du processeur seul (le GPU travaille en parallèle)
const PROFILE = process.env.BENCH_PROFILE || ''   // dossier : profils processeur (.cpuprofile) du défilement et du repos
const PORT = 4181
const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'silent' })
const BASE = `http://localhost:${PORT}/`
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })

// ——— instrumentation injectée avant tout script de la page ———
const INIT = () => {
  const B = (window.__B = { nosync: !!window.__NOSYNC, ctx: [], frames: [], lcp: [], cls: 0, shifts: [], events: [], longtasks: [], skip: new Set(window.__SKIP || []) })
  const px = new Uint8Array(4)
  const tagOf = (src) => (src.includes('uFbo') ? 'glass' : src.includes('uMaskB') ? 'halftone' : src.includes('uWashCol') ? 'backdrop' : 'other')
  const oGet = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    const c = oGet.call(this, type, opts)
    if (c && /webgl/.test(type) && !c.__k) {
      c.__k = (this.className || 'canvas').split(' ')[0]; c.__dirty = false; B.ctx.push(c)
      const sh = new WeakMap(), pr = new WeakMap()
      const oSrc = c.shaderSource.bind(c), oAtt = c.attachShader.bind(c), oUse = c.useProgram.bind(c), oDraw = c.drawArrays.bind(c)
      c.shaderSource = (s, src) => { if (src.includes('gl_FragColor')) sh.set(s, tagOf(src)); return oSrc(s, src) }
      c.attachShader = (p, s) => { if (sh.has(s)) pr.set(p, sh.get(s)); return oAtt(p, s) }
      c.useProgram = (p) => { c.__p = pr.get(p) || 'other'; return oUse(p) }
      c.drawArrays = (...a) => { if (B.skip.has(c.__k) || B.skip.has(c.__p)) return; c.__dirty = true; return oDraw(...a) }
    }
    return c
  }
  // copies 2D du fond WebGL (bande du haut, voile de la barre) : coupables à part
  const oDI = CanvasRenderingContext2D.prototype.drawImage
  CanvasRenderingContext2D.prototype.drawImage = function (src, ...a) { if (B.skip.has('copies') && src?.classList?.contains('bg-canvas')) return; return oDI.call(this, src, ...a) }
  const oRaf = window.requestAnimationFrame.bind(window)
  let cur = null
  window.requestAnimationFrame = (cb) => oRaf((t) => {
    const s = performance.now()
    cb(t)
    let drew = false
    for (const c of B.ctx) if (c.__dirty) { if (!B.nosync) c.readPixels(0, 0, 1, 1, c.RGBA, c.UNSIGNED_BYTE, px); c.__dirty = false; drew = true }
    const ms = performance.now() - s
    if (cur && cur.t === t) { cur.ms += ms; cur.gpu ||= drew } else { if (cur && B.rec) B.frames.push(cur); cur = { t, ms, gpu: drew } }
  })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) B.lcp.push({ t: e.startTime, size: e.size, el: e.element ? e.element.tagName + '.' + (e.element.className || '') : e.url }) }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { B.cls += e.value; B.shifts.push({ v: e.value, t: e.startTime, src: (e.sources || []).map((s) => s.node?.nodeName + '.' + (s.node?.className || '')).join(' ') }) } }).observe({ type: 'layout-shift', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) B.events.push({ name: e.name, d: e.duration, id: e.interactionId, t: e.startTime, proc: e.processingEnd - e.processingStart, tgt: e.target ? e.target.tagName + '.' + (e.target.className || '') : '' }) }).observe({ type: 'event', durationThreshold: 16, buffered: true })
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) B.longtasks.push({ t: e.startTime, d: e.duration }) }).observe({ type: 'longtask', buffered: true }) } catch {}
}

const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
const r2 = (x) => Math.round(x * 100) / 100
const median = (a) => q(a, 0.5)

async function open(url, { skip = [], css = '', width = 1440, height = 900, dpr = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, locale: 'fr-FR' })
  await ctx.addInitScript(`window.__SKIP = ${JSON.stringify(skip)};window.__NOSYNC = ${NOSYNC};(${INIT})()`)
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); await cdp.send('Performance.enable')
  const net = { bytes: 0, n: 0, byType: {} }
  const types = new Map()
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type))
  cdp.on('Network.loadingFinished', (e) => { net.n++; net.bytes += e.encodedDataLength; const t = types.get(e.requestId) || 'Other'; net.byType[t] = (net.byType[t] || 0) + e.encodedDataLength })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  if (css) await ctx.addInitScript(`addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s)})`)
  await page.goto(url, { waitUntil: 'load' })
  return { ctx, page, cdp, net, errors }
}
const metrics = async (cdp) => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
// enregistre les images pendant fn() ; renvoie durée d'image (JS + GPU), intervalle entre images, images lentes
async function rec(page, cdp, fn, prof = '') {
  if (PROFILE && prof) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start') }
  const m0 = await metrics(cdp)
  await page.evaluate(() => { window.__B.frames = []; window.__B.rec = true })
  await fn()
  const fr = await page.evaluate(() => { window.__B.rec = false; return window.__B.frames })
  const m1 = await metrics(cdp)
  if (PROFILE && prof) { const { profile } = await cdp.send('Profiler.stop'); (await import('node:fs')).mkdirSync(PROFILE, { recursive: true }); writeFileSync(`${PROFILE}/${prof}.cpuprofile`, JSON.stringify(profile)) }
  const ms = fr.map((f) => f.ms), drawn = fr.filter((f) => f.gpu).map((f) => f.ms)
  const iv = fr.slice(1).map((f, i) => f.t - fr[i].t)
  const span = (m1.Timestamp - m0.Timestamp) || 1
  return {
    frames: fr.length, drawnFrames: drawn.length,
    frameMs: { mean: r2(ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length)), p50: r2(q(ms, 0.5)), p95: r2(q(ms, 0.95)), max: r2(Math.max(0, ...ms)) },
    drawnMs: { p50: r2(q(drawn, 0.5)), p95: r2(q(drawn, 0.95)) },
    intervalMs: { p50: r2(q(iv, 0.5)), p95: r2(q(iv, 0.95)), over20: iv.filter((x) => x > 20).length },
    // fil principal, en ms par seconde : scripts, styles, mise en page
    mainPerSec: { script: r2((m1.ScriptDuration - m0.ScriptDuration) * 1000 / span), style: r2((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000 / span), layout: r2((m1.LayoutDuration - m0.LayoutDuration) * 1000 / span), layouts: Math.round((m1.LayoutCount - m0.LayoutCount) / span), task: r2((m1.TaskDuration - m0.TaskDuration) * 1000 / span) },
  }
}
const wait = (page, ms) => page.waitForTimeout(ms)
async function scrollDown(page, steps = 70) { await page.mouse.move(720, 450); for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, 120); await wait(page, 40) } }
async function toWork(page) {
  await page.evaluate(() => { const y = document.querySelector('#projets').getBoundingClientRect().top + scrollY; scrollTo(0, y) })
  await page.mouse.wheel(0, 1); await wait(page, 1500)
}
async function hoverCards(page, ms = 3000) {
  const b = await page.evaluate(() => { const r = document.querySelector('#projets .card:not(.card--copy) .card__media').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
  const t0 = Date.now(); let i = 0
  while (Date.now() - t0 < ms) { const k = (i++ % 60) / 60; await page.mouse.move(b.x + b.w * (0.2 + 0.6 * k), b.y + b.h * (0.3 + 0.4 * Math.sin(k * 6.28))); await wait(page, 16) }
}
const vitals = (page) => page.evaluate(() => { const B = window.__B; const inp = {}; for (const e of B.events) inp[e.id] = Math.max(inp[e.id] || 0, e.d); const v = Object.values(inp); return { events: B.events, lcp: B.lcp.at(-1) || null, cls: Math.round(B.cls * 10000) / 10000, shifts: B.shifts.slice(0, 8), inp: v.length ? Math.max(...v) : 0, interactions: v.length, longtasks: B.longtasks.length, longtaskMs: Math.round(B.longtasks.reduce((a, x) => a + x.d, 0)), contexts: B.ctx.map((c) => c.__k) } })

const result = { date: new Date().toISOString(), chromium: browser.version(), screen: '1440×900 @2x', runs: RUNS, pages: {}, effects: {} }

// ——— accueil ———
if (!ONLY || ONLY === 'home') {
  const { ctx, page, cdp, net, errors } = await open(BASE + '?muet')
  const t0 = Date.now()
  await page.waitForSelector('html.intro-done', { timeout: 60000 })
  const introMs = Date.now() - t0
  await wait(page, 2500)
  const load = { bytes: net.bytes, n: net.n, byType: { ...net.byType } }
  const home = { introDoneMs: introMs, load }
  home.idleHero = await rec(page, cdp, () => wait(page, 3000), 'repos-accueil')
  home.scroll = await rec(page, cdp, () => scrollDown(page), 'defilement')
  await wait(page, 1500)
  home.afterScroll = { bytes: net.bytes, n: net.n, byType: { ...net.byType } }
  await toWork(page)
  home.hoverCards = await rec(page, cdp, () => hoverCards(page), 'survol-vignettes')
  // interactions (INP) : bouton Clair/Sombre deux fois, ouverture d'une fiche, Échap
  const tg = await page.locator('.theme-toggle').first().boundingBox()
  await page.mouse.click(tg.x + tg.width / 2, tg.y + tg.height / 2); await wait(page, 800)
  await page.mouse.click(tg.x + tg.width / 2, tg.y + tg.height / 2); await wait(page, 800)
  const card = await page.locator('#projets .card:not(.card--copy) .card__media').first().boundingBox()
  await page.mouse.click(card.x + card.width / 2, card.y + card.height / 2); await wait(page, 1500)
  home.ficheOpen = await rec(page, cdp, async () => { await page.mouse.move(720, 450); for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 80); await wait(page, 40) } })
  await page.keyboard.press('Escape'); await wait(page, 1500)
  Object.assign(home, await vitals(page))
  home.errors = errors
  result.pages['accueil'] = home
  await ctx.close()
}

// ——— fiches projet (pages projet) ———
if (!ONLY || ONLY === 'fiches') {
  const slugs = ['voyageur-1', 'mondes-immerges-globe', 'duo-news', 'photographique-volume', 'dumbo', 'mondes-immerges']
  for (const s of slugs) {
    const { ctx, page, cdp, net, errors } = await open(BASE + '?muet#p-' + s)
    await page.waitForSelector(`#p-${s}.is-open`, { timeout: 30000 }); await wait(page, 3000)
    const load = { bytes: net.bytes, n: net.n, byType: { ...net.byType } }
    const browse = await rec(page, cdp, async () => { await page.mouse.move(720, 450); for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 90); await wait(page, 40) } })
    await wait(page, 1500)
    const after = { bytes: net.bytes, n: net.n }
    const close = await page.locator(`#p-${s} .fiche__close`).boundingBox()
    await page.mouse.click(close.x + close.width / 2, close.y + close.height / 2); await wait(page, 1500)
    result.pages['fiche ' + s] = { load, afterBrowse: after, browse, ...(await vitals(page)), errors }
    await ctx.close()
  }
}

// ——— coût de chaque effet (coupé de l'extérieur) ———
if (!ONLY || ONLY === 'effects') {
  const variants = {
    'tout': {},
    'sans fond animé (bg-canvas)': { skip: ['bg-canvas'] },
    'sans copies 2D du fond (bande haute, barre)': { skip: ['copies'] },
    'sans passe verre des vignettes': { skip: ['glass'] },
    'sans trame des vignettes et logo (halftone)': { skip: ['halftone'] },
    'sans tracé du nom (name-trace)': { skip: ['name-trace'] },
    'sans flous CSS des mots (filter: blur)': { css: '.w{filter:none!important}' },
    'sans backdrop-filter (barre, bandes)': { css: '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' },
  }
  const PICK = (process.env.BENCH_VARIANTS || '').split(',').filter(Boolean)   // ex. BENCH_VARIANTS=tout,sans fond
  for (const [name, opt] of Object.entries(variants)) {
    if (PICK.length && !PICK.some((v) => name.startsWith(v))) continue
    const runs = []
    for (let k = 0; k < RUNS; k++) {
      const { ctx, page, cdp } = await open(BASE + '?muet', opt)
      await page.waitForSelector('html.intro-done', { timeout: 60000 }); await wait(page, 2000)
      const idle = await rec(page, cdp, () => wait(page, 2000))
      const scroll = await rec(page, cdp, () => scrollDown(page, 50))
      await toWork(page)
      const hover = await rec(page, cdp, () => hoverCards(page, 2500))
      runs.push({ idle, scroll, hover })
      await ctx.close()
    }
    const pick = (sc, f) => r2(median(runs.map((r) => f(r[sc]))))
    result.effects[name] = Object.fromEntries(['idle', 'scroll', 'hover'].map((sc) => [sc, {
      frameMean: pick(sc, (x) => x.frameMs.mean), frameP50: pick(sc, (x) => x.frameMs.p50), frameP95: pick(sc, (x) => x.frameMs.p95), drawnP50: pick(sc, (x) => x.drawnMs.p50),
      intervalP95: pick(sc, (x) => x.intervalMs.p95), slow: pick(sc, (x) => x.intervalMs.over20),
      scriptPerSec: pick(sc, (x) => x.mainPerSec.script), stylePerSec: pick(sc, (x) => x.mainPerSec.style), layoutPerSec: pick(sc, (x) => x.mainPerSec.layout), layoutsPerSec: pick(sc, (x) => x.mainPerSec.layouts),
    }]))
    console.log(name, JSON.stringify(result.effects[name]))
  }
}

writeFileSync(OUT, JSON.stringify(result, null, 2))
console.log('écrit :', OUT)
await browser.close()
await server.close()
