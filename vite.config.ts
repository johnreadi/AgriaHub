import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          port: 3001,
          host: 'localhost'
        },
        watch: {
          usePolling: true
        },
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false
          }
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
        dedupe: ['react', 'react-dom']
      },
      // build: {} // configuration par défaut de Vite
      // Optimisations pour le développement
      optimizeDeps: {
        include: ['react', 'react-dom']
      }
    };
});
