# Guide du site : tout modifier et publier sans assistant

Ce guide permet de garder la main sur holosene.fr : changer un texte, une image, un projet, puis mettre en ligne.
Il ne suppose rien d'autre qu'un Mac, le dossier `Projet Portfolio` et un accès au compte GitHub `Johann-Ar`.

Écrit le 23 novembre 2026. Si une commande ne marche plus, voir « En cas de problème » à la fin.

---

## 1. Le site en une page

| Adresse en ligne | Ce que c'est | Dossier sur le Mac | Dépôt GitHub |
|---|---|---|---|
| holosene.fr/ | page d'accueil HOLOSENE | `Portfolio/holosene/index.html` | `Johann-Ar/Portfolio` |
| holosene.fr/portfolio/ | le portfolio (FR) | `Portfolio/` | `Johann-Ar/Portfolio` |
| holosene.fr/portfolio/en/ | le portfolio (EN) | même dossier, même fichier de textes | idem |
| holosene.fr/portfolio/dumbo-biovolume/ | projet Dumbo | `Dumbo-biovolume/` | `Johann-Ar/Dumbo-biovolume` |
| holosene.fr/portfolio/mondes-immerges/ | projet Mondes immergés (et `/globe/`) | `Mondes-immerges/` | `Johann-Ar/Mondes-immerges` |
| holosene.fr/portfolio/voyageur-1/ | projet Voyageur 1 | `Voyageur-1/` | `Johann-Ar/Voyageur-1` |
| holosene.fr/portfolio/photographique-volume/ | projet Volume photographique | `photographique-volume/` | `Johann-Ar/photographique-volume` |

**Comment ça tient ensemble.** Chaque dépôt est publié gratuitement par GitHub Pages, automatiquement, à chaque
envoi (« push ») sur la branche `main`. Un petit programme chez Cloudflare (le « Worker »,
`Portfolio/cloudflare/holosene-worker/worker.js`) reçoit les visites de holosene.fr et va chercher la bonne page
dans le bon dépôt. Le nom de domaine est acheté chez Hostinger, et son DNS est géré par Cloudflare.

**La règle d'or.** On modifie les fichiers sur le Mac, on vérifie en local, puis on fait un push. Quelques minutes
plus tard, la nouvelle version est en ligne. Rien ne se modifie directement « sur le serveur ».

---

## 2. Préparer le Mac (une seule fois)

Ouvrir l'application **Terminal** (Spotlight : ⌘ Espace, taper « Terminal »).

1. Vérifier que Node.js est installé : taper `node -v` puis Entrée. Un numéro (v22 ou plus) doit s'afficher.
   Sinon, installer la version « LTS » depuis https://nodejs.org.
2. Vérifier que git est installé : `git -v`. Sinon, macOS propose d'installer les « outils de ligne de commande » :
   accepter.
3. Aller dans le dossier du portfolio et installer ses dépendances :

```bash
cd "/Users/johann/Documents/Projet Portfolio/Portfolio"
```

```bash
npm install
```

À savoir sur le Terminal :
- Une commande s'exécute avec Entrée. `Ctrl + C` arrête ce qui tourne (par exemple l'aperçu local).
- Les guillemets autour du chemin sont obligatoires, car « Projet Portfolio » contient une espace.
- Pour ouvrir un fichier dans un éditeur de texte : `open -e src/content.js` (TextEdit) ou, mieux, l'ouvrir dans
  VS Code (gratuit, https://code.visualstudio.com : glisser le dossier `Portfolio` sur l'icône).
  Avec TextEdit, vérifier que le fichier reste en « texte brut » (Format → Convertir en texte brut).

---

## 3. Voir le site sur son Mac avant de publier

Dans le Terminal, depuis le dossier `Portfolio` :

```bash
npm run dev
```

Puis ouvrir dans le navigateur l'adresse affichée (en général http://localhost:5173). Chaque fois qu'on enregistre
un fichier, la page se met à jour toute seule. `Ctrl + C` pour arrêter.

Astuces dans l'adresse :
- `?dev` : affiche en clair les textes encore « à compléter » (marqués `TODO`) ; `?dev=0` pour revenir.
- `?muet` : coupe le son (utile pour les sites des projets).
- `/en/` : la version anglaise (http://localhost:5173/en/).
- `#p-voyageur-1` : ouvre directement la page d'un projet (remplacer par son « slug », voir plus bas).

Pour voir la version finale, exactement comme elle sera publiée :

```bash
npm run build
```

```bash
npm run preview
```

---

## 4. Modifier les textes du portfolio

**Presque tous les textes sont dans un seul fichier : `Portfolio/src/content.js`.**
Les pages sont fabriquées à partir de ce fichier : on n'écrit jamais les textes dans le HTML.

### 4.1 Lire le fichier

Chaque texte existe en français et en anglais, sous cette forme :

```js
T('Texte en français', 'Text in English')
```

Règles à respecter, sinon le site ne se construit plus :
- Garder les apostrophes droites `'` qui entourent chaque texte, et la virgule entre les deux langues.
- À l'intérieur d'un texte, utiliser l'apostrophe typographique **’** (comme dans `d’interaction`), jamais
  l'apostrophe droite `'`. Si on doit vraiment en mettre une, l'écrire `\'`.
- Garder les virgules en fin de ligne et les parenthèses comme elles sont.
- `**mot**` met un mot en gras (seulement dans « À propos » et l'accroche des projets).
- `TODO('…')` signale un texte à fournir : il est invisible en ligne. Pour l'afficher, le remplacer par `T('…', '…')`.
  La commande `npm run todo` liste tout ce qui reste à compléter.

### 4.2 Où se trouve chaque texte

| Ce qu'on voit sur le site | Où le changer dans `src/content.js` |
|---|---|
| Phrase sous le nom, en haut de l'accueil | `studio` |
| Intitulés (Design d'interaction · Creative coding…) | `site.baseline` |
| Description pour Google et les partages | `site.description` |
| Adresse e-mail du contact | `site.email` |
| Liens GitHub et autres réseaux | `site.socials` (une ligne `{ label: '…', href: 'https://…' }` par lien) |
| Petit texte au-dessus des vignettes de projets | `workIntro` |
| Bloc « À propos » en bas de page | `about` (un `T(…)` par paragraphe) |
| Boutons et petits libellés (Fermer, Contact, Projet suivant…) | `ui` |
| Inscription « Proposition non commandée » au-dessus du titre | `ui.proposal` |
| Section « Travaux de recherche » | `research` (`intro`, puis un bloc par travail dans `items`) |
| Tout ce qui concerne un projet | son bloc dans `projects` (voir 4.3) |

Exemple : pour changer la phrase d'accroche, trouver (⌘ F) `export const studio` et modifier les deux textes.

### 4.3 Les champs d'un projet

Chaque projet est un bloc `{ … }` dans la liste `projects`. Les champs :

| Champ | Rôle |
|---|---|
| `slug` | identifiant court, sans espace ni accent ; sert dans l'adresse (`#p-slug`). Ne pas le changer à la légère. |
| `title` | titre du projet (une seule langue) |
| `genre` | petite mention à côté du titre sur la vignette (la technique, pas une description) |
| `year` | année affichée dans la fiche |
| `cover` | image de la vignette sur l'accueil ; `coverMobile` : version carrée pour téléphone ; `coverDark` et `coverMobileDark` : versions pour le mode sombre |
| `coverCredit` | crédit de l'image de vignette (ajouté aux crédits de la fiche) |
| `intent`, `context` | 1er paragraphe de la fiche (bout à bout) |
| `capture`, `processing` | 2e paragraphe |
| `staging`, `learned` | 3e paragraphe |
| `role`, `tools`, `credits` | lignes « Rôle », « Outils », « Crédits » de la fiche technique (`tools` : texte simple, une seule langue ; `credits` : liste de `T(…)`) |
| `link` | bouton « Ouvrir le projet ↗ » : `label` (texte) et `href` (adresse) |
| `media` | images et vidéos à droite de la fiche (voir 5.2) |
| `hidden: true` | masque le projet (ni vignette ni fiche) sans rien supprimer |
| `research: true` | projet présenté seulement dans « Travaux de recherche » |
| `spec` | ancien champ, plus affiché aujourd'hui : on peut l'ignorer |

Un champ laissé en `TODO(…)` n'apparaît simplement pas.

### 4.4 Ordre, masquage, ajout, suppression

- **Ordre des vignettes** : c'est l'ordre des blocs dans `projects`. Couper un bloc entier (de `{` à `},`) et le
  coller ailleurs.
- **Masquer un projet** : ajouter `hidden: true,` sous son `slug`. L'enlever pour le remettre.
- **Ajouter un projet** : copier un bloc existant en entier, le coller, puis changer `slug`, `title`, les textes et
  les images. Créer le dossier d'images `public/media/<slug>/` (voir 5).
- **Supprimer un projet** : préférer `hidden: true` (réversible). Sinon, supprimer le bloc entier, avec sa virgule.

### 4.5 Textes hors de `content.js`

| Texte | Fichier |
|---|---|
| Mentions légales | `Portfolio/mentions-legales.html` (FR) et `Portfolio/en/mentions-legales.html` (EN) |
| Page d'accueil HOLOSENE (racine de holosene.fr) | `Portfolio/holosene/index.html` |
| Page « introuvable » (404) | `Portfolio/404.html` |
| Textes à l'intérieur d'un site de projet | dans le dossier de ce projet (voir 8) |

Dans ces fichiers HTML, ne changer que le texte entre les balises (`<p>texte</p>`), jamais les balises elles-mêmes.

---

## 5. Images, vidéos et CV

### 5.1 Où les mettre

Tous les médias du portfolio sont dans `Portfolio/public/media/`, un dossier par projet. Dans `content.js`, on
écrit le chemin **à partir de** `media/` : `'voyageur-1/vignette.webp'`.

Formats conseillés :
- images : **.webp** (Aperçu sur Mac : Fichier → Exporter → format WebP n'existe pas partout ; sinon .jpg convient).
  Largeur 1600 à 2400 px suffit, moins de 500 Ko si possible.
- vidéos : **.mp4** (H.264), muettes, courtes (5 à 20 s), moins de 10 Mo si possible.
- Noms de fichiers : minuscules, sans espace ni accent (`plongee-2.webp`).

### 5.2 La liste `media` d'un projet

```js
media: [
  { src: 'mon-projet/grande.webp', alt: T('Description de l’image', 'Image description') },
  { src: 'mon-projet/detail-1.webp', alt: T('…', '…'), layout: 'stack' },
  { src: 'mon-projet/detail-2.webp', alt: T('…', '…'), layout: 'stack' },
  { src: 'mon-projet/film.mp4', poster: 'mon-projet/film-poster.webp', alt: T('…', '…') },
],
```

- Chaque ligne = une case. `layout: 'stack'` sur **deux lignes qui se suivent** : elles se partagent une case,
  l'une au-dessus de l'autre. Ne pas mettre deux paires `stack` à la suite.
- `alt` : description de l'image pour les personnes aveugles et Google. Toujours la remplir.
- Vidéo `.mp4` : lue en boucle, sans son ; `poster` = image affichée pendant le chargement.
- `ratio: 16/9` (facultatif) impose un format ; sinon le site prend le format le plus proche de l'image.
- `pos: [0.5, 0]` (facultatif) choisit le point de cadrage (0,0 = haut gauche ; 0.5,0.5 = centre).

### 5.3 Déclarer la taille d'une nouvelle image (important)

Le fichier `Portfolio/src/media-sizes.json` donne la largeur et la hauteur de chaque média, pour éviter que la page
saute au chargement. Pour un nouveau fichier, ajouter une entrée (largeur, hauteur en pixels), avec une virgule entre
les entrées :

```json
"mon-projet/grande.webp": [2000, 1250],
```

La taille d'une image se lit dans le Finder (sélectionner le fichier, ⌘ I, rubrique « Plus d'infos »). Si on oublie,
le site fonctionne quand même, mais le cadrage peut être moins juste.

### 5.4 Le CV

Remplacer le fichier `Portfolio/public/cv/johann-arata-cv.pdf` par le nouveau PDF, **en gardant exactement ce nom**.
Le bouton « Curriculum vitae » le télécharge.

### 5.5 La vidéo d'accueil

C'est un montage déjà calculé : `public/media/accueil-montage.mp4` (ordinateur), `accueil-montage-1280.mp4` (mobile)
et le dossier `public/media/accueil/` (version haute qualité en streaming, 4 tailles). L'image affichée avant la
vidéo est `public/media/accueil-fond.webp`.

Le plus simple, pour la remplacer par un autre montage : exporter une vidéo 16:10, muette, en boucle, puis remplacer
les deux `.mp4` en gardant leurs noms. Supprimer ensuite le dossier `public/media/accueil/`, et dans
`src/render.js`, retirer de la ligne `<video class="hero__bg" …>` l'attribut
`data-hls="${root}media/accueil/montage.m3u8"`. Le site lit alors directement le MP4. Recréer la version streaming
en 4 tailles demande ffmpeg et des réglages précis : à refaire avec un assistant si besoin.

---

## 6. Publier (mettre en ligne)

### 6.1 Vérifier avant d'envoyer

```bash
cd "/Users/johann/Documents/Projet Portfolio/Portfolio"
```

```bash
npm run build
```

Si la commande se termine par `✓ built in …`, tout va bien. Si elle affiche une erreur, elle donne en général le
fichier et la ligne (souvent une apostrophe ou une virgule oubliée dans `content.js`). Corriger et relancer.

### 6.2 Envoyer

Trois commandes, à lancer l'une après l'autre :

```bash
git add -A src public mentions-legales.html en holosene 404.html
```

```bash
git commit -m "Textes : mise à jour de la page À propos"
```

```bash
git push
```

- `git add` choisit les fichiers à envoyer. Éviter `git add .` : il prendrait aussi des brouillons qui n'ont rien à
  faire en ligne (par exemple `RAPPORT-SITE-2026-11-20.md`).
- `git commit -m "…"` enregistre une version avec une courte phrase qui dit ce qui a changé.
- `git push` envoie sur GitHub. GitHub reconstruit et publie le site tout seul.

Pour voir ce qui va partir avant `git commit` : `git status` (liste des fichiers) et `git diff` (le détail ; `q`
pour sortir).

### 6.3 Suivre la mise en ligne

Sur https://github.com/Johann-Ar/Portfolio/actions : la publication « GitHub Pages » apparaît. Pastille jaune = en
cours (2 à 5 min) ; verte = en ligne ; rouge = échec (cliquer pour lire l'erreur ; le site en ligne reste
l'ancienne version, rien n'est cassé). Recharger ensuite holosene.fr/portfolio/ avec ⌘ ⇧ R.

### 6.4 Gros fichiers et connexion lente

GitHub refuse un fichier de plus de 100 Mo, et un envoi trop gros sur une connexion lente échoue (« HTTP 408 »,
« remote end hung up »). Dans ce cas :
- réessayer avec : `git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push`
- ou attendre une meilleure connexion (une vidéo d'accueil complète pèse environ 180 Mo) ;
- ou envoyer en plusieurs fois : faire un `git commit` par petit groupe de fichiers et un `git push` après chacun.

Un site GitHub Pages ne doit pas dépasser 1 Go au total.

---

## 7. holosene.fr : le Worker Cloudflare

On n'y touche que dans trois cas.

**Ajouter un nouveau site de projet sous holosene.fr/portfolio/<nom>/**
1. Le projet doit avoir son dépôt GitHub publié par GitHub Pages, avec des chemins relatifs (`base: './'` dans
   Vite) ou `base: '/portfolio/<nom>/'`.
2. Dans `Portfolio/cloudflare/holosene-worker/worker.js`, ajouter une ligne dans `PROJETS` :
   `'mon-projet': 'Nom-Exact-Du-Depot',` (la casse compte).
3. Double-cliquer sur `Projet Portfolio/Publier holosene.fr.command`. Un navigateur peut demander de se connecter
   à Cloudflare la première fois.

**Rendre le site visible par Google (le jour de la version 1.0)**
Aujourd'hui, le site est en ligne mais demande aux moteurs de recherche de ne pas l'indexer. Pour changer :
dans `worker.js`, remplacer `const PRIVE = true` par `const PRIVE = false`, puis double-cliquer sur
`Publier holosene.fr.command`.

**Le DNS ou le domaine**
Tableau de bord Cloudflare (https://dash.cloudflare.com), domaine holosene.fr. Le domaine lui-même (renouvellement
annuel) est chez Hostinger. Penser à vérifier la date de renouvellement pour ne pas le perdre.

---

## 8. Les sites des projets

Chaque projet a son propre dossier et son propre dépôt. Le principe reste le même : modifier, vérifier, puis
`git add`, `git commit` et `git push` depuis **son** dossier.

| Projet | Dossier | Aperçu local | Particularité |
|---|---|---|---|
| Dumbo | `Dumbo-biovolume/` | ouvrir `index.html` via un petit serveur : `npx serve .` puis l'adresse affichée | site sans compilation : on modifie directement les fichiers ; réglages de la salle dans `salle/src/config.js` |
| Mondes immergés | `Mondes-immerges/` | `npm install` puis `npm run dev` | compilé par GitHub (`deploy.yml`) |
| Voyageur 1 | `Voyageur-1/` | `npm install` puis `npm run dev` | compilé par GitHub (`pages.yml`) ; `npm run build` vérifie aussi le code |
| Volume photographique | `photographique-volume/` | voir son README | la branche de travail actuelle n'est pas `main` : vérifier avec `git branch` ; seul `main` est publié |

Pour les textes d'un projet, chercher la phrase dans tout le dossier : dans VS Code, ⌘ ⇧ F, taper un morceau de la
phrase.

Mention à garder sur Dumbo : « Proposition pour le Musée océanographique de Monaco ». Les projets liés à la NASA, à
National Geographic ou au Musée doivent toujours rester présentés comme des propositions personnelles non
commandées (jamais avec leur logo ni comme s'ils venaient d'eux).

---

## 9. Ce qu'il ne faut pas toucher

- **Le logo et la roue irisée** : ils viennent uniquement de `Portfolio/design/logo-kit/` (export exact du Figma).
  Ne jamais redessiner le logo ni modifier à la main `design/logo-kit/src/` ou `design/logo-kit/tokens/` (le détail
  est dans `Portfolio/CLAUDE.md`).
- **Les fichiers techniques** (`src/main.js`, `src/gl.js`, `src/render.js`, `vite.config.js`, `src/styles.css`) :
  à ne modifier que si on sait ce qu'on fait. Une erreur dedans peut casser l'affichage sans message clair.
- **Les scripts ajoutés à la main dans une page HTML** sont bloqués par la sécurité du site (CSP) : c'est voulu.
- **Les mots de passe, clés et jetons** ne vont jamais dans un fichier envoyé sur GitHub (les dépôts sont publics).

---

## 10. En cas de problème

| Symptôme | Que faire |
|---|---|
| `npm run build` affiche une erreur dans `content.js` | regarder le numéro de ligne indiqué : apostrophe droite dans un texte, virgule ou parenthèse manquante |
| Page blanche en local | regarder le Terminal où tourne `npm run dev` : l'erreur y est écrite |
| `git push` refusé : « rejected… fetch first » | quelqu'un (ou une autre machine) a envoyé entre-temps : `git pull --rebase` puis `git push` |
| `git push` : « HTTP 408 », « hung up » | connexion trop lente pour la taille : voir 6.4 |
| `git push` demande un mot de passe | GitHub n'accepte plus le mot de passe du compte : créer un « token » sur https://github.com/settings/tokens (droit `repo`) et le coller à la place, ou installer GitHub Desktop (https://desktop.github.com) qui gère la connexion |
| La publication est rouge dans Actions | ouvrir le détail : souvent la même erreur que `npm run build` en local |
| Le site en ligne n'a pas changé | attendre la fin de la publication (6.3), puis recharger avec ⌘ ⇧ R |
| On a tout cassé en local | `git restore src/content.js` (remet le fichier tel qu'il était au dernier commit) ; `git restore .` pour tout remettre |
| On veut revenir à une version déjà publiée | `git log --oneline` (liste des versions), puis `git revert <numéro>` et `git push` : annule cette version proprement |

**Alternative sans Terminal.** GitHub Desktop (gratuit) fait `add`, `commit` et `push` avec des boutons. Pour une
toute petite correction de texte, on peut aussi modifier `src/content.js` directement sur github.com (ouvrir le
fichier, icône crayon, « Commit changes ») : la publication part toute seule. Attention, il n'y a alors pas de
vérification locale avant la mise en ligne.

---

## 11. Aide-mémoire

```bash
cd "/Users/johann/Documents/Projet Portfolio/Portfolio"
```

| Je veux… | Commande |
|---|---|
| voir le site en local | `npm run dev` |
| vérifier que tout se construit | `npm run build` |
| lister les textes à compléter | `npm run todo` |
| voir ce que j'ai modifié | `git status` puis `git diff` |
| publier | `git add -A src public` → `git commit -m "…"` → `git push` |
| annuler mes modifications non publiées d'un fichier | `git restore <fichier>` |
| récupérer la dernière version en ligne | `git pull` |

Comptes à garder sous la main : GitHub (`Johann-Ar`), Cloudflare (DNS et Worker de holosene.fr), Hostinger
(achat et renouvellement du domaine).
