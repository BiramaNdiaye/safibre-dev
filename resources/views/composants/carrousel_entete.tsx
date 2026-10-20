import { Link } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '~/scripts/animations'
import { cn } from '~/scripts/utils/css'
import { IconeFleche } from '~/views/composants/icones'

export type Scene = {
  rubrique: string
  fin: string
  fort: string
  texte: string
  photo: string
  photoAlt: string
  position?: string
}

const DUREE = 7000

/**
 * En-tete de l accueil : les vraies photos des equipes en plein ecran, une
 * scene apres l autre. Pas d effet decoratif : le metier se montre lui-meme.
 */
export function CarrouselEnTete({ scenes }: { scenes: Scene[] }) {
  // La photo change tout de suite, le texte apres sa sortie : les deux se chevauchent en douceur
  const [photo, setPhoto] = useState(0)
  const [actif, setActif] = useState(0)
  const [pause, setPause] = useState(false)
  const texte = useRef<HTMLDivElement>(null)
  const enTransition = useRef(false)

  const calme = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const aller = useCallback(
    (suivant: number) => {
      if (suivant === actif || enTransition.current) return
      setPhoto(suivant)
      if (!texte.current || calme()) {
        setActif(suivant)
        return
      }
      enTransition.current = true
      gsap.to(texte.current.querySelectorAll('.ligne-masque > span, [data-scene-texte]'), {
        yPercent: -30,
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power2.in',
        stagger: 0.03,
        onComplete: () => setActif(suivant),
      })
    },
    [actif]
  )

  // Entree du texte de la scene, y compris a l arrivee sur la page
  useEffect(() => {
    const el = texte.current
    if (!el) return
    if (calme()) {
      enTransition.current = false
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ligne-masque > span',
        { yPercent: 110, autoAlpha: 1 },
        { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: 0.09 }
      )
      gsap.fromTo(
        '[data-scene-texte]',
        { yPercent: 0, y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.06,
          delay: 0.25,
          onComplete: () => {
            enTransition.current = false
          },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [actif])

  const scene = scenes[actif]

  return (
    <section
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-encre text-white"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      aria-roledescription="carrousel"
    >
      {scenes.map((s, i) => (
        <div
          key={s.photo}
          aria-hidden={i !== photo}
          className={cn(
            'absolute inset-0 -z-10 transition-opacity duration-[1800ms] ease-in-out',
            i === photo ? 'opacity-100' : 'opacity-0'
          )}
        >
          <img
            src={s.photo}
            alt={s.photoAlt}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={cn(
              'size-full object-cover transition-transform duration-[9000ms] ease-out will-change-transform',
              i === photo ? 'scale-[1.06]' : 'scale-100'
            )}
            style={{ objectPosition: s.position ?? 'center' }}
          />
        </div>
      ))}
      {/* Voile pour la lisibilite du texte, rien de plus */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-encre via-encre/45 to-encre/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-encre/70 to-transparent md:via-transparent" />

      <div className="conteneur relative pb-10 pt-32 md:pb-14 lg:pt-44">
        <div ref={texte} key={actif} className="flex max-w-4xl flex-col gap-5 md:gap-6">
          <span data-scene-texte className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
            <span className="text-accent-clair">{String(actif + 1).padStart(2, '0')}</span>
            <span className="mx-2 text-white/40">/</span>
            {scene.rubrique}
          </span>
          {actif === 0 ? (
            <h1 className="text-[clamp(1.95rem,min(5.6vw,8.5vh),5.2rem)] uppercase leading-[0.95] tracking-[-0.02em]">
              <TitreScene scene={scene} />
            </h1>
          ) : (
            <p className="text-[clamp(1.95rem,min(5.6vw,8.5vh),5.2rem)] uppercase leading-[0.95] tracking-[-0.02em]">
              <TitreScene scene={scene} />
            </p>
          )}
          <p data-scene-texte className="max-w-xl text-[15px] leading-relaxed text-white/80 md:text-base">
            {scene.texte}
          </p>
          <div data-scene-texte className="flex flex-col gap-3 sm:flex-row">
            <a href="#expertises" className="bouton-contour">
              Nos expertises
            </a>
            <Link href="/contact" className="bouton-plein">
              Demander une étude
              <IconeFleche size={18} />
            </Link>
          </div>
        </div>

        {/* Navigation : une barre par scene, qui se remplit pendant qu elle est affichee */}
        <div className="mt-12 grid grid-cols-3 gap-3 md:mt-16 md:gap-6">
          {scenes.map((s, i) => (
            <button
              key={s.photo}
              type="button"
              onClick={() => aller(i)}
              className="group flex flex-col gap-3 py-2 text-left"
              aria-label={`Afficher : ${s.rubrique}`}
              aria-current={i === photo}
            >
              <span className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/20">
                <span
                  key={photo}
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full bg-accent-clair transition-[width] duration-500',
                    i < photo ? 'w-full' : 'w-0',
                    i === photo && 'animate-[remplir_linear_forwards] motion-reduce:animate-none'
                  )}
                  // La fin du remplissage fait passer a la scene suivante : barre et image restent synchrones
                  onAnimationEnd={() => aller((photo + 1) % scenes.length)}
                  style={
                    i === photo
                      ? { animationDuration: `${DUREE}ms`, animationPlayState: pause ? 'paused' : 'running' }
                      : undefined
                  }
                />
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-500 md:text-xs',
                  i === photo ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                )}
              >
                <span className="hidden sm:inline">{String(i + 1).padStart(2, '0')} · </span>
                {s.rubrique}
              </span>
            </button>
          ))}
        </div>
      </div>

    </section>
  )
}

function TitreScene({ scene }: { scene: Scene }) {
  return (
    <>
      <span className="ligne-masque">
        <span className="font-light">{scene.fin}</span>
      </span>
      <span className="ligne-masque">
        <span className="font-extrabold">{scene.fort}</span>
      </span>
    </>
  )
}
