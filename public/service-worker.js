// public/service-worker.js
// Industry-standard service worker for meal tracking PWA

const CACHE_VERSION = 'v2.1.0';
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
  NETWORK_FIRST: [
    /\/api\/gpt\/meal-chat/,
    /\/api\/gpt\/summary/,
    /\/api\/admin\//,
  ],
};

// Background sync tag names
const SYNC_TAGS = {
  MEAL_DATA: 'meal-data-sync',
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

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAMES.APP_SHELL);

  // Only cache in production
  if (!IS_DEVELOPMENT) {
    await cache.addAll(APP_SHELL_URLS);
    log('App shell precached');
  }
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_NAMES);

  await Promise.all(
    cacheNames.map(async (cacheName) => {
      if (!currentCaches.includes(cacheName)) {
        log(`Deleting old cache: ${cacheName}`);
        await caches.delete(cacheName);
      }
    }),
  );
}

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
      log(`Network response cached: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    log(`Network failed: ${request.url}`, error);
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
    event.respondWith(
      IS_DEVELOPMENT
        ? fetch(request) // No caching in development
        : cacheFirstStrategy(request, CACHE_NAMES.IMAGES),
    );
    return;
  }

  // Handle other static resources
  if (request.method === 'GET') {
    event.respondWith(
      IS_DEVELOPMENT
        ? fetch(request) // No caching in development
        : staleWhileRevalidateStrategy(request, CACHE_NAMES.STATIC),
    );
    return;
  }
});

// Background sync - UPDATED for  actual architecture
self.addEventListener('sync', (event) => {
  log(`Background sync triggered: ${event.tag}`);

  switch (event.tag) {
    case SYNC_TAGS.MEAL_DATA:
      event.waitUntil(handleMealDataSync());
      break;

    default:
      log(`Unknown sync tag: ${event.tag}`);
  }
});

// UPDATED: Handle meal data synchronization using  actual flow
async function handleMealDataSync() {
  try {
    log('Starting meal data sync...');

    // Get pending meal data from IndexedDB
    const pendingMealData = await getPendingMealData();

    for (const mealEntry of pendingMealData) {
      try {
        // Sync using  actual meal logging flow
        const success = await syncMealEntry(mealEntry);

        if (success) {
          await removePendingMealData(mealEntry.id);
          log(`Successfully synced meal data: ${mealEntry.id}`);
        } else {
          log(`Failed to sync meal data: ${mealEntry.id}`);
        }
      } catch (error) {
        log(`Error syncing meal data: ${mealEntry.id}`, error);
      }
    }

    log('Meal data sync completed');
  } catch (error) {
    log('Meal data sync failed:', error);
  }
}

// UPDATED: Sync using  actual architecture
async function syncMealEntry(mealEntry) {
  try {
    const { userId, userName, meal, chatMessages, generateSummary } = mealEntry;

    // Extract user answers and bot responses from chat
    const userAnswers = chatMessages
      .filter((m) => m.sender === 'user')
      .map((m) => m.text);

    const gptResponses = chatMessages
      .filter((m) => m.sender === 'bot')
      .map((m) => m.text);

    // Step 1: Save meal data using new upsert API
    const mealLogResponse = await fetch('/api/meals/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name: userName,
        meal: meal,
        answers: userAnswers,
        gpt_responses: gptResponses,
      }),
    });

    if (!mealLogResponse.ok) {
      const errorText = await mealLogResponse.text();
      log(`Meal upsert failed: ${errorText}`);
      return false;
    }

    log(`Successfully saved meal data for ${meal}`);

    // Step 2: Generate summary if requested
    if (generateSummary && userAnswers.length > 0) {
      const summaryResponse = await fetch('/api/gpt/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName,
          meal: meal,
          answers: userAnswers,
        }),
      });

      if (!summaryResponse.ok) {
        log('Summary generation failed, but meal data saved successfully');
        // Don't fail the whole sync if summary fails
      } else {
        log(`Successfully generated summary for ${meal}`);
      }
    }

    return true;
  } catch (error) {
    log('Error in syncMealEntry:', error);
    return false;
  }
}

// IndexedDB helpers for offline functionality - UPDATED interface
async function getPendingMealData() {
  // This would interface with  updated IndexedDB structure
  // For now, return empty array (implement in sw-utils.ts)
  return [];
}

async function removePendingMealData(id) {
  // This would remove the synced meal data from IndexedDB
  // Implementation in sw-utils.ts
}

// Push notifications (keeping  existing functionality)
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

  // Get the URL to open from notification data
  let urlToOpen = '/'; // Default fallback

  if (event.notification.data) {
    if (typeof event.notification.data === 'string') {
      urlToOpen = event.notification.data;
    } else if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }
  }

  console.log('🔔 Notification clicked, navigating to:', urlToOpen);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if we already have a window open with the target URL
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            console.log(
              '📱 Focusing existing window and navigating to:',
              urlToOpen,
            );
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
            });
            return client.focus();
          }
        }

        // No existing window found, open a new one
        console.log('🆕 Opening new window at:', urlToOpen);
        const fullUrl = self.location.origin + urlToOpen;
        return self.clients.openWindow(fullUrl);
      })
      .catch((error) => {
        console.error('❌ Error handling notification click:', error);
        // Fallback: try to open a new window
        const fullUrl = self.location.origin + urlToOpen;
        return self.clients.openWindow(fullUrl);
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
