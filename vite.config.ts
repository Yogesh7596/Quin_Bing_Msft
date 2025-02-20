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
    outDir: 'dist', 
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes('@fluentui/react-icons')) {
            return 'fluentui-icons';
          } else if (id.includes('@fluentui/react')) {
            return 'fluentui-react';
          } else if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@fluentui/react'],
    esbuildOptions: {
      keepNames: true, // Prevents React component names from being removed
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"', // Ensures React runs in production mode
  },
});
