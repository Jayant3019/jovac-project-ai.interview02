import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:4000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (error, request) => {
            console.error(`API proxy failed for ${request.method} ${request.url} -> ${apiTarget}: ${error.message}`)
          })
        },
      },
    },
  },
})
