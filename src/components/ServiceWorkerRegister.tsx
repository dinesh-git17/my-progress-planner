'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
}

export default function ServiceWorkerRegister() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isOnline: true,
    updateAvailable: false,
  });
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // 🔥 CRITICAL: Skip service worker entirely in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '🚫 Development mode: Service worker disabled to prevent caching issues',
      );

      // Unregister any existing service workers in development
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            console.log('🗑️ Unregistered existing service worker');
          });
        });
      }

      return;
    }

    // Only register in production
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('🔄 Registering service worker (production only)...');

      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/',
          updateViaCache: 'none', // Always check for updates
        },
      );

      console.log('✅ Service worker registered:', registration.scope);
      setSwState((prev) => ({ ...prev, isRegistered: true }));

      // Set up update detection
      setupUpdateDetection(registration);
      setupServiceWorkerMessaging(registration);
      setupOnlineOfflineDetection();
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  };

  const setupUpdateDetection = (registration: ServiceWorkerRegistration) => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('🆕 New service worker installing...');

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('✨ New service worker installed, update available');
            setSwState((prev) => ({ ...prev, updateAvailable: true }));
            setShowUpdatePrompt(true);
          }
        });
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      window.location.reload();
    });

    // Check for updates every 30 minutes
    setInterval(
      () => {
        registration.update();
      },
      30 * 60 * 1000,
    );
  };

  const setupServiceWorkerMessaging = (
    registration: ServiceWorkerRegistration,
  ) => {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Message from service worker:', event.data);

      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('📦 Cache updated for:', event.data.url);
      }

      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        console.log('🔄 Background sync completed');
      }
    });
  };

  const setupOnlineOfflineDetection = () => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setSwState((prev) => ({ ...prev, isOnline }));

      if (isOnline) {
        console.log('🌐 App is online');
        triggerBackgroundSync();
      } else {
        console.log('📴 App is offline');
      }
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  const triggerBackgroundSync = async () => {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register('meal-log-sync');
          console.log('🔄 Background sync registered');
        }
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  };

  const handleUpdateApp = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Show update prompt only in production
  if (showUpdatePrompt && process.env.NODE_ENV === 'production') {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">Update Available</h3>
            <p className="text-sm opacity-90">
              A new version of the app is ready. Restart to get the latest
              features.
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleUpdateApp}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
            >
              Update
            </button>
            <button
              onClick={handleDismissUpdate}
              className="text-white/80 hover:text-white px-2 py-1 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
