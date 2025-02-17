import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Your existing proxy configuration
      // "/ask": "http://127.0.0.1:50505",
      // "/chat": "http://127.0.0.1:50505",
      // "/documentService/questionFeedback": "http://127.0.0.1:50505",
      // "/documentService/getCategories":"http://127.0.0.1:50505",
    },
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: () => 'everything.js' // Forces all into one bundle
      }
    }
  }
});
