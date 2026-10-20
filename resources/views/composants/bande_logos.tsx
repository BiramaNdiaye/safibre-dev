import { partenaires } from '~/scripts/contenu'

/** Bande des clients et partenaires : defile sans fin, s arrete au survol pour qu on puisse lire. */
export function BandeLogos() {
  const serie = [...partenaires, ...partenaires]
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <ul className="flex w-max animate-[defiler_40s_linear_infinite] gap-4 pr-4 sm:pr-6 group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-6">
        {serie.map((p, i) => (
          <li
            key={`${p.nom}-${i}`}
            aria-hidden={i >= partenaires.length}
            className="flex h-24 w-44 shrink-0 items-center justify-center rounded-2xl border border-encre/10 bg-white px-6 sm:h-28 sm:w-52"
          >
            <img
              src={p.logo}
              alt={i < partenaires.length ? p.nom : ''}
              loading="lazy"
              className="max-h-12 max-w-full object-contain grayscale transition duration-500 hover:grayscale-0 sm:max-h-14"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
