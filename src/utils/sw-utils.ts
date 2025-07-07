// src/utils/sw-utils.ts
// Service Worker utility functions for industry-standard PWA

// Extend global interfaces for TypeScript support
/* eslint-disable no-unused-vars */
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }

  interface Navigator {
    storage?: {
      estimate(): Promise<{ usage?: number; quota?: number }>;
    };
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}
/* eslint-enable no-unused-vars */

export interface PendingMealLog {
  id: string;
  timestamp: number;
  data: {
    user_id: string;
    meal: 'breakfast' | 'lunch' | 'dinner';
    entries: string[];
    date: string;
  };
}

export interface ServiceWorkerInfo {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  version: string | null;
}

/**
 * Check if service workers are supported in the current browser
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if the app is currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get information about the current service worker
 */
export async function getServiceWorkerInfo(): Promise<ServiceWorkerInfo> {
  if (!isServiceWorkerSupported()) {
    return {
      isSupported: false,
      isRegistered: false,
      registration: null,
      version: null,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    let version = null;

    if (registration?.active) {
      // Get version from service worker
      version = await getServiceWorkerVersion(registration.active);
    }

    return {
      isSupported: true,
      isRegistered: !!registration,
      registration: registration || null,
      version,
    };
  } catch (error) {
    console.error('Error getting service worker info:', error);
    return {
      isSupported: true,
      isRegistered: false,
      registration: null,
      version: null,
    };
  }
}

/**
 * Get the version of the active service worker
 */
export async function getServiceWorkerVersion(
  serviceWorker: ServiceWorker,
): Promise<string | null> {
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data?.version || null);
    };

    serviceWorker.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Trigger a background sync for meal logs
 */
export async function triggerMealLogSync(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    console.warn(
      'Background sync not supported - service workers not available',
    );
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration.sync) {
      console.warn('Background sync not supported by browser');
      return false;
    }

    await registration.sync.register('meal-log-sync');
    console.log('🔄 Background sync registered for meal logs');
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    return false;
  }
}

/**
 * Simple IndexedDB wrapper for offline storage
 */
export class OfflineStorage {
  private dbName = 'MealTrackerOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for offline data
        if (!db.objectStoreNames.contains('pendingMealLogs')) {
          const mealLogsStore = db.createObjectStore('pendingMealLogs', {
            keyPath: 'id',
          });
          mealLogsStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' });
        }
      };
    });
  }

  async addPendingMealLog(
    mealLog: Omit<PendingMealLog, 'id' | 'timestamp'>,
  ): Promise<string> {
    if (!this.db) await this.init();

    const id = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingLog: PendingMealLog = {
      id,
      timestamp: Date.now(),
      data: mealLog.data,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pendingMealLogs'],
        'readwrite',
      );
      const store = transaction.objectStore('pendingMealLogs');
      const request = store.add(pendingLog);

      request.onsuccess = () => {
        console.log('📱 Meal log saved offline:', id);
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingMealLogs(): Promise<PendingMealLog[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingMealLogs'], 'readonly');
      const store = transaction.objectStore('pendingMealLogs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingMealLog(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pendingMealLogs'],
        'readwrite',
      );
      const store = transaction.objectStore('pendingMealLogs');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ Pending meal log removed:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllPendingLogs(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pendingMealLogs'],
        'readwrite',
      );
      const store = transaction.objectStore('pendingMealLogs');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 All pending meal logs cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setUserPreference(key: string, value: unknown): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['userPreferences'],
        'readwrite',
      );
      const store = transaction.objectStore('userPreferences');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserPreference(key: string): Promise<unknown> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userPreferences'], 'readonly');
      const store = transaction.objectStore('userPreferences');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Singleton instance of offline storage
 */
export const offlineStorage = new OfflineStorage();

/**
 * Cache management utilities
 */
export class CacheManager {
  /**
   * Get cache usage information
   */
  static async getCacheUsage(): Promise<{
    used: number;
    quota: number;
  } | null> {
    if (!navigator.storage?.estimate) {
      console.warn('Storage estimation not supported');
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      console.error('Error getting cache usage:', error);
      return null;
    }
  }

  /**
   * Clear all application caches
   */
  static async clearAllCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log(`🧹 Clearing cache: ${cacheName}`);
          return caches.delete(cacheName);
        }),
      );
    }
  }

  /**
   * Get list of cached URLs
   */
  static async getCachedUrls(): Promise<string[]> {
    if (!('caches' in window)) return [];

    const cacheNames = await caches.keys();
    const allUrls: string[] = [];

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      allUrls.push(...requests.map((request) => request.url));
    }

    return allUrls;
  }
}

/**
 * Network status utilities
 */
export class NetworkStatus {
  private static listeners: (() => void)[] = [];

  static init() {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
      this.listeners.forEach((listener) => listener());
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  }

  static addListener(listener: () => void) {
    this.listeners.push(listener);
    console.log(
      `Added network status listener. Total listeners: ${this.listeners.length}`,
    );
  }

  static removeListener(listener: () => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log(
        `Removed network status listener. Total listeners: ${this.listeners.length}`,
      );
    }
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      // Ping your API to check real connectivity
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  /**
   * Measure service worker installation time
   */
  static measureInstallTime(): void {
    if ('serviceWorker' in navigator) {
      const startTime = performance.now();

      navigator.serviceWorker.ready.then(() => {
        const installTime = performance.now() - startTime;
        console.log(`⚡ Service worker ready in ${installTime.toFixed(2)}ms`);

        // You could send this to analytics
        if ('gtag' in window) {
          (window as any).gtag('event', 'sw_install_time', {
            value: Math.round(installTime),
            custom_parameter: 'service_worker_performance',
          });
        }
      });
    }
  }

  /**
   * Monitor cache hit rates
   */
  static monitorCacheHits(url: string, wasFromCache: boolean): void {
    console.log(
      `${wasFromCache ? '💾' : '🌐'} ${url} - ${wasFromCache ? 'Cache Hit' : 'Network'}`,
    );

    // Track cache hit rates
    const key = wasFromCache ? 'cache_hits' : 'cache_misses';
    const currentCount = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (currentCount + 1).toString());
  }

  /**
   * Get cache performance stats
   */
  static getCacheStats(): { hits: number; misses: number; hitRate: number } {
    const hits = parseInt(localStorage.getItem('cache_hits') || '0');
    const misses = parseInt(localStorage.getItem('cache_misses') || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    return { hits, misses, hitRate };
  }
}

/**
 * PWA installation utilities
 */
export class PWAInstaller {
  private static deferredPrompt: Event | null = null;

  static init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('💾 PWA install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      this.deferredPrompt = null;

      // Track installation
      if ('gtag' in window) {
        (window as any).gtag('event', 'pwa_installed', {
          custom_parameter: 'app_installation',
        });
      }
    });
  }

  static canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  static async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    try {
      // Type assertion for the prompt method
      (this.deferredPrompt as any).prompt();
      const { outcome } = await (this.deferredPrompt as any).userChoice;

      console.log(`PWA install prompt: ${outcome}`);
      this.deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error) {
      console.error('Error prompting PWA install:', error);
      return false;
    }
  }

  static isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true
    );
  }
}

/**
 * Offline-first meal logging
 */
export async function logMealOfflineFirst(mealData: {
  user_id: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
  entries: string[];
  date: string;
}): Promise<{ success: boolean; offline: boolean; id?: string }> {
  // Try network first if online
  if (navigator.onLine) {
    try {
      const response = await fetch('/api/log-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });

      if (response.ok) {
        console.log('✅ Meal logged successfully online');
        return { success: true, offline: false };
      }
    } catch (error) {
      console.warn(
        'Network request failed, falling back to offline storage:',
        error,
      );
    }
  }

  // Fallback to offline storage
  try {
    const id = await offlineStorage.addPendingMealLog({ data: mealData });

    // Register background sync
    await triggerMealLogSync();

    console.log('📱 Meal logged offline, will sync when online');
    return { success: true, offline: true, id };
  } catch (error) {
    console.error('Failed to log meal offline:', error);
    return { success: false, offline: true };
  }
}

/**
 * Get pending sync count for UI
 */
export async function getPendingSyncCount(): Promise<number> {
  try {
    const pendingLogs = await offlineStorage.getPendingMealLogs();
    return pendingLogs.length;
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    return 0;
  }
}
