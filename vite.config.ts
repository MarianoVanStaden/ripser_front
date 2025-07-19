import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add this server configuration to help the HMR client
  // connect correctly.
  server: {
    hmr: {
      host: 'localhost',
    },
  },
})
