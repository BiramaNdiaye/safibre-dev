# Consignes de travail — Safibre (site vitrine)

Ce fichier rassemble les consignes du proprietaire. Il est lu a chaque
demarrage. Quand une nouvelle consigne arrive en conversation, l ajouter ici.

## Le projet

- Site vitrine de SAFIBRE (Societe Africaine de la Fibre, Dakar, 2020) :
  bureau d etudes et operations terrain pour les reseaux fibre FTTH / FTTO.
- Laravel 11 + Inertia + React + Tailwind 3, deploye sur fly.io (`fly.toml`).
- Refonte du 13 octobre 2026 : nouveau design, Mantine retire du site public
  (Filament reste pour l admin). Sauvegarde de l avant-refonte :
  `C:\dev\safibre.sn-main-avant-refonte.tgz`.
- `MODIFICATIONS_RESTANTES.md` est la liste vivante de ce qui reste a faire.
  La lire en debut de session, la mettre a jour en fin de session.

## Demarrer en local

- `composer install --ignore-platform-req=ext-intl` (PHP de XAMPP sans intl,
  seul Filament l exige), `pnpm install`.
- `php artisan serve --port=8003` + `pnpm dev` (voir `.claude/launch.json`).
- Mails en local : `MAIL_MAILER=log`, ils s ecrivent dans `storage/logs/laravel.log`.

## Facon de travailler (meme regles que Sunu Ecole et Rangu)

- Ne pas lancer d agents sans demande explicite.
- Decider comme un vrai dev ; installer les bibliotheques utiles et dire lesquelles.
- Repondre en francais. Nommage en francais, textes affiches ACCENTUES,
  commentaires sans accents qui disent pourquoi.
- Penser droitier : action principale a droite (Envoyer, Valider).
- Ne jamais annoncer fait ce qui n a pas tourne : `npx tsc --noEmit`,
  `pnpm build`, et la page ouverte au navigateur (telephone et bureau).
- Pas de commit sans demande.
- **Ne jamais supprimer** (consigne du 19/10) : ce qu on retire ou remplace reste
  dans le code, en commentaire, a sa place, avec un mot sur pourquoi.

## Design (consignes du 13 octobre 2026)

- Reference principale : **Stelogy** (stelogy.com) — titres en capitales
  fin / gras (« Vos reseaux, / nos solutions ») soulignes d un trait orange
  et d un « + », bandeau d expertises sous le menu, bandes sombres.
  Autres references : smartworldpartners.fr (tuiles photo), Lusion (animations).
- **Rien qui « fasse IA »** : pas de particules, de halos flous, de « + » qui
  flottent, de photos decoupees en formes. Les en-tetes montrent les vraies
  photos des equipes, en plein ecran, cadrees sur les visages.
- **La fibre** : un trait orange qui se dessine au defilement. Il entre par
  le bord gauche (coude net), passe **dans les marges**, jamais sur le texte.
  **Masquee sur telephone** (< 768 px, demande du 20/10), visible sur ordinateur.
- **Bureau d etudes** (20/10) : papier millimetre ; sous la souris le quadrillage
  s eclaire en vert (`composants/fond_plan.tsx`, ordinateur seulement).
- **Une animation = un seul endroit** : ne pas repeter le meme effet partout.
  - accueil : carrousel photo, photo qui s elargit. Les cartes des poles
    facon Lusion (entree basculee + sortie qui retrecit) ont ete RETIREES le
    20/10 (« enleve le shrink ») : simple montee ;
  - operations terrain : galerie qui file a l horizontale ;
  - entreprise : rideau sur la photo d equipe.
- **En-tetes** (19/10) : photo plein ecran, titre pose dessus. Les en-tetes en
  cadre arrondi a encoches (style Groupe IAM) ont ete essayes et REFUSES :
  « pas beau ». Ne pas les reproposer.
- Defilement amorti (Lenis) branche sur GSAP : tout doit rester fluide.
- **Logos** (consigne du 13/10) : le principal est le vert « SAFIBRE Bureau
  d'Etudes Telecoms » (`assets/logo-etudes.webp`, partout par defaut) ; l orange
  « Operations Terrain Telecoms » (`assets/logo-terrain.webp`) est reserve au
  terrain : `<Vitrine logo="terrain">` sur la page operations terrain.
- **Couleurs** (consigne du 13/10, d apres l ancien site) : le **vert #417F62
  est la couleur principale**, l orange #E46B22 la secondaire. Les boutons et
  etats actifs utilisent `accent` : vert partout, orange sur la page terrain
  (`data-pole="terrain"`). L orange reste pour la fibre, les « + », les
  chiffres et les blocs decoratifs. Fonds sombres `encre` = noir #030303
  (consigne du 19/10, avant : vert profond #0F1F19). Tout est dans `resources/css/app.css`.

- **Bandeau « Une panne ? »** (20/10) : numero en grand sur fond orange, sur
  l accueil (apres les expertises) et la page terrain. La bande de balisage
  orange / noir sous l en-tete terrain a ete REFUSEE (« je veux pas ca »).
- **Film 3D de l accueil** (19/10) : ambiance « maquette » de jour comme les
  plans 3D envoyes (batiments blancs, mer bleue, trace orange sur la rue). Les
  balises facon Fortnite et le batiment allume en vert = un abonne raccorde.
  Ne pas toucher au `Dockerfile`.

## Ou est quoi

- Textes, coordonnees, chiffres, partenaires : `resources/scripts/contenu.ts`.
- Animations (attributs `data-apparition`) : `resources/scripts/animations.ts`.
- Sections des pages (20/10, pour des pages courtes et lisibles) :
  `resources/views/sections/accueil|terrain|bureau/` ; une page = la liste de ses sections.
- Scenes 3D : `resources/scripts/scene_dakar.ts` (accueil), `scene_senegal.ts`
  (realisations) et ses outils dans `resources/scripts/senegal/outils.ts` ; donnees
  generees par `outils/donnees-dakar.mjs` et `outils/donnees-senegal.mjs`.
- Composants : `resources/views/composants/`, mise en page :
  `resources/views/layouts/vitrine.tsx`, pages : `resources/views/pages/`.
- Photos compressees (WebP) : `resources/assets/photos/`.
