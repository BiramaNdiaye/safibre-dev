import { chiffres, expertises, methode } from '~/scripts/contenu'
import { Plus, Titre } from '~/views/composants/titre'

export function Ambition() {
  return (
    <section id="expertises" className="scroll-mt-20 pb-16 pt-24 md:pb-20 md:pt-32">
      <div className="conteneur flex flex-col items-center gap-8 text-center">
        <Titre surtitre="Notre métier" fin="Un seul interlocuteur," fort="de la conception à la mise en production" centre />
        {/* Avant : fort="du plan à la mise en service" */}
        <p data-apparition="monte" className="max-w-2xl text-[15px] leading-relaxed text-encre/70 md:text-base">
          Un réseau fibre se joue dans les détails : un tracé bien étudié, un dossier conforme, une
          soudure propre, une mesure vérifiée. Chez SAFIBRE, le bureau d'études et les équipes
          terrain travaillent ensemble, sur le même projet, avec les mêmes données. Moins
          d'allers-retours pour vous, un réseau qui dure.
        </p>
      </div>
    </section>
  )
}
