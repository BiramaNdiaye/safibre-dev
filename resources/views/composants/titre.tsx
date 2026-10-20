import { cn } from '~/scripts/utils/css'

type PlusProps = { className?: string }

/** Le « + » de la marque : il ponctue les titres et les listes, comme chez Stelogy. */
export function Plus({ className }: PlusProps) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={cn('size-3 shrink-0 text-orange', className)}>
      <path d="M4.5 0h3v4.5H12v3H7.5V12h-3V7.5H0v-3h4.5z" fill="currentColor" />
    </svg>
  )
}

type TitreProps = {
  surtitre?: string
  fin: string
  fort: string
  centre?: boolean
  sombre?: boolean
  niveau?: 'h1' | 'h2'
  className?: string
}

/**
 * Titre en deux temps : une ligne fine qui pose le sujet, une ligne grasse
 * qui donne la reponse (« Vos réseaux, / nos solutions »). Souligne d un
 * trait orange termine par un plus.
 */
export function Titre({ surtitre, fin, fort, centre, sombre, niveau = 'h2', className }: TitreProps) {
  const Balise = niveau
  return (
    <div className={cn('flex flex-col gap-5', centre && 'items-center text-center', className)}>
      {surtitre && (
        <span
          data-apparition="monte"
          className={cn('surtitre', sombre ? 'text-accent-clair' : 'text-accent')}
        >
          <Plus className="size-2.5" />
          {surtitre}
        </span>
      )}
      <Balise
        data-apparition="titre"
        className={cn(
          'text-[clamp(1.9rem,5.2vw,3.6rem)] uppercase leading-[1.02] tracking-[-0.01em]',
          sombre ? 'text-white' : 'text-encre'
        )}
      >
        <span className="ligne-masque">
          <span className="font-light">{fin}</span>
        </span>
        <span className="ligne-masque">
          <span className="font-extrabold">{fort}</span>
        </span>
      </Balise>
      <span className={cn('flex items-center', centre && 'justify-center')} aria-hidden>
        <span data-apparition="trait" className="block h-[3px] w-28 bg-accent" />
        <Plus className="-ml-0.5 size-3.5" />
      </span>
    </div>
  )
}
