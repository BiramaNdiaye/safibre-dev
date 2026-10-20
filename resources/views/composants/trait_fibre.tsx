import { PropsWithChildren, useEffect, useId, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '~/scripts/animations'
import { cn } from '~/scripts/utils/css'

type Point = [number, number]

/**
 * Abscisse d un point de passage :
 *  - un nombre : pourcentage de la largeur du bloc ;
 *  - 'g' / 'd' : milieu de la marge gauche / droite de la page, la ou il n y a jamais de texte ;
 *  - 'bord' : le bord gauche de l ecran, d ou la fibre arrive.
 */
type Abscisse = number | 'g' | 'd' | 'bord'

/** [abscisse, ordonnee en % de la hauteur, ondulation facultative dans la marge (-1..1)] */
export type PointFibre = [Abscisse, number] | [Abscisse, number, number]

const LARGEUR_CONTENU = 1240

type TraitFibreProps = PropsWithChildren<{
  /** Points de passage, du haut vers le bas */
  points: PointFibre[]
  /** Indices des points de passage ou poser un connecteur (une etape, un jalon) */
  noeuds?: number[]
  /** Trace de remplacement sous 768 px, quand le trace principal passerait sur le texte */
  pointsMobile?: PointFibre[]
  noeudsMobile?: number[]
  className?: string
  epaisseur?: number
}>

// Les couleurs des points du logo SAFIBRE : le code couleur des fibres d un cable
const COULEURS_FIBRES = ['#2f6fe4', '#e46b22', '#22c55e', '#a16207', '#94a3b8', '#ffffff', '#ef4444', '#111827', '#facc15', '#a855f7', '#ec4899', '#22d3ee']

/**
 * La fibre qui traverse la page : un trait qui se dessine au rythme du
 * defilement (idee reprise de Lusion), avec une lumiere a sa tete et des
 * connecteurs qui s allument quand elle passe.
 */
export function TraitFibre({
  points: pointsBureau,
  noeuds: noeudsBureau = [],
  pointsMobile,
  noeudsMobile,
  className,
  epaisseur = 3,
  children,
}: TraitFibreProps) {
  const bloc = useRef<HTMLDivElement>(null)
  const chemin = useRef<SVGPathElement>(null)
  const tete = useRef<HTMLDivElement>(null)
  // Un filtre par fibre : plusieurs fibres sur la meme page partageaient le meme identifiant
  const idLueur = 'lueur-fibre-' + useId().replace(/:/g, '')
  const [taille, setTaille] = useState({ l: 0, h: 0, gauche: 0, ecran: 0 })

  useEffect(() => {
    const el = bloc.current
    if (!el) return
    const observateur = new ResizeObserver(([entree]) => {
      const { width, height } = entree.contentRect
      const gauche = el.getBoundingClientRect().left
      const ecran = document.documentElement.clientWidth
      setTaille((t) =>
        Math.abs(t.l - width) < 2 && Math.abs(t.h - height) < 2 && t.ecran === ecran
          ? t
          : { l: width, h: height, gauche, ecran }
      )
    })
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [])

  const mobile = taille.ecran > 0 && taille.ecran < 768 && !!pointsMobile
  const points = mobile ? pointsMobile! : pointsBureau
  const noeuds = mobile ? (noeudsMobile ?? []) : noeudsBureau

  // Marge libre de chaque cote du contenu (meme calcul que .conteneur)
  const debutContenu =
    Math.max(0, (taille.ecran - LARGEUR_CONTENU) / 2) + (taille.ecran >= 640 ? 32 : 20)
  const milieuMarge = debutContenu / 2
  const amplitude = debutContenu > 90 ? debutContenu * 0.22 : 0

  const enPixels = points.map(([x, y, onde = 0]) => {
    let px: number
    if (x === 'bord') px = -taille.gauche
    else if (x === 'g') px = milieuMarge - taille.gauche + onde * amplitude
    else if (x === 'd') px = taille.ecran - milieuMarge - taille.gauche + onde * amplitude
    else px = (x / 100) * taille.l
    return [px, (y / 100) * taille.h] as Point
  })
  // Entree par le bord : un coude net, comme un cable qui sort de sa gaine,
  // plutot qu une courbe qui partirait en boucle
  // Sur telephone la marge est trop etroite pour un coude : la fibre descend tout droit
  const entreeParLeBord =
    points[0]?.[0] === 'bord' && enPixels.length > 2 && enPixels[1][0] - enPixels[0][0] > 40
  const tracePoints = points[0]?.[0] === 'bord' && !entreeParLeBord ? enPixels.slice(1) : enPixels
  let d: string
  if (entreeParLeBord) {
    const [bx, by] = enPixels[0]
    const [gx] = enPixels[1]
    const rayon = Math.min(60, (gx - bx) * 0.6)
    const suite = [[gx, by + rayon] as Point, ...enPixels.slice(2)]
    d =
      `M ${bx} ${by} L ${gx - rayon} ${by} Q ${gx} ${by} ${gx} ${by + rayon}` +
      courbeDouce(suite).replace(/^M [^C]+/, ' ')
  } else {
    d = courbeDouce(tracePoints)
  }

  // Zone de la lueur : la bande ou passe la fibre, elargie de 40 px de chaque cote.
  // Jamais nulle (trait vertical sur telephone) et jamais toute la page (flou couteux a recalculer au defilement)
  const xs = enPixels.map(([x]) => x)
  const zoneX = (xs.length ? Math.min(...xs) : 0) - 40
  const zoneL = (xs.length ? Math.max(...xs) - Math.min(...xs) : 0) + 80

  useGSAP(
    () => {
      const trait = chemin.current
      if (!trait || !taille.l) return
      const longueur = trait.getTotalLength()
      const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (calme) {
        gsap.set(trait, { strokeDasharray: 'none' })
        return
      }

      gsap.set(trait, { strokeDasharray: longueur, strokeDashoffset: longueur })

      ScrollTrigger.create({
        trigger: bloc.current,
        start: 'top 70%',
        end: 'bottom 60%',
        scrub: 0.8,
        onUpdate: ({ progress }) => {
          trait.style.strokeDashoffset = String(longueur * (1 - progress))
          const p = trait.getPointAtLength(longueur * progress)
          if (tete.current) {
            tete.current.style.transform = `translate(${p.x}px, ${p.y}px)`
            tete.current.style.opacity = progress > 0.002 && progress < 0.998 ? '1' : '0'
          }
          // Relus a chaque fois : les connecteurs se placent apres le premier rendu
          bloc.current?.querySelectorAll<HTMLElement>('[data-noeud]').forEach((c) => {
            const allume = progress >= Number(c.dataset.noeud)
            if (allume !== (c.dataset.allume === '1')) {
              c.dataset.allume = allume ? '1' : '0'
              gsap.to(c, { scale: allume ? 1 : 0, opacity: allume ? 1 : 0, duration: 0.5, ease: 'back.out(3)' })
            }
          })
        },
      })
    },
    { scope: bloc, dependencies: [taille.l, taille.h], revertOnUpdate: true }
  )

  return (
    <div ref={bloc} className={cn('relative', className)}>
      <svg
        aria-hidden
        // max-md:hidden : la fibre est masquee sur telephone (demande du 20/10), elle reste sur ordinateur
        className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible max-md:hidden"
        width={taille.l}
        height={taille.h}
        viewBox={`0 0 ${taille.l || 1} ${taille.h || 1}`}
      >
        <defs>
          {/* Avant : <filter id="lueur-fibre" x="-20%" y="-20%" width="140%" height="140%">
              Zone calculee sur la boite du trait : sur telephone le trait est parfaitement vertical,
              boite de largeur nulle, donc filtre de largeur nulle et trait orange invisible.
              On prend maintenant la bande ou passe la fibre (zoneX, zoneL). */}
          <filter
            id={idLueur}
            filterUnits="userSpaceOnUse"
            // Avant (19/10, premier correctif) : x={-60} width={taille.l + 120}, toute la largeur du bloc :
            // le flou se recalculait sur toute la page au defilement et alourdissait l ordinateur
            x={zoneX}
            y={-40}
            width={zoneL}
            height={(taille.h || 1) + 80}
          >
            <feGaussianBlur stdDeviation="4" result="flou" />
            <feMerge>
              <feMergeNode in="flou" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Gaine : le parcours entier, a peine visible, pour qu on devine ou va la fibre */}
        <path d={d} fill="none" stroke="currentColor" strokeOpacity={0.07} strokeWidth={epaisseur} strokeLinecap="round" />
        <path
          ref={chemin}
          d={d}
          fill="none"
          stroke="rgb(var(--orange))"
          strokeWidth={epaisseur}
          strokeLinecap="round"
          filter={`url(#${idLueur})`}
        />
      </svg>

      {taille.l > 0 &&
        noeuds.map((indice, i) => (
          <Connecteur
            key={indice}
            position={enPixels[indice]}
            d={d}
            couleur={COULEURS_FIBRES[(i * 5) % COULEURS_FIBRES.length]}
          />
        ))}

      <div
        ref={tete}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0 opacity-0 max-md:hidden"
        style={{ willChange: 'transform' }}
      >
        <span className="absolute -left-6 -top-6 size-12 rounded-full bg-orange/40 blur-xl" />
        <span className="absolute -left-[5px] -top-[5px] size-[10px] rounded-full bg-white shadow-[0_0_14px_4px_rgba(255,180,120,0.9)]" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}

function Connecteur({ position, d, couleur }: { position: Point; d: string; couleur: string }) {
  const [fraction, setFraction] = useState<number | null>(null)

  useEffect(() => {
    // On cherche a quel moment du parcours la tete passe sur ce point : c est la qu il s allume
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.setAttribute('d', d)
    const longueur = trace.getTotalLength()
    let meilleure = 0
    let ecart = Infinity
    for (let i = 0; i <= 400; i++) {
      const p = trace.getPointAtLength((longueur * i) / 400)
      const e = (p.x - position[0]) ** 2 + (p.y - position[1]) ** 2
      if (e < ecart) {
        ecart = e
        meilleure = i / 400
      }
    }
    setFraction(meilleure)
  }, [d, position[0], position[1]])

  if (fraction === null) return null
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <span
      data-noeud={fraction}
      aria-hidden
      className="pointer-events-none absolute z-0 -ml-[9px] -mt-[9px] size-[18px] rounded-full border-[3px] border-white shadow-[0_0_0_4px_rgba(228,107,34,0.25)] max-md:hidden"
      style={{
        left: position[0],
        top: position[1],
        backgroundColor: couleur,
        // Eteint tant que la lumiere n est pas passee
        opacity: calme ? 1 : 0,
        transform: calme ? undefined : 'scale(0)',
      }}
    />
  )
}

/** Catmull-Rom vers Bezier : une courbe souple qui passe par chaque point, comme un cable pose. */
function courbeDouce(points: Point[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}
