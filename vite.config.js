import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace this with your current ngrok subdomain:
const allowedNgrokHost = '43c0-42-108-96-215.ngrok-free.app'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:5005',
    },
    allowedHosts: [allowedNgrokHost] // ✅ allow Ngrok
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
})
