import '~/css/app.css'
import '~/scripts/bootstrap'

import { createInertiaApp, router } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot, hydrateRoot } from 'react-dom/client'

router.on('navigate', () => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'G-FLERB9SEH8', {
      page_path: window.location.pathname + window.location.search,
    })
  }
})

createInertiaApp({
  progress: { color: '#417f62' },
  title: (titre) => (titre ? `${titre} · Safibre` : 'Safibre'),
  resolve(nom) {
    return resolvePageComponent(
      `../views/pages/${nom}.tsx`,
      import.meta.glob('../views/pages/**/*.tsx')
    )
  },
  setup({ el, App, props }) {
    if (import.meta.env.DEV) {
      createRoot(el).render(<App {...props} />)
      return
    }
    hydrateRoot(el, <App {...props} />)
  },
})
