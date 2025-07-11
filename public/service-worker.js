// public/service-worker.js
// Industry-standard service worker for meal tracking PWA

const CACHE_VERSION = 'v1.0.0';
const IS_DEVELOPMENT =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.port === '3000';

const CACHE_NAMES = {
  APP_SHELL: `app-shell-${CACHE_VERSION}`,
  API_CACHE: `api-cache-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`,
  STATIC: `static-${CACHE_VERSION}`,
};

// Critical app shell resources that should always be cached
const APP_SHELL_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/loading-image.png',
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = {
  CACHE_FIRST: [/\/api\/gpt\/quote/, /\/api\/user\/name/],
  STALE_WHILE_REVALIDATE: [
    /\/api\/meals\/check/,
    /\/api\/streak/,
    /\/api\/summaries/,
  ],
  NETWORK_FIRST: [/\/api\/log-meal/, /\/api\/gpt\/meal-chat/, /\/api\/admin\//],
};

// Background sync tag names
const SYNC_TAGS = {
  MEAL_LOG: 'meal-log-sync',
  USER_DATA: 'user-data-sync',
};

// Utility functions
function log(message, data = null) {
  console.log(`[SW ${CACHE_VERSION}] ${message}`, data || '');
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'))
  );
}

function shouldCacheRequest(request) {
  // Don't cache chrome-extension, chrome:// or other non-http requests
  return (
    request.url.startsWith('http') &&
    !request.url.includes('chrome-extension') &&
    !request.url.includes('chrome://') &&
    !request.url.includes('_next/webpack-hmr') && // Skip Next.js HMR
    !request.url.includes('_next/static/chunks/hmr/') // Skip HMR chunks
  );
}

function getApiCacheStrategy(url) {
  for (const [strategy, patterns] of Object.entries(API_CACHE_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(url))) {
      return strategy;
    }
  }
  return 'NETWORK_ONLY';
}

// Cache management
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_NAMES);

  const deletions = cacheNames
    .filter((cacheName) => !currentCaches.includes(cacheName))
    .map((cacheName) => {
      log(`Deleting old cache: ${cacheName}`);
      return caches.delete(cacheName);
    });

  return Promise.all(deletions);
}

async function precacheAppShell() {
  // Skip precaching in development to avoid conflicts with Next.js dev server
  if (IS_DEVELOPMENT) {
    log('Development mode: Skipping app shell precaching');
    return;
  }

  const cache = await caches.open(CACHE_NAMES.APP_SHELL);

  try {
    // Cache app shell resources
    await cache.addAll(APP_SHELL_URLS);
    log('App shell precached successfully');
  } catch (error) {
    log('Failed to precache some app shell resources:', error);
    // Try to cache individually to identify problematic URLs
    for (const url of APP_SHELL_URLS) {
      try {
        await cache.add(url);
        log(`Cached: ${url}`);
      } catch (err) {
        log(`Failed to cache: ${url}`, err);
      }
    }
  }
}

// Caching strategies
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    log(`Cache hit: ${request.url}`);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      log(`Cached from network: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    log(`Network failed for: ${request.url}`, error);
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to fetch from network in the background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        log(`Background updated cache: ${request.url}`);
      }
      return response;
    })
    .catch((error) => {
      log(`Background fetch failed: ${request.url}`, error);
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    log(`Serving from cache: ${request.url}`);
    networkPromise; // Update in background
    return cachedResponse;
  }

  // Otherwise wait for network
  log(`Fetching from network: ${request.url}`);
  return networkPromise;
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      log(`Network response cached: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    log(`Network failed, trying cache: ${request.url}`, error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      log(`Served from cache: ${request.url}`);
      return cachedResponse;
    }
    throw error;
  }
}

// Service worker event listeners
self.addEventListener('install', (event) => {
  log('Installing service worker');

  event.waitUntil(
    (async () => {
      await precacheAppShell();
      await self.skipWaiting(); // Take control immediately
    })(),
  );
});

self.addEventListener('activate', (event) => {
  log('Activating service worker');

  event.waitUntil(
    (async () => {
      await cleanupOldCaches();
      await self.clients.claim(); // Take control of all pages
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-http requests and development-specific requests
  if (!shouldCacheRequest(request)) {
    return;
  }

  // 🔥 DEVELOPMENT MODE: Completely bypass service worker
  if (IS_DEVELOPMENT) {
    log('🚫 Development mode: Service worker bypassing all requests');
    return; // Let browser handle everything normally
  }

  // Handle navigation requests (page loads) - PRODUCTION ONLY
  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          // Try network first for navigation
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          log('Navigation request failed, serving app shell', error);
          // Serve cached app shell as fallback
          const cache = await caches.open(CACHE_NAMES.APP_SHELL);
          const cachedResponse = await cache.match('/');
          return cachedResponse || new Response('Offline', { status: 503 });
        }
      })(),
    );
    return;
  }

  // Handle API requests - even in development for offline functionality
  if (request.url.includes('/api/')) {
    const strategy = getApiCacheStrategy(request.url);

    event.respondWith(
      (async () => {
        switch (strategy) {
          case 'CACHE_FIRST':
            return cacheFirstStrategy(request, CACHE_NAMES.API_CACHE);

          case 'STALE_WHILE_REVALIDATE':
            return staleWhileRevalidateStrategy(request, CACHE_NAMES.API_CACHE);

          case 'NETWORK_FIRST':
            return networkFirstStrategy(request, CACHE_NAMES.API_CACHE);

          default:
            // Network only for unknown APIs
            return fetch(request);
        }
      })(),
    );
    return;
  }

  // Handle static assets (images, etc.) - lighter caching in development
  if (request.destination === 'image') {
    event.respondWith(
      IS_DEVELOPMENT
        ? fetch(request) // No caching in development
        : cacheFirstStrategy(request, CACHE_NAMES.IMAGES),
    );
    return;
  }

  // Handle other static resources - lighter caching in development
  if (request.method === 'GET') {
    event.respondWith(
      IS_DEVELOPMENT
        ? fetch(request) // No caching in development
        : staleWhileRevalidateStrategy(request, CACHE_NAMES.STATIC),
    );
    return;
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  log(`Background sync triggered: ${event.tag}`);

  switch (event.tag) {
    case SYNC_TAGS.MEAL_LOG:
      event.waitUntil(handleMealLogSync());
      break;

    default:
      log(`Unknown sync tag: ${event.tag}`);
  }
});

// Handle meal log synchronization
async function handleMealLogSync() {
  try {
    log('Starting meal log sync...');

    // Get pending meal logs from IndexedDB
    const pendingLogs = await getPendingMealLogs();

    for (const logEntry of pendingLogs) {
      try {
        const response = await fetch('/api/log-meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry.data),
        });

        if (response.ok) {
          await removePendingMealLog(logEntry.id);
          log(`Successfully synced meal log: ${logEntry.id}`);
        } else {
          log(`Failed to sync meal log: ${logEntry.id}`, response.status);
        }
      } catch (error) {
        log(`Error syncing meal log: ${logEntry.id}`, error);
      }
    }

    log('Meal log sync completed');
  } catch (error) {
    log('Meal log sync failed:', error);
  }
}

// IndexedDB helpers for offline functionality
async function getPendingMealLogs() {
  // Implementation would go here
  return [];
}

async function removePendingMealLog(id) {
  // Implementation would go here
}

// Push notifications (keeping your existing functionality)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Progress Planner';
  const options = {
    body: data.body || 'Gentle reminder: log your meal, love! 💖',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192.png',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
    vibrate: [200, 100, 200],
    tag: 'meal-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(urlToOpen);
      }),
  );
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

log(`Service worker script loaded - Development mode: ${IS_DEVELOPMENT}`);
