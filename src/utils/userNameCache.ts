// src/utils/userNameCache.ts
/**
 * User Name Caching Utility
 *
 * Provides persistent caching for user names to prevent unnecessary database calls
 * and avoid the ask name page when navigating back from meal chat pages.
 */

import {
  getUserName as getDbUserName,
  saveUserName as saveDbUserName,
} from './user';

interface CachedUserName {
  name: string;
  timestamp: number;
  userId: string;
}

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const STORAGE_KEY_PREFIX = 'mealapp_username_';

/**
 * Get user name with caching
 * First checks localStorage cache, then falls back to database
 */
export async function getUserName(userId: string): Promise<string | null> {
  if (!userId?.trim()) {
    console.warn('getUserName: Invalid userId provided');
    return null;
  }

  try {
    // First, try to get from cache
    const cachedName = getCachedUserName(userId);
    if (cachedName) {
      console.log('📋 Using cached user name:', cachedName);
      return cachedName;
    }

    // If not in cache, fetch from database
    console.log('🔍 Fetching user name from database...');
    const dbName = await getDbUserName(userId);

    if (dbName) {
      // Cache the result for future use
      setCachedUserName(userId, dbName);
      console.log('✅ User name fetched and cached:', dbName);
      return dbName;
    }

    console.log('❌ No user name found in database');
    return null;
  } catch (error) {
    console.error('Error in getUserName:', error);

    // Try to return cached version even if database fails
    const emergencyCache = getCachedUserName(userId, true); // Allow expired cache
    if (emergencyCache) {
      console.log(
        '🚨 Using expired cache due to database error:',
        emergencyCache,
      );
      return emergencyCache;
    }

    return null;
  }
}

/**
 * Save user name with caching
 * Saves to database and updates cache
 */
export async function saveUserName(
  userId: string,
  name: string,
): Promise<boolean> {
  if (!userId?.trim() || !name?.trim()) {
    console.error('saveUserName: Invalid parameters');
    return false;
  }

  try {
    // Save to database first
    const dbSuccess = await saveDbUserName(userId, name.trim());

    if (dbSuccess) {
      // Update cache on successful database save
      setCachedUserName(userId, name.trim());
      console.log('✅ User name saved to database and cached');
      return true;
    } else {
      console.error('❌ Failed to save user name to database');
      return false;
    }
  } catch (error) {
    console.error('Error in saveUserName:', error);
    return false;
  }
}

/**
 * Get user name from localStorage cache
 */
function getCachedUserName(
  userId: string,
  allowExpired = false,
): string | null {
  try {
    if (typeof window === 'undefined') return null;

    const cacheKey = STORAGE_KEY_PREFIX + userId;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const cachedData: CachedUserName = JSON.parse(cached);

    // Validate cached data structure
    if (
      !cachedData.name ||
      !cachedData.timestamp ||
      cachedData.userId !== userId
    ) {
      console.warn('Invalid cached user name data, removing...');
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Check if cache is expired (unless we're allowing expired cache)
    const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
    if (isExpired && !allowExpired) {
      console.log('Cached user name expired, removing...');
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cachedData.name;
  } catch (error) {
    console.error('Error reading cached user name:', error);
    return null;
  }
}

/**
 * Set user name in localStorage cache
 */
function setCachedUserName(userId: string, name: string): void {
  try {
    if (typeof window === 'undefined') return;

    const cacheKey = STORAGE_KEY_PREFIX + userId;
    const cacheData: CachedUserName = {
      name: name.trim(),
      timestamp: Date.now(),
      userId: userId,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('📋 User name cached successfully');
  } catch (error) {
    console.error('Error caching user name:', error);
    // Non-critical error, continue without caching
  }
}

/**
 * Clear cached user name for a specific user
 */
export function clearUserNameCache(userId: string): void {
  try {
    if (typeof window === 'undefined') return;

    const cacheKey = STORAGE_KEY_PREFIX + userId;
    localStorage.removeItem(cacheKey);
    console.log('🗑️ Cleared user name cache for user:', userId);
  } catch (error) {
    console.error('Error clearing user name cache:', error);
  }
}

/**
 * Clear all cached user names (useful for logout)
 */
export function clearAllUserNameCaches(): void {
  try {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    // Find all keys that start with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove all found keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`🗑️ Cleared ${keysToRemove.length} user name caches`);
  } catch (error) {
    console.error('Error clearing all user name caches:', error);
  }
}

/**
 * Preload user name into cache (useful for preventing ask name page)
 */
export async function preloadUserName(userId: string): Promise<void> {
  try {
    // Check if already cached and fresh
    const cached = getCachedUserName(userId);
    if (cached) {
      console.log('User name already cached, skipping preload');
      return;
    }

    // Fetch and cache
    const name = await getUserName(userId);
    if (name) {
      console.log('✅ User name preloaded successfully');
    }
  } catch (error) {
    console.error('Error preloading user name:', error);
  }
}

/**
 * Get cache statistics for debugging
 */
export function getUserNameCacheStats(): {
  totalCached: number;
  cacheKeys: string[];
  cacheSize: number;
} {
  try {
    if (typeof window === 'undefined') {
      return { totalCached: 0, cacheKeys: [], cacheSize: 0 };
    }

    const cacheKeys: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        cacheKeys.push(key);
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }

    return {
      totalCached: cacheKeys.length,
      cacheKeys,
      cacheSize: totalSize,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalCached: 0, cacheKeys: [], cacheSize: 0 };
  }
}
