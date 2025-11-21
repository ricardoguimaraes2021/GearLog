import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Otimizações para produção
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Desativa source maps em produção (mais rápido)
    minify: 'esbuild', // Usa esbuild para minificação (mais rápido que terser)
    
    // Code splitting e chunk optimization
    rollupOptions: {
      output: {
        // Separa vendor libraries em chunks separados
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': ['axios', 'date-fns', 'zustand'],
        },
        // Nome dos ficheiros com hash para cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Limite de aviso de tamanho (em KB)
    chunkSizeWarningLimit: 1000,
    
    // Otimizações adicionais
    cssCodeSplit: true,
    reportCompressedSize: true,
    target: 'es2015', // Suporta browsers modernos
  },
})

