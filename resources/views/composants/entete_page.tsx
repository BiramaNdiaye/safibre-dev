import { Link } from '@inertiajs/react'
import { ReactNode } from 'react'
import { Plus } from '~/views/composants/titre'

type EnTetePageProps = {
  fil: string
  fin: string
  fort: string
  texte: ReactNode
  photo: string
  photoAlt?: string
  position?: string
  actions?: ReactNode
}

/** En-tete des pages interieures : la photo du metier en pleine largeur, le titre pose dessus. */
export function EnTetePage({ fil, fin, fort, texte, photo, photoAlt = '', position, actions }: EnTetePageProps) {
  return (
    <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-encre text-white">
      <img
        src={photo}
        alt={photoAlt}
        className="absolute inset-0 -z-10 size-full animate-[poser_2.4s_cubic-bezier(.16,1,.3,1)_both] object-cover"
        style={{ objectPosition: position ?? 'center' }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-encre via-encre/50 to-encre/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-encre/60 to-transparent" />

      <div className="conteneur flex flex-col gap-6 pb-14 pt-36 md:pb-20 lg:pt-48">
        <nav data-apparition="monte" aria-label="Fil d'Ariane" className="surtitre text-white/70">
          <Link href="/" className="transition-colors hover:text-white">
            Accueil
          </Link>
          <Plus className="size-2.5" />
          <span className="text-white">{fil}</span>
        </nav>
        <h1
          data-apparition="titre"
          className="max-w-4xl text-[clamp(2.1rem,min(5.6vw,9vh),4.6rem)] uppercase leading-[0.96] tracking-[-0.02em]"
        >
          <span className="ligne-masque">
            <span className="font-light">{fin}</span>
          </span>
          <span className="ligne-masque">
            <span className="font-extrabold">{fort}</span>
          </span>
        </h1>
        <div data-apparition="monte" data-delai="0.2" className="max-w-xl text-[15px] leading-relaxed text-white/80 md:text-base">
          {texte}
        </div>
        {actions && (
          <div data-apparition="monte" data-delai="0.35" className="flex flex-col gap-3 sm:flex-row">
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}
