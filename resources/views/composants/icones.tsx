import { SVGProps } from 'react'

// Les quelques icones du site, dessinees ici : une bibliotheque entiere pour
// sept pictos alourdissait le chargement (et le serveur de dev).

type IconeProps = SVGProps<SVGSVGElement> & { size?: number }

function Icone({ size = 20, children, ...props }: IconeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconeFleche = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icone>
)

export const IconeFlecheDiagonale = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Icone>
)

export const IconeTelephone = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Icone>
)

export const IconeCourriel = (p: IconeProps) => (
  <Icone {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icone>
)

export const IconeLieu = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icone>
)

export const IconeMenu = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Icone>
)

export const IconeFermer = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icone>
)

export const IconeHorloge = (p: IconeProps) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icone>
)

// Coche des fiches d intervention (page operations terrain)
export const IconeCoche = (p: IconeProps) => (
  <Icone {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icone>
)

// Engagements (page entreprise) et livrables (bureau d etudes)
export const IconeBouclier = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icone>
)

export const IconeDocument = (p: IconeProps) => (
  <Icone {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icone>
)
