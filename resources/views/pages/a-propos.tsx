import { Link } from '@inertiajs/react'
import photoEnTete from '~/assets/photos/equipe-bureau.webp'
import photoGroupe from '~/assets/photos/equipe-groupe.webp'
import photoTerrain from '~/assets/photos/terrain-equipe.webp'
import photoBureau from '~/assets/photos/etude-2.webp'
import { chiffres } from '~/scripts/contenu'
import { BandeLogos } from '~/views/composants/bande_logos'
import { EnTetePage } from '~/views/composants/entete_page'
import logoEtudes from '~/assets/logo-etudes.webp'
import logoTerrain from '~/assets/logo-terrain.webp'
import { IconeBouclier, IconeDocument, IconeFleche, IconeHorloge } from '~/views/composants/icones'
import { Plus, Titre } from '~/views/composants/titre'
import { Vitrine } from '~/views/layouts/vitrine'

const clients = [
  { titre: 'Opérateurs télécoms', texte: 'Études, dossiers, déploiement et maintenance de leurs réseaux fibre.' },
  { titre: 'Entreprises privées', texte: 'Raccordement FTTO et liaisons fiables pour leurs sites.' },
  { titre: 'Collectivités territoriales', texte: 'Accompagnement des projets d’aménagement numérique.' },
  { titre: 'Administrations publiques', texte: 'Infrastructures documentées, conformes et maintenues.' },
]

const engagements = [
  {
    icone: IconeHorloge,
    titre: 'Disponibilité',
    texte: 'Un suivi continu des incidents pour garantir la disponibilité de vos services.',
  },
  {
    icone: IconeBouclier,
    titre: 'Sécurité',
    texte: 'Des équipes équipées et formées, des protocoles stricts sur chaque chantier.',
  },
  {
    icone: IconeDocument,
    titre: 'Transparence',
    texte: 'Un rapport après chaque intervention et des retours réguliers sur l’avancement.',
  },
]

export default function APropos() {
  return (
    <Vitrine
      titre="L'entreprise"
      description="SAFIBRE, Société Africaine de la Fibre, créée en 2020 : bureau d'études et opérations terrain pour les réseaux fibre optique."
    >
      <EnTetePage
        fil="L'entreprise"
        fin="Société Africaine"
        fort="de la Fibre"
        texte={
          <p>
            <strong className="text-white">S</strong>ociété <strong className="text-white">A</strong>fricaine
            de la <strong className="text-white">Fibre</strong>, SAFIBRE est née en 2020.
            Notre spécialité : la fiabilité des informations SIG indispensables à l'exploitation des
            réseaux fibre, et les équipes terrain qui les construisent et les entretiennent.
          </p>
        }
        photo={photoEnTete}
        photoAlt="Membre de l'équipe SAFIBRE dans les bureaux"
        position="center 12%"
      />

      <section className="pb-16 pt-24 md:pt-32">
        <div className="conteneur flex flex-col gap-14">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Titre surtitre="Pour qui" fin="Ceux qui font" fort="le réseau" />
            <p data-apparition="monte" className="max-w-sm text-[15px] leading-relaxed text-encre/60">
              Nos métiers s'adressent à tous ceux qui construisent, exploitent ou financent un réseau
              fibre.
            </p>
          </div>
          <ul data-apparition="cascade" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clients.map((c, i) => (
              <li
                key={c.titre}
                className="group flex flex-col gap-10 rounded-[24px] border border-encre/10 bg-white p-7 transition-colors duration-500 hover:border-accent/60"
              >
                <span className="text-sm font-extrabold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex flex-col gap-3">
                  <span className="text-lg font-extrabold uppercase leading-tight">{c.titre}</span>
                  <span className="text-[15px] leading-relaxed text-encre/65">{c.texte}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-24 pt-8 md:pb-32">
        <div className="conteneur flex flex-col gap-8">
          <figure className="flex flex-col gap-4">
            <div data-apparition="image" className="relative aspect-[4/3] overflow-hidden rounded-[28px] md:aspect-[21/9]">
              <img
                src={photoGroupe}
                alt="L'équipe SAFIBRE au complet"
                loading="lazy"
                className="size-full object-cover object-[center_22%]"
              />
            </div>
            <figcaption className="flex items-center gap-2 text-sm text-encre/60">
              <Plus className="size-2.5" />
              L'équipe SAFIBRE.
            </figcaption>
          </figure>

          {/* Les chiffres sous la photo, sur fond sombre : lisibles, sans masquer personne */}
          <ul data-apparition="cascade" className="grid grid-cols-2 overflow-hidden rounded-[28px] bg-encre text-white lg:grid-cols-4">
            {chiffres.map((c, i) => (
              <li
                key={c.libelle}
                className={`flex flex-col gap-2 p-7 md:p-9 ${i % 2 === 1 ? 'border-l border-white/10' : ''} ${i >= 2 ? 'border-t border-white/10 lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
              >
                <span className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none tracking-tight">
                  {c.prefixe && <span className="text-orange">{c.prefixe}</span>}
                  <span data-apparition="compteur" data-valeur={c.valeur} data-annee={c.annee ? '' : undefined}>
                    {c.valeur}
                  </span>
                  {c.suffixe && <span className="text-orange">{c.suffixe}</span>}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">{c.libelle}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>


      <section className="py-24 md:py-32">
        <div className="conteneur flex flex-col gap-16">
          <Titre surtitre="Nos engagements" fin="Ce que vous" fort="pouvez attendre" centre />
          <ul data-apparition="cascade" className="grid gap-5 md:grid-cols-3">
            {engagements.map((e, i) => (
              <li key={e.titre} className="group flex flex-col gap-4 rounded-[28px] border border-encre/10 bg-white p-8 transition-colors duration-500 hover:border-accent/60">
                {/* <span className="text-sm font-extrabold text-accent">0{i + 1}</span>  (avant : numero seul) */}
                <span className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent transition-colors duration-500 group-hover:bg-accent group-hover:text-white">
                    <e.icone size={24} />
                  </span>
                  <span className="text-sm font-extrabold text-encre/25">0{i + 1}</span>
                </span>
                <span className="text-xl font-extrabold uppercase">{e.titre}</span>
                <p className="text-[15px] leading-relaxed text-encre/70">{e.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32">
        <div className="conteneur grid gap-5 md:grid-cols-2">
          {[
            { photo: photoBureau, titre: "Bureau d'études", lien: '/bureau_etude', logo: logoEtudes, teinte: 'from-vert/95' },
            { photo: photoTerrain, titre: 'Opérations terrain', lien: '/operations-telecoms', logo: logoTerrain, teinte: 'from-orange/95' },
          ].map((p) => (
            <Link
              key={p.lien}
              href={p.lien}
              data-apparition="monte"
              className="group relative isolate flex aspect-[16/10] items-end overflow-hidden rounded-[28px] p-7 text-white md:p-9"
            >
              <img src={p.photo} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[1400ms] ease-sortie group-hover:scale-105" />
              {/* <div className="absolute inset-0 -z-10 bg-gradient-to-t from-encre/90 to-transparent" />  (avant : degrade noir, sans logo) */}
              <div className={`absolute inset-0 -z-10 bg-gradient-to-t ${p.teinte} via-encre/30 to-transparent`} />
              {/* Le logo du pole, sur une pastille blanche pour rester lisible sur la photo */}
              <span className="absolute left-7 top-7 rounded-2xl bg-white/95 px-4 py-3 shadow-lg md:left-9 md:top-9">
                <img src={p.logo} alt={`Logo SAFIBRE ${p.titre}`} className="h-8 w-auto md:h-9" loading="lazy" />
              </span>
              <span className="flex w-full items-center justify-between text-2xl font-extrabold uppercase md:text-3xl">
                {p.titre}
                <IconeFleche size={26} className="transition-transform duration-500 group-hover:translate-x-2" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-24 md:py-28">
        <div className="conteneur">
          <Titre surtitre="Références" fin="Ils nous font" fort="confiance" centre />
        </div>
        <div className="mt-12" data-apparition="monte">
          <BandeLogos />
        </div>
      </section>
    </Vitrine>
  )
}
