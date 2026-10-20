import { Head, Link, usePage } from '@inertiajs/react'
import { IconeCourriel, IconeFermer, IconeFlecheDiagonale, IconeLieu, IconeMenu, IconeTelephone } from '~/views/composants/icones'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Toaster } from 'sonner'
import logoEtudes from '~/assets/logo-etudes.webp'
import logoTerrain from '~/assets/logo-terrain.webp'
import { gsap, useApparitions, useDefilementFluide } from '~/scripts/animations'
import { coordonnees, expertises, navigation } from '~/scripts/contenu'
import { cn } from '~/scripts/utils/css'
import { RetourHaut } from '~/views/composants/retour_haut'
import { Plus } from '~/views/composants/titre'

type VitrineProps = PropsWithChildren<{
  titre?: string
  description?: string
  /** Logo de l en-tete : le principal (bureau d etudes) ou celui du terrain */
  logo?: 'etudes' | 'terrain'
  /** La page a deja son propre appel en bas (bandeau) : le pied ne repete pas « Parlons-en » */
  sansAppelPied?: boolean
}>

const LOGOS = {
  etudes: { src: logoEtudes, alt: "Safibre, Bureau d'Études Télécoms" },
  terrain: { src: logoTerrain, alt: 'Safibre, Opérations Terrain Télécoms' },
}

export function Vitrine({ titre, description, logo = 'etudes', sansAppelPied, children }: VitrineProps) {
  const page = useRef<HTMLDivElement>(null)
  useApparitions(page)
  useDefilementFluide()

  return (
    <div ref={page} data-pole={logo} className="flex min-h-svh flex-col">
      <Head title={titre}>{description && <meta name="description" content={description} />}</Head>
      <Entete logo={logo} />
      <main className="flex-1">{children}</main>
      <Pied sansAppel={sansAppelPied} />
      <RetourHaut />
      <Toaster richColors position="top-center" />
    </div>
  )
}

function Entete({ logo }: { logo: keyof typeof LOGOS }) {
  const { url } = usePage()
  const [defile, setDefile] = useState(false)
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 40)
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [])

  // On ferme le menu a chaque changement de page et on bloque le fond tant qu il est ouvert
  useEffect(() => setOuvert(false), [url])
  useEffect(() => {
    // Le defilement amorti continue sous le menu si on ne l arrete pas lui aussi
    const lenis = (window as unknown as { lenis?: { stop(): void; start(): void } }).lenis
    document.body.style.overflow = ouvert ? 'hidden' : ''
    if (ouvert) lenis?.stop()
    else lenis?.start()
  }, [ouvert])

  const actif = (lien: string) => url === lien || url.startsWith(lien + '#') || url.startsWith(lien + '?')

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 text-white transition-[background-color,box-shadow,backdrop-filter] duration-500',
          defile || ouvert
            ? 'bg-encre/95 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md'
            : 'bg-gradient-to-b from-encre/80 to-transparent'
        )}
      >
        <div className="conteneur flex h-[72px] items-center justify-between gap-6">
          <Link href="/" className="shrink-0" aria-label="Safibre, accueil">
            <img src={LOGOS[logo].src} alt={LOGOS[logo].alt} width={700} height={149} className="h-9 w-auto sm:h-10" />
          </Link>

          <nav className="hidden items-center gap-8 whitespace-nowrap xl:flex" aria-label="Navigation principale">
            {/* Contact passe par le bouton « Nous contacter », inutile en double */}
            {navigation.filter((n) => n.lien !== '/contact').map((item) => (
              <Link
                key={item.lien}
                href={item.lien}
                className={cn(
                  'group relative text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  actif(item.lien) ? 'text-accent-clair' : 'text-white/80 hover:text-white'
                )}
              >
                {item.libelle}
                <span
                  className={cn(
                    'absolute -bottom-1.5 left-0 h-px w-full origin-left bg-accent-clair transition-transform duration-500 ease-sortie',
                    actif(item.lien) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={coordonnees.telephoneLien}
              className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-full border border-white/25 px-4 text-[12px] font-bold uppercase tracking-wider transition-colors hover:border-white hover:bg-white hover:text-encre md:inline-flex"
            >
              <IconeTelephone size={15} />
              Appeler
            </a>
            <Link
              href="/contact"
              className="hidden h-10 items-center whitespace-nowrap rounded-full bg-accent px-5 text-[12px] font-bold uppercase tracking-wider transition-colors hover:bg-accent-fonce sm:inline-flex"
            >
              {/* Ancien libelle : Demander une étude */}
              {/* Ancien libelle : Demander une étude */}
          Nous contacter
            </Link>
            <button
              type="button"
              onClick={() => setOuvert((o) => !o)}
              className="grid size-11 place-items-center rounded-full border border-white/20 xl:hidden"
              aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={ouvert}
            >
              {ouvert ? <IconeFermer size={20} /> : <IconeMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Bandeau des expertises : il se replie au defilement pour laisser la place au contenu */}
        <div
          className={cn(
            'hidden overflow-hidden border-t border-white/10 transition-[max-height,opacity] duration-500 ease-sortie xl:block',
            defile ? 'max-h-0 opacity-0' : 'max-h-14 opacity-100'
          )}
        >
          <ul className="conteneur flex h-12 items-center justify-between">
            {expertises.map((e) => (
              <li key={e.code}>
                <Link
                  href={e.lien}
                  className="group flex items-center gap-2 text-[12px] font-semibold text-white/85 transition-colors hover:text-white"
                >
                  <Plus className="transition-transform duration-500 group-hover:rotate-90" />
                  {e.titre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <MenuMobile ouvert={ouvert} actif={actif} />
    </>
  )
}

function MenuMobile({ ouvert, actif }: { ouvert: boolean; actif: (lien: string) => boolean }) {
  const panneau = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ouvert || !panneau.current) return
    gsap.fromTo(
      panneau.current.querySelectorAll('[data-entree]'),
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.15 }
    )
  }, [ouvert])

  return (
    <div
      ref={panneau}
      className={cn(
        'fixed inset-0 z-40 flex flex-col bg-encre px-5 pb-8 pt-28 text-white sm:px-8 transition-[clip-path] duration-700 ease-sortie xl:hidden',
        ouvert ? '[clip-path:inset(0_0_0_0)]' : 'pointer-events-none [clip-path:inset(0_0_100%_0)]'
      )}
      aria-hidden={!ouvert}
      // Ferme, le menu ne doit pas etre atteignable au clavier (aria-hidden seul laissait passer la touche Tab)
      {...(!ouvert && ({ inert: '' } as Record<string, string>))}
    >
      <div className="grain pointer-events-none absolute inset-0" />
      <nav className="relative flex flex-col" aria-label="Navigation mobile">
        {[{ libelle: 'Accueil', lien: '/' }, ...navigation.filter((n) => n.lien !== '/contact')].map((item) => (
          <Link
            key={item.lien}
            href={item.lien}
            data-entree
            className={cn(
              'flex items-center justify-between border-b border-white/10 py-4 text-2xl font-extrabold uppercase',
              (item.lien === '/' ? false : actif(item.lien)) && 'text-accent-clair'
            )}
          >
            {item.libelle}
            <IconeFlecheDiagonale size={22} className="text-white/40" />
          </Link>
        ))}
      </nav>
      <div className="relative mt-auto flex flex-col gap-3" data-entree>
        <a href={coordonnees.telephoneLien} className="flex items-center gap-3 text-white/80">
          <IconeTelephone size={18} className="text-accent-clair" />
          {coordonnees.telephone}
        </a>
        <a href={`mailto:${coordonnees.email}`} className="flex items-center gap-3 text-white/80">
          <IconeCourriel size={18} className="text-accent-clair" />
          {coordonnees.email}
        </a>
        <Link href="/contact" className="bouton-plein mt-4 w-full">
          Nous contacter
        </Link>
      </div>
    </div>
  )
}

function Pied({ sansAppel }: { sansAppel?: boolean }) {
  // Sur la page Contact, l appel « Parlons-en / Nous ecrire » renverrait vers la page ou l on est deja
  const surContact = usePage().url.startsWith('/contact')
  return (
    <footer className="relative overflow-hidden bg-encre text-white">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="conteneur relative">
        {!surContact && !sansAppel && (
        <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 py-16 md:flex-row md:items-end md:py-20">
          <p data-apparition="titre" className="text-[clamp(2rem,5vw,3.8rem)] uppercase leading-[1.02]">
            <span className="ligne-masque">
              <span className="font-light">Un réseau à construire ?</span>
            </span>
            <span className="ligne-masque">
              <span className="font-extrabold">
                Parlons-en<span className="text-orange">.</span>
              </span>
            </span>
          </p>
          <Link href="/contact" data-apparition="monte" className="bouton-plein shrink-0">
            Nous écrire
            <IconeFlecheDiagonale size={18} />
          </Link>
        </div>
        )}

        {/* Avant : <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4"> : sur telephone tout s empilait (1 300 px de pied)
            Maintenant : Expertises et Safibre cote a cote des le telephone */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
            <img src={LOGOS.etudes.src} alt={LOGOS.etudes.alt} width={700} height={149} className="h-11 w-auto self-start" loading="lazy" />
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Société Africaine de la Fibre. Bureau d'études et opérations terrain pour les réseaux
              fibre optique, depuis 2020.
            </p>
          </div>

          <ColonnePied titre="Expertises">
            {expertises.map((e) => (
              <Link key={e.code} href={e.lien} className="text-white/70 transition-colors hover:text-accent-clair">
                {e.titre}
              </Link>
            ))}
          </ColonnePied>

          <ColonnePied titre="Safibre">
            {navigation.map((n) => (
              <Link key={n.lien} href={n.lien} className="text-white/70 transition-colors hover:text-accent-clair">
                {n.libelle}
              </Link>
            ))}
            <Link href="/legal" className="text-white/70 transition-colors hover:text-accent-clair">
              Mentions légales
            </Link>
          </ColonnePied>

          <ColonnePied titre="Nous joindre" className="col-span-2 sm:col-span-1">
            <a href={coordonnees.telephoneLien} className="flex items-center gap-2 text-white/70 hover:text-accent-clair">
              <IconeTelephone size={16} className="text-accent-clair" />
              {coordonnees.telephone}
            </a>
            <a href={`mailto:${coordonnees.email}`} className="flex items-center gap-2 text-white/70 hover:text-accent-clair">
              <IconeCourriel size={16} className="text-accent-clair" />
              {coordonnees.email}
            </a>
            <p className="flex items-start gap-2 text-white/70">
              <IconeLieu size={16} className="mt-0.5 shrink-0 text-accent-clair" />
              <span>
                {coordonnees.adresse.map((ligne) => (
                  <span key={ligne} className="block">
                    {ligne}
                  </span>
                ))}
              </span>
            </p>
          </ColonnePied>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} SAFIBRE SUARL. Tous droits réservés.</span>
          {/* <span>Dakar, Sénégal</span>  (deja dans l adresse juste au-dessus) */}
          <Link href="/legal" className="transition-colors hover:text-white/70">
            Mentions légales
          </Link>
        </div>
      </div>
    </footer>
  )
}

function ColonnePied({ titre, className, children }: PropsWithChildren<{ titre: string; className?: string }>) {
  return (
    <div className={cn('flex flex-col gap-3 text-sm', className)}>
      <span className="surtitre mb-2 text-white">
        <Plus className="size-2.5" />
        {titre}
      </span>
      {children}
    </div>
  )
}
