import { useEffect, useRef, useState } from 'react'
import { cn } from '~/scripts/utils/css'

const RAYON = 22
const PERIMETRE = 2 * Math.PI * RAYON

/**
 * Bouton pour remonter en haut de page. En bas a droite, sous le pouce (on
 * pense droitier) ; il n apparait qu apres un ecran de defilement, et son
 * anneau orange montre ou l on en est dans la page.
 */
export function RetourHaut() {
  const [visible, setVisible] = useState(false)
  const anneau = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let image = 0
    const mettreAJour = () => {
      cancelAnimationFrame(image)
      image = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const progression = max > 0 ? window.scrollY / max : 0
        setVisible(window.scrollY > window.innerHeight)
        if (anneau.current) {
          anneau.current.style.strokeDashoffset = String(PERIMETRE * (1 - progression))
        }
      })
    }
    mettreAJour()
    window.addEventListener('scroll', mettreAJour, { passive: true })
    window.addEventListener('resize', mettreAJour)
    return () => {
      cancelAnimationFrame(image)
      window.removeEventListener('scroll', mettreAJour)
      window.removeEventListener('resize', mettreAJour)
    }
  }, [])

  const remonter = () => {
    const lenis = (window as unknown as { lenis?: { scrollTo(cible: number, options?: object): void } }).lenis
    if (lenis) lenis.scrollTo(0, { duration: 1.4 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={remonter}
      aria-label="Revenir en haut de la page"
      tabIndex={visible ? 0 : -1}
      className={cn(
        'group fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-encre text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-500 ease-sortie md:bottom-8 md:right-8',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      )}
    >
      <svg viewBox="0 0 56 56" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={RAYON} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2" />
        <circle
          ref={anneau}
          cx="28"
          cy="28"
          r={RAYON}
          fill="none"
          stroke="rgb(var(--orange))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={PERIMETRE}
          strokeDashoffset={PERIMETRE}
        />
      </svg>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="relative size-5 transition-transform duration-500 ease-sortie group-hover:-translate-y-1"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  )
}
