import photoTerrain1 from '~/assets/photos/terrain-2.webp'
import photoSig from '~/assets/photos/etude-sig.webp'
import photoGroupe from '~/assets/photos/equipe-groupe.webp'
import { expertises } from '~/scripts/contenu'
import { BandeauPanne } from '~/views/composants/bandeau_panne'
import { BandeLogos } from '~/views/composants/bande_logos'
import { Dakar3D } from '~/views/composants/dakar_3d'
import { CarrouselEnTete } from '~/views/composants/carrousel_entete'
import { SelecteurExpertises } from '~/views/composants/selecteur_expertises'
import { Titre } from '~/views/composants/titre'
import { TraitFibre } from '~/views/composants/trait_fibre'
import { Vitrine } from '~/views/layouts/vitrine'
import { Ambition } from '~/views/sections/accueil/ambition'
import { Chiffres } from '~/views/sections/accueil/chiffres'
import { Poles } from '~/views/sections/accueil/poles'
export default function Accueil() {
  return (
    <Vitrine
      titre="Bureau d'études et opérations fibre optique au Sénégal"
      description="SAFIBRE conçoit, déploie et maintient les réseaux fibre optique FTTH et FTTO des opérateurs, entreprises et collectivités au Sénégal."
    >
      <EnTete />

      <TraitFibre
        className="text-encre"
        points={[
          ['bord', 1],
          ['g', 3],
          ['g', 22, 0.9],
          ['g', 45, -0.9],
          ['g', 70, 0.9],
          ['g', 97],
        ]}
        noeuds={[1, 4, 5]}
      >
        <Ambition />
        <section className="pb-24 pt-10 md:pb-32">
          <div className="conteneur flex flex-col gap-14">
            <Titre surtitre="Nos expertises" fin="Vos réseaux," fort="nos solutions" />
            <SelecteurExpertises expertises={expertises} />
          </div>
        </section>
      </TraitFibre>

      {/* Bandeau « Une panne ? » repris de la page operations terrain (demande du 20/10) :
          juste apres les expertises, quand le visiteur vient de voir ce que l on repare */}
      <BandeauPanne />
      <Chiffres />
      <Dakar3D />
      {/* Section « Notre approche » masquee le 19/10 a la demande du proprietaire ;
          la fonction Methode reste plus bas, il suffit de decommenter. */}
      {/* <Methode /> */}
      <Poles />
      {/* <BandeauPanne />  (d abord place ici, apres les poles : remonte le 20/10, juste apres les expertises) */}

      <section className="py-24 md:py-28">
        <div className="conteneur flex flex-col gap-12">
          <Titre surtitre="Références" fin="Ils nous font" fort="confiance" centre />
        </div>
        <div className="mt-12" data-apparition="monte">
          <BandeLogos />
        </div>
      </section>
    </Vitrine>
  )
}

function EnTete() {
  return (
    <CarrouselEnTete
      // Ordre demande le 19/10 : bureau d etudes d abord (avant : operations terrain en premier)
      scenes={[
        {
          rubrique: "Bureau d'études",
          fin: 'Des plans justes,',
          fort: 'des dossiers conformes',
          texte:
            "Études FTTH et FTTO, routes optiques, dossiers BLO et DOE : nos ingénieurs préparent le terrain avant que la première équipe ne s'y rende.",
          photo: photoSig,
          photoAlt: "Ingénieur SAFIBRE travaillant sur une carte SIG du réseau",
          position: '70% 40%',
        },
        {
          rubrique: 'Opérations terrain',
          fin: 'Le réseau fibre,',
          fort: "de l'étude au raccordement",
          texte:
            "Bureau d'études et équipes terrain pour les opérateurs, les entreprises et les collectivités du Sénégal. Nous concevons, déployons et maintenons vos réseaux FTTH et FTTO depuis 2020.",
          photo: photoTerrain1,
          photoAlt: 'Technicien SAFIBRE raccordant un boîtier fibre sur un poteau',
          position: '60% 30%',
        },
        {
          rubrique: "L'équipe",
          fin: 'Une seule équipe,',
          fort: 'deux métiers',
          texte:
            "Des ingénieurs au bureau, des techniciens sur le terrain, les mêmes données et un seul interlocuteur pour vous.",
          photo: photoGroupe,
          photoAlt: "L'équipe SAFIBRE réunie devant les bureaux",
          position: 'center 35%',
        },
      ]}
    />
  )
}

