import { Link } from '@inertiajs/react'
import { chiffres, coordonnees } from '~/scripts/contenu'
import { IconeFleche } from '~/views/composants/icones'

/** Une panne : le numero en grand, a portee de pouce. */
export function BandeauPanne() {
  const suivi = chiffres.find((c) => c.suffixe === '/7')
  return (
    <section className="relative overflow-hidden bg-orange text-white">
      <div className="conteneur grid items-center gap-8 py-14 md:grid-cols-[minmax(0,1fr)_auto] md:py-16">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            Une panne sur votre réseau ?
          </span>
          <a
            href={coordonnees.telephoneLien}
            className="text-[clamp(2rem,6vw,4rem)] font-extrabold leading-none tracking-tight transition-opacity hover:opacity-85"
          >
            {coordonnees.telephone}
          </a>
          {suivi && (
            <span className="text-sm font-semibold text-white/90">
              {suivi.libelle} : {suivi.valeur}
              {suivi.suffixe}
            </span>
          )}
        </div>
        {/* Action principale a droite (droitiers) */}
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link href="/contact" className="inline-flex h-12 items-center gap-2 rounded-full bg-encre px-6 text-[13px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-encre">
            Planifier une intervention
            <IconeFleche size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
