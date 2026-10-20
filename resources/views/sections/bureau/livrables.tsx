import { IconeDocument, IconeFleche } from '~/views/composants/icones'
import { Plus, Titre } from '~/views/composants/titre'

// Les pieces remises au client, tirees des services ci-dessus (rien d invente)
const livrables = [
  { titre: "Études de faisabilité", dossier: '01' },
  { titre: "Plans d'implantation", dossier: '01' },
  { titre: 'Cahiers des charges techniques', dossier: '01' },
  { titre: 'Routes optiques', dossier: '02' },
  { titre: 'Dossiers BLO', dossier: '02' },
  { titre: 'Dossiers des ouvrages exécutés (DOE)', dossier: '02' },
  { titre: 'Données SIG mises à jour', dossier: '02' },
  { titre: 'Rapports et indicateurs', dossier: '03' },
]

/** Ce que le client recoit, en bordereau. RETIRE le 20/10 (contenu juge faux par le proprietaire) : plus affiche. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Livrables() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="conteneur flex flex-col gap-14">
        <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <Titre surtitre="Ce que nous livrons" fin="Des documents" fort="qui font foi" />
          <p data-apparition="monte" className="max-w-md text-[15px] leading-relaxed text-encre/65 md:justify-self-end">
            Un réseau se pose une fois, il s'exploite pendant des années. Ce sont ces pièces qui
            permettent de le comprendre, de le réparer et de le faire évoluer.
          </p>
        </div>
        <div data-apparition="monte" className="overflow-hidden rounded-[22px] border border-encre/10">
          <div className="flex items-center justify-between gap-4 whitespace-nowrap border-b border-encre/10 bg-vert px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white sm:px-6 sm:text-[11px] sm:tracking-[0.18em]">
            <span>Bordereau de livraison</span>
            <span className="hidden text-white/75 sm:inline">SAFIBRE · Bureau d'études</span>
            <span className="text-white/75 sm:hidden">SAFIBRE</span>
          </div>
          <ol data-apparition="cascade" className="grid sm:grid-cols-2">
            {livrables.map((l, i) => (
              <li
                key={l.titre}
                className={`flex items-center gap-4 border-b border-encre/10 px-5 py-4 sm:px-6 ${i % 2 === 0 ? 'sm:border-r' : ''}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-vert/10 text-vert">
                  <IconeDocument size={20} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-encre/45">
                    Pièce {String(i + 1).padStart(2, '0')} · ETU-{l.dossier}
                  </span>
                  <span className="text-[15px] font-semibold">{l.titre}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
