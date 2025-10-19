import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@frameforge/kernel': fileURLToPath(new URL('./packages/kernel/src/index.js', import.meta.url)),
      '@': resolve(__dirname, 'src'),
      'packages': resolve(__dirname, 'packages'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
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
