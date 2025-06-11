// MSRC Enhanced Service Worker
// Handles caching for API responses and assets

const CACHE_NAME = 'msrc-cache-v1';
const API_CACHE_NAME = 'msrc-api-cache-v1';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/login',
  '/dashboard'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  // Take control of all clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('msrc-') && 
                 cacheName !== CACHE_NAME &&
                 cacheName !== API_CACHE_NAME;
        }).map(cacheName => {
          console.log('[ServiceWorker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Helper function to determine if a request is an API request
const isApiRequest = (url) => {
  return API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
};

// Helper function to determine if a response should be cached
const shouldCache = (response) => {
  // Only cache successful responses
  if (!response || response.status !== 200) {
    return false;
  }
  
  // Check for no-store cache control
  const cacheControl = response.headers.get('Cache-Control');
  if (cacheControl && cacheControl.includes('no-store')) {
    return false;
  }
  
  return true;
};

// Fetch event - handle network requests with caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Special handling for API requests
  if (isApiRequest(url)) {
    // For API endpoints like /api/auth/me, use a network-first strategy with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response before using it
          const responseToCache = response.clone();
          
          if (shouldCache(response)) {
            caches.open(API_CACHE_NAME)
              .then(cache => {
                // Store the response in cache with the original request as key
                cache.put(event.request, responseToCache);
                console.log('[ServiceWorker] Cached API response:', url.pathname);
              });
          }
          
          return response;
        })
        .catch(() => {
          // If network request fails, try to return from cache
          console.log('[ServiceWorker] Fetching from API cache:', url.pathname);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-GET requests or failed responses
            if (event.request.method !== 'GET' || !response || response.status !== 200) {
              return response;
            }
            
            // Clone the response before using it
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_AUTH_CACHE') {
    caches.open(API_CACHE_NAME).then(cache => {
      // Clear auth-related cache entries
      cache.keys().then(keys => {
        keys.forEach(request => {
          if (request.url.includes('/api/auth/me')) {
            cache.delete(request);
          }
        });
      });
    });
    
    console.log('[ServiceWorker] Auth cache cleared');
  }
});
