<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#030303">
        <meta name="robots" content="noindex">
        <title>Page introuvable · Safibre</title>
        @vite(['resources/css/app.css'])
    </head>
    {{-- Page d erreur aux couleurs du site : la page Laravel par defaut, en anglais, cassait la marque --}}
    <body class="bg-encre text-white">
        <main class="conteneur flex min-h-svh flex-col justify-between gap-16 py-10">
            <a href="/" aria-label="Safibre, accueil">
                <img src="{{ Vite::asset('resources/assets/logo-etudes.webp') }}" alt="Safibre, Bureau d'Études Télécoms" width="700" height="149" class="h-10 w-auto">
            </a>

            <div class="flex flex-col gap-7">
                <span class="surtitre text-accent-clair">Erreur 404</span>
                <h1 class="text-[clamp(2.3rem,7vw,5rem)] uppercase leading-[0.96] tracking-[-0.02em]">
                    <span class="block font-light">Cette page</span>
                    <span class="block font-extrabold">n'existe pas (ou plus)</span>
                </h1>
                <p class="max-w-xl text-[15px] leading-relaxed text-white/70 md:text-base">
                    Le lien est peut-être ancien : le site a été refait. Repartez de l'accueil, ou dites-nous ce que vous cherchiez.
                </p>
                <div class="flex flex-col gap-3 sm:flex-row">
                    <a href="/contact" class="bouton-contour">Nous contacter</a>
                    <a href="/" class="bouton-plein">Retour à l'accueil</a>
                </div>
            </div>

            <p class="text-xs text-white/40">© {{ date('Y') }} SAFIBRE SUARL</p>
        </main>
    </body>
</html>
