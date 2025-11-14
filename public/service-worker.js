const CACHE_NAME = 'ai-wireframe-designer-v1.0.1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching static assets...');
        await cache.addAll(STATIC_CACHE_URLS);
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      } catch (error) {
        console.error('[SW] Failed to cache static assets:', error);
        // Don't fail the installation, just log the error
        return self.skipWaiting();
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletePromises);
        console.log('[SW] Cache cleanup completed');
        return self.clients.claim();
      } catch (error) {
        console.error('[SW] Failed during activation:', error);
        return self.clients.claim();
      }
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // If not in cache, fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        const networkResponse = await fetch(event.request);
        
        // Don't cache if not a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache successful responses for future use
        try {
          const cache = await caches.open(CACHE_NAME);
          const responseToCache = networkResponse.clone();
          await cache.put(event.request, responseToCache);
        } catch (cacheError) {
          console.warn('[SW] Failed to cache response:', cacheError);
          // Don't fail the request if caching fails
        }

        return networkResponse;

      } catch (error) {
        console.error('[SW] Fetch failed:', error);
        
        // For navigation requests, serve the main page as fallback
        if (event.request.mode === 'navigate') {
          const fallbackResponse = await caches.match('/') || await caches.match('/index.html');
          if (fallbackResponse) {
            return fallbackResponse;
          }
        }

        // Return a network error response
        return new Response('Network error occurred', {
          status: 408,
          statusText: 'Request Timeout',
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
    })()
  );
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting - activating new service worker');
    self.skipWaiting();
  }
});

// Handle errors globally
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Service Worker unhandled promise rejection:', event.reason);
});