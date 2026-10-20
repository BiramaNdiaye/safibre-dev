import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig(({ isSsrBuild }) => {
  return {
    plugins: [
      laravel({
        input: [
          'resources/css/app.css',
          'resources/scripts/app.tsx',
        ],
        ssr: 'resources/scripts/ssr.tsx',
        refresh: true,
      }),
      react(),
    ],

    resolve: {
      alias: {
        '~/': '/resources/',
      },
      // Une seule copie de React, sinon @gsap/react appelle des hooks sur une autre instance
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', '@inertiajs/react', 'gsap', 'gsap/ScrollTrigger', '@gsap/react', 'lenis', 'sonner', 'axios'],
    },
  }
})
