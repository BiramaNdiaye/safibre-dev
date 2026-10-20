import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import ReactDOMServer from 'react-dom/server'

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (titre) => (titre ? `${titre} · Safibre` : 'Safibre'),
    resolve(nom) {
      return resolvePageComponent(
        `../views/pages/${nom}.tsx`,
        import.meta.glob('../views/pages/**/*.tsx')
      )
    },
    setup: ({ App, props }) => <App {...props} />,
  })
)
