import { cn } from '~/scripts/utils/css'
import { IconeCoche } from '~/views/composants/icones'
import { Plus } from '~/views/composants/titre'

export type Service = {
  ancre?: string
  numero: string
  titre: string
  texte: string
  points: string[]
  photo?: string
  photoAlt?: string
}

/**
 * Un service : texte d un cote, photo de l autre, en alternance d un bloc a l autre.
 * Variante « terrain » (page operations terrain) : presentee comme une fiche
 * d intervention, code INT-xx en chasse fixe, liste cochee, balisage de chantier.
 * Variante « etudes » (page bureau d etudes) : presentee comme un dossier d etude,
 * code ETU-xx, puces de legende de plan, reperes de coupe autour de la photo.
 */
export function BlocService({ service, inverse, variante }: { service: Service; inverse?: boolean; variante?: 'terrain' | 'etudes' }) {
  const terrain = variante === 'terrain'
  const etudes = variante === 'etudes'
  const code = terrain ? 'INT' : 'ETU'
  return (
    <article
      id={service.ancre}
      className="grid scroll-mt-28 items-center gap-10 md:grid-cols-2 md:gap-16"
    >
      <div className={cn('flex flex-col gap-6', inverse && 'md:order-2')}>
        {terrain || etudes ? (
          <span data-apparition="monte" className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em]">
            <span className={cn('rounded-md px-2.5 py-1 text-white', terrain ? 'bg-orange' : 'bg-vert')}>
              {code}-{service.numero}
            </span>
            <span className="text-encre/50">{terrain ? "Fiche d'intervention" : "Dossier d'étude"}</span>
          </span>
        ) : (
          <span data-apparition="monte" className="text-7xl font-extrabold leading-none text-encre/[0.08] md:text-8xl">
            {service.numero}
          </span>
        )}
        <h3
          data-apparition="titre"
          className={cn('text-2xl font-extrabold uppercase leading-tight md:text-[2rem]', !terrain && !etudes && '-mt-10 md:-mt-14')}
        >
          <span className="ligne-masque">
            <span>{service.titre}</span>
          </span>
        </h3>
        <p data-apparition="monte" className="max-w-lg text-[15px] leading-relaxed text-encre/70 md:text-base">
          {service.texte}
        </p>
        <ul data-apparition="cascade" className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {service.points.map((point) => (
            <li key={point} className="flex items-start gap-3 border-t border-encre/10 pt-3 text-sm font-semibold">
              {terrain ? (
                // Case cochee, comme sur un bon d intervention
                <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] bg-orange text-white">
                  <IconeCoche size={13} strokeWidth={3} />
                </span>
              ) : etudes ? (
                // Puce de legende, comme sur un plan
                <span className="mt-[5px] size-2.5 shrink-0 border-2 border-vert" />
              ) : (
                <Plus className="mt-1" />
              )}
              {point}
            </li>
          ))}
        </ul>
      </div>

      {service.photo && (
        <div className={cn('relative', inverse && 'md:order-1')}>
          {/* Bloc decoratif : orange plein (defaut), bandes de balisage (terrain), reperes de coupe (etudes) */}
          {etudes ? (
            <span aria-hidden className="pointer-events-none absolute -inset-3 text-vert">
              <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-current" />
              <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-current" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-current" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-current" />
            </span>
          ) : (
            <span
              aria-hidden
              className={cn('absolute -bottom-5 size-28', terrain ? 'balisage rounded-md' : 'bg-orange/90', inverse ? '-right-5' : '-left-5')}
            />
          )}
          <div data-apparition="image" className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <img src={service.photo} alt={service.photoAlt ?? ''} loading="lazy" className="size-full object-cover" />
            {(terrain || etudes) && (
              <span className="absolute bottom-4 left-4 rounded-md bg-encre/85 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                {terrain ? 'Sur le terrain' : "Bureau d'études"} · {code}-{service.numero}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
