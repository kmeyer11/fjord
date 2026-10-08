import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Where the dev server proxies /api to — defaults to the port the Docker
  // container publishes. Override in frontend/.env.local (gitignored) with
  // VITE_DEV_API_TARGET=http://127.0.0.1:<port> to point at a second, locally
  // run backend instead, without touching this tracked file.
  const apiTarget = loadEnv(mode, process.cwd(), 'VITE_').VITE_DEV_API_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        '/api': apiTarget,
      },
    },
  }
})
