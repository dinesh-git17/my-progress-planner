// src/hooks/useUpdateNotification.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCacheManager } from './useCacheManager';

// ============================================================================
// CONSTANTS
// ============================================================================

const UPDATE_NOTIFICATION_DISMISSED_KEY = 'meals_update_dismissed';
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// TYPES
// ============================================================================

interface UpdateNotificationState {
  shouldShow: boolean;
  isVisible: boolean;
  lastDismissed: number | null;
}

interface UpdateNotificationHook {
  shouldShowNotification: boolean;
  isNotificationVisible: boolean;
  showNotification: () => void;
  hideNotification: () => void;
  dismissNotification: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the timestamp when the update notification was last dismissed
 */
function getLastDismissedTime(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(UPDATE_NOTIFICATION_DISMISSED_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch (error) {
    console.warn('Failed to read last dismissed time:', error);
    return null;
  }
}

/**
 * Store the timestamp when the update notification was dismissed
 */
function setLastDismissedTime(timestamp: number): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      UPDATE_NOTIFICATION_DISMISSED_KEY,
      timestamp.toString(),
    );
  } catch (error) {
    console.warn('Failed to store last dismissed time:', error);
  }
}

/**
 * Check if enough time has passed since last dismissal
 */
function shouldRespectCooldown(lastDismissed: number | null): boolean {
  if (!lastDismissed) return false;

  const now = Date.now();
  const timeSinceDismissal = now - lastDismissed;

  return timeSinceDismissal < NOTIFICATION_COOLDOWN;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useUpdateNotification(): UpdateNotificationHook {
  const { isUpdateAvailable } = useCacheManager();

  const [state, setState] = useState<UpdateNotificationState>({
    shouldShow: false,
    isVisible: false,
    lastDismissed: null,
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  useEffect(() => {
    const lastDismissed = getLastDismissedTime();
    const respectCooldown = shouldRespectCooldown(lastDismissed);

    setState((prev) => ({
      ...prev,
      lastDismissed,
      shouldShow: isUpdateAvailable && !respectCooldown,
    }));
  }, [isUpdateAvailable]);

  // ========================================================================
  // AUTO-SHOW LOGIC
  // ========================================================================

  useEffect(() => {
    if (state.shouldShow && !state.isVisible) {
      // Add a small delay before showing to avoid jarring experience
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: true }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.shouldShow, state.isVisible]);

  // ========================================================================
  // ACTION HANDLERS
  // ========================================================================

  const showNotification = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isVisible: true,
      shouldShow: true,
    }));
  }, []);

  const hideNotification = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const dismissNotification = useCallback(() => {
    const now = Date.now();
    setLastDismissedTime(now);

    setState((prev) => ({
      ...prev,
      isVisible: false,
      shouldShow: false,
      lastDismissed: now,
    }));
  }, []);

  // ========================================================================
  // RETURN INTERFACE
  // ========================================================================

  return {
    shouldShowNotification: state.shouldShow,
    isNotificationVisible: state.isVisible,
    showNotification,
    hideNotification,
    dismissNotification,
  };
}
