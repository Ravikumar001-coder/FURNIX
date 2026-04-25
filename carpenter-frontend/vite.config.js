import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Proxy API calls during development
    // so you don't get CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,       // no source maps in production
    minify: 'terser',
    rollupOptions: {
      output: {
        // Split vendor code into separate chunk (faster loading)
        manualChunks(id) {
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/axios')) {
            return 'axios'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'ui'
          }
          return undefined
        },
      },
    },
  },
})