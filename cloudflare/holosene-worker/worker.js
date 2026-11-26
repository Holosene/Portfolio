/**
 * holosene.fr : un seul domaine, plusieurs sites GitHub Pages (chacun se republie seul, à chaque push sur son dépôt).
 *   holosene.fr/                     page HOLOSENE        ← johann-ar.github.io/Portfolio/
 *   holosene.fr/portfolio/…          portfolio            ← johann-ar.github.io/Portfolio/portfolio/…
 *   holosene.fr/portfolio/<nom>/…    projet               ← johann-ar.github.io/<Dépôt>/…
 *   holosene.fr/utsubo-coverletter/… lettre de motivation Utsubo ← lettre-utsubo.pages.dev/utsubo-coverletter/… (Cloudflare Pages)
 *   www.holosene.fr/…                redirigé vers holosene.fr/…
 * Pour ajouter un projet : une ligne dans PROJETS (nom dans l'adresse → nom exact du dépôt, la casse compte).
 * Publication : « Publier holosene.fr.command » (wrangler deploy).
 */
const GH = 'https://johann-ar.github.io'
// 26/11 : échange des noms de comptes GitHub (Johann-Ar → holosene). Pendant la transition, si l'ancienne adresse répond
// 404 (compte déjà renommé), on essaie la nouvelle. L'ancienne est essayée d'abord : avant le renommage, holosene.github.io
// sert encore les vieilles copies de l'ancien compte Holosene. Une fois le renommage fait : GH = GH_NOUVEAU, GH_NOUVEAU = null.
const GH_NOUVEAU = 'https://holosene.github.io'
// 24/11 : sites servis ailleurs que sur GitHub Pages, au même chemin des deux côtés (chemin → origine)
const AILLEURS = { 'utsubo-coverletter': 'https://lettre-utsubo.pages.dev' }
const PROJETS = {
  'dumbo-biovolume': 'Dumbo-biovolume',
  'mondes-immerges': 'Mondes-immerges',
  'voyageur-1': 'Voyageur-1',
  'photographique-volume': 'Photographique-volume',
}
// en-têtes de la requête transmis à GitHub (vidéos : Range ; cache du navigateur : If-*)
// Site pas encore en version finale (choix de Johann, 21/11/2026) : visible avec l'adresse, mais ni référencé par les
// moteurs de recherche ni archivé. Le jour de la version 1.0 : PRIVE = false, puis « Publier holosene.fr.command ».
const PRIVE = true
const ROBOTS_PRIVE = 'User-agent: *\nDisallow:\n\nUser-agent: ia_archiver\nUser-agent: archive.org_bot\nDisallow: /\n'
const PASS = ['accept', 'accept-encoding', 'accept-language', 'range', 'if-none-match', 'if-modified-since', 'user-agent']

export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4)
      return Response.redirect(url.href, 301)
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } })

    // robots.txt : les moteurs peuvent passer (pour lire le « noindex » ci-dessous), les archives du web non
    if (PRIVE && url.pathname === '/robots.txt') return new Response(ROBOTS_PRIVE, { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } })

    // quel site, et quel préfixe d'un côté et de l'autre
    let origine = GH, from = '/Portfolio/', to = '/', rest = url.pathname.slice(1)
    const a = url.pathname.match(/^\/([^/]+)(\/.*)?$/)
    if (a && AILLEURS[a[1]]) {
      if (!a[2]) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301)
      origine = AILLEURS[a[1]], from = to = `/${a[1]}/`, rest = a[2].slice(1)
    }
    const m = url.pathname.match(/^\/portfolio\/([^/]+)(\/.*)?$/)
    if (m && PROJETS[m[1]]) {
      if (!m[2]) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301)
      from = `/${PROJETS[m[1]]}/`, to = `/portfolio/${m[1]}/`, rest = m[2].slice(1)
    }

    const headers = new Headers()
    for (const h of PASS) if (request.headers.has(h)) headers.set(h, request.headers.get(h))
    const surGH = origine === GH
    let res = await fetch(origine + from + rest + url.search, { method: request.method, headers, redirect: 'manual' })
    if (surGH && GH_NOUVEAU && res.status === 404) {
      const res2 = await fetch(GH_NOUVEAU + from + rest + url.search, { method: request.method, headers, redirect: 'manual' })
      if (res2.status !== 404) res = res2, origine = GH_NOUVEAU
    }

    const out = new Response(res.body, res)
    // redirections de GitHub (dossier sans « / » final…) : ramenées sous holosene.fr
    const loc = res.headers.get('location')
    if (loc) {
      const l = new URL(loc, origine + from + rest)
      if (l.origin === origine && l.pathname.startsWith(from)) out.headers.set('location', url.origin + to + l.pathname.slice(from.length) + l.search + l.hash)
    }
    out.headers.set('strict-transport-security', 'max-age=31536000')
    out.headers.set('x-content-type-options', 'nosniff')
    out.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
    if (PRIVE) out.headers.set('x-robots-tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex')
    out.headers.delete('x-github-request-id')
    // fichiers versionnés par Vite (nom suivi d'une empreinte, ex. main-HE6pYvvQ.js) : leur contenu ne change jamais, le
    // navigateur les garde un an sans redemander (GitHub Pages n'envoie que 10 min). Le reste garde l'en-tête d'origine.
    if (res.status === 200 && /\/assets\/[^/]+-[\w-]{8}\.[a-z0-9]+$/i.test(url.pathname)) out.headers.set('cache-control', 'public, max-age=31536000, immutable')
    // page HOLOSENE et portfolio (pas les sites de projets ni la lettre, qui ont leurs propres besoins) : en-têtes de
    // sécurité de l'ancien vercel.json (perdus au passage sur GitHub Pages) et cache des médias d'une semaine
    const site = surGH && from === '/Portfolio/'
    if (site) {
      out.headers.set('x-frame-options', 'DENY')
      out.headers.set('content-security-policy', "frame-ancestors 'none'")
      out.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()')
      out.headers.set('cross-origin-opener-policy', 'same-origin')
      if (res.status === 200 && /^\/portfolio\/(media|logotypes|icons)\//.test(url.pathname)) out.headers.set('cache-control', 'public, max-age=604800, stale-while-revalidate=86400')
    }
    return out
  },
}
