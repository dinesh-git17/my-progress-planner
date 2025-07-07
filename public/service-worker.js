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
  NETWORK_FIRST: [/\/api\/log-meal/, /\/api\/gpt\/meal-chat/],
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

  await Promise.all(
    cacheNames
      .filter((cacheName) => !currentCaches.includes(cacheName))
      .map((cacheName) => {
        log(`Deleting old cache: ${cacheName}`);
        return caches.delete(cacheName);
      }),
  );
}

// Install event - cache app shell
self.addEventListener('install', (event) => {
  log('Installing service worker');

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.APP_SHELL).then((cache) => {
        log('Caching app shell resources');
        return cache.addAll(APP_SHELL_URLS);
      }),
      cleanupOldCaches(),
    ]),
  );

  // Take control immediately
  self.skipWaiting();
});

// Activate event - cleanup and take control
self.addEventListener('activate', (event) => {
  log('Activating service worker');

  event.waitUntil(Promise.all([cleanupOldCaches(), self.clients.claim()]));
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests
  if (!shouldCacheRequest(request)) {
    return;
  }

  // Handle different types of requests
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Navigation request handler - always serve app shell
async function handleNavigationRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAMES.APP_SHELL);
    return (await cache.match('/')) || fetch(request);
  } catch (error) {
    log('Navigation request failed', error);
    return new Response('App offline', { status: 503 });
  }
}

// API request handler - strategy based on endpoint
async function handleApiRequest(request) {
  const strategy = getApiCacheStrategy(request.url);
  const cache = await caches.open(CACHE_NAMES.API_CACHE);

  switch (strategy) {
    case 'CACHE_FIRST':
      return handleCacheFirst(request, cache);
    case 'STALE_WHILE_REVALIDATE':
      return handleStaleWhileRevalidate(request, cache);
    case 'NETWORK_FIRST':
      return handleNetworkFirst(request, cache);
    default:
      return fetch(request);
  }
}

// Cache strategies
async function handleCacheFirst(request, cache) {
  try {
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

async function handleStaleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function handleNetworkFirst(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

// Image request handler
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.IMAGES);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Image offline', { status: 503 });
  }
}

// Static resource handler
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || new Response('Resource offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  log(`Background sync: ${event.tag}`);

  if (event.tag === SYNC_TAGS.MEAL_LOG) {
    event.waitUntil(syncMealLogs());
  } else if (event.tag === SYNC_TAGS.USER_DATA) {
    event.waitUntil(syncUserData());
  }
});

// Sync functions
async function syncMealLogs() {
  try {
    // Implementation for syncing offline meal logs
    log('Syncing meal logs');
  } catch (error) {
    log('Meal log sync failed', error);
  }
}

async function syncUserData() {
  try {
    // Implementation for syncing user data
    log('Syncing user data');
  } catch (error) {
    log('User data sync failed', error);
  }
}
