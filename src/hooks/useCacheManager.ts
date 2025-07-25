// src/hooks/useCacheManager.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_VERSION_KEY = 'meals_app_cache_version';
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '2.1.0';

// ============================================================================
// TYPES
// ============================================================================

interface CacheManagerState {
  isUpdateAvailable: boolean;
  currentVersion: string;
  storedVersion: string | null;
  isLoading: boolean;
  lastCheckedAt: number | null;
}

interface CacheManagerHook {
  isUpdateAvailable: boolean;
  currentVersion: string;
  storedVersion: string | null;
  isLoading: boolean;
  forceUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  checkForUpdates: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get stored cache version from localStorage
 */
function getStoredVersion(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(CACHE_VERSION_KEY);
  } catch (error) {
    console.warn('Failed to read stored cache version:', error);
    return null;
  }
}

/**
 * Store cache version in localStorage
 */
function setStoredVersion(version: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_VERSION_KEY, version);
  } catch (error) {
    console.warn('Failed to store cache version:', error);
  }
}

/**
 * Clear all app caches while preserving essential user data
 */
async function clearAppCaches(): Promise<void> {
  // Preserve essential user data before clearing
  const essentialData = preserveEssentialData();

  try {
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
      console.log('✅ Service worker caches cleared');
    }

    // Clear localStorage except for essential data
    if (typeof window !== 'undefined') {
      // Get all localStorage keys
      const keysToPreserve = [
        'meals_user_id',
        'meals_auth_token',
        'meals_user_name',
        'meals_user_session',
        CACHE_VERSION_KEY, // Keep the version after update
      ];

      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToPreserve.includes(key) && !key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ localStorage cleaned (preserved essential data)');
    }

    // Clear sessionStorage (less critical)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
    }

    // Restore essential data
    restoreEssentialData(essentialData);
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    // Restore data even if clearing failed
    restoreEssentialData(essentialData);
    throw error;
  }
}

/**
 * Preserve essential user data before cache clearing
 */
function preserveEssentialData(): Record<string, string | null> {
  if (typeof window === 'undefined') return {};

  const essentialKeys = [
    'meals_user_id',
    'meals_auth_token',
    'meals_user_name',
    'meals_user_session',
  ];

  const preserved: Record<string, string | null> = {};

  essentialKeys.forEach((key) => {
    try {
      preserved[key] = localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to preserve ${key}:`, error);
    }
  });

  return preserved;
}

/**
 * Restore essential user data after cache clearing
 */
function restoreEssentialData(data: Record<string, string | null>): void {
  if (typeof window === 'undefined') return;

  Object.entries(data).forEach(([key, value]) => {
    try {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Failed to restore ${key}:`, error);
    }
  });
}

/**
 * Check if service worker needs updating
 */
async function checkServiceWorkerUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    // Force check for updates
    await registration.update();

    // Check if there's a waiting worker
    return !!registration.waiting;
  } catch (error) {
    console.warn('Service worker update check failed:', error);
    return false;
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useCacheManager(): CacheManagerHook {
  const [state, setState] = useState<CacheManagerState>({
    isUpdateAvailable: false,
    currentVersion: CURRENT_VERSION,
    storedVersion: null,
    isLoading: true,
    lastCheckedAt: null,
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  useEffect(() => {
    const initializeVersionCheck = async () => {
      const storedVersion = getStoredVersion();
      const hasVersionChanged =
        storedVersion && storedVersion !== CURRENT_VERSION;

      // Check for service worker updates
      const hasServiceWorkerUpdate = await checkServiceWorkerUpdate();

      setState((prev) => ({
        ...prev,
        storedVersion,
        isUpdateAvailable: hasVersionChanged || hasServiceWorkerUpdate,
        isLoading: false,
        lastCheckedAt: Date.now(),
      }));

      // If this is the first time or version changed, update stored version
      if (!storedVersion || hasVersionChanged) {
        console.log('🔄 Version change detected:', {
          stored: storedVersion,
          current: CURRENT_VERSION,
        });
      }
    };

    initializeVersionCheck();
  }, []);

  // ========================================================================
  // PERIODIC UPDATE CHECKS
  // ========================================================================

  useEffect(() => {
    // Check for updates every 5 minutes
    const interval = setInterval(
      async () => {
        const hasServiceWorkerUpdate = await checkServiceWorkerUpdate();

        if (hasServiceWorkerUpdate) {
          setState((prev) => ({
            ...prev,
            isUpdateAvailable: true,
            lastCheckedAt: Date.now(),
          }));
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // ========================================================================
  // CACHE MANAGEMENT ACTIONS
  // ========================================================================

  const forceUpdate = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log('🔄 Starting forced cache update...');

      // Clear all caches
      await clearAppCaches();

      // Update stored version
      setStoredVersion(CURRENT_VERSION);

      // Skip waiting service worker if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      console.log('✅ Cache update completed, reloading...');

      // Force reload to get fresh content
      window.location.reload();
    } catch (error) {
      console.error('❌ Force update failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));

      // Still try to reload even if cache clearing failed
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isUpdateAvailable: false,
    }));

    // Update stored version to current version to prevent showing again
    setStoredVersion(CURRENT_VERSION);
  }, []);

  const checkForUpdates = useCallback(async () => {
    const hasServiceWorkerUpdate = await checkServiceWorkerUpdate();

    setState((prev) => ({
      ...prev,
      isUpdateAvailable: hasServiceWorkerUpdate,
      lastCheckedAt: Date.now(),
    }));
  }, []);

  // ========================================================================
  // RETURN INTERFACE
  // ========================================================================

  return {
    isUpdateAvailable: state.isUpdateAvailable,
    currentVersion: state.currentVersion,
    storedVersion: state.storedVersion,
    isLoading: state.isLoading,
    forceUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}
