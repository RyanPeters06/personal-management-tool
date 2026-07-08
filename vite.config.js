import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Build timestamp distinguishes deploys so you can confirm phone + laptop
    // are running the exact same build.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Life Manager',
        short_name: 'Life Manager',
        description: 'Personal life manager — tasks, projects, finance, journal, and more',
        theme_color: '#ffffff',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        // The app is a local-first SPA — cache everything, navigate offline
        navigateFallback: 'index.html',
        // Never intercept API or Supabase calls
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    // Dedicated port for Life Manager so it never collides with another
    // local Electron/Vite app (e.g. Royal Chatbot on 5173). strictPort makes
    // startup fail loudly instead of silently drifting to another port.
    port: 5273,
    strictPort: true,
  },
})
