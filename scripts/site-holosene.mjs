/**
 * Assemble le site publié pour holosene.fr (à lancer après `npm run build`, dans le workflow pages.yml) :
 *   dist-site/index.html   la page HOLOSENE (holosene/index.html), à la racine du domaine
 *   dist-site/portfolio/   tout le portfolio compilé (dist/)
 *   dist-site/404.html     la 404 du portfolio (liens absolus en /portfolio/, BASE_PATH)
 * Les projets (holosene.fr/portfolio/<nom>/) ne sont pas copiés ici : le Worker Cloudflare (cloudflare/holosene-worker)
 * les relaie depuis le GitHub Pages de leur propre dépôt.
 * Le fichier source holosene/index.html n'est pas modifié : seuls ses liens relatifs sont recalés dans la copie publiée
 * (« ../x » depuis /portfolio/holosene/ devient « portfolio/x » depuis la racine).
 */
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ORIGIN = 'https://holosene.fr/'
const src = resolve('dist'), out = resolve('dist-site')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(src, resolve(out, 'portfolio'), { recursive: true })

// page HOLOSENE à la racine (les scripts en ligne ne changent pas : leur empreinte CSP reste valable)
const holo = readFileSync(resolve(src, 'holosene/index.html'), 'utf8').replace(/(href|src)="\.\.\//g, '$1="portfolio/')
writeFileSync(resolve(out, 'index.html'), holo)

// l'ancienne copie /portfolio/holosene/ renvoie à la racine
const redirect = (to) => `<!doctype html>\n<html><head><meta charset="utf-8" />\n<meta name="robots" content="noindex" />\n<link rel="canonical" href="${to}" />\n<meta http-equiv="refresh" content="0; url=${to}" />\n<title>HOLOSENE</title></head>\n<body><a href="${to}">${to}</a></body></html>\n`
writeFileSync(resolve(out, 'portfolio/holosene/index.html'), redirect(ORIGIN))

// adresses du portfolio quand il était à la racine (johann-ar.github.io/Portfolio/en/…) : vers /portfolio/…
for (const page of ['en/index.html', 'mentions-legales.html', 'en/mentions-legales.html']) {
  mkdirSync(resolve(out, page, '..'), { recursive: true })
  writeFileSync(resolve(out, page), redirect(ORIGIN + 'portfolio/' + page.replace(/index\.html$/, '')))
}

// 404, icônes demandées d'office par les navigateurs à la racine
for (const f of ['404.html', 'favicon.ico']) cpSync(resolve(src, f), resolve(out, f))
rmSync(resolve(out, 'portfolio/404.html'))

// robots et sitemap à la racine du domaine (la page HOLOSENE en plus des deux langues du portfolio)
const sitemap = readFileSync(resolve(src, 'sitemap.xml'), 'utf8')
  .replace(/(<urlset[^>]*>\n)/, `$1  <url><loc>${ORIGIN}</loc></url>\n`)
writeFileSync(resolve(out, 'sitemap.xml'), sitemap)
writeFileSync(resolve(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}sitemap.xml\n`)
rmSync(resolve(out, 'portfolio/sitemap.xml'))
rmSync(resolve(out, 'portfolio/robots.txt'))

console.log('dist-site prêt : / (HOLOSENE), /portfolio/ (portfolio)')
