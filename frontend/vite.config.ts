import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En dev local, contourne le besoin de CORS sur les services (aucun n'en a —
    // en prod tout passe par Traefik sur le même domaine).
    proxy: {
      '/auth': 'http://localhost:3001',
      '/calendar': 'http://localhost:3002',
      '/tracking': 'http://localhost:3003',
    },
  },
})
