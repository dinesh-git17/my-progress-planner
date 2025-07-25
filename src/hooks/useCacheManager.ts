// src/hooks/useCacheManager.ts
'use client';

import { useEffect, useState } from 'react';

const CACHE_VERSION_KEY = 'mpp_app_version'; // My Progress Planner prefix
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const DEBUG_TOGGLE_KEY = 'mpp_debug_update_notification'; // Debug toggle storage

interface CacheStatus {
  isLoading: boolean;
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  lastChecked: Date | null;
  isLegacyMigration: boolean;
  debugMode: boolean;
}

export function useCacheManager() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isLoading: true,
    isUpdateAvailable: false,
    currentVersion: CURRENT_VERSION,
    latestVersion: CURRENT_VERSION,
    lastChecked: null,
    isLegacyMigration: false,
    debugMode: false,
  });

  // Check for updates on app load
  useEffect(() => {
    checkForUpdates();
    checkDebugMode();
  }, []);

  // 🐛 DEBUG MODE CHECKER
  const checkDebugMode = () => {
    const debugEnabled = localStorage.getItem(DEBUG_TOGGLE_KEY) === 'true';
    setCacheStatus((prev) => ({ ...prev, debugMode: debugEnabled }));

    if (debugEnabled) {
      console.log('🐛 DEBUG MODE: Update notification can be toggled manually');
    }
  };

  const checkForUpdates = async () => {
    try {
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      const now = new Date();

      // 🐛 DEBUG MODE: Check if debug toggle is forcing notification
      const debugEnabled = localStorage.getItem(DEBUG_TOGGLE_KEY) === 'true';
      const debugForceUpdate =
        localStorage.getItem('mpp_debug_force_update') === 'true';

      if (debugEnabled && debugForceUpdate) {
        console.log('🐛 DEBUG: Forcing update notification for testing');
        setCacheStatus({
          isLoading: false,
          isUpdateAvailable: true,
          currentVersion: storedVersion || '0.9.0',
          latestVersion: CURRENT_VERSION,
          lastChecked: now,
          isLegacyMigration: false,
          debugMode: true,
        });
        return;
      }

      // 🎯 LEGACY USER MIGRATION (handles users who missed Phase 1)
      if (storedVersion === null) {
        console.log(
          `🔄 Legacy user detected - migrating to version: ${CURRENT_VERSION}`,
        );

        // Set current version as their baseline (whatever version is deployed)
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);

        setCacheStatus({
          isLoading: false,
          isUpdateAvailable: false, // ✅ NO false positive!
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          lastChecked: now,
          isLegacyMigration: true, // Flag for analytics/debugging
          debugMode: debugEnabled,
        });

        return;
      }

      // 🔄 NORMAL VERSION CHECK (for users with stored version)
      const isUpdateAvailable = storedVersion !== CURRENT_VERSION;

      setCacheStatus({
        isLoading: false,
        isUpdateAvailable,
        currentVersion: storedVersion,
        latestVersion: CURRENT_VERSION,
        lastChecked: now,
        isLegacyMigration: false,
        debugMode: debugEnabled,
      });

      if (isUpdateAvailable) {
        console.log(
          `🆕 Update available: ${storedVersion} → ${CURRENT_VERSION}`,
        );
      } else {
        console.log(`✅ App is up to date: ${CURRENT_VERSION}`);
      }
    } catch (error) {
      console.error('Cache check failed:', error);
      setCacheStatus((prev) => ({
        ...prev,
        isLoading: false,
        lastChecked: new Date(),
      }));
    }
  };

  const updateCache = async () => {
    try {
      console.log(
        `🔄 Starting update process: ${cacheStatus.currentVersion} → ${CURRENT_VERSION}`,
      );

      // 🐛 DEBUG MODE: Don't actually update if in debug mode
      if (cacheStatus.debugMode) {
        console.log('🐛 DEBUG: Simulating update (not actually updating)');
        // Just hide the notification
        localStorage.setItem('mpp_debug_force_update', 'false');
        // Trigger a re-check to hide notification
        setTimeout(() => checkForUpdates(), 100);
        return;
      }

      // 💾 PRESERVE CRITICAL USER DATA (My Progress Planner specific)
      const criticalData = {
        // Supabase auth tokens
        supabase_auth: localStorage.getItem('sb-auth-token'),
        supabase_session: localStorage.getItem('supabase.auth.token'),

        // User data
        user_name: localStorage.getItem('user-name'),
        user_id: localStorage.getItem('user-id'),
        friend_code: localStorage.getItem('friend-code'),

        // App state
        meal_draft: localStorage.getItem('meal-draft'),
        notification_subscription: localStorage.getItem('push-subscription'),
        user_preferences: localStorage.getItem('user-preferences'),

        // Streak and progress (if cached locally)
        streak_cache: localStorage.getItem('streak-cache'),
        last_meal_time: localStorage.getItem('last-meal-time'),

        // Other app-specific data
        onboarding_complete: localStorage.getItem('onboarding-complete'),
        theme_preference: localStorage.getItem('theme-preference'),
      };

      // 🗑️ CLEAR SERVICE WORKER CACHES
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`🗑️ Clearing cache: ${cacheName}`);
            return caches.delete(cacheName);
          }),
        );
        console.log('✅ All service worker caches cleared');
      }

      // 🔄 UPDATE VERSION IN STORAGE
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);

      // 💾 RESTORE CRITICAL DATA
      Object.entries(criticalData).forEach(([key, value]) => {
        if (value !== null) {
          // Restore with original key names
          const originalKey = key.replace(/_/g, '-'); // Convert underscores back to hyphens

          if (key === 'supabase_auth') {
            localStorage.setItem('sb-auth-token', value);
          } else if (key === 'supabase_session') {
            localStorage.setItem('supabase.auth.token', value);
          } else {
            localStorage.setItem(originalKey, value);
          }
        }
      });

      console.log('💾 Critical data preserved and restored');

      // 🔄 FORCE CONTROLLED RELOAD
      console.log('🔄 Reloading app with fresh version...');
      window.location.reload();
    } catch (error) {
      console.error('❌ Cache update failed:', error);
      // Fallback: just reload without cache clearing
      window.location.reload();
    }
  };

  const forceUpdate = () => {
    updateCache();
  };

  // Manual refresh check (for pull-to-refresh or manual triggers)
  const manualRefresh = () => {
    checkForUpdates();
  };

  // 🐛 DEBUG FUNCTIONS
  const enableDebugMode = () => {
    localStorage.setItem(DEBUG_TOGGLE_KEY, 'true');
    localStorage.setItem('mpp_debug_force_update', 'false');
    checkDebugMode();
    console.log(
      '🐛 DEBUG MODE ENABLED: Use toggleUpdateNotification() to test',
    );
  };

  const disableDebugMode = () => {
    localStorage.removeItem(DEBUG_TOGGLE_KEY);
    localStorage.removeItem('mpp_debug_force_update');
    checkDebugMode();
    checkForUpdates(); // Reset to normal state
    console.log('🐛 DEBUG MODE DISABLED');
  };

  const toggleUpdateNotification = () => {
    if (!cacheStatus.debugMode) {
      console.log('🐛 Enable debug mode first with enableDebugMode()');
      return;
    }

    const currentForceState =
      localStorage.getItem('mpp_debug_force_update') === 'true';
    const newForceState = !currentForceState;

    localStorage.setItem('mpp_debug_force_update', String(newForceState));
    checkForUpdates();

    console.log(
      `🐛 DEBUG: Update notification ${newForceState ? 'SHOWN' : 'HIDDEN'}`,
    );
  };

  return {
    ...cacheStatus,
    checkForUpdates: manualRefresh,
    forceUpdate,
    // Debug functions
    enableDebugMode,
    disableDebugMode,
    toggleUpdateNotification,
  };
}
