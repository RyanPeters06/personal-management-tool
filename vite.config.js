import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
