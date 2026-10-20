import { Link } from '@inertiajs/react'
import photoEnTete from '~/assets/photos/etude-sig.webp'
import photoEtudes from '~/assets/photos/etude-3.webp'
import photoDossiers from '~/assets/photos/etude-casque.webp'
import photoCentre from '~/assets/photos/etude-echange.webp'
import photoIngenieur from '~/assets/photos/etude-ingenieur.webp'
import { Service } from '~/views/composants/bloc_service'
import { EnTetePage } from '~/views/composants/entete_page'
import { DossiersEtude } from '~/views/composants/dossiers_etude'
import { FondPlan } from '~/views/composants/fond_plan'
import { IconeFleche } from '~/views/composants/icones'
import { Plus, Titre } from '~/views/composants/titre'
import { Vitrine } from '~/views/layouts/vitrine'
import { BandeauEtude } from '~/views/sections/bureau/bandeau_etude'
const services: Service[] = [
  {
    ancre: 'etudes',
    numero: '01',
    titre: 'Études et ingénierie',
    texte:
      "Nous étudions la faisabilité de vos projets de déploiement et de raccordement à très haut débit, puis nous concevons le réseau : tracé, dimensionnement, plans d'implantation et cahier des charges. Un réseau bien étudié se pose plus vite et se répare plus facilement.",
    points: [
      'Études de faisabilité technique',
      'Conception détaillée FTTH / FTTO',
      'Dimensionnement des équipements',
      "Plans d'implantation",
      'Cahiers des charges techniques',
      "Études d'impact",
    ],
    photo: photoEtudes,
    photoAlt: "Ingénieure du bureau d'études SAFIBRE devant ses plans",
  },
  {
    ancre: 'dossiers',
    numero: '02',
    titre: 'Dossiers opérateurs',
    texte:
      "La qualité d'exploitation des réseaux fibre est une priorité de l'ARTP. Nous produisons les documents qui la rendent possible : routes optiques, dossiers BLO et dossiers des ouvrages exécutés remis au maître d'ouvrage à la livraison du chantier.",
    points: [
      'Production des routes optiques',
      'Gestion et traitement des dossiers BLO',
      'Dossiers des ouvrages exécutés (DOE)',
      'Mise à jour des données SIG',
    ],
    photo: photoDossiers,
    photoAlt: 'Technicienne SAFIBRE au poste de travail, casque sur les oreilles',
  },
  {
    ancre: 'centre',
    numero: '03',
    titre: "Centre d'activités télécoms",
    texte:
      "Quand un client signale une panne Internet, de téléphone ou de télévision, un ticket s'ouvre chez son opérateur. Notre centre suit ces tickets jusqu'à leur résolution, surveille en continu vos services actifs et passifs et vous rend compte de chaque intervention.",
    points: [
      'Gestion des tickets opérateurs',
      'Suivi des services actifs et passifs',
      'Planification des interventions',
      'Rapports et indicateurs',
      'Support technique N2 / N3',
      'Gestion des résiliations',
    ],
    photo: photoCentre,
    photoAlt: 'Deux membres de l’équipe SAFIBRE échangent sur un dossier',
  },
]

const principes = [
  { titre: 'Méthode', texte: 'Un processus écrit, les mêmes étapes à chaque projet, rien de laissé au hasard.' },
  { titre: 'Précision', texte: 'Des calculs et des relevés vérifiés avant d’envoyer une équipe sur le terrain.' },
  { titre: 'Qualité', texte: 'Un contrôle à chaque étape, conforme aux exigences de l’opérateur.' },
  { titre: 'Délais', texte: 'Un planning suivi au jour le jour, et des retours réguliers.' },
]

export default function BureauEtudes() {
  return (
    <Vitrine
      // Le bandeau vert « Un projet a etudier ? » ferme la page : pas de second appel dans le pied
      sansAppelPied
      titre="Bureau d'études télécoms"
      description="Le bureau d'études SAFIBRE : études et ingénierie FTTH / FTTO, routes optiques, dossiers BLO et DOE, centre d'activités télécoms."
    >
      <EnTetePage
        fil="Bureau d'études"
        fin="Concevoir le réseau"
        fort="avant de le poser"
        texte={
          <p>
            Notre bureau d'études réunit des professionnels de la fibre optique : ils étudient la
            faisabilité des projets de déploiement et de raccordement, conçoivent les réseaux à très
            haut débit et produisent les dossiers exigés par les opérateurs.
          </p>
        }
        photo={photoEnTete}
        photoAlt="Ingénieur SAFIBRE travaillant sur une carte SIG du réseau"
        position="center 30%"
        actions={
          <Link href="/contact" className="bouton-plein">
            Demander une étude
            <IconeFleche size={18} />
          </Link>
        }
      />

      {/* Avant : <section className="py-24 md:py-32"> ; papier millimetre ajoute le 20/10 (identite bureau d etudes) */}
      {/* <section className="papier-plan py-24 md:py-32">  (avant l effet souris du 20/10) */}
      <FondPlan className="py-24 md:py-32">
        <div className="conteneur flex flex-col gap-16">
          <Titre surtitre="Nos services" fin="De l'étude" fort="au dossier livré" />
          {/* Avant (jusqu au 20/10) : meme zigzag texte / photo que la page terrain :
              <TraitFibre className="text-encre" points={[['g', 0], ['g', 16, 0.9], ['g', 50, -0.9], ['g', 84, 0.9], ['g', 100]]} noeuds={[1, 2, 3]}>
              <div className="flex flex-col gap-24 md:gap-32">
              {services.map((s, i) => (
              <BlocService key={s.numero} service={s} inverse={i % 2 === 1} variante="etudes" />
              ))}
              </div>
              </TraitFibre>
          */}
          <DossiersEtude services={services} />
        </div>
      </FondPlan>

      {/* <Livrables />  (bordereau « Ce que nous livrons » retire le 20/10 : « c est faux » selon le proprietaire) */}

      <section className="relative overflow-hidden bg-encre py-24 text-white md:py-32">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="conteneur relative grid items-center gap-14 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          {/* Pile : deux blocs aux couleurs de la marque sous la photo, ouverts en eventail */}
          <div
            data-apparition="pile"
            className="relative mx-auto aspect-[3/4] w-full max-w-[280px] cursor-pointer sm:max-w-sm"
          >
            <div
              data-rotation={-4}
              data-decalage={-6}
              data-survol-rotation={-6}
              data-survol-decalage={-10}
              aria-hidden
              className="absolute inset-0 rounded-[28px] bg-vert"
            />
            <div
              data-rotation={3}
              data-decalage={6}
              data-survol-rotation={5}
              data-survol-decalage={10}
              aria-hidden
              className="absolute inset-0 rounded-[28px] bg-orange"
            />
            <div
              data-rotation={0}
              data-decalage={0}
              data-survol-rotation={0}
              data-survol-decalage={0}
              data-survol-monte={-2}
              className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)]"
            >
              <img
                src={photoIngenieur}
                alt="Ingénieur du bureau d'études SAFIBRE"
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-12">
            <Titre surtitre="Notre approche" fin="La rigueur," fort="à chaque étape" sombre />
            <ul data-apparition="cascade" className="grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
              {principes.map((p) => (
                <li key={p.titre} className="flex flex-col gap-3 bg-encre p-7">
                  <span className="flex items-center gap-3 text-lg font-extrabold uppercase">
                    <Plus />
                    {p.titre}
                  </span>
                  <p className="text-sm leading-relaxed text-white/65">{p.texte}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <BandeauEtude />
    </Vitrine>
  )
}

