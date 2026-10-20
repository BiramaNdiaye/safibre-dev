import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const couleur = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: ['./resources/**/*.{js,jsx,ts,tsx,blade.php}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Montserrat Variable"', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        encre: { DEFAULT: couleur('--encre'), 2: couleur('--encre-2') },
        orange: { DEFAULT: couleur('--orange') },
        vert: { DEFAULT: couleur('--vert') },
        accent: {
          DEFAULT: couleur('--accent'),
          fonce: couleur('--accent-fonce'),
          clair: couleur('--accent-clair'),
        },
        papier: couleur('--papier'),
        brand: {
          '50': '#f1f8f4',
          '100': '#deede3',
          '200': '#bedcca',
          '300': '#93c2a9',
          '400': '#65a284',
          '500': '#417f62',
          '600': '#326950',
          '700': '#285442',
          '800': '#214435',
          '900': '#1c382d',
          '950': '#0f1f19',
        },
      },
      transitionTimingFunction: {
        sortie: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [typography],
} satisfies Config
