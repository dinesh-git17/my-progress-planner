// src/utils/sw-utils.ts
// Updated utilities for meal tracking PWA with proper architecture

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get service worker registration info
 */
export async function getServiceWorkerInfo(): Promise<{
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  version: string | null;
}> {
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
    const version = registration?.active
      ? await getServiceWorkerVersion(registration.active)
      : null;

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
 * Trigger a background sync for meal data
 */
export async function triggerMealDataSync(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    console.warn(
      'Background sync not supported - service workers not available',
    );
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Type assertion for background sync support
    const syncRegistration = registration as any;

    if (!syncRegistration.sync) {
      console.warn('Background sync not supported by browser');
      return false;
    }

    await syncRegistration.sync.register('meal-data-sync');
    console.log('🔄 Background sync registered for meal data');
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    return false;
  }
}

/**
 * Enhanced IndexedDB wrapper for offline meal data storage
 */
export class OfflineStorage {
  private dbName = 'MealTrackerOfflineDB';
  private version = 3; // Increment version to trigger upgrade
  private db: IDBDatabase | null = null;
  private initialized = false;

  async init(): Promise<void> {
    // Prevent multiple initializations
    if (this.initialized && this.db) {
      return;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Delete old stores if they exist
        if (db.objectStoreNames.contains('pendingMealLogs')) {
          db.deleteObjectStore('pendingMealLogs');
        }
        if (db.objectStoreNames.contains('pendingMealData')) {
          db.deleteObjectStore('pendingMealData');
        }

        // Create fresh store for enhanced meal data
        const mealDataStore = db.createObjectStore('pendingMealData', {
          keyPath: 'id',
          autoIncrement: true,
        });

        mealDataStore.createIndex('timestamp', 'timestamp', { unique: false });
        mealDataStore.createIndex('userId', 'userId', { unique: false });
        mealDataStore.createIndex('meal', 'meal', { unique: false });
        mealDataStore.createIndex('environment', 'environment', {
          unique: false,
        });

        console.log('📦 IndexedDB schema updated with clean slate');
      };
    });
  }

  /**
   * Add pending meal data for offline sync
   */
  async addPendingMealData(mealData: {
    userId: string;
    userName: string;
    meal: string;
    chatMessages: Array<{ sender: string; text: string; timestamp: number }>;
    timestamp: number;
    generateSummary?: boolean;
  }): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pendingMealData'],
        'readwrite',
      );
      const store = transaction.objectStore('pendingMealData');

      const mealEntry = {
        ...mealData,
        timestamp: Date.now(),
        synced: false,
      };

      const request = store.add(mealEntry);

      request.onsuccess = () => {
        console.log('📱 Meal data stored offline:', request.result);
        resolve(request.result as number);
      };

      request.onerror = () => {
        console.error('Failed to store meal data offline:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending meal data for sync
   */
  async getPendingMealData(): Promise<
    Array<{
      id: number;
      userId: string;
      userName: string;
      meal: string;
      chatMessages: Array<{ sender: string; text: string; timestamp: number }>;
      timestamp: number;
      synced: boolean;
      generateSummary?: boolean;
    }>
  > {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingMealData'], 'readonly');
      const store = transaction.objectStore('pendingMealData');
      const request = store.getAll();

      request.onsuccess = () => {
        const allData = request.result || [];
        const pendingData = allData.filter((item) => !item.synced);
        resolve(pendingData);
      };

      request.onerror = () => {
        console.error('Failed to get pending meal data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove synced meal data
   */
  async removePendingMealData(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pendingMealData'],
        'readwrite',
      );
      const store = transaction.objectStore('pendingMealData');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Removed synced meal data:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove meal data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all offline data (for debugging/reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['pendingMealData'],
        'readwrite',
      );
      const store = transaction.objectStore('pendingMealData');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 Cleared all offline meal data');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear offline data:', request.error);
        reject(request.error);
      };
    });
  }
}

/**
 * Clear all offline data when switching between environments
 */
export async function clearOfflineDataOnEnvironmentChange(): Promise<void> {
  try {
    await offlineStorage.init();
    await offlineStorage.clearAllData();
    console.log('🧹 Cleared offline data for environment change');
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

/**
 * Enhanced meal logging with fallback to offline storage
 * Works with your actual MealChat architecture
 */
export async function logMealWithFallback(mealData: {
  userId: string;
  userName: string;
  meal: string;
  chatMessages: Array<{ sender: string; text: string; timestamp: number }>;
  generateSummary?: boolean;
}): Promise<{ success: boolean; offline: boolean; id?: string | number }> {
  // Try online first if connected
  if (navigator.onLine) {
    try {
      // This would need to be adapted to work with your upsertMealLog function
      // For now, we'll store offline as this requires more integration
      console.log('🌐 Online but storing offline for manual sync');

      // In a full implementation, you'd call your actual meal logging flow here
      // const success = await callActualMealFlow(mealData);
      // if (success) return { success: true, offline: false };
    } catch (error) {
      console.warn(
        'Online meal logging failed, falling back to offline:',
        error,
      );
    }
  }

  // Fallback to offline storage
  try {
    const mealDataWithTimestamp = {
      ...mealData,
      timestamp: Date.now(), // Add the missing timestamp
    };

    const id = await offlineStorage.addPendingMealData(mealDataWithTimestamp);

    // Register background sync
    await triggerMealDataSync();

    console.log('📱 Meal logged offline, will sync when online');
    return { success: true, offline: true, id };
  } catch (error) {
    console.error('Failed to log meal offline:', error);
    return { success: false, offline: true };
  }
}

// Global instance with proper initialization
const offlineStorage = new OfflineStorage();

/**
 * Get pending sync count for UI with proper initialization
 */
export async function getPendingSyncCount(): Promise<number> {
  try {
    // Ensure IndexedDB is initialized before accessing data
    await offlineStorage.init();
    const pendingData = await offlineStorage.getPendingMealData();
    return pendingData.length;
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    // Return 0 instead of throwing to prevent UI errors
    return 0;
  }
}

/**
 * Manual sync trigger for UI - UPDATED for real integration
 */
export async function manualSync(): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> {
  try {
    const pendingData = await offlineStorage.getPendingMealData();
    let syncedCount = 0;
    const errors: string[] = [];

    for (const mealEntry of pendingData) {
      try {
        // Extract data for API call
        const userAnswers = mealEntry.chatMessages
          .filter((m) => m.sender === 'user')
          .map((m) => m.text);

        const gptResponses = mealEntry.chatMessages
          .filter((m) => m.sender === 'bot')
          .map((m) => m.text);

        // Call the upsert API
        const response = await fetch('/api/meals/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: mealEntry.userId,
            name: mealEntry.userName,
            meal: mealEntry.meal,
            answers: userAnswers,
            gpt_responses: gptResponses,
          }),
        });

        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`);
        }

        // Generate summary if requested
        if (mealEntry.generateSummary && userAnswers.length > 0) {
          const summaryResponse = await fetch('/api/gpt/summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: mealEntry.userName,
              meal: mealEntry.meal,
              answers: userAnswers,
            }),
          });

          if (!summaryResponse.ok) {
            console.warn(`Summary generation failed for ${mealEntry.meal}`);
            // Don't fail the sync for summary issues
          }
        }

        await offlineStorage.removePendingMealData(mealEntry.id);
        syncedCount++;
        console.log(
          `✅ Synced meal: ${mealEntry.meal} from ${new Date(mealEntry.timestamp).toLocaleString()}`,
        );
      } catch (error) {
        const errorMsg = `Failed to sync ${mealEntry.meal}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      syncedCount: 0,
      errors: [`Manual sync failed: ${error}`],
    };
  }
}

/**
 * Export the offline storage instance for direct use
 */
export { offlineStorage };

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
