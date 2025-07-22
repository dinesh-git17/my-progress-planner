/**
 * User Initialization Hook for Sweethearty
 *
 * This hook handles automatic user setup when they first interact with the app:
 * - Ensures user record exists in database
 * - Generates friend codes lazily
 * - Handles authentication state changes
 * - Provides loading states for UI
 *
 * Usage:
 * ```tsx
 * const { isInitialized, isLoading, error } = useUserInitialization(userId);
 * ```
 *
 * @author Sweethearty Team
 * @version 1.0.0
 * @since 2025-07-07
 */

import { useCallback, useEffect, useState } from 'react';
import { getUserFriendCode, saveUserName } from '../src/utils/user';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface UserInitializationState {
  /** Whether user initialization has completed successfully */
  isInitialized: boolean;
  /** Whether initialization is currently in progress */
  isLoading: boolean;
  /** Any error that occurred during initialization */
  error: string | null;
  /** The user's friend code (available after initialization) */
  friendCode: string | null;
  /** Force re-initialization (useful for error recovery) */
  retry: () => void;
}

interface InitializationOptions {
  /** Whether to generate friend code immediately (default: true) */
  generateFriendCode?: boolean;
  /** Timeout for initialization in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Whether to log debug information (default: false in production) */
  enableDebugLogs?: boolean;
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Initializes user data and ensures all required records exist
 *
 * This hook performs the following initialization sequence:
 * 1. Validates user ID format
 * 2. Creates user record if it doesn't exist
 * 3. Generates friend code (lazy loading)
 * 4. Handles authentication state changes
 * 5. Provides error recovery mechanisms
 *
 * @param userId - The user's UUID
 * @param options - Configuration options for initialization
 * @returns Initialization state and utilities
 */
export function useUserInitialization(
  userId: string | null,
  options: InitializationOptions = {},
): UserInitializationState {
  const {
    generateFriendCode = true,
    timeoutMs = 10000,
    enableDebugLogs = process.env.NODE_ENV === 'development',
  } = options;

  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);

  /**
   * Debug logging utility (only active in development)
   */
  const debugLog = useCallback(
    (message: string, data?: any) => {
      if (enableDebugLogs) {
        console.log(`[UserInit] ${message}`, data || '');
      }
    },
    [enableDebugLogs],
  );

  /**
   * Validates user ID format and requirements
   */
  const validateUserId = useCallback(
    (id: string | null): boolean => {
      if (!id) {
        debugLog('User ID is null or undefined');
        return false;
      }

      if (typeof id !== 'string' || id.trim().length === 0) {
        debugLog('User ID is empty or invalid type');
        return false;
      }

      // Basic UUID format validation (optional but recommended)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        debugLog('User ID does not match UUID format:', id);
        // Note: We don't return false here to support custom ID formats
      }

      return true;
    },
    [debugLog],
  );

  /**
   * Core initialization logic
   */
  const initializeUser = useCallback(
    async (id: string): Promise<void> => {
      debugLog('Starting user initialization for:', id);

      try {
        setIsLoading(true);
        setError(null);

        // Create timeout promise for initialization
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Initialization timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        });

        // Main initialization promise
        const initPromise = async (): Promise<void> => {
          debugLog('Ensuring user record exists');

          // Step 1: Ensure user has a basic record
          // This will create the user record if it doesn't exist
          // saveUserName with empty name creates the record without overwriting existing names
          const userName = await import('../src/utils/user').then((module) =>
            module.getUserName(id),
          );

          if (!userName) {
            debugLog('User record not found, creating basic record');
            // Create user record without overwriting existing data
            // This is safe because saveUserName uses upsert
            await saveUserName(id, ''); // Empty name won't overwrite existing names
          }

          // Step 2: Generate friend code if requested
          if (generateFriendCode) {
            debugLog('Generating/retrieving friend code');
            const code = await getUserFriendCode(id);

            if (!code) {
              throw new Error('Failed to generate friend code');
            }

            setFriendCode(code);
            debugLog('Friend code ready:', code);
          }

          debugLog('User initialization completed successfully');
        };

        // Race between initialization and timeout
        await Promise.race([initPromise(), timeoutPromise]);

        setIsInitialized(true);
        debugLog('User initialization state updated to initialized');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('User initialization failed:', errorMessage, error);
        setError(errorMessage);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    },
    [generateFriendCode, timeoutMs, debugLog],
  );

  /**
   * Force retry mechanism for error recovery
   */
  const retry = useCallback(() => {
    debugLog('Manual retry triggered');
    setInitializationAttempt((prev) => prev + 1);
    setError(null);
    setIsInitialized(false);
  }, [debugLog]);

  /**
   * Reset state when user changes
   */
  const resetState = useCallback(() => {
    debugLog('Resetting initialization state');
    setIsInitialized(false);
    setIsLoading(false);
    setError(null);
    setFriendCode(null);
  }, [debugLog]);

  // =============================================================================
  // EFFECT HANDLERS
  // =============================================================================

  /**
   * Main initialization effect
   * Triggers when userId changes or retry is called
   */
  useEffect(() => {
    // Reset state for new user or retry
    if (initializationAttempt > 0 || !isInitialized) {
      resetState();
    }

    // Skip initialization if no valid user ID
    if (!validateUserId(userId)) {
      debugLog('Skipping initialization - invalid user ID');
      setIsLoading(false);
      return;
    }

    // Skip if already initialized for this user
    if (isInitialized && !initializationAttempt) {
      debugLog('User already initialized, skipping');
      return;
    }

    debugLog('Triggering user initialization');
    initializeUser(userId as string);
  }, [
    userId,
    initializationAttempt,
    validateUserId,
    initializeUser,
    resetState,
    isInitialized,
    debugLog,
  ]);

  /**
   * Cleanup effect for component unmounting
   */
  useEffect(() => {
    return () => {
      debugLog('Cleaning up user initialization hook');
    };
  }, [debugLog]);

  // =============================================================================
  // RETURN STATE
  // =============================================================================

  return {
    isInitialized,
    isLoading,
    error,
    friendCode,
    retry,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Simplified hook for basic user initialization without friend codes
 * Useful for components that only need to ensure user record exists
 */
export function useBasicUserInit(userId: string | null) {
  return useUserInitialization(userId, {
    generateFriendCode: false,
    timeoutMs: 5000,
  });
}

/**
 * Hook specifically for friend code management
 * Returns friend code state and utilities
 */
export function useFriendCode(userId: string | null) {
  const { friendCode, isLoading, error, retry } = useUserInitialization(
    userId,
    {
      generateFriendCode: true,
      timeoutMs: 8000,
    },
  );

  return {
    friendCode,
    isLoading,
    error,
    refresh: retry,
  };
}

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Development-only hook for debugging initialization issues
 * Provides detailed state information and manual controls
 */
export function useUserInitializationDebug(userId: string | null) {
  const result = useUserInitialization(userId, {
    enableDebugLogs: true,
    timeoutMs: 15000,
  });

  // Additional debug information only available in development
  const debugInfo =
    process.env.NODE_ENV === 'development'
      ? {
          userId,
          timestamp: new Date().toISOString(),
          userAgent:
            typeof window !== 'undefined'
              ? window.navigator.userAgent
              : 'server',
        }
      : {};

  return {
    ...result,
    debugInfo,
  };
}
