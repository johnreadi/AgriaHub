#!/usr/bin/env node

/**
 * Serveur Node.js pour AgriaHub - Compatible Heroku Buildpacks
 * Sert les fichiers statiques React et proxie les requêtes API vers PHP
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Configuration pour la production
app.set('trust proxy', 1);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Headers de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Servir les fichiers statiques du frontend (build React)
const frontendBuildPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendBuildPath));

// Proxy pour l'API PHP (si disponible)
if (process.env.PHP_API_URL) {
  app.use('/api', createProxyMiddleware({
    target: process.env.PHP_API_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ 
        error: 'API temporarily unavailable',
        message: 'Backend service is not accessible'
      });
    }
  }));
} else {
  // API mock pour le développement/test
  app.use('/api', (req, res) => {
    console.log('API call intercepted:', req.method, req.url);
    
    // Réponses mock pour les endpoints principaux
    if (req.url.includes('/auth.php')) {
      return res.json({
        success: false,
        message: 'API backend not configured. Set PHP_API_URL environment variable.'
      });
    }
    
    if (req.url.includes('/menu.php')) {
      return res.json({
        success: true,
        data: [],
        message: 'Mock API - No menu items available'
      });
    }
    
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Backend API is not configured',
      hint: 'Set PHP_API_URL environment variable to connect to PHP backend'
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Catch-all handler: envoie index.html pour les routes React
app.get('*', (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Application not available');
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AgriaHub Server started on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.PHP_API_URL) {
    console.log(`🔗 PHP API Proxy: ${process.env.PHP_API_URL}`);
  } else {
    console.log(`⚠️  PHP API not configured - using mock responses`);
  }
});