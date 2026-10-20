import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '~/scripts/animations'
import type { DonneesSenegal, SceneSenegal } from '~/scripts/scene_senegal'
import { Plus } from '~/views/composants/titre'
import photoBobine from '~/assets/photos/terrain-bobine.webp'
import photoPoteau from '~/assets/photos/terrain-poteau.webp'
import photoRaccord from '~/assets/photos/terrain-2.webp'
import photoTirage from '~/assets/photos/terrain-3.webp'
import photoEquipe from '~/assets/photos/terrain-equipe.webp'

// Une vraie photo de chantier par etape (demande du 20/10 : « avec des photos »)
const PHOTOS = [
  { src: photoBobine, legende: 'Câble optique prêt à poser' },
  { src: photoRaccord, legende: "Raccordement d'un boîtier sur poteau" },
  { src: photoPoteau, legende: "Montée à l'échelle, collègue en appui" },
  { src: photoTirage, legende: 'Préparation du tirage de câble' },
  { src: photoEquipe, legende: 'Binôme au départ du chantier' },
]

// Un texte par etape du deploiement. Les bornes suivent la scene : la fibre court de 8 % a 86 %
// du defilement, Diourbel (km 152) vers 32 %, Kaolack (km 216) vers 42 %, Tambacounda a 86 %.
// Avant (20/10, premiere version : un seul trace par les quatre villes, 491 km) :
// const ETAPES = [
//   { jusqua: 0.3, surtitre: 'Nos réalisations', fin: 'Le déploiement,', fort: 'de Dakar à Tambacounda', texte: 'Un réseau fibre déployé par nos équipes, de la capitale jusqu’à l’est du pays.' },
//   { jusqua: 0.4, surtitre: 'Km 152', fin: 'Première étape,', fort: 'Diourbel', texte: 'Le tracé quitte la presqu’île du Cap-Vert et rejoint Diourbel.' },
//   { jusqua: 0.62, surtitre: 'Km 216', fin: 'Au centre du pays,', fort: 'Kaolack', texte: 'Le réseau rejoint Kaolack, carrefour du centre du Sénégal.' },
//   { jusqua: 0.9, surtitre: 'Km 491', fin: 'Jusqu’à l’est,', fort: 'Tambacounda', texte: 'La fibre arrive à Tambacounda, porte de l’est du Sénégal.' },
//   { jusqua: 1.01, surtitre: 'De bout en bout', fin: '491 km de route,', fort: 'un même réseau', texte: 'Étude, pose, raccordement et mise en service : les mêmes équipes, d’un bout à l’autre du tracé.' },
// ]
// Version precedente (textes en avance : Tambacounda annoncee a 62 % alors qu elle s allume a 86 %) :
// // Axe direct Dakar -> Tambacounda (466 km de route) et raccordements : Diourbel (44 km, piquage vers 38 %
// // du defilement), Kaolack (sur l axe, vers 44 %) ; Tambacounda a 86 %.
// const ETAPES = [
//   { jusqua: 0.3, surtitre: 'Nos réalisations', fin: 'Le déploiement,', fort: 'de Dakar à Tambacounda', texte: 'Un axe fibre déployé par nos équipes, de la capitale jusqu’à l’est du pays.' },
//   { jusqua: 0.41, surtitre: 'Raccordement', fin: 'Une branche vers', fort: 'Diourbel', texte: 'Depuis l’axe principal, un raccordement de 44 km rejoint Diourbel.' },
//   { jusqua: 0.62, surtitre: 'Raccordement', fin: 'Au centre du pays,', fort: 'Kaolack', texte: 'L’axe traverse Kaolack, raccordée au passage.' },
//   { jusqua: 0.9, surtitre: 'Km 466', fin: 'Jusqu’à l’est,', fort: 'Tambacounda', texte: 'La fibre arrive à Tambacounda, porte de l’est du Sénégal.' },
//   { jusqua: 1.01, surtitre: 'De bout en bout', fin: '466 km d’axe,', fort: 'deux raccordements', texte: 'Étude, pose, raccordement et mise en service : les mêmes équipes, d’un bout à l’autre.' },
// ]
// Bornes calees sur les allumages mesures (window.__timingsSenegal en developpement) :
// Dakar 8 %, Diourbel 37,6 %, Kaolack 44,4 %, Tambacounda 86 %. Chaque texte arrive juste avant sa ville.
const ETAPES = [
  { jusqua: 0.33, surtitre: 'Nos réalisations', fin: 'Le déploiement,', fort: 'de Dakar à Tambacounda', texte: 'Un axe fibre déployé par nos équipes, de la capitale jusqu’à l’est du pays.' },
  { jusqua: 0.42, surtitre: 'Raccordement', fin: 'Une branche vers', fort: 'Diourbel', texte: 'Depuis l’axe principal, un raccordement de 44 km rejoint Diourbel.' },
  { jusqua: 0.55, surtitre: 'Raccordement', fin: 'Au centre du pays,', fort: 'Kaolack', texte: 'L’axe traverse Kaolack, raccordée au passage.' },
  { jusqua: 0.8, surtitre: 'Vers l’est', fin: 'Poteau', fort: 'après poteau', texte: 'L’axe file vers l’est, le long de la route.' },
  { jusqua: 0.93, surtitre: 'Km 466', fin: 'Jusqu’à l’est,', fort: 'Tambacounda', texte: 'La fibre arrive à Tambacounda, porte de l’est du Sénégal.' },
  { jusqua: 1.01, surtitre: 'De bout en bout', fin: '466 km d’axe,', fort: 'deux raccordements', texte: 'Étude, pose, raccordement et mise en service : les mêmes équipes, d’un bout à l’autre.' },
]

let telechargement: Promise<[typeof import('~/scripts/scene_senegal'), DonneesSenegal]> | null = null
function telecharger() {
  telechargement ??= Promise.all([
    import('~/scripts/scene_senegal'),
    // Genere par outils/donnees-senegal.mjs
    fetch('/donnees/senegal-3d.json').then((r) => {
      if (!r.ok) throw new Error('Donnees 3D introuvables')
      return r.json() as Promise<DonneesSenegal>
    }),
  ])
  return telechargement
}

/**
 * Le deploiement Dakar -> Tambacounda en 3D, la fibre suit le defilement.
 * Meme fonctionnement que le film de l accueil (Dakar3D) : section haute, toile collee.
 */
export function Senegal3D() {
  const section = useRef<HTMLElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const scene = useRef<SceneSenegal | null>(null)
  const [etat, setEtat] = useState<'attente' | 'chargement' | 'pret' | 'indisponible'>('attente')
  const [etape, setEtape] = useState(0)
  const [progression, setProgression] = useState(0)

  // La section est en haut de page : on charge tout de suite
  useEffect(() => {
    let annule = false
    const essai = document.createElement('canvas')
    if (!(essai.getContext('webgl2') || essai.getContext('webgl'))) {
      setEtat('indisponible')
      return
    }
    setEtat('chargement')
    telecharger()
      .then(async ([{ creerSceneSenegal }, donnees]) => {
        if (annule || !toile.current) return
        const leger = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4
        scene.current = creerSceneSenegal(toile.current, donnees, { leger })
        await scene.current.pret
        if (!annule) setEtat('pret')
      })
      .catch(() => setEtat('indisponible'))
    return () => {
      annule = true
      scene.current?.detruire()
      scene.current = null
    }
  }, [])

  // La scene ne tourne que visible ; le defilement de la section pilote le film
  useEffect(() => {
    if (etat !== 'pret' || !section.current || !toile.current) return
    const s = scene.current
    if (!s) return
    const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (import.meta.env.DEV) (window as unknown as { __sceneSenegal?: SceneSenegal }).__sceneSenegal = s
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
    <section ref={section} aria-label="Le déploiement de la fibre de Dakar à Tambacounda, en 3D" className="relative h-[460vh] bg-encre text-white md:h-[560vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={toile} className="absolute inset-0 size-full" aria-hidden />
        {/* Avant : from-encre/85 ... to-encre/40, trop sombre sur le sud de la carte */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-encre/70 via-transparent via-40% to-encre/30" />

        {etat !== 'pret' && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="surtitre text-white/60">
              {etat === 'indisponible' ? 'La vue 3D ne peut pas s’afficher sur cet appareil' : 'Chargement de la carte…'}
            </span>
          </div>
        )}

        <div className="conteneur absolute inset-x-0 bottom-0 pb-12 md:pb-16">
          <div key={etape} className="flex max-w-xl animate-[apparaitre_.8s_cubic-bezier(.16,1,.3,1)] flex-col gap-4">
            <span className="surtitre text-accent-clair">
              <Plus className="size-2.5" />
              {courante.surtitre}
            </span>
            {/* Le titre de la page est la premiere etape : un h1, puis de simples paragraphes */}
            {etape === 0 ? (
              <h1 className="text-[clamp(1.9rem,min(4.6vw,8vh),3.6rem)] uppercase leading-[1] tracking-[-0.01em]">
                <span className="block font-light">{courante.fin}</span>
                <span className="block font-extrabold">{courante.fort}</span>
              </h1>
            ) : (
              <p className="text-[clamp(1.9rem,min(4.6vw,8vh),3.6rem)] uppercase leading-[1] tracking-[-0.01em]">
                <span className="block font-light">{courante.fin}</span>
                <span className="block font-extrabold">{courante.fort}</span>
              </p>
            )}
            <p className="max-w-md text-[15px] leading-relaxed text-white/80">{courante.texte}</p>
          </div>
        </div>

        {/* Photo par etape : retiree aussitot (20/10, le proprietaire voulait des POTEAUX, pas des photos)
        
        <figure key={'photo-' + etape} className="absolute bottom-16 right-14 hidden w-[min(30vw,380px)] animate-[apparaitre_.8s_cubic-bezier(.16,1,.3,1)] flex-col gap-2 lg:flex">
          <div className="aspect-[4/3] overflow-hidden rounded-[22px] border border-white/20 shadow-2xl">
            <img src={PHOTOS[etape]?.src} alt={PHOTOS[etape]?.legende} className="size-full object-cover" />
          </div>
          <figcaption className="text-right text-xs text-white/70">{PHOTOS[etape]?.legende}</figcaption>
        </figure>
        */}

        {/* Avancement : un trait vertical, comme la fibre */}
        <div className="absolute right-5 top-1/2 hidden h-48 w-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15 md:right-8 md:block" aria-hidden>
          <div className="w-full rounded-full bg-orange transition-[height] duration-200" style={{ height: `${progression * 100}%` }} />
        </div>

        <p className="absolute bottom-3 left-5 right-5 text-right text-[10px] text-white/45 md:left-auto md:right-8">
          Tracé d’illustration le long des routes · Données © contributeurs OpenStreetMap, itinéraire OSRM
        </p>
      </div>
      <span className="sr-only">
        Animation : la fibre SAFIBRE se déploie de Dakar à Tambacounda, en passant par Diourbel et Kaolack, sur un axe d environ 466 km de route, avec des raccordements vers Diourbel et Kaolack.
      </span>
    </section>
  )
}
