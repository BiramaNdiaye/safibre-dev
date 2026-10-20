import { Link } from '@inertiajs/react'
import { IconeDocument, IconeFleche } from '~/views/composants/icones'

/** Appel en fin de page, pendant vert du bandeau « Une panne ? » de la page terrain. */
export function BandeauEtude() {
  return (
    <section className="relative overflow-hidden bg-vert text-white">
      {/* Quadrillage blanc tres leger : le meme papier de plan, en negatif sur le vert */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="conteneur relative grid items-center gap-8 py-14 md:grid-cols-[minmax(0,1fr)_auto] md:py-16">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/80">Un projet à étudier ?</span>
          <p className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold uppercase leading-[1.02]">
            Parlons de votre réseau
          </p>
          <span className="text-sm font-semibold text-white/85">Faisabilité, conception, dossiers opérateurs.</span>
        </div>
        {/* Action principale a droite (droitiers) */}
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link href="/contact" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-bold uppercase tracking-wider text-vert transition-colors hover:bg-encre hover:text-white">
            Demander une étude
            <IconeFleche size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
