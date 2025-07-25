// src/components/AppUpdateManager.tsx
'use client';

import { useUpdateNotification } from '@/hooks/useUpdateNotification';
import UpdateNotification from './UpdateNotification';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AppUpdateManager - Centralized update management
 *
 * This component handles the overall update flow:
 * - Monitors for app updates using the cache manager
 * - Shows update notifications at appropriate times
 * - Manages user interactions with update prompts
 * - Handles the actual update process
 *
 * Usage:
 * Place this component at the root level of your app (in layout.tsx or page.tsx)
 * to enable automatic update management throughout the application.
 */
export default function AppUpdateManager() {
  const { isNotificationVisible, dismissNotification } =
    useUpdateNotification();

  return (
    <UpdateNotification
      isOpen={isNotificationVisible}
      onClose={dismissNotification}
    />
  );
}

// ============================================================================
// HELPER COMPONENTS FOR MANUAL TRIGGERING
// ============================================================================

/**
 * Manual Update Trigger Button
 *
 * Use this component if you want to provide a manual way for users
 * to check for updates (e.g., in a settings menu)
 */
export function ManualUpdateTrigger() {
  const { showNotification, shouldShowNotification } = useUpdateNotification();

  if (!shouldShowNotification) {
    return null;
  }

  return (
    <button
      onClick={showNotification}
      className="px-4 py-2 bg-pink-500 text-white rounded-lg font-medium text-sm hover:bg-pink-600 transition-colors"
      aria-label="Check for app updates"
    >
      🆕 Update Available
    </button>
  );
}

/**
 * Update Status Indicator
 *
 * Use this component to show a subtle indicator that an update is available
 * (e.g., a small badge or dot in the navigation)
 */
export function UpdateStatusIndicator() {
  const { shouldShowNotification } = useUpdateNotification();

  if (!shouldShowNotification) {
    return null;
  }

  return (
    <div
      className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"
      aria-label="Update available"
      title="App update available"
    />
  );
}
