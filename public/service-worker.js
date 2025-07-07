// public/service-worker.js
// Industry-standard service worker for meal tracking PWA

const CACHE_VERSION = 'v1.0.0';
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
      request.headers.get('accept').includes('text/html'))
  );
}

function shouldCacheRequest(request) {
  // Don't cache chrome-extension, chrome:// or other non-http requests
  return (
    request.url.startsWith('http') &&
    !request.url.includes('chrome-extension') &&
    !request.url.includes('chrome://')
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
        log(`Updated cache: ${request.url}`);
      }
      return response;
    })
    .catch((error) => {
      log(`Background fetch failed: ${request.url}`, error);
      return null;
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    log(`Serving from cache: ${request.url}`);
    return cachedResponse;
  }

  // Wait for network if no cache available
  return networkPromise;
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      log(`Network first success: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    log(`Network first failed, trying cache: ${request.url}`, error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      log(`Fallback to cache: ${request.url}`);
      return cachedResponse;
    }

    throw error;
  }
}

// Background sync handlers
async function handleMealLogSync() {
  log('Processing meal log background sync');

  try {
    // Get pending meal logs from IndexedDB
    const pendingLogs = await getPendingMealLogs();

    for (const logData of pendingLogs) {
      try {
        const response = await fetch('/api/log-meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData.data),
        });

        if (response.ok) {
          await removePendingMealLog(logData.id);
          log(`Synced meal log: ${logData.id}`);
        }
      } catch (error) {
        log(`Failed to sync meal log: ${logData.id}`, error);
      }
    }
  } catch (error) {
    log('Background sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers for background sync
async function getPendingMealLogs() {
  return new Promise((resolve) => {
    const request = indexedDB.open('MealTrackerOfflineDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingMealLogs')) {
        resolve([]);
        return;
      }

      const transaction = db.transaction(['pendingMealLogs'], 'readonly');
      const store = transaction.objectStore('pendingMealLogs');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        resolve([]);
      };
    };

    request.onerror = () => {
      resolve([]);
    };
  });
}

async function removePendingMealLog(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('MealTrackerOfflineDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingMealLogs')) {
        resolve();
        return;
      }

      const transaction = db.transaction(['pendingMealLogs'], 'readwrite');
      const store = transaction.objectStore('pendingMealLogs');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        log(`Removed pending log: ${id}`);
        resolve();
      };

      deleteRequest.onerror = () => {
        resolve(); // Don't fail the sync
      };
    };

    request.onerror = () => {
      resolve(); // Don't fail the sync
    };
  });
}

// Service Worker Event Handlers

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

  // Skip non-http requests
  if (!shouldCacheRequest(request)) {
    return;
  }

  // Handle navigation requests (page loads)
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

  // Handle API requests
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

  // Handle static assets (images, etc.)
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.IMAGES));
    return;
  }

  // Handle other static resources
  if (request.method === 'GET') {
    event.respondWith(
      staleWhileRevalidateStrategy(request, CACHE_NAMES.STATIC),
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

log('Service worker script loaded');
