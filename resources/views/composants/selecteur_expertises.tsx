import { Link } from '@inertiajs/react'
import { useState } from 'react'
import { Expertise } from '~/scripts/contenu'
import { cn } from '~/scripts/utils/css'
import { IconeFleche } from '~/views/composants/icones'
import { Plus } from '~/views/composants/titre'

/**
 * Les expertises : une liste numerotee a gauche, le detail de celle choisie a
 * droite. Rien ne change tout seul : le visiteur choisit, et voit sans
 * hesiter quelle ligne est ouverte (fond, barre, fleche).
 */
export function SelecteurExpertises({ expertises }: { expertises: Expertise[] }) {
  const [actif, setActif] = useState(0)
  const courante = expertises[actif]

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      {/* Liste des expertises */}
      <ul data-apparition="cascade" className="flex flex-col gap-2" aria-label="Choisir une expertise">
        {expertises.map((e, i) => {
          const ouvert = i === actif
          return (
            <li key={e.code}>
              <button
                type="button"
                onClick={() => setActif(i)}
                aria-pressed={ouvert}
                aria-controls="detail-expertise"
                className={cn(
                  'group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-all duration-500 ease-sortie md:gap-5 md:px-6 md:py-5',
                  ouvert
                    ? 'border-accent/30 bg-white shadow-[0_18px_40px_-28px_rgba(3,3,3,0.45)]'
                    : 'border-transparent hover:border-encre/10 hover:bg-white/60'
                )}
              >
                {/* Barre de l expertise ouverte */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-3 left-0 w-1 rounded-full bg-accent transition-transform duration-500 ease-sortie',
                    ouvert ? 'scale-y-100' : 'scale-y-0'
                  )}
                />
                <span
                  className={cn(
                    'w-7 shrink-0 text-sm font-extrabold tabular-nums transition-colors',
                    ouvert ? 'text-accent' : 'text-encre/35 group-hover:text-encre/60'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    className={cn(
                      'text-[13px] font-extrabold uppercase leading-tight tracking-wider transition-colors sm:text-sm',
                      ouvert ? 'text-encre' : 'text-encre/70 group-hover:text-encre'
                    )}
                  >
                    {e.titre}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-encre/40">
                    {e.pole === 'etudes' ? "Bureau d'études" : 'Opérations terrain'}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full transition-all duration-500 ease-sortie',
                    ouvert
                      ? 'bg-accent text-white'
                      : 'bg-encre/5 text-encre/50 group-hover:bg-encre/10 group-hover:text-encre'
                  )}
                >
                  <IconeFleche size={16} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Detail de l expertise choisie */}
      <div
        id="detail-expertise"
        data-apparition="monte"
        aria-live="polite"
        className="overflow-hidden rounded-[28px] border border-encre/10 bg-white lg:sticky lg:top-28"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-encre-2">
          {expertises.map((e, i) => (
            <img
              key={e.code}
              src={e.photo}
              alt=""
              loading="lazy"
              className={cn(
                'absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[900ms] ease-sortie',
                i === actif ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
              )}
            />
          ))}
          <span className="absolute left-5 top-5 rounded-full bg-encre/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            {String(actif + 1).padStart(2, '0')} / {String(expertises.length).padStart(2, '0')}
          </span>
        </div>

        <div key={courante.code} className="flex animate-[apparaitre_.6s_cubic-bezier(.16,1,.3,1)] flex-col gap-5 p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <span className="surtitre text-accent">
              <Plus className="size-2.5" />
              {courante.pole === 'etudes' ? "Bureau d'études" : 'Opérations terrain'}
            </span>
            <h3 className="text-2xl font-extrabold uppercase leading-tight md:text-[1.75rem]">{courante.titre}</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-encre/70">{courante.resume}</p>
          <ul className="flex flex-wrap gap-2">
            {courante.points.map((point) => (
              <li key={point} className="rounded-full bg-papier px-3.5 py-1.5 text-xs font-semibold text-encre/75">
                {point}
              </li>
            ))}
          </ul>
          <Link href={courante.lien} className="bouton-plein self-start">
            En savoir plus
            <IconeFleche size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
