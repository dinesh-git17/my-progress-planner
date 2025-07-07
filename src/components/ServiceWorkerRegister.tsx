// src/components/ServiceWorkerRegister.tsx
'use client';

import { useEffect, useState } from 'react';

// Extend ServiceWorkerRegistration interface to include sync
/* eslint-disable no-unused-vars */
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}
/* eslint-enable no-unused-vars */

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export default function ServiceWorkerRegister() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    updateAvailable: false,
    registration: null,
  });

  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    setSwState((prev) => ({ ...prev, isSupported: true }));

    // Register service worker
    registerServiceWorker();

    // Setup online/offline detection
    setupOnlineOfflineDetection();

    // Cleanup function
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('🔧 Registering service worker...');

      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/',
          updateViaCache: 'none', // Always check for updates
        },
      );

      console.log('✅ Service worker registered successfully');

      setSwState((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
      }));

      // Setup update detection
      setupUpdateDetection(registration);

      // Setup messaging with service worker
      setupServiceWorkerMessaging(registration);
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  };

  const setupUpdateDetection = (registration: ServiceWorkerRegistration) => {
    // Check for updates on page load
    registration.update();

    // Listen for new service worker installing
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        console.log('🔄 New service worker found, installing...');

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

    // Listen for service worker taking control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      // Reload the page to ensure latest version
      window.location.reload();
    });

    // Check for updates periodically (every 30 minutes)
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
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Message from service worker:', event.data);

      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('📦 Cache updated for:', event.data.url);
      }

      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        console.log('🔄 Background sync completed');
      }
    });

    // Log registration for debugging
    console.log('🔗 Service worker messaging setup for:', registration.scope);
  };

  const setupOnlineOfflineDetection = () => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setSwState((prev) => ({ ...prev, isOnline }));

      if (isOnline) {
        console.log('🌐 App is online');
        // Trigger background sync when coming back online
        triggerBackgroundSync();
      } else {
        console.log('📴 App is offline');
      }
    };

    // Initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  };

  const triggerBackgroundSync = () => {
    if ('serviceWorker' in navigator && swState.registration?.sync) {
      navigator.serviceWorker.ready
        .then((reg) => {
          return reg.sync?.register('meal-log-sync');
        })
        .catch((error) => {
          console.warn('Background sync not supported or failed:', error);
        });
    }
  };

  const handleUpdateApp = async () => {
    if (swState.registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
    setSwState((prev) => ({ ...prev, updateAvailable: false }));
  };

  // Only render update prompt if there's an update available
  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <>
      {/* Update Available Prompt */}
      <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/60">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-sm mb-1">
                App Update Available
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                A new version of the app is ready with improvements and bug
                fixes.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateApp}
                  className="
                    px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 
                    text-white text-xs font-medium rounded-lg 
                    hover:scale-105 transition-transform
                  "
                >
                  Update Now
                </button>
                <button
                  onClick={handleDismissUpdate}
                  className="
                    px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium 
                    rounded-lg hover:bg-gray-200 transition-colors
                  "
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Indicator */}
      {!swState.isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
          <div className="bg-orange-100 border border-orange-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-orange-700">
                You're offline - changes will sync when connected
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
