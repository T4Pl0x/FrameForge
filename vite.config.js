import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@frameforge/kernel': fileURLToPath(new URL('./packages/kernel/src/index.js', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('mermaid')) {
              return 'mermaid';
            }
            if (id.includes('katex')) {
              return 'katex';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
