import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '~/scripts/animations'
import type { SceneDakar } from '~/scripts/scene_dakar'
import { cn } from '~/scripts/utils/css'
import { Plus } from '~/views/composants/titre'

// Un texte par plan du film (voir les PLANS de scene_dakar.ts)
const ETAPES = [
  { jusqua: 0.3, surtitre: 'Fann · Point E · Amitié', fin: 'Le réseau,', fort: 'rue par rue', texte: "Depuis la Corniche, la fibre suit les vraies rues du quartier jusqu'à nos bureaux." },
  { jusqua: 0.58, surtitre: 'Sur le terrain', fin: 'Poser,', fort: 'raccorder, mesurer', texte: 'Nos équipes tirent le câble, posent les boîtiers et contrôlent chaque liaison.' },
  { jusqua: 0.76, surtitre: "Au bureau d'études", fin: 'Chaque mètre', fort: 'sur le plan', texte: 'Tracés, routes optiques et dossiers des ouvrages exécutés : le réseau est documenté, pas seulement posé.' },
  { jusqua: 1.01, surtitre: 'Jusqu’à vous', fin: 'De la conception', fort: 'à la mise en production' /* avant : 'Du plan', 'à la mise en service' */, texte: 'Un seul interlocuteur, de la première étude au dernier raccordement.' },
]

// Telechargement partage : lance pendant que la page est au repos, reutilise a l approche
let telechargement: Promise<[typeof import('~/scripts/scene_dakar'), unknown]> | null = null
function telecharger() {
  telechargement ??= Promise.all([
    import('~/scripts/scene_dakar'),
    // Servi tel quel depuis public/ : genere par outils/donnees-dakar.mjs
    fetch('/donnees/dakar-3d.json').then((r) => {
      if (!r.ok) throw new Error('Donnees 3D introuvables')
      return r.json()
    }),
  ])
  return telechargement
}

/**
 * Le quartier de Dakar en 3D, la fibre qui se dessine au defilement. La scene
 * (Three.js + donnees OSM) n est chargee qu a l approche de la section, et ne
 * tourne que lorsqu elle est a l ecran.
 */
export function Dakar3D() {
  const section = useRef<HTMLElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const scene = useRef<SceneDakar | null>(null)
  const [etat, setEtat] = useState<'attente' | 'chargement' | 'pret' | 'indisponible'>('attente')
  const [etape, setEtape] = useState(0)
  const [progression, setProgression] = useState(0)

  // Chargement a l approche : Three.js et les donnees ne pesent rien tant qu on n arrive pas ici
  useEffect(() => {
    const el = section.current
    if (!el) return
    let annule = false
    // Des que le navigateur est au repos, on telecharge Three.js et les donnees (sans rien construire) :
    // a l arrivee sur la section, il ne reste que la construction
    const auRepos = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 2500))
    const attente = auRepos(() => void telecharger().catch(() => undefined))
    const observateur = new IntersectionObserver(
      async ([entree]) => {
        if (!entree.isIntersecting || scene.current || !toile.current) return
        observateur.disconnect()
        const essai = document.createElement('canvas')
        if (!(essai.getContext('webgl2') || essai.getContext('webgl'))) {
          setEtat('indisponible')
          return
        }
        setEtat('chargement')
        try {
          // Avant : import + fetch lances seulement ici, a 900 px de la section
          const [{ creerSceneDakar }, donnees] = await telecharger()
          if (annule || !toile.current) return
          const leger = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4
          scene.current = creerSceneDakar(toile.current, donnees as Parameters<typeof creerSceneDakar>[1], { leger })
          // On attend la compilation des shaders (en parallele) avant d afficher la scene
          await scene.current.pret
          if (annule) return
          setEtat('pret')
        } catch {
          setEtat('indisponible')
        }
      },
      // Avant : 900px ; plus tot, la construction est finie quand on arrive
      { rootMargin: '1600px 0px' }
    )
    observateur.observe(el)
    return () => {
      annule = true
      if (window.cancelIdleCallback) window.cancelIdleCallback(attente as number)
      else window.clearTimeout(attente as number)
      observateur.disconnect()
      scene.current?.detruire()
      scene.current = null
    }
  }, [])

  // La scene ne tourne que visible ; le defilement de la section pilote le film
  useEffect(() => {
    if (etat !== 'pret' || !section.current || !toile.current) return
    const s = scene.current
    // Apres un rechargement a chaud, la scene a pu etre detruite : on attend qu elle soit recreee
    if (!s) return
    // Mouvements reduits : pas de boucle (circulation, tremble), une image fixe qui suit le defilement
    const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (import.meta.env.DEV) (window as unknown as { __sceneDakar?: SceneDakar }).__sceneDakar = s
    const visible = new IntersectionObserver(([e]) => (e.isIntersecting && !calme ? s.demarrer() : s.arreter()))
    visible.observe(section.current)
    const taille = new ResizeObserver(() => s.redimensionner())
    taille.observe(toile.current)
    const declencheur = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: ({ progress }) => {
        if (calme) s.figer(progress)
        else s.definirProgression(progress)
        setProgression(progress)
        setEtape(Math.max(0, ETAPES.findIndex((e) => progress < e.jusqua)))
      },
    })
    return () => {
      visible.disconnect()
      taille.disconnect()
      declencheur.kill()
      s.arreter()
    }
  }, [etat])

  const courante = ETAPES[etape]

  return (
    <section ref={section} aria-label="Le réseau de fibre en 3D, à Dakar" className="relative h-[420vh] bg-encre text-white md:h-[520vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={toile} className="absolute inset-0 size-full" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-encre/85 via-transparent to-encre/30" />

        {etat !== 'pret' && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="surtitre text-white/60">
              {etat === 'indisponible' ? 'La vue 3D ne peut pas s’afficher sur cet appareil' : 'Chargement de la ville…'}
            </span>
          </div>
        )}

        {/* Texte du plan en cours */}
        <div className="conteneur absolute inset-x-0 bottom-0 pb-12 md:pb-16">
          <div key={etape} className="flex max-w-xl animate-[apparaitre_.8s_cubic-bezier(.16,1,.3,1)] flex-col gap-4">
            <span className="surtitre text-accent-clair">
              <Plus className="size-2.5" />
              {courante.surtitre}
            </span>
            <p className="text-[clamp(1.9rem,min(4.6vw,8vh),3.6rem)] uppercase leading-[1] tracking-[-0.01em]">
              <span className="block font-light">{courante.fin}</span>
              <span className="block font-extrabold">{courante.fort}</span>
            </p>
            <p className="max-w-md text-[15px] leading-relaxed text-white/80">{courante.texte}</p>
          </div>
        </div>

        {/* Avancement du film : un trait vertical, comme la fibre */}
        <div className="absolute right-5 top-1/2 hidden h-48 w-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15 md:right-8 md:block" aria-hidden>
          <div className="w-full rounded-full bg-orange transition-[height] duration-200" style={{ height: `${progression * 100}%` }} />
        </div>

        {/* Avant : className="absolute bottom-3 right-5 text-[10px] text-white/45 md:right-8" (collait au bord gauche sur telephone) */}
        <p className="absolute bottom-3 left-5 right-5 text-right text-[10px] text-white/45 md:left-auto md:right-8">
          Tracé d’illustration sur les rues réelles du quartier · Données © contributeurs OpenStreetMap
        </p>
      </div>
      <span className={cn('sr-only')}>
        Animation : la fibre SAFIBRE se dessine le long des rues de Fann, Point E et Amitié, jusqu’aux bureaux de l’avenue Habib Bourguiba.
      </span>
    </section>
  )
}
