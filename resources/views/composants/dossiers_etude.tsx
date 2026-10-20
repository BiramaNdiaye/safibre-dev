import { useEffect, useState } from 'react'
import { cn } from '~/scripts/utils/css'
import type { Service } from '~/views/composants/bloc_service'

/**
 * Les services du bureau d etudes presentes comme un dossier technique : un sommaire
 * colle a gauche (ETU-01, 02, 03) qui suit la lecture, et a droite une « page » par
 * dossier (grande photo, titre, texte, points). Volontairement different du zigzag
 * texte / photo de la page operations terrain.
 */
export function DossiersEtude({ services }: { services: Service[] }) {
  const [actif, setActif] = useState(services[0]?.ancre ?? '')

  // Le dossier dont le haut a passe le milieu de l ecran devient le dossier lu
  useEffect(() => {
    const pages = services.map((s) => document.getElementById(s.ancre ?? '')).filter(Boolean) as HTMLElement[]
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActif(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    pages.forEach((p) => observateur.observe(p))
    return () => observateur.disconnect()
  }, [services])

  return (
    <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
      {/* Sommaire : colle sous le menu pendant la lecture, sur ordinateur seulement */}
      <nav aria-label="Sommaire des dossiers" className="hidden lg:block">
        <ol className="sticky top-32 flex flex-col overflow-hidden rounded-[22px] border border-encre/10 bg-white/80 backdrop-blur-sm">
          <li className="border-b border-encre/10 px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-encre/50">
            Sommaire
          </li>
          {services.map((s) => {
            const lu = actif === s.ancre
            return (
              <li key={s.numero}>
                <a
                  href={`#${s.ancre}`}
                  className={cn(
                    'flex flex-col gap-1 border-l-[3px] px-5 py-4 transition-colors duration-300',
                    lu ? 'border-vert bg-vert/[0.06]' : 'border-transparent hover:bg-encre/[0.03]'
                  )}
                >
                  <span className={cn('font-mono text-[11px] font-bold tracking-[0.16em]', lu ? 'text-vert' : 'text-encre/40')}>
                    ETU-{s.numero}
                  </span>
                  <span className={cn('text-sm font-bold uppercase leading-snug', lu ? 'text-encre' : 'text-encre/55')}>{s.titre}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="flex flex-col gap-20 md:gap-24">
        {services.map((s) => (
          <article key={s.numero} id={s.ancre} className="flex scroll-mt-28 flex-col gap-8">
            {s.photo && (
              <div className="relative">
                {/* Reperes de coupe, comme sur une feuille de plan */}
                <span aria-hidden className="pointer-events-none absolute -inset-3 text-vert">
                  <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-current" />
                  <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-current" />
                  <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-current" />
                  <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-current" />
                </span>
                <div data-apparition="image" className="relative aspect-[16/10] overflow-hidden rounded-[24px] md:aspect-[21/9]">
                  <img src={s.photo} alt={s.photoAlt ?? ''} loading="lazy" className="size-full object-cover" />
                  <span className="absolute left-4 top-4 rounded-md bg-vert px-2.5 py-1 font-mono text-xs font-bold tracking-[0.16em] text-white">
                    ETU-{s.numero}
                  </span>
                </div>
              </div>
            )}
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
              <div className="flex flex-col gap-4">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-encre/50">Dossier d'étude</span>
                <h3 data-apparition="titre" className="text-2xl font-extrabold uppercase leading-tight md:text-[2rem]">
                  <span className="ligne-masque">
                    <span>{s.titre}</span>
                  </span>
                </h3>
                <p data-apparition="monte" className="text-[15px] leading-relaxed text-encre/70 md:text-base">
                  {s.texte}
                </p>
              </div>
              <ul data-apparition="cascade" className="flex flex-col self-start md:pt-9">
                {s.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 border-t border-encre/10 py-3 text-sm font-semibold last:border-b">
                    {/* Puce de legende, comme sur un plan */}
                    <span className="mt-[5px] size-2.5 shrink-0 border-2 border-vert" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
