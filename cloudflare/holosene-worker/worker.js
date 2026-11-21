/**
 * holosene.fr : un seul domaine, plusieurs sites GitHub Pages (chacun se republie seul, à chaque push sur son dépôt).
 *   holosene.fr/                     page HOLOSENE        ← johann-ar.github.io/Portfolio/
 *   holosene.fr/portfolio/…          portfolio            ← johann-ar.github.io/Portfolio/portfolio/…
 *   holosene.fr/portfolio/<nom>/…    projet               ← johann-ar.github.io/<Dépôt>/…
 *   www.holosene.fr/…                redirigé vers holosene.fr/…
 * Pour ajouter un projet : une ligne dans PROJETS (nom dans l'adresse → nom exact du dépôt, la casse compte).
 * Publication : « Publier holosene.fr.command » (wrangler deploy).
 */
const GH = 'https://johann-ar.github.io'
const PROJETS = {
  'dumbo-biovolume': 'Dumbo-biovolume',
  'mondes-immerges': 'Mondes-immerges',
  'voyageur-1': 'Voyageur-1',
  'photographique-volume': 'Photographique-volume',
}
// en-têtes de la requête transmis à GitHub (vidéos : Range ; cache du navigateur : If-*)
const PASS = ['accept', 'accept-encoding', 'accept-language', 'range', 'if-none-match', 'if-modified-since', 'user-agent']

export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4)
      return Response.redirect(url.href, 301)
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } })

    // quel site, et quel préfixe d'un côté et de l'autre
    let from = '/Portfolio/', to = '/', rest = url.pathname.slice(1)
    const m = url.pathname.match(/^\/portfolio\/([^/]+)(\/.*)?$/)
    if (m && PROJETS[m[1]]) {
      if (!m[2]) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301)
      from = `/${PROJETS[m[1]]}/`, to = `/portfolio/${m[1]}/`, rest = m[2].slice(1)
    }

    const headers = new Headers()
    for (const h of PASS) if (request.headers.has(h)) headers.set(h, request.headers.get(h))
    const res = await fetch(GH + from + rest + url.search, { method: request.method, headers, redirect: 'manual' })

    const out = new Response(res.body, res)
    // redirections de GitHub (dossier sans « / » final…) : ramenées sous holosene.fr
    const loc = res.headers.get('location')
    if (loc) {
      const l = new URL(loc, GH + from + rest)
      if (l.origin === GH && l.pathname.startsWith(from)) out.headers.set('location', url.origin + to + l.pathname.slice(from.length) + l.search + l.hash)
    }
    out.headers.set('strict-transport-security', 'max-age=31536000')
    out.headers.set('x-content-type-options', 'nosniff')
    out.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
    out.headers.delete('x-github-request-id')
    return out
  },
}
