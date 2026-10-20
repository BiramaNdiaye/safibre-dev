# Modifications restantes — Safibre

Liste vivante : la lire en debut de session, la mettre a jour en fin de session.

## Fait (13/10/2026) — refonte

- Nouveau design (Stelogy + Lusion), 6 pages : accueil, entreprise, bureau
  d etudes, operations terrain, contact, mentions legales.
- Anciennes adresses redirigees en 301 (`/maintenance_fibre_optique`,
  `/centre_telecom`, `/bureau`, `/support`, `/waitlist`).
- Formulaire de contact corrige : le message partait vers l adresse du
  VISITEUR ; il part maintenant vers `CONTACT_DESTINATAIRE`
  (defaut contact@safibre.sn) avec « Repondre » vers le visiteur.
  Messages d erreur en francais, limite 5 envois / minute.
- Photos compressees : 6 Mo -> 60 a 260 Ko (WebP). Police Montserrat
  auto-hebergee (~40 Ko). Icones maison au lieu de Tabler.

### Fait (19/10/2026) — film 3D du reseau (accueil)
- Section `Dakar3D` (`resources/views/composants/dakar_3d.tsx`) + scene Three.js
  (`resources/scripts/scene_dakar.ts`) : vrai quartier Fann / Point E / Amitie
  (OpenStreetMap, credit affiche), fibre qui se pose au defilement en 6 plans.
- Donnees : `node outils/donnees-dakar.mjs <extrait-overpass.json>` ecrit
  `public/donnees/dakar-3d.json` (la ligne de cote n est plus remplie en vert).
- Ambiance « maquette » d apres les plans 3D du proprietaire : jour, batiments
  blancs, mer bleue scintillante avec hauts-fonds et ecume, trace orange sur la rue.
- Raccordements : poteau + PBO, cable qui pend, lumiere qui court, batiment
  allume en vert + balise (losange, faisceau, onde) qui se fait discrete ensuite.
- Arrivee : vrai siege SAFIBRE (couronne verte, enseigne, etages qui s allument).
- Gros plan « Sur le terrain » : technicien sur echelle au poteau (cote rue, poteau
  choisi pour etre degage), collegue au pied ; equipe + camionnette + touret qui
  suivent la tete de la fibre ; siege SAFIBRE avec enseigne.
- Vitesse : shaders compiles en parallele (`compileAsync`, la page ne gele plus),
  Three.js + donnees telecharges au repos, houle et raccordements optimises
  (blocage 6,8 s -> 1,9 s en dev). Cache nginx d un an sur `/build/`
  (`.fly/nginx/sites-available/default`, le Dockerfile n est pas touche).
- Section « Notre approche » masquee (en commentaire dans `home.tsx`).
- Fonds sombres en #030303, bouton « Nous contacter », lien Contact masque du menu.
- A voir : la scene pese ~140 Ko gzip (chargee seulement a l approche) ; tester
  sur un vrai telephone d entree de gamme.

### Fait (20/10/2026) — sections et identites des poles
- Operations terrain : fiches d intervention INT-xx, bon d intervention (tampon
  « Rapport remis »), bandeau orange « Une panne ? ». Bande de balisage sous
  l en-tete REFUSEE (gardee en commentaire).
- Bureau d etudes : dossiers ETU-xx sur papier millimetre, reperes de coupe,
  bandeau vert « Un projet a etudier ? ». Bordereau « Ce que nous livrons » RETIRE
  (juge faux par le proprietaire, garde en commentaire). Effet souris sur le papier.
- Entreprise : logos des deux poles sur leurs cartes, icones des engagements.
- Accueil : bandeau « Une panne ? » apres les expertises, cartes des poles avec
  leurs services et bouton « Decouvrir le pole », plus d effet qui retrecit.
- Pied : plus compact sur telephone, pas de « Parlons-en » sur Contact ni sur
  Bureau d etudes (qui a deja son bandeau).

### Fait (19/10/2026) — securite
- `composer update` dans les versions permises : Laravel 11.34 -> 11.57, Livewire
  3.5 -> 3.8 (faille CRITIQUE d execution de code a distance corrigee), Filament
  3.2 -> 3.3, Guzzle, Symfony, CommonMark. `pnpm audit` : plus rien.
  Anciens fichiers gardes : `composer.lock.avant-maj-securite`, `pnpm-lock.yaml.avant-maj-securite`.
- Formulaire de contact : e-mail valide en `email:rfc,filter` (refuse les retours a la
  ligne : injection d en-tetes) + champ piege `site_web` contre les robots.
- Seeder : plus de mot de passe admin en clair (ADMIN_PASSWORD dans .env, sinon aleatoire).
- nginx : HSTS, Referrer-Policy stricte, Permissions-Policy, cache 1 an sur /build/.
- A DECIDER : passer a Laravel 12. Laravel 11 n est plus corrige ; il reste des avis
  (signed URL, validation de fichiers, page de debug) sans correctif en 11.x.
- A FAIRE : si le compte hello@tmuco.dev existe en ligne avec l ancien mot de passe
  du seeder, le changer depuis l admin.
- Menu mobile ferme : `inert` ajoute (il restait atteignable a la touche Tab).

### A voir — sections des sites de reference (contenu reel necessaire)
- Temoignages clients (Stelogy « Ceux qui parlent le mieux de nous ») : citations et noms reels.
- Realisations / actualites (Stelogy, Synaps) : chantiers et dates reels.
- Zones d intervention au Senegal (SWP « A l international ») : regions reellement couvertes.

### Fait (19/10/2026) — revue page par page
- Rendu serveur Inertia (SSR) desactive par defaut (`config/inertia.php`,
  `INERTIA_SSR_ENABLED`) : aucun serveur de rendu ne tourne, mais le build
  produit `bootstrap/ssr/ssr.js`, donc Laravel tentait de le joindre a chaque
  page (plusieurs secondes perdues, en local et probablement en ligne).
- Page 404 aux couleurs du site (`resources/views/errors/404.blade.php`).
- Menu : liens complets a partir de 1280 px, bouton menu en dessous (a 1024 px
  les liens passaient sur deux lignes).
- Selecteur d expertises refait : liste numerotee, ligne ouverte marquee,
  detail lisible sous la photo, plus de defilement automatique.
- Animations : declenchees des l entree a l ecran, plus rien de cache en CSS
  (un grand ecran montrait des zones vides sous l en-tete).
- Espaces insecables avant « : » et « ? ».
- Local seulement : PHP de XAMPP sans opcache, 3 a 7 s par page en dev.

## A confirmer par le proprietaire

1. Chiffres repris de l ancien site (ils se contredisaient d une page a
   l autre) : +2 000 raccordements, +5 000 dossiers d ingenierie par an,
   suivi 24/7. Corriger dans `contenu.ts` si besoin.
2. Logos clients / partenaires affiches (Orange, Camusat, Circet, Sade,
   Axione, Raisecom, CSMA, PLP, GI Smartware) : accord pour les montrer ?
3. Hebergeur dans les mentions legales : Fly.io (adresse a verifier).
4. En production : definir `CONTACT_DESTINATAIRE` et verifier que l envoi
   de mail (Resend) est configure sur fly.io, puis faire un envoi test.

## A faire

- Tests : les 22 tests d authentification de Breeze echouent, et c etait
  deja le cas avant la refonte : `routes/auth.php` n a jamais ete charge
  (pas de connexion publique sur le site, l admin passe par Filament).
  Les supprimer ou brancher `auth.php`. Lancer les tests avec
  `DB_DATABASE=:memory:` : sinon ils essaient d effacer la base locale,
  verrouillee par `php artisan serve` sous Windows.

- Deployer sur fly.io une fois valide (`fly deploy`) — le Dockerfile
  utilise Node 18 : verifier que la compilation passe dans l image.
- Supprimer les dependances devenues inutiles au site public si Filament
  ne s en sert pas : `@mantine/*`, `@tabler/icons-react`, `lucide-react`.
- Supprimer les anciennes photos lourdes non utilisees de
  `resources/assets/` (garder `photos/`, `images/partners/`, les logos).
- Page « Realisations » (projets avec photos) si le proprietaire a des
  references a montrer.
- Version anglaise ? (les logos portent « Telecom Engineering » et
  « Telecom Field Operations »).
