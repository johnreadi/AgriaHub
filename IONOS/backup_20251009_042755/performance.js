// Script d'optimisation des performances et Core Web Vitals
(function() {
  'use strict';

  // Préchargement des ressources critiques
  function preloadCriticalResources() {
    const criticalResources = [
      '/icons/icon-192x192.svg',
      '/icons/icon-512x512.svg'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }

  // Optimisation des images avec lazy loading natif
  function optimizeImages() {
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
  }

  // Optimisation des polices
  function optimizeFonts() {
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontLinks.forEach(link => {
      link.rel = 'preconnect';
    });
  }

  // Mesure et amélioration du CLS (Cumulative Layout Shift)
  function improveCLS() {
    // Réserver l'espace pour les images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.style.aspectRatio && img.width && img.height) {
        img.style.aspectRatio = `${img.width} / ${img.height}`;
      }
    });
  }

  // Optimisation du LCP (Largest Contentful Paint)
  function optimizeLCP() {
    // Précharger l'image hero si elle existe
    const heroImage = document.querySelector('.hero-image, .main-banner img');
    if (heroImage && heroImage.src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = heroImage.src;
      link.as = 'image';
      document.head.appendChild(link);
    }
  }

  // Optimisation du FID (First Input Delay)
  function optimizeFID() {
    // Différer les scripts non critiques
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    scripts.forEach(script => {
      if (!script.src.includes('critical')) {
        script.defer = true;
      }
    });
  }

  // Optimisation de la navigation
  function optimizeNavigation() {
    // Précharger les pages importantes au survol
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', function() {
        const href = this.getAttribute('href');
        if (href && href !== '#') {
          // Précharger les ressources de la page
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = href;
          document.head.appendChild(prefetchLink);
        }
      }, { once: true });
    });
  }

  // Optimisation du cache du service worker
  function optimizeServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker enregistré avec succès');

          // Recharger automatiquement lorsque le nouveau SW prend le contrôle
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker: nouveau contrôleur actif, rechargement...');
            window.location.reload();
          });
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Activer immédiatement la nouvelle version pour propager les modifications
                try {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                } catch (e) {
                  console.log('Impossible d\'envoyer SKIP_WAITING au SW:', e);
                  if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                }
              }
            });
          });
        })
        .catch(error => {
          console.log('Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    }
  }

  // Optimisation de la mémoire
  function optimizeMemory() {
    // Nettoyer les event listeners inutilisés
    window.addEventListener('beforeunload', () => {
      // Nettoyer les timers et intervals
      const highestTimeoutId = setTimeout(() => {});
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
      
      const highestIntervalId = setInterval(() => {});
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
      }
    });
  }

  // Initialisation des optimisations
  function initPerformanceOptimizations() {
    // Exécuter immédiatement
    preloadCriticalResources();
    optimizeFonts();
    optimizeLCP();
    optimizeFID();

    // Exécuter après le chargement du DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        optimizeImages();
        improveCLS();
        optimizeNavigation();
        optimizeMemory();
      });
    } else {
      optimizeImages();
      improveCLS();
      optimizeNavigation();
      optimizeMemory();
    }

    // Exécuter après le chargement complet
    window.addEventListener('load', () => {
      optimizeServiceWorker();
    });
  }

  // Mesure des Core Web Vitals
  function measureWebVitals() {
    // Mesurer le CLS
    let clsValue = 0;
    let clsEntries = [];
    
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });

    // Mesurer le LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Mesurer le FID
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    }).observe({ type: 'first-input', buffered: true });
  }

  // Démarrer les optimisations
  initPerformanceOptimizations();
  
  // Mesurer les performances en mode développement
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    measureWebVitals();
  }

})();