<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="SAFIBRE, Société Africaine de la Fibre : bureau d'études et opérations terrain pour les réseaux fibre optique au Sénégal. Études FTTH/FTTO, déploiement, raccordements, maintenance.">
        <meta name="theme-color" content="#030303">
        <title inertia>Safibre</title>

        {{-- Marque la page comme animable avant le premier rendu : evite le flash des elements a faire apparaitre --}}
        <script>document.documentElement.classList.add('js')</script>

        @routes
        @viteReactRefresh
        @vite([
            'resources/css/app.css',
            'resources/scripts/app.tsx',
            "resources/views/pages/{$page['component']}.tsx"
        ])
        @inertiaHead

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FLERB9SEH8"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FLERB9SEH8');
        </script>
    </head>
    <body>
        @inertia
    </body>
</html>
