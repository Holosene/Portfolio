/**
 * holosene.fr (page d'attente) : fond uni, logotype HOLOSENE du pack en grand au centre, rendu à l'encre (ink-word.js) ;
 * il apparaît en fondu, déjà entier (le tracé animé a été retiré le 26/11), puis les liens et le pied de page.
 * (Le logo S·o qui se traçait au-dessus a été retiré le 26/11 : le mot part tout de suite.)
 */
import 'virtual:iris.css'
import '../styles.css'
import '../logotype.css'
import './holo.css'
import { createInkWord } from './ink-word.js'

document.documentElement.classList.add('js', 'intro-done')

// lettrage à l'encre ; sans WebGL 2 (ou carte indisponible) : le SVG du pack, fixe
const title = document.querySelector('.holo__title')
// le lien « Portfolio » n'apparaît qu'une fois le mot entier
const showLink = () => document.body.classList.remove('trace-wait')
const fallback = () => {
  showLink()
  title.classList.remove('ink-wait', 'ink-on')
}
let word = null
// reduced: true : le mot est dessiné entier d'emblée (pas de tracé) ; le fondu est dans holo.css
try { word = createInkWord(title.querySelector('.logotype'), { reduced: true, onFail: fallback, onTraced: showLink }) } catch (err) { console.warn(err) }
if (!word) fallback()

const loop = (t) => { word?.frame(t); requestAnimationFrame(loop) }
requestAnimationFrame(loop)
