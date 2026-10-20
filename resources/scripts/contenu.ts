// Tout le texte du site au meme endroit : le proprietaire relit et corrige ici
// sans fouiller dans la mise en page.

import terrainBoitier from '~/assets/photos/terrain-2.webp'
import terrainPoteau from '~/assets/photos/terrain-1.webp'
import terrainBobine from '~/assets/photos/terrain-3.webp'
import etudeSig from '~/assets/photos/etude-sig.webp'
import etudeCasque from '~/assets/photos/etude-casque.webp'
import etudeEchange from '~/assets/photos/etude-echange.webp'
import equipeBureau from '~/assets/photos/equipe-bureau.webp'

import logoRaisecom from '~/assets/images/partners/raisecom.png'
import logoCamusat from '~/assets/images/partners/camusat.png'
import logoCsma from '~/assets/images/partners/csma.png'
import logoPlp from '~/assets/images/partners/plp.png'
import logoGismartware from '~/assets/images/partners/gismartware.png'
import logoSade from '~/assets/images/partners/sade.png'
import logoCircet from '~/assets/images/partners/circet.png'
import logoOrange from '~/assets/images/partners/orange.png'
import logoAxione from '~/assets/images/partners/axione.png'

export const coordonnees = {
  telephone: '+221 33 801 86 40',
  telephoneLien: 'tel:+221338018640',
  email: 'contact@safibre.sn',
  adresse: ['Avenue Bourguiba, Villa n° 3085', 'Amitié 1', 'Dakar, Sénégal'],
  horaires: 'Du lundi au vendredi, 8 h – 18 h',
}

export const navigation = [
  { libelle: "L'entreprise", lien: '/a-propos' },
  { libelle: "Bureau d'études", lien: '/bureau_etude' },
  { libelle: 'Opérations terrain', lien: '/operations-telecoms' },
  { libelle: 'Nos réalisations', lien: '/realisations' },
  { libelle: 'Contact', lien: '/contact' },
]

export type Expertise = {
  code: string
  titre: string
  pole: 'etudes' | 'terrain'
  resume: string
  points: string[]
  photo: string
  lien: string
}

export const expertises: Expertise[] = [
  {
    code: 'etudes',
    titre: "Études et ingénierie",
    pole: 'etudes',
    resume:
      "Faisabilité, conception et dimensionnement des réseaux FTTH et FTTO, jusqu'aux plans d'implantation et aux cahiers des charges.",
    points: ['Études de faisabilité', 'Conception détaillée', "Plans d'implantation", 'Cahiers des charges'],
    photo: etudeSig,
    lien: '/bureau_etude#etudes',
  },
  {
    code: 'dossiers',
    titre: 'Dossiers opérateurs',
    pole: 'etudes',
    resume:
      "Routes optiques, dossiers BLO et dossiers des ouvrages exécutés (DOE) : la documentation qui permet d'exploiter et de maintenir le réseau.",
    points: ['Routes optiques', 'Dossiers BLO', 'DOE', 'Mise à jour du SIG'],
    photo: etudeCasque,
    lien: '/bureau_etude#dossiers',
  },
  {
    code: 'deploiement',
    titre: 'Déploiement et raccordement',
    pole: 'terrain',
    resume:
      'Pose des câbles, raccordements FTTH et FTTO, petits ouvrages de construction et d’extension du réseau.',
    points: ['Raccordements FttX', 'Pose de câbles', 'Extension du réseau', 'Réglages et mesures'],
    photo: terrainBoitier,
    lien: '/operations-telecoms#deploiement',
  },
  {
    code: 'maintenance',
    titre: 'Maintenance et dépannage',
    pole: 'terrain',
    resume:
      'Diagnostic de panne, mesures réflectométriques, remise en état de la fibre et du coaxial pour une remise en service rapide.',
    points: ['Diagnostic de panne', 'Réflectométrie', 'Maintenance préventive', 'Remise en état'],
    photo: terrainPoteau,
    lien: '/operations-telecoms#maintenance',
  },
  {
    code: 'centre',
    titre: "Centre d'activités télécoms",
    pole: 'etudes',
    resume:
      'Suivi continu de vos activités, des services actifs et passifs, et traitement des tickets opérateurs jusqu’à leur clôture.',
    points: ['Tickets opérateurs', 'Suivi des interventions', 'Rapports', 'Support N2 / N3'],
    photo: etudeEchange,
    lien: '/bureau_etude#centre',
  },
  {
    code: 'recette',
    titre: 'Recette et mise en service',
    pole: 'terrain',
    resume:
      'Réception des travaux, tests de validation, activation des services et gestion des résiliations.',
    points: ['Réception de travaux', 'Tests de validation', 'Activation de service', 'Résiliations'],
    photo: terrainBobine,
    lien: '/operations-telecoms#recette',
  },
]

// Chiffres repris de l ancien site ; a confirmer par le proprietaire avant mise en ligne.
export const chiffres = [
  { valeur: 2020, prefixe: '', suffixe: '', libelle: 'Année de création', annee: true },
  { valeur: 2000, prefixe: '+', suffixe: '', libelle: 'Raccordements réalisés' },
  { valeur: 5000, prefixe: '+', suffixe: '', libelle: "Dossiers d'ingénierie par an" },
  { valeur: 24, prefixe: '', suffixe: '/7', libelle: 'Suivi des incidents' },
]

export const methode = [
  {
    numero: '01',
    titre: 'Étudier',
    texte: 'Relevés, faisabilité, choix du tracé. On part du terrain réel, pas d’un plan théorique.',
  },
  {
    numero: '02',
    titre: 'Concevoir',
    texte: 'Ingénierie, dimensionnement, plans et dossiers conformes aux exigences de l’opérateur.',
  },
  {
    numero: '03',
    titre: 'Déployer',
    texte: 'Pose, raccordement, mesures. Chaque intervention se clôt par un rapport détaillé.',
  },
  {
    numero: '04',
    titre: 'Maintenir',
    texte: 'Diagnostic, dépannage et maintenance préventive pour un réseau qui dure.',
  },
]

export const partenaires = [
  { nom: 'Orange', logo: logoOrange },
  { nom: 'Camusat', logo: logoCamusat },
  { nom: 'Circet', logo: logoCircet },
  { nom: 'Sade', logo: logoSade },
  { nom: 'Axione', logo: logoAxione },
  { nom: 'Raisecom', logo: logoRaisecom },
  { nom: 'CSMA Consult', logo: logoCsma },
  { nom: 'PLP', logo: logoPlp },
  { nom: 'GI Smartware', logo: logoGismartware },
]

export const photoEquipe = equipeBureau
