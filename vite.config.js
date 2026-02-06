import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  base: '/',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Ensure this is set to 'esbuild'
    target: 'es2020', // Add this for better compatibility
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-hot-toast', 'axios']
        }
      }
    }
  },
  
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
})