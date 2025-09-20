import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://suraksha-backend-cz74.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API proxy error:', err);
          });
        },
      },
      '/socket.io': {
        target: 'https://suraksha-backend-cz74.onrender.com',
        changeOrigin: true,
        ws: true,
        timeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('WebSocket proxy error:', err);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err) => {
              console.log('WebSocket error:', err);
            });
          });
        },
      }
    }
  },
})
