import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
