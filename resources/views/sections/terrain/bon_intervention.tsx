import { IconeCoche, IconeFleche, IconeTelephone } from '~/views/composants/icones'
import { Titre } from '~/views/composants/titre'

const missions = [
  'Effectuer les raccordements FttH et FttO',
  'Entretenir et remettre en état le réseau, fibre et coaxial',
  'Réaliser les mesures réflectométriques',
  "Intervenir sur les petits ouvrages de construction ou d'extension",
  'Diagnostiquer une panne en mesurant et analysant les liaisons optiques',
  'Vérifier la conformité des installations des nouveaux réseaux',
  'Assurer une remise en service rapide, selon les procédures',
  'Clôturer chaque intervention par un rapport détaillé',
]

/**
 * Les missions presentees comme un bon d intervention : chaque ligne est une case
 * cochee, et le bon se termine par le rapport remis (la derniere mission).
 */
export function BonIntervention() {
  return (
    <section className="relative overflow-hidden bg-encre py-24 text-white md:py-32">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="conteneur relative grid gap-14 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-6">
          <Titre surtitre="Nos missions" fin="Ce que font" fort="nos techniciens" sombre />
          <p data-apparition="monte" className="max-w-sm text-[15px] leading-relaxed text-white/60">
            De l'appel au rapport, chaque intervention suit la même fiche.
          </p>
        </div>
        <div data-apparition="monte" className="overflow-hidden rounded-[22px] border border-white/15 bg-encre-2">
          <div className="balisage h-2" />
          <div className="flex items-center justify-between gap-4 whitespace-nowrap border-b border-white/10 px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 sm:px-6 sm:text-[11px] sm:tracking-[0.18em]">
            <span>Bon d'intervention</span>
            <span className="text-orange">SAFIBRE · Terrain</span>
          </div>
          <ol data-apparition="cascade" className="flex flex-col px-6">
            {missions.map((mission, i) => (
              <li key={mission} className="flex items-center gap-4 border-b border-white/10 py-4 last:border-b-0">
                <span className="w-7 shrink-0 font-mono text-xs font-bold text-white/40">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 text-[15px] font-medium text-white/85 md:text-base">{mission}</span>
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-orange text-white">
                  <IconeCoche size={15} strokeWidth={3} />
                </span>
              </li>
            ))}
          </ol>
          <div className="flex items-center justify-end border-t border-white/10 px-6 py-5">
            {/* Le tampon : la derniere mission, le rapport, cloture le bon */}
            <span className="-rotate-3 rounded-md border-2 border-orange px-3 py-1.5 font-mono text-xs font-extrabold uppercase tracking-[0.2em] text-orange">
              Rapport remis
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
