import photoChantier from '~/assets/photos/terrain-equipe.webp'
import { chiffres, expertises, methode } from '~/scripts/contenu'
import { Plus, Titre } from '~/views/composants/titre'

export function Chiffres() {
  return (
    <section className="relative overflow-hidden bg-encre pb-20 pt-24 text-white md:pb-28 md:pt-32">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="conteneur relative flex flex-col gap-16 md:gap-20">
        <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-6">
            <Titre surtitre="En chiffres" fin="Sur le terrain," fort="chaque jour" sombre />
            <p data-apparition="monte" className="max-w-md text-[15px] leading-relaxed text-white/65">
              Depuis 2020, nos équipes raccordent, mesurent et documentent les réseaux fibre
              au Sénégal.
            </p>
          </div>
          <ul data-apparition="cascade" className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-white/10">
            {chiffres.map((c) => (
              <li key={c.libelle} className="flex flex-col gap-2 bg-encre p-6 md:p-8">
                <span className="flex items-baseline text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-none tracking-tight">
                  {c.prefixe && <span className="mr-1 text-orange">{c.prefixe}</span>}
                  <span data-apparition="compteur" data-valeur={c.valeur} data-annee={c.annee ? '' : undefined}>
                    {c.valeur}
                  </span>
                  {c.suffixe && <span className="text-orange">{c.suffixe}</span>}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  {c.libelle}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* La photo arrive legerement inclinee et se pose a plat, en suivant le defilement */}
        <div className="[perspective:1400px]">
          <div data-apparition="elargir" className="relative h-[52svh] min-h-[340px] overflow-hidden rounded-[28px]">
            <img
              src={photoChantier}
              alt="Deux techniciens SAFIBRE en tenue sur un chantier"
              loading="lazy"
              className="absolute inset-0 size-full object-cover object-[center_28%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-encre/70 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-6 flex items-center gap-2 text-sm text-white/85 md:bottom-7 md:left-8">
              <Plus className="size-2.5" />
              Équipe terrain, avant une intervention
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
