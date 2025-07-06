// hooks/useUserStreak.ts

import { useCallback, useEffect, useState } from 'react';

/**
 * Calculates consecutive daily streak from sorted log dates
 * @param dates Array of date strings in YYYY-MM-DD format, sorted descending
 * @returns Number of consecutive days from today backwards
 */
function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let streak = 0;
  let compareDate = new Date(today);

  for (const dateStr of dates) {
    const logDate = new Date(dateStr + 'T00:00:00Z');

    if (logDate.getTime() === compareDate.getTime()) {
      streak += 1;
      compareDate.setUTCDate(compareDate.getUTCDate() - 1);
    } else if (logDate.getTime() < compareDate.getTime()) {
      // Found a gap in the sequence - streak is broken
      break;
    }
    // If logDate > compareDate, skip this date (future date, shouldn't happen)
  }

  return streak;
}

/**
 * Custom hook to fetch and calculate user's current meal logging streak
 * Handles data recovery scenarios with retry logic and manual refresh capability
 */
export function useUserStreak(user_id?: string, isAfterRecovery = false) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Manual refresh function that can be called to refetch streak data
   * Useful for triggering updates after data changes
   */
  const refreshStreak = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchStreakWithRetry = async (attempt = 1): Promise<void> => {
      try {
        // For users who just recovered data, add delay to ensure backend sync completion
        if (isAfterRecovery && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Cache-bust to ensure fresh data, especially important after recovery
        const timestamp = Date.now();
        const response = await fetch(
          `/api/streak?user_id=${user_id}&t=${timestamp}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const { dates } = await response.json();

        if (isCancelled) return;

        const calculatedStreak = calculateStreak(dates ?? []);

        // Recovery scenario: If we get 0 streak but have date data, the sync might be incomplete
        // Retry up to 2 additional times with exponential backoff
        if (
          isAfterRecovery &&
          calculatedStreak === 0 &&
          dates?.length > 0 &&
          attempt < 3
        ) {
          const backoffDelay = attempt * 1500; // 1.5s, then 3s
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return fetchStreakWithRetry(attempt + 1);
        }

        setStreak(calculatedStreak);
      } catch (error) {
        console.error('Failed to fetch user streak:', error);

        // Retry once on network/server errors, but not for recovery scenarios
        if (!isAfterRecovery && attempt === 1) {
          setTimeout(() => fetchStreakWithRetry(2), 1000);
          return;
        }

        // Fallback to 0 on persistent failures
        if (!isCancelled) {
          setStreak(0);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchStreakWithRetry();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [user_id, isAfterRecovery, refreshTrigger]); // Added refreshTrigger to dependencies

  return { streak, loading, refreshStreak };
}
