const CACHE_NAME = 'agria-rouen-cache-v2.6'
const STATIC_CACHE = 'agria-static-v2.6'
const DYNAMIC_CACHE = 'agria-dynamic-v2.6'
const API_CACHE = 'agria-api-v2.6'

// Ressources critiques à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  // Pages principales
  '/menu',
  '/actu',
  '/contact',
  '/restaurant',
  '/takeaway'
];

// URLs d'API à mettre en cache avec stratégie Network First
const API_URLS = [
  '/api/menu',
  '/api/activities',
  '/api/company-info'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Supprimer les anciens caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Claiming clients')
        return self.clients.claim()
      })
  )
})

// Écoute des messages pour activer immédiatement la nouvelle version
self.addEventListener('message', event => {
  try {
    const data = event && event.data ? event.data : null
    if (data && data.type === 'SKIP_WAITING') {
      self.skipWaiting()
    }
  } catch (_) {}
})

// Stratégies de cache
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Endpoint paramètres d'apparence: toujours frais et non mis en cache
  if (url.pathname === '/api/settings.php' && url.searchParams.get('type') === 'appearance') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        const cached = await caches.match(request)
        return cached || new Response('Service indisponible', { status: 503 })
      })
    )
    return
  }
  // Stratégie pour les API (Network First)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Stratégie pour les assets statiques (Cache First)
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Stratégie pour les pages HTML (Network First pour propager rapidement les mises à jour)
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Stratégie par défaut (Network First)
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Stratégie Cache First (pour les assets statiques)
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First Strategy failed:', error);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

// Stratégie Network First (pour les API et contenu dynamique)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    // Pour les API, toujours retourner la réponse réseau même si elle n'est pas OK
    // Cela permet aux erreurs 401, 404, etc. d'être correctement propagées
    if (request.url.includes('/api/')) {
      return networkResponse;
    }
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline - No cached version available', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Offline', message: 'No cached version available' })
    });
  }
}

// Stratégie Stale While Revalidate (pour les pages HTML)
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Gestion des messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Notification de mise à jour disponible
self.addEventListener('controllerchange', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        message: 'Une nouvelle version de l\'application est disponible!'
      });
    });
  });
});

// Gestion des erreurs globales
self.addEventListener('error', event => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker Unhandled Rejection:', event.reason);
});