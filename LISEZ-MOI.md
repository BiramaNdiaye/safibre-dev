# SAFIBRE — site vitrine

Site de SAFIBRE (Société Africaine de la Fibre) : bureau d'études et opérations
terrain pour les réseaux fibre. Laravel 11 + Inertia + React + Tailwind, scènes 3D
avec Three.js.

## Lancer le site en local

Il faut PHP 8.2 et Composer. Le site est déjà compilé (`public/build`), Node
n'est utile que pour modifier le code.

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Puis ouvrir http://localhost:8000.

Si `composer install` réclame l'extension PHP `intl` (utilisée seulement par
l'administration Filament) : `composer install --ignore-platform-req=ext-intl`.

## Pour modifier le code

```bash
pnpm install
pnpm dev
```

## Les pages

- `/` accueil, avec le film 3D du quartier (Fann, Point E, Amitié)
- `/a-propos` l'entreprise
- `/bureau_etude` bureau d'études
- `/operations-telecoms` opérations terrain
- `/realisations` le déploiement Dakar → Tambacounda en 3D
- `/contact` formulaire de contact (en local, les messages s'écrivent dans
  `storage/logs/laravel.log`)

## Où est quoi

- Pages : `resources/views/pages/`, sections : `resources/views/sections/`,
  composants : `resources/views/composants/`
- Textes et coordonnées : `resources/scripts/contenu.ts`
- Scènes 3D : `resources/scripts/scene_dakar.ts`, `resources/scripts/scene_senegal.ts`
- Données des cartes (OpenStreetMap, SRTM, OSRM) : `public/donnees/`, régénérées par
  les scripts du dossier `outils/`
- Consignes de design et de travail : `CLAUDE.md` ; reste à faire : `MODIFICATIONS_RESTANTES.md`
