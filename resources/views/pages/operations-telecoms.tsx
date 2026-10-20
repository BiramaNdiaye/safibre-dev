import { Link } from '@inertiajs/react'
import photoEnTete from '~/assets/photos/terrain-1.webp'
import photoDeploiement from '~/assets/photos/terrain-2.webp'
import photoMaintenance from '~/assets/photos/terrain-poteau.webp'
import photoRecette from '~/assets/photos/terrain-3.webp'
import photoBobine from '~/assets/photos/terrain-bobine.webp'
import photoHarnais from '~/assets/photos/terrain-harnais.webp'
import photoEquipe from '~/assets/photos/terrain-equipe.webp'
import { BandeauPanne } from '~/views/composants/bandeau_panne'
import { BlocService, Service } from '~/views/composants/bloc_service'
import { EnTetePage } from '~/views/composants/entete_page'
import { IconeFleche, IconeTelephone } from '~/views/composants/icones'
import { Titre } from '~/views/composants/titre'
import { TraitFibre } from '~/views/composants/trait_fibre'
import { coordonnees } from '~/scripts/contenu'
import { cn } from '~/scripts/utils/css'
import { Vitrine } from '~/views/layouts/vitrine'
import { BonIntervention } from '~/views/sections/terrain/bon_intervention'
const services: Service[] = [
  {
    ancre: 'deploiement',
    numero: '01',
    titre: 'Déploiement et raccordement',
    texte:
      "Nous posons et raccordons vos réseaux fibre FTTH et FTTO en respectant les infrastructures existantes : techniques peu invasives, poses soignées, chantiers propres. Chaque raccordement est mesuré avant d'être déclaré terminé.",
    points: [
      'Raccordements FttH et FttO',
      'Pose de câbles optiques',
      "Petits ouvrages d'extension",
      'Câblage structuré',
      'Réglages et mesures de conformité',
      'Rapport après chaque intervention',
    ],
    photo: photoDeploiement,
    photoAlt: 'Technicien SAFIBRE raccordant un boîtier fibre sur un poteau',
  },
  {
    ancre: 'maintenance',
    numero: '02',
    titre: 'Maintenance et dépannage',
    texte:
      "En cas de panne, nos techniciens identifient le défaut, mesurent et analysent les liaisons optiques, puis remettent le service en marche selon les procédures de l'opérateur. Entre deux pannes, la maintenance préventive évite la suivante.",
    points: [
      'Inspection visuelle des connecteurs',
      "Mesure de la perte d'insertion",
      'Tests de réflectométrie (OTDR)',
      'Remise en état fibre et coaxial',
      'Maintenance préventive',
      'Remise en service rapide',
    ],
    photo: photoMaintenance,
    photoAlt: 'Technicien SAFIBRE en intervention sur une armoire fibre',
  },
  {
    ancre: 'recette',
    numero: '03',
    titre: 'Recette et mise en service',
    texte:
      "Avant qu'un réseau ne soit exploité, il faut le réceptionner : nous vérifions les travaux, validons les performances, activons les services et documentons l'ensemble pour l'opérateur.",
    points: [
      'Réception des travaux',
      'Tests de validation',
      'Mise en exploitation',
      'Activation de service',
      'Gestion des résiliations',
      'Documentation technique',
    ],
    photo: photoRecette,
    photoAlt: 'Équipe SAFIBRE déroulant un câble fibre depuis une bobine',
  },
]

// Ordre choisi pour alterner grandes et petites cartes, et les scenes
const galerie = [
  { photo: photoHarnais, legende: 'Harnais bouclé avant chaque montée', grand: true },
  { photo: photoBobine, legende: 'Câble optique prêt à poser', grand: false },
  { photo: photoDeploiement, legende: "Raccordement d'un boîtier sur poteau", grand: true },
  { photo: photoMaintenance, legende: "Montée à l'échelle, collègue en appui", grand: false },
  { photo: photoRecette, legende: 'Préparation du tirage de câble', grand: true },
  { photo: photoEquipe, legende: 'Binôme au départ du chantier', grand: false },
]

export default function OperationsTerrain() {
  return (
    <Vitrine
      logo="terrain"
      titre="Opérations terrain télécoms"
      description="Les équipes terrain SAFIBRE : déploiement et raccordement fibre FTTH / FTTO, maintenance, dépannage, mesures réflectométriques, recette et mise en service."
    >
      <EnTetePage
        fil="Opérations terrain"
        fin="Sur le poteau,"
        fort="dans la tranchée"
        texte={
          <p>
            Nos techniciens déploient, raccordent et maintiennent les réseaux fibre optique au
            quotidien. Des équipes formées, équipées et encadrées, qui rendent compte de chaque
            intervention.
          </p>
        }
        photo={photoEnTete}
        photoAlt="Technicien SAFIBRE au travail sur un boîtier de raccordement"
        position="center 25%"
        actions={
          <>
            <Link href="/contact" className="bouton-plein">
              Planifier une intervention
              <IconeFleche size={18} />
            </Link>
            <a href={coordonnees.telephoneLien} className="bouton-contour">
              <IconeTelephone size={16} />
              {coordonnees.telephone}
            </a>
          </>
        }
      />

      {/* <BandeBalisage />  (bande de balisage sous l en-tete : refusee le 20/10, « je veux pas ca ») */}

      <section className="py-24 md:py-32">
        <div className="conteneur flex flex-col gap-16">
          <Titre surtitre="Nos interventions" fin="Poser, réparer," fort="mettre en service" />
          <TraitFibre className="text-encre" points={[['g', 0], ['g', 16, 0.9], ['g', 50, -0.9], ['g', 84, 0.9], ['g', 100]]} noeuds={[1, 2, 3]}>
            <div className="flex flex-col gap-24 md:gap-32">
              {services.map((s, i) => (
                <BlocService key={s.numero} service={s} inverse={i % 2 === 1} variante="terrain" />
              ))}
            </div>
          </TraitFibre>
        </div>
      </section>

      {/* Galerie de chantier qui file a l horizontale au defilement */}
      <section className="overflow-hidden bg-encre pb-8 pt-24 text-white md:pt-32">
        <div className="conteneur mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <Titre surtitre="Sur le chantier" fin="Nos équipes," fort="en images" sombre />
          <p data-apparition="monte" className="max-w-sm text-[15px] leading-relaxed text-white/60">
            Pas de photos d'illustration : ce sont nos techniciens, sur nos chantiers.
          </p>
        </div>
        <div data-apparition="glisse" aria-label="Photos de chantier">
          <ul className="flex w-max items-start gap-5 md:gap-8">
            {galerie.map((p, i) => (
              <li
                key={p.photo}
                className={cn(
                  'group flex shrink-0 flex-col gap-4',
                  p.grand ? 'w-[64vw] sm:w-[38vw] lg:w-[25vw]' : 'w-[50vw] sm:w-[28vw] lg:w-[18vw]',
                  // Quinconce : les petites cartes descendent, la rangee respire
                  !p.grand && 'mt-16 md:mt-24'
                )}
              >
                <div
                  className={cn(
                    'overflow-hidden rounded-[22px] bg-encre-2',
                    p.grand ? 'aspect-[4/5]' : 'aspect-[3/4]'
                  )}
                >
                  <img
                    src={p.photo}
                    alt={p.legende}
                    loading="lazy"
                    data-glisse-image
                    className="size-full scale-[1.15] object-cover transition-[filter] duration-700 group-hover:brightness-110"
                  />
                </div>
                <p className="flex items-baseline gap-3 text-sm text-white/70">
                  <span className="text-xs font-extrabold text-accent-clair">{String(i + 1).padStart(2, '0')}</span>
                  {p.legende}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ancienne liste des missions (avant l identite terrain du 20/10) : */}
      {/*
      <section className="relative overflow-hidden bg-encre py-24 text-white md:py-32">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="conteneur relative grid gap-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Titre surtitre="Nos missions" fin="Ce que font" fort="nos techniciens" sombre />
          <ol data-apparition="cascade" className="flex flex-col">
            {missions.map((mission, i) => (
              <li key={mission} className="flex items-baseline gap-6 border-b border-white/10 py-5">
                <span className="w-8 shrink-0 text-sm font-extrabold text-accent-clair">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-base font-medium text-white/85 md:text-lg">{mission}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      */}
      <BandeauPanne />
      <BonIntervention />
    </Vitrine>
  )
}

// BandeauPanne : deplace le 20/10 dans composants/bandeau_panne.tsx (aussi utilise sur l accueil).
// La version d origine, identique, etait definie ici.

