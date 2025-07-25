// src/components/ServiceWorkerRegister.tsx
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

            // 🎯 INSTEAD OF AUTO-RELOAD: Send message to cache manager
            // The useCacheManager hook will handle showing the update notification
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { newWorker, registration },
              }),
            );
          }
        });
      }
    });

    // 🚨 REMOVED AUTO-RELOAD - Let user control updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      // ❌ REMOVED: window.location.reload();
      // ✅ NEW: This only happens when user chooses to update
      console.log('✅ App updated successfully');
    });

    // Check for updates every 30 minutes (background)
    setInterval(
      () => {
        console.log('🔍 Checking for service worker updates...');
        registration.update();
      },
      30 * 60 * 1000,
    );

    // Check for updates when app becomes visible (user returns)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👁️ App became visible - checking for updates...');
        registration.update();
      }
    });
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

      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        console.log('🆕 Update notification from service worker');
        setSwState((prev) => ({ ...prev, updateAvailable: true }));
      }
    });
  };

  const setupOnlineOfflineDetection = () => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setSwState((prev) => ({ ...prev, isOnline }));

      if (isOnline) {
        console.log('🌐 App came online');
      } else {
        console.log('📱 App went offline');
      }
    };

    // Initial status
    updateOnlineStatus();

    // Listen for changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  // Don't render anything - this is just a service component
  return null;
}
