import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Permitir cualquier host (ngrok incluido)
    host: true,
    port: 5173,
    // CORS abierto para todas las peticiones
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
  }
})

