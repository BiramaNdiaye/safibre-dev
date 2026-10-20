import { chiffres, expertises, methode } from '~/scripts/contenu'
import { Plus, Titre } from '~/views/composants/titre'
import { TraitFibre } from '~/views/composants/trait_fibre'

export function Methode() {
  return (
    <section className="relative overflow-hidden bg-papier py-24 md:py-32">
      <div className="conteneur flex flex-col gap-16">
        <Titre surtitre="Notre approche" fin="Quatre étapes," fort="un même fil" />

        {/* La fibre passe par chaque etape : le connecteur s allume quand la lumiere l atteint */}
        <TraitFibre
          className="text-encre"
          points={[
            [4, 0],
            [4, 12.5],
            [50, 25],
            [96, 37.5],
            [50, 50],
            [4, 62.5],
            [50, 75],
            [96, 87.5],
            [96, 100],
          ]}
          noeuds={[1, 3, 5, 7]}
          pointsMobile={[['g', 0], ['g', 12.5], ['g', 37.5], ['g', 62.5], ['g', 87.5], ['g', 100]]}
          noeudsMobile={[1, 2, 3, 4]}
        >
          <ol className="flex flex-col">
            {methode.map((etape, i) => (
              <li
                key={etape.numero}
                className={`flex min-h-[220px] items-center md:min-h-[240px] pl-10 ${i % 2 === 0 ? 'justify-start md:pl-16' : 'justify-start md:justify-end md:pl-0 md:pr-16 md:text-right'}`}
              >
                <div data-apparition={i % 2 === 0 ? 'gauche' : 'monte'} className={`flex max-w-sm flex-col gap-3 rounded-3xl bg-papier/90 p-2 backdrop-blur-sm ${i % 2 === 1 ? 'md:items-end' : ''}`}>
                  <span className="text-6xl font-extrabold leading-none text-encre/10 md:text-7xl">{etape.numero}</span>
                  <h3 className="text-xl font-extrabold uppercase tracking-wide md:text-2xl">{etape.titre}</h3>
                  <p className="text-[15px] leading-relaxed text-encre/70">{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </TraitFibre>
      </div>
    </section>
  )
}
