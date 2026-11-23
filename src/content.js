/**
 * Contenu du site Holosene (FR / EN).
 * Règle : uniquement des informations fournies par Johann (portfolio, CV, brief). Rien d'inventé.
 * T('fr', 'en') : texte traduit. TODO('…') : à fournir par Johann, affiché seulement en mode développement (?dev).
 * Médias : chemins relatifs à public/media/. media[] : dans l'ordre contexte → détails → vue d'ensemble ; layout: 'stack'
 *   = petite case, deux 'stack' qui se suivent partagent une case double (jamais deux cases doubles d'affilée) ;
 *   ratio (facultatif) = format imposé, sinon le format le plus proche de l'image ; .mp4 = vidéo muette en boucle.
 */
export const T = (fr, en = fr) => ({ fr, en })
export const TODO = (fr, en) => ({ todo: true, fr: `[À compléter par Johann : ${fr}]`, en: `[To be completed by Johann: ${en || fr}]` })

export const site = {
  name: 'Holosene',
  person: 'Johann Arata',
  email: 'arata.johann@gmail.com',
  url: 'https://holosene.fr/portfolio/',
  intent: T(
    'Je conçois des expériences interactives, du concept au prototype codé.',
    'I design interactive experiences, from concept to coded prototype.',
  ),
  baseline: T('Design d’interaction · Creative coding · UI/UX · Scénographie numérique', 'Interaction design · Creative coding · UI/UX · Digital scenography'),
  signature: T('Portfolio de Johann Arata', 'Portfolio of Johann Arata'),
  description: T(
    'Holosene, portfolio de Johann Arata, designer d’interaction et creative technologist junior : sites immersifs, WebGL, UI/UX et scénographie numérique.',
    'Holosene, portfolio of Johann Arata, interaction designer and junior creative technologist: immersive websites, WebGL, UI/UX and digital scenography.',
  ),
  // CV en PDF, téléchargé depuis le bouton « Curriculum vitae » du contact : déposer le fichier à cette adresse dans public/
  cv: 'cv/johann-arata-cv.pdf',
  socials: [
    { label: 'GitHub', href: 'https://github.com/holosene' },
  ],
}

export const ui = {
  projects: T('Projets', 'Work'),
  research: T('Travaux de recherche', 'Research work'),
  studio: T('À propos', 'About'),
  workHint: T('Faites défiler', 'Scroll'),
  contact: T('Contact', 'Contact'),
  skip: T('Aller au contenu', 'Skip to content'),
  nav: T('Navigation principale', 'Main navigation'),
  langLabel: T('Read in English', 'Lire en français'),
  themeLight: T('Passer en mode clair', 'Switch to light mode'),
  themeDark: T('Passer en mode sombre', 'Switch to dark mode'),
  open: T('Voir la fiche', 'View project'),
  close: T('Fermer', 'Close'),
  specHead: T('Captation · traitement · rendu', 'Capture · processing · output'),
  copy: T('Copier l’adresse', 'Copy address'),
  cv: T('Curriculum vitae', 'Curriculum vitae'),
  copied: T('Adresse copiée', 'Address copied'),
  legal: T('Mentions légales et confidentialité', 'Legal notice and privacy'),
  lensLabel: T('Le monogramme Holosene en trame de points : le S en blanc, le « o » irisé', 'The Holosene monogram as a dot screen: the S in white, the iridescent “o”'),
  panelLabel: T('Image du projet en trame de points ; la lentille montre l’image d’origine', 'Project image as a dot screen; the lens shows the original image'),
  index: T('Projets', 'Work'),
  sections: {
    intent: T('Intention', 'Intent'),
    context: T('Contexte et milieu', 'Context and environment'),
    capture: T('Captation', 'Capture'),
    processing: T('Reconstruction et traitement', 'Reconstruction and processing'),
    staging: T('Mise en scène', 'Staging'),
    learned: T('Ce que j’ai appris, limites', 'What I learned, limits'),
    credits: T('Fiche technique', 'Fact sheet'),   // titre de la rubrique (ses lignes : rôle, outils, année, crédits)
  },
  proposal: T('Proposition non commandée', 'Unsolicited proposal'),   // petite inscription au-dessus du titre, sur la page de chaque projet (hors recherche)
  role: T('Rôle', 'Role'),
  tools: T('Outils', 'Tools'),
  year: T('Année', 'Year'),
  creditsLabel: T('Crédits', 'Credits'),
}

export const projects = [
  {
    slug: '4derives',
    hidden: true,   // masqué pour l'instant (vignette et fiche)
    research: true,   // présenté seulement dans Recherche (avec ses essais 4DGS)
    genre: T('4D Gaussian splatting', '4D Gaussian splatting'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: '4Dérives',
    year: '2025-26',
    cover: '4derives/080.webp',
    spec: [
      [T('Capteur', 'Sensor'), T('GoPro, à hauteur d’yeux', 'GoPro, at eye level')],
      [T('Reconstruction', 'Reconstruction'), T('4D Gaussian splatting', '4D Gaussian splatting')],
      [T('Rendu', 'Output'), T('Film, essais 4D', 'Film, 4D tests')],
    ],
    intent: TODO('l’intention du projet en une phrase', 'the project’s intent in one sentence'),
    context: T(
      'Une descente de rivière filmée en GoPro à hauteur d’yeux, en trois saisons : automne, hiver, printemps.',
      'A river descent filmed on a GoPro at eye level, across three seasons: autumn, winter, spring.',
    ),
    capture: T('Tournage par Johann, en GoPro à hauteur d’yeux, sur trois saisons.', 'Shot by Johann on a GoPro at eye level, across three seasons.'),
    processing: T(
      'Essais en 4D Gaussian splatting (Luma AI) à partir du tournage, pour prolonger l’espace hors du cadre.',
      'Tests in 4D Gaussian splatting (Luma AI) from the footage, to extend the space beyond the frame.',
    ),
    staging: T('Un film : l’étalonnage, la musique et le rythme font les variations entre les saisons.', 'A film: grading, music and pace carry the changes between seasons.'),
    learned: T('Les essais en 4D Gaussian splatting montrent les limites des outils accessibles aujourd’hui.', 'The 4D Gaussian splatting tests show the limits of today’s accessible tools.'),
    role: TODO('ton rôle (seul ? avec qui ?)', 'your role'),
    tools: 'GoPro, DaVinci Resolve, Luma AI',
    credits: [TODO('auteur de la musique', 'music credit')],
    link: { label: T('Voir le film', 'Watch the film'), href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
    media: [
      // contexte (le film), puis le traitement en 4D, puis le rendu d'ensemble
      { src: '4derives/084.webp', alt: T('Image d’ouverture du film 4Dérives', 'Opening still of 4Dérives') },
      { src: '4derives/080.webp', alt: T('Image du film, automne', 'Still from the film, autumn') },
      { src: '4derives/082.webp', alt: T('Image du film, printemps', 'Still from the film, spring'), layout: 'stack' },
      { src: '4derives/078.webp', alt: T('Image du film, hiver', 'Still from the film, winter'), layout: 'stack' },
      { src: '4derives/086.webp', alt: T('Image après traitement', 'Processed image') },
      { src: '4derives/073.webp', alt: T('Mouvement de caméra dans un volume 4D', 'Camera move inside a 4D volume') },
      { src: '4derives/075.webp', alt: T('Essai 4D Shape of Motion', '4D Shape of Motion test'), layout: 'stack' },
      { src: '4derives/067.webp', alt: T('Le volume 4D dans SuperSplat', 'The 4D volume in SuperSplat'), layout: 'stack' },
    ],
  },
  {
    slug: 'voyageur-1',
    genre: T('Design interactif, WebGL 2', 'Interaction design, WebGL 2'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: 'NASA Voyageur 1',
    year: '2026',
    cover: 'voyageur-1/vignette.webp',
    coverMobile: 'voyageur-1/vignette-mobile.webp',
    coverCredit: T('Images du disque : NASA / JPL ; décodage : Ron Barry (2017)', 'Record images: NASA / JPL; decoding: Ron Barry (2017)'),
    spec: [
      [T('Source', 'Source'), T('Les 116 images du disque d’or (1977)', 'The 116 images of the Golden Record (1977)')],
      [T('Traitement', 'Processing'), T('Simulation du signal sonore, calibrée sur les images NASA', 'Audio signal simulation, calibrated on NASA images')],
      [T('Rendu', 'Output'), T('Splats gaussiens en WebGL 2', 'Gaussian splats in WebGL 2')],
    ],
    intent: T(
      'Faire découvrir les 116 images du disque d’or de Voyager, chacune en volume.',
      'An introduction to the 116 images of the Voyager Golden Record, each one in volume.',
    ),
    context: T(
      'En 1977, les images du disque ont été gravées dans le sillon sous forme de son. Décodées en 2017, elles en gardent les traces : stries, trames, pertes.',
      'In 1977, the record’s images were cut into the groove as sound. Decoded in 2017, they still carry its marks: streaks, scan lines, losses.',
    ),
    capture: T('Un récit en photos d’archives NASA mène jusqu’au disque, qui tourne entouré de ses images.', 'A story in NASA archive photos leads to the record, spinning among its images.'),
    processing: T(
      'Chaque image se reforme en gaussiennes, étirées le long des traces du signal et détachées là où il l’a abîmée.',
      'Each image re-forms as Gaussians, stretched along the signal’s scan lines and pulled apart where it damaged them.',
    ),
    staging: T('Un site WebGL 2 sans bibliothèque, accompagné des sons du disque.', 'A library-free WebGL 2 site, set to the record’s sounds.'),
    learned: TODO('ce que tu as appris, les limites', 'what you learned, the limits'),
    role: TODO('ton rôle', 'your role'),
    tools: 'WebGL 2, TypeScript, Vite, Web Audio',
    credits: [
      T('Voyager Golden Record (1977) : NASA / JPL', 'Voyager Golden Record (1977): NASA / JPL'),
      T('Décodage des images : Ron Barry (2017)', 'Image decoding: Ron Barry (2017)'),
      T('Photos d’archives : NASA / JPL-Caltech, NASA / KSC', 'Archive photos: NASA / JPL-Caltech, NASA / KSC'),
      T('Projet indépendant, ni produit ni approuvé par la NASA', 'Independent project, not produced or endorsed by NASA'),
    ],
    link: { label: T('Ouvrir le projet', 'Open the project'), href: 'https://holosene.fr/portfolio/voyageur-1/' },   // le site en ligne (le code : github.com/Johann-Ar/Voyageur-1)
    media: [
      // ordre de l'expérience : l'accueil, le récit, le disque et ses images, une image en volume, la galerie
      { src: 'voyageur-1/accueil.webp', dark: 'voyageur-1/accueil-sombre.webp', alt: T('L’accueil du site', 'The site’s home screen') },
      { src: 'voyageur-1/voyageur-recit.mp4', poster: 'voyageur-1/voyageur-recit-poster.webp', alt: T('Le récit en photos d’archives NASA', 'The story in NASA archive photos') },
      { src: 'voyageur-1/disque.webp', alt: T('Le disque d’or entouré de ses images', 'The Golden Record surrounded by its images') },
      { src: 'voyageur-1/voyageur-disque.mp4', poster: 'voyageur-1/voyageur-disque-poster.webp', alt: T('Le disque tourne au glisser', 'Dragging spins the record') },
      { src: 'voyageur-1/voyageur-volume.mp4', poster: 'voyageur-1/voyageur-volume-poster.webp', alt: T('Une image se reforme en volume, puis tourne', 'An image re-forms in volume, then turns') },
      { src: 'voyageur-1/galerie.webp', alt: T('La galerie des 116 images', 'The gallery of 116 images') },
    ],
  },
  {
    // le site du globe (dépôt Mondes-immerges) ; l'article de licence du même nom reste dans Recherche (slug mondes-immerges)
    slug: 'mondes-immerges-globe',
    genre: T('Datavisualisation, WebGPU, three.js', 'Data visualisation, WebGPU, three.js'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: 'National Geographic',
    year: '2026',
    cover: 'mondes-immerges-site/vignette.webp',
    coverMobile: 'mondes-immerges-site/vignette-mobile.webp',
    coverCredit: T('Courants : NASA / JPL OSCAR ; relief : NOAA ETOPO1', 'Currents: NASA / JPL OSCAR; relief: NOAA ETOPO1'),
    spec: [
      [T('Source', 'Source'), T('Courants de surface mesurés par satellite (NASA OSCAR), relief ETOPO1, fleuves Natural Earth', 'Satellite-measured surface currents (NASA OSCAR), ETOPO1 relief, Natural Earth rivers')],
      [T('Traitement', 'Processing'), T('300 000 particules portées par les courants réels, encre qui dérive et se diffuse', '300,000 particles carried by the real currents, ink that drifts and spreads')],
      [T('Rendu', 'Output'), T('Globe en WebGPU (three.js, TSL), repli WebGL 2', 'WebGPU globe (three.js, TSL), WebGL 2 fallback')],
    ],
    intent: T(
      'Relier dix documentaires National Geographic sur les mondes aquatiques par ce qui les relie vraiment : les courants de l’océan.',
      'Linking ten National Geographic documentaries about aquatic worlds through what truly connects them: the ocean’s currents.',
    ),
    context: T(
      'Prolongement de l’article de licence Mondes Immergés : rendre sensibles des milieux aquatiques, cette fois en un site à parcourir. Projet étudiant non officiel.',
      'A follow-up to the Mondes Immergés bachelor’s paper: making aquatic environments felt, this time as a site to explore. Unofficial student project.',
    ),
    capture: T('Les champs de vitesse NASA, le relief et les fleuves du monde, rangés dans des textures.', 'NASA velocity fields, relief and the world’s rivers, stored in textures.'),
    processing: T(
      'Les particules déposent une encre jaune que le courant transporte ; les fleuves descendent vers la mer, la main qui survole écarte l’eau.',
      'Particles leave a yellow ink that the current carries; rivers flow down to the sea, and a hovering hand parts the water.',
    ),
    staging: T(
      'Sur le globe, chaque cadre jaune ouvre un film : son histoire, ses visages, sa galerie, comment agir.',
      'On the globe, each yellow frame opens a film: its story, its people, its gallery, how to act.',
    ),
    learned: TODO('ce que tu as appris, les limites', 'what you learned, the limits'),
    role: TODO('ton rôle', 'your role'),
    tools: 'WebGPU, three.js (TSL), Vite, Python (NumPy, SciPy)',
    credits: [
      T('Films, photos et textes de référence : National Geographic', 'Films, photos and reference texts: National Geographic'),
      T('Courants : NASA / JPL OSCAR, via NOAA CoastWatch ERDDAP', 'Currents: NASA / JPL OSCAR, via NOAA CoastWatch ERDDAP'),
      T('Relief et bathymétrie : NOAA ETOPO1 ; fleuves : Natural Earth', 'Relief and bathymetry: NOAA ETOPO1; rivers: Natural Earth'),
      T('Projet étudiant, ni produit ni approuvé par National Geographic', 'Student project, not produced or endorsed by National Geographic'),
    ],
    link: { label: T('Ouvrir le projet', 'Open the project'), href: 'https://holosene.fr/portfolio/mondes-immerges/' },
    media: [
      // ordre de l'expérience : l'accueil, le globe et ses films, la page d'un documentaire
      { src: 'mondes-immerges-site/accueil.webp', alt: T('L’accueil : le globe tourne, porté par les courants', 'The home screen: the globe turns, carried by the currents') },
      { src: 'mondes-immerges-site/courants.mp4', poster: 'mondes-immerges-site/courants-poster.webp', alt: T('De près : les courants marins en mouvement autour de l’Afrique australe', 'Close up: the ocean currents moving around southern Africa') },
      { src: 'mondes-immerges-site/courant-aiguilles.webp', alt: T('Détail : le courant des Aiguilles se replie au sud de l’Afrique', 'Detail: the Agulhas current folding back south of Africa'), layout: 'stack' },
      { src: 'mondes-immerges-site/canal-mozambique.webp', alt: T('Détail : tourbillons dans le canal du Mozambique', 'Detail: eddies in the Mozambique Channel'), layout: 'stack' },
      { src: 'mondes-immerges-site/globe-voyage.mp4', poster: 'mondes-immerges-site/globe-voyage-poster.webp', alt: T('Explorer : le globe passe d’un film à l’autre', 'Explore: the globe travels from one film to the next') },
      { src: 'mondes-immerges-site/globe-film.webp', alt: T('Un cadre jaune s’ouvre sur l’affiche du film', 'A yellow frame opens onto the film’s poster'), layout: 'stack' },
      { src: 'mondes-immerges-site/globe-pieuvre.webp', alt: T('Secrets of the Octopus, sur le globe', 'Secrets of the Octopus, on the globe'), layout: 'stack' },
      { src: 'mondes-immerges-site/documentaire.webp', alt: T('La page d’un documentaire : Secrets of the Octopus', 'A documentary’s page: Secrets of the Octopus') },
      { src: 'mondes-immerges-site/mobile-accueil.webp', alt: T('Sur téléphone : l’accueil', 'On a phone: the home screen') },
      { src: 'mondes-immerges-site/mobile-documentaire.webp', alt: T('Sur téléphone : la page d’un documentaire', 'On a phone: a documentary’s page') },
    ],
  },
  {
    slug: 'duo-news',
    genre: T('UI/UX design, Figma', 'UI/UX design, Figma'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: 'Duo News',
    year: '2026',
    cover: 'duo-news/vignette.webp',
    coverMobile: 'duo-news/vignette-mobile.webp',   // vignette carrée (mobile) : l'image de couverture seule
    coverDark: 'duo-news/vignette-sombre.webp', coverMobileDark: 'duo-news/vignette-mobile-sombre.webp',   // mode sombre : même image, fond sombre
    spec: [
      [T('Support', 'Device'), T('iPhone Duo, écran pliable : ouvert en double page, fermé en une page', 'iPhone Duo, foldable screen: open as a double page, closed as a single page')],
      [T('Contenu', 'Content'), T('Sources RSS d’actualité locales, réglables', 'Local RSS news sources, user-selectable')],
      [T('Rendu', 'Output'), T('Prototype de démonstration Figma', 'Figma demo prototype')],
    ],
    intent: T('Un journal qui rassemble les sources RSS d’actualité, voulu pour l’iPhone Duo.', 'A newspaper that gathers RSS news sources, designed for the iPhone Duo.'),
    context: T(
      'Projet de Master Design, Environnements numériques (Université de Strasbourg, octobre 2026). Une édition quotidienne qui reprend les codes de la presse papier.',
      'Master’s project in Design, Digital Environments (University of Strasbourg, October 2026). A daily edition that borrows the codes of print newspapers.',
    ),
    capture: T('L’écran intérieur de l’iPhone Duo : OLED pliable 7,6 pouces, 1878 × 2670 px. Fermé, il prend un format passeport.', 'The iPhone Duo inner screen: 7.6-inch foldable OLED, 1878 × 2670 px. Closed, it is passport-sized.'),
    processing: T('Trois familles de caractères, onze styles de texte appliqués à tous les composants ; Hubot Sans ExtraBold pour les gros titres, dans l’esprit des unes de presse.', 'Three typefaces, eleven text styles applied to every component; Hubot Sans ExtraBold for headlines, in the spirit of newspaper front pages.'),
    staging: T('Un prototype en deux parcours, journal ouvert et journal fermé : accueil, réglages des sources, pages d’articles, fin de l’édition.', 'A prototype with two flows, open and closed: home, source settings, article pages, end of the edition.'),
    learned: TODO('ce que tu as appris, les limites', 'what you learned, the limits'),
    role: TODO('ton rôle', 'your role'),
    tools: 'Figma',
    credits: [],
    media: [
      // contexte (en main, le parcours ouvert), puis le système (grille, images, typo, couleurs), puis le parcours fermé ;
      // dark / posterDark : la même image sur fond sombre, montrée en mode sombre (main.js)
      { src: 'duo-news/main-prototype.webp', dark: 'duo-news/main-prototype-sombre.webp', alt: T('Le journal Duo News tenu en main, iPhone Duo fermé', 'Duo News held in hand, iPhone Duo closed') },
      { src: 'duo-news/duo-news-ouvert.mp4', poster: 'duo-news/duo-news-ouvert-poster.webp', dark: 'duo-news/duo-news-ouvert-sombre.mp4', posterDark: 'duo-news/duo-news-ouvert-sombre-poster.webp', alt: T('Parcours du journal ouvert, de l’accueil à la fin de l’édition', 'Open newspaper flow, from home to the end of the edition') },
      { src: 'duo-news/ouvert-une.webp', dark: 'duo-news/ouvert-une-sombre.webp', alt: T('Le journal ouvert en double page', 'The newspaper open as a double page'), layout: 'stack' },
      { src: 'duo-news/ferme-trio.webp', dark: 'duo-news/ferme-trio-sombre.webp', alt: T('Trois pages du journal fermé', 'Three pages of the closed newspaper'), layout: 'stack' },
      { src: 'duo-news/la-grille.webp', dark: 'duo-news/la-grille-sombre.webp', alt: T('La grille : 6 colonnes, ligne de base de 16 px', 'The grid: 6 columns, 16 px baseline') },
      { src: 'duo-news/traitement-des-images.webp', dark: 'duo-news/traitement-des-images-sombre.webp', alt: T('Le traitement des images en trichromie', 'Image processing in trichromy') },
      { src: 'duo-news/les-styles-de-texte.webp', dark: 'duo-news/les-styles-de-texte-sombre.webp', alt: T('Les styles de texte : trois familles, onze styles', 'Text styles: three typefaces, eleven styles'), layout: 'stack' },
      { src: 'duo-news/les-couleurs.webp', dark: 'duo-news/les-couleurs-sombre.webp', alt: T('Les couleurs : trois thèmes, clair, confort et sombre', 'Colours: three themes, light, comfort and dark'), layout: 'stack' },
      { src: 'duo-news/duo-news-ferme.mp4', poster: 'duo-news/duo-news-ferme-poster.webp', dark: 'duo-news/duo-news-ferme-sombre.mp4', posterDark: 'duo-news/duo-news-ferme-sombre-poster.webp', alt: T('Parcours du journal fermé, page par page', 'Closed newspaper flow, page by page') },
    ],
  },
  {
    slug: 'photographique-volume',
    genre: T('Design interactif, SHARP, Gaussian splatting', 'Interaction design, SHARP, Gaussian splatting'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: 'Volume Photographique',
    year: '2025-26',
    cover: 'photographique-volume/vignette.webp',
    coverCredit: T('Rendu : Johann Arata, d’après les photographies de Nicolas Floc’h', 'Render: Johann Arata, from Nicolas Floc’h’s photographs'),
    spec: [
      [T('Source', 'Source'), T('Photographies de Nicolas Floc’h (série « Invisible »)', 'Photographs by Nicolas Floc’h (“Invisible” series)')],
      [T('Volume', 'Volume'), T('Une photo, une scène 3D en gaussiennes (SHARP)', 'One photo, one 3D Gaussian scene (SHARP)')],
      [T('Rendu', 'Output'), T('Plongée au défilement, son génératif (Web Audio)', 'Scroll-driven dive, generative sound (Web Audio)')],
    ],
    intent: TODO('l’intention du projet en une phrase', 'the project’s intent in one sentence'),
    context: T(
      'Les fonds marins photographiés par Nicolas Floc’h dans les Calanques deviennent des volumes où l’on s’enfonce. Sept photographies, de la côte vers le large.',
      'The seabeds Nicolas Floc’h photographed in the Calanques become volumes to sink into. Seven photographs, from the coast out to the open sea.',
    ),
    capture: T('Pas de captation propre : photographies de Nicolas Floc’h, série « Invisible » (Parc national des Calanques, 2018-2020) et palette de « La couleur de l’eau » (2020).', 'No own capture: photographs by Nicolas Floc’h, “Invisible” series (Calanques National Park, 2018-2020), and the palette of “La couleur de l’eau” (2020).'),
    processing: T(
      'Chaque photographie est reconstruite en scène 3D de gaussiennes par SHARP, puis teintée de la couleur réelle de l’eau relevée par Floc’h, profondeur par profondeur.',
      'Each photograph is rebuilt as a 3D Gaussian scene by SHARP, then tinted with the real colour of the water Floc’h recorded, depth by depth.',
    ),
    staging: T('Au défilement, l’image se creuse comme une membrane élastique, puis se défait en cellules ; on remonte à la surface pour passer à la photo suivante. Le son suit la plongée.', 'Scrolling hollows the image out like an elastic membrane, then breaks it into cells; rising back to the surface moves on to the next photo. The sound follows the dive.'),
    learned: TODO('ce que tu as appris, les limites', 'what you learned, the limits'),
    role: TODO('ton rôle', 'your role'),
    tools: 'Three.js, SHARP, Spark (Gaussian splatting), Web Audio',
    credits: [T('Photographies © Nicolas Floc’h', 'Photographs © Nicolas Floc’h'), T('Reconstruction 3D : SHARP, sous licence Apple Machine Learning Research Model', '3D reconstruction: SHARP, under the Apple Machine Learning Research Model License')],
    link: { label: T('Ouvrir le projet', 'Open the project'), href: 'https://holosene.fr/portfolio/photographique-volume/' },
    media: [
      // la plongée en vidéo, puis des détails de près (gaussiennes, cellules), puis la dernière photo, au large
      { src: 'photographique-volume/plongee.mp4', poster: 'photographique-volume/plongee-poster.webp', alt: T('Plongée dans une photographie : l’image se creuse puis se défait en cellules', 'Diving into a photograph: the image hollows out, then breaks into cells') },
      { src: 'photographique-volume/posidonie.webp', alt: T('De près : racines de posidonie en gaussiennes', 'Close up: seagrass roots as Gaussian splats') },
      { src: 'photographique-volume/posidonie-cellules.webp', alt: T('Plus profond : les racines se défont en cellules', 'Deeper: the roots break into cells'), layout: 'stack' },
      { src: 'photographique-volume/roche.webp', alt: T('Fond rocheux, couleur de l’eau près de la côte', 'Rocky seabed, the colour of the water near the coast'), layout: 'stack' },
      { src: 'photographique-volume/large.webp', alt: T('La dernière photographie, au large, en pleine plongée', 'The last photograph, out at sea, mid-dive') },
    ],
  },
  {
    slug: 'dumbo',
    // le site a changé (nov. 2026) : une salle d'exposition reconstituée en 3D, plus la galerie de volumes en points
    // (l'ancienne page reste en ligne : original.html)
    genre: T('Scénographie numérique, Gaussian splatting, Blender', 'Digital scenography, Gaussian splatting, Blender'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: 'Musée océanographique Monaco',
    year: '2026',
    cover: 'dumbo/vignette.webp',
    coverMobile: 'dumbo/vignette-mobile.webp',
    coverCredit: T('Capture du site : Johann Arata ; créatures : vidéos du Schmidt Ocean Institute', 'Site capture: Johann Arata; creatures: Schmidt Ocean Institute footage'),
    spec: [
      [T('Source', 'Source'), T('Plongées du ROV SuBastian (Schmidt Ocean Institute)', 'ROV SuBastian dives (Schmidt Ocean Institute)')],
      [T('Traitement', 'Processing'), T('Créatures détourées par IA (SAM 2), salle et visiteurs en gaussiennes', 'Creatures cut out by AI (SAM 2), room and visitors as Gaussian splats')],
      [T('Rendu', 'Output'), T('Salle d’exposition à parcourir, temps réel', 'Walkable exhibition room, real time')],
    ],
    intent: TODO('l’intention du projet en une phrase', 'the project’s intent in one sentence'),
    context: T(
      'Une salle d’exposition posée au fond des abysses : ses murs deviennent des hublots ouverts sur des créatures que personne ne peut voir de ses yeux. Proposition pour le Musée océanographique de Monaco.',
      'An exhibition room set on the deep-sea floor: its walls become portholes onto creatures no one can see with their own eyes. A proposal for the Oceanographic Museum of Monaco.',
    ),
    capture: T('Pas de captation propre : plongées filmées en 4K par le ROV SuBastian du Schmidt Ocean Institute. Aucune de ces espèces ne vit en aquarium ; certaines n’ont été filmées qu’une fois.', 'No own capture: dives filmed in 4K by the Schmidt Ocean Institute’s ROV SuBastian. None of these species lives in an aquarium; some were filmed only once.'),
    processing: T(
      'Une IA de segmentation (SAM 2) détoure chaque créature dans les plongées entières, pour des passages longs et à leur taille réelle. La salle et ses visiteurs sont des nuages de gaussiennes (Gaussian splatting) ; les visiteurs la traversent comme sur une photo en pose longue.',
      'A segmentation AI (SAM 2) cuts out each creature across whole dives, for long passages at true scale. The room and its visitors are Gaussian splats; the visitors cross it like a long-exposure photograph.',
    ),
    staging: T('On marche librement dans la salle, au clavier, à la souris ou au doigt. La seule lumière vient des écrans : les créatures surgissent du noir, s’approchent, puis y retournent. Ambiance sonore en continu.', 'Visitors walk freely through the room, by keyboard, mouse or touch. The only light comes from the screens: creatures rise out of the dark, come close, then sink back. Continuous soundscape.'),
    learned: TODO('ce que tu as appris, les limites', 'what you learned, the limits'),
    role: TODO('ton rôle', 'your role'),
    tools: 'Three.js, Spark (Gaussian splatting), SAM 2, Blender, Web Audio',
    credits: [
      T('Images : archives du Schmidt Ocean Institute (ROV SuBastian)', 'Footage: Schmidt Ocean Institute archives (ROV SuBastian)'),
      T('Musique : Teimo (Schluss), Thomas Köner', 'Music: Teimo (Schluss), Thomas Köner'),
      TODO('mention exacte exigée par la licence du Schmidt Ocean Institute', 'exact licence wording'),
    ],
    link: { label: T('Ouvrir le projet', 'Open the project'), href: 'https://holosene.fr/portfolio/dumbo-biovolume/' },
    media: [
      // ordre de la visite : l'accueil, l'entrée dans la salle, la nef, les créatures derrière les écrans, les visiteurs
      { src: 'dumbo/accueil.webp', alt: T('L’accueil du site : Dumbo, présences abyssales rares', 'The site’s home screen: Dumbo, rare abyssal presences') },
      { src: 'dumbo/salle-marche.mp4', poster: 'dumbo/salle-marche-poster.webp', alt: T('Marche dans la salle, jusqu’à l’écran du fond', 'Walking through the room to the far screen') },
      { src: 'dumbo/nef.webp', alt: T('La salle d’expo : écrans-hublots, visiteurs en gaussiennes', 'The exhibition room: porthole screens, visitors as Gaussian splats') },
      { src: 'dumbo/nef-meduse.webp', alt: T('Une créature traverse l’écran du fond', 'A creature crossing the far screen'), layout: 'stack' },
      { src: 'dumbo/nef-lumiere.webp', alt: T('Créatures sur les écrans et au sol', 'Creatures on the screens and on the floor'), layout: 'stack' },
      { src: 'dumbo/calmar.webp', alt: T('Une créature rouge surgit du noir', 'A red creature rising out of the dark'), layout: 'stack' },
      { src: 'dumbo/hublot.webp', alt: T('Une créature tout près de l’écran', 'A creature right against the screen'), layout: 'stack' },
      { src: 'dumbo/retour.webp', alt: T('Demi-tour : le panneau d’entrée et les visiteurs, un poisson sur l’écran', 'Turning back: the entrance panel and the visitors, a fish on the screen') },
      { src: 'dumbo/visiteurs.webp', alt: T('Les visiteurs, comme sur une photo en pose longue', 'The visitors, like a long-exposure photograph') },
    ],
  },
  {
    slug: 'mondes-immerges',
    research: true,   // présenté seulement dans Recherche
    genre: T('Édition, InDesign', 'Editorial design, InDesign'),   // à côté du titre : l'outil ou la technique, pas une description du projet
    title: 'Mondes Immergés',
    year: '2024-25',
    cover: 'mondes-immerges/011.webp',
    spec: [
      [T('Forme', 'Format'), T('Article de licence édité', 'Published bachelor’s paper')],
      [T('Sujet', 'Subject'), T('Design immersif et milieux aquatiques', 'Immersive design and aquatic environments')],
      [T('Cadre', 'Context'), T('DNMADe Design numérique', 'DNMADe in Digital Design')],
    ],
    intent: T(
      'Comment le design immersif peut-il rendre sensibles des milieux aquatiques qui se dégradent ?',
      'How can immersive design make damaged aquatic environments felt?',
    ),
    context: T(
      'Article de licence, DNMADe (René Goscinny). Il croise écologie et représentation visuelle et pose les bases des projets qui ont suivi.',
      'Bachelor’s paper written during my design degree (René Goscinny). It brings ecology and visual representation together and laid the groundwork for the projects that followed.',
    ),
    capture: T('Sources documentaires et scientifiques.', 'Documentary and scientific sources.'),
    processing: T('Analyse de dispositifs existants et expérimentations graphiques.', 'Review of existing works and graphic experiments.'),
    staging: T('Un article édité, mis en page et imprimé.', 'An edited, designed and printed paper.'),
    learned: TODO('ce que tu en retiens', 'what you take from it'),
    role: TODO('ton rôle', 'your role'),
    tools: 'InDesign, Photoshop, Illustrator',
    credits: [],
    link: { label: T('Lire l’article', 'Read the paper'), href: 'https://indd.adobe.com/view/dc3c7dff-f28e-4969-9c00-527dc66c4321' },
    media: [
      // contexte (le livre en main), puis les expérimentations, puis le livre à feuilleter
      { src: 'mondes-immerges/012.webp', alt: T('Expérimentation en volume', 'Volume experiment') },
      { src: 'mondes-immerges/013.webp', pos: [0.5, 0.25], alt: T('Page d’ouverture', 'Opening spread') },
      { src: 'mondes-immerges/009.webp', alt: T('Aurores boréales transformées en particules', 'Northern lights turned into particles'), layout: 'stack' },
      { src: 'mondes-immerges/005.webp', alt: T('Motif génératif', 'Generative pattern'), layout: 'stack' },
      { src: 'mondes-immerges/010.webp', alt: T('Expérimentation graphique', 'Graphic experiment') },
      { book: 'mondes-immerges/livre', pages: 130, ratio: 1004 / 1400, poster: 'mondes-immerges/011.webp', alt: T('Le livre Mondes Immergés à feuilleter', 'The Mondes Immergés book, to leaf through') },
    ],
  },
]

/** Recherche : le profil de chercheur, au-delà des projets. Uniquement des éléments fournis par Johann. */
/** Projets choisis : courte présentation de la section. */
export const workIntro = T(
  'Scénographie numérique en 3D temps réel, sites immersifs en WebGL et WebGPU, datavisualisation, Gaussian splatting et design d’interface : chaque projet va du concept au prototype codé.',
  'Real-time 3D digital scenography, immersive websites in WebGL and WebGPU, data visualisation, Gaussian splatting and interface design: each project goes from concept to coded prototype.',
)

export const research = {
  intro: T(
    'Mon mémoire porte sur la reconstruction volumétrique du réel capturé (Gaussian splatting 3D et autres techniques) et sur la frontière entre captation, reconstruction et génération par IA.',
    'My thesis looks at the volumetric reconstruction of captured reality (3D Gaussian splatting and other techniques) and at the line between capture, reconstruction and AI generation.',
  ),
  items: [
    {
      ongoing: true,   // en cours : toujours en dernier de sa partie (render.js)
      kind: T('Mémoire de master', 'Master’s thesis'), when: T('En cours', 'In progress'),
      title: T('Reconstruction volumétrique du réel capturé', 'Volumetric reconstruction of captured reality'),
      text: T('Gaussian splatting 3D et 4D ; ce qui sépare captation, reconstruction et génération par IA.', '3D and 4D Gaussian splatting; what separates capture, reconstruction and AI generation.'),
      more: TODO('titre du mémoire, direction, échéance', 'thesis title, supervisor, deadline'),
      image: 'en-cours.webp', label: T('En cours', 'In progress'),   // dégradé tramé ; texte net dessiné par le WebGL
    },
    {
      // 4Dérives et les essais 4DGS : un seul travail (le film et ses essais en 4D Gaussian splatting)
      hidden: true,   // masqué pour l'instant
      kind: T('Film et 4D Gaussian splatting', 'Film and 4D Gaussian splatting'), when: '2025-26',
      title: T('4Dérives', '4Dérives'),
      text: T('Une descente de rivière filmée en GoPro sur trois saisons, et ses essais en 4D Gaussian splatting (Luma AI) qui prolongent l’espace hors du cadre. Ils montrent les limites des outils accessibles aujourd’hui.', 'A river descent filmed on a GoPro across three seasons, and its 4D Gaussian splatting tests (Luma AI) that extend the space beyond the frame. They show the limits of today’s accessible tools.'),
      slug: '4derives', image: '4derives/080.webp', alt: T('4Dérives, la rivière filmée en GoPro', '4Dérives, the river filmed on a GoPro'),
      href: '#p-4derives',
    },
    {
      kind: T('Article de licence', 'Bachelor’s paper'), when: '2024-25',
      title: T('Mondes Immergés', 'Mondes Immergés'),
      text: T('Comment le design immersif peut-il rendre sensibles des milieux aquatiques qui se dégradent ? Article édité pendant le DNMADe.', 'How can immersive design make damaged aquatic environments felt? A paper published during my design degree.'),
      slug: 'mondes-immerges', image: 'mondes-immerges/011.webp', pos: [0.5, 0.12], alt: T('Couverture du livre Mondes Immergés', 'Cover of Mondes Immergés'),
      href: '#p-mondes-immerges',
    },
    {
      todo: true,
      kind: TODO('autre recherche personnelle (texte, expérimentation, communication…)', 'other personal research'), when: '',
      title: TODO('titre', 'title'), text: TODO('une ou deux phrases', 'one or two sentences'),
    },
  ],
}

/** Mini à propos sous le logotype (une phrase). */
export const studio = T(
  'Designer d’interaction et creative technologist junior. Je conçois des expériences interactives : sites immersifs, interfaces, scénographies numériques.',
  'Interaction designer and junior creative technologist. I design interactive experiences: immersive websites, interfaces, digital scenography.',
)

/** À propos, en fin de page. **…** : mots mis en avant. Uniquement des informations fournies par Johann. */
export const about = [
  T('Je suis designer d’interaction et creative technologist junior, en **master Design (Environnements numériques)** à la Faculté des arts de Strasbourg.',
    'I am an interaction designer and junior creative technologist, studying for a **master’s in Design (Digital Environments)** at the Faculty of Arts in Strasbourg.'),
  T('Je conçois des **expériences interactives** (sites immersifs, interfaces, scénographies numériques), du concept au prototype codé en **WebGL, WebGPU et Three.js**.',
    'I design **interactive experiences** (immersive websites, interfaces, digital scenography), from concept to a prototype coded in **WebGL, WebGPU and Three.js**.'),
  T('Plusieurs projets sont des **propositions non commandées**, pensées pour des institutions comme National Geographic ou le Musée océanographique de Monaco.',
    'Several projects are **unsolicited proposals**, designed for institutions such as National Geographic or the Musée océanographique de Monaco.'),
  T('En parallèle, je mène une **recherche en design** sur le réel capturé et sur ce qui le sépare de la **génération par IA**.',
    'Alongside, I carry out **design research** on captured reality and on what separates it from **AI generation**.'),
]
