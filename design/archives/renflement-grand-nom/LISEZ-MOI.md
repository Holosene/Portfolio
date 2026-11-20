# Renflement du grand JOHANN ARATA (accueil) — archivé le 20 nov. 2026

Effet « boule dans un collant » sur le grand nom de l'accueil, retiré à la demande de Johann.
Le petit nom du pied de page le garde. Copie ici, hors du code compilé.

- `name-bulge.js` : le module tel qu'il était (commit f836ac2), avec le battement pendant le tracé du nom
  (boules gonflées seulement sur la partie déjà tracée, carte name-along.png).

## Pour le remettre
1. `src/render.js` : retirer `renflement: false` des deux `logotypeSvg` du grand nom (`hero__name`).
2. `src/main.js` : dans `initNameBulge([...])`, remettre `...sweeps.map((sw) => sw.el)` en tête de la liste.
3. Version exacte : `git show f836ac2.js du même commit).
