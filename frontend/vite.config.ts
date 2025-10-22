import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/agriarouen/',
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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom']
      },
      build: {
        // Optimisations de build pour les performances
        rollupOptions: {
          output: {
            manualChunks: {
              // Séparer les dépendances vendor pour un meilleur cache
              vendor: ['react', 'react-dom'],
              // Séparer les icônes pour un chargement optimisé
              icons: ['./components/icons/Icons']
            }
          }
        },
        // Optimiser la taille des chunks
        chunkSizeWarningLimit: 1000,
        // Activer la minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        }
      },
      // Optimisations pour le développement
      optimizeDeps: {
        include: ['react', 'react-dom']
      }
    };
});
