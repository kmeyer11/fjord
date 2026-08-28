import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      // The .ics feed lives outside /api (it's a plain URL Apple Calendar subscribes
      // to, not a JSON endpoint) but still needs proxying so the dev server behaves
      // like the single-process production deployment. Scoped to the exact feed
      // path — a bare "/calendar" prefix would also swallow the SPA's own
      // client-side /calendar route.
      '/calendar/fjord.ics': 'http://127.0.0.1:8000',
    },
  },
})
