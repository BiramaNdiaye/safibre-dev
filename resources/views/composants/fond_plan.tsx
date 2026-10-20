import { PointerEvent, PropsWithChildren, useRef } from 'react'
import { cn } from '~/scripts/utils/css'

/**
 * Section sur papier millimetre (page bureau d etudes). Sous la souris, le
 * quadrillage s eclaire en vert autour du curseur, comme une lampe sur un plan.
 * Seulement avec une souris : sur ecran tactile il n y a rien a suivre.
 */
export function FondPlan({ className, children }: PropsWithChildren<{ className?: string }>) {
  const section = useRef<HTMLElement>(null)

  // On ecrit directement les variables CSS : pas de rendu React a chaque mouvement
  const suivre = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !section.current) return
    const r = section.current.getBoundingClientRect()
    section.current.style.setProperty('--x', `${e.clientX - r.left}px`)
    section.current.style.setProperty('--y', `${e.clientY - r.top}px`)
  }

  return (
    <section ref={section} onPointerMove={suivre} className={cn('papier-plan group/plan relative', className)}>
      <div
        aria-hidden
        className="papier-plan-vif pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover/plan:opacity-100"
      />
      <div className="relative">{children}</div>
    </section>
  )
}
