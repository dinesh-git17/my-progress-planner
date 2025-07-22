'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { getCurrentSession, getLocalUserId } from '@/utils/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useEffect, useRef, useState } from 'react';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type MealList = {
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  created_at: string;
  isLoaded?: boolean; // Track if GPT content is loaded
};

type StoryTab = {
  key: 'breakfast' | 'lunch' | 'dinner';
  emoji: string;
  label: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================
const BANNER_CURVE_HEIGHT = 100; // ← INCREASED from 44 to 100
const BANNER_TOP_PADDING = 35; // ← INCREASED from 32 to 35
const BANNER_BOTTOM_PADDING = 28; // ← INCREASED from 22 to 28
const BANNER_TEXT_HEIGHT = 80; // ← INCREASED from 74 to 80
const BANNER_TOTAL_HEIGHT =
  BANNER_CURVE_HEIGHT +
  BANNER_TOP_PADDING +
  BANNER_BOTTOM_PADDING +
  BANNER_TEXT_HEIGHT;

const STORY_DURATION = 20000; // 20 seconds like summaries

const storyTabs: readonly StoryTab[] = [
  { key: 'breakfast', emoji: '🌅', label: 'Breakfast' },
  { key: 'lunch', emoji: '☀️', label: 'Lunch' },
  { key: 'dinner', emoji: '🌙', label: 'Dinner' },
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats date string into stacked display format (Month Day / Year)
 */
function formatPrettyDateStacked(dateString: string) {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const day = parseInt(parts[2]);
    const date = new Date(year, month, day);

    const monthDay = date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    });

    return { monthDay, year: year.toString() };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { monthDay: dateString, year: '' };

  const monthDay = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
  const year = date.getFullYear();
  return { monthDay, year: year.toString() };
}

/**
 * Sanitizes and formats text content for display
 */
function prettifyText(str: string | null): string {
  if (!str) return '';
  let s = str.trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.?!…]$/.test(s)) s += '.';
  return s;
}

/**
 * Filters meal data to return only available story slides
 */
function getAvailableStories(mealList: MealList): StoryTab[] {
  return storyTabs.filter((tab) => mealList[tab.key]);
}

// ============================================================================
// HEADER COMPONENT (CLEANED)
// ============================================================================
function MealsHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        background: 'transparent', // No background needed - SVG handles it
        // REMOVED pt-safe-top - SVG will extend into notch
      }}
    >
      {/* SVG that creates the entire header shape with wavy bottom - EXTENDS INTO NOTCH */}
      <svg
        className="w-full"
        viewBox="0 0 500 220" // Increased height to account for notch area
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          height: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`, // Add safe area to height
        }}
      >
        {/* Gradient definition - matches homepage progress tab */}
        <defs>
          <linearGradient
            id="headerGradient1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>
        </defs>

        {/* Single path with just 2-3 large wave peaks */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#headerGradient1)"
        />
      </svg>

      {/* Text content positioned absolutely over the SVG - RESPECTS SAFE AREA */}
      <div
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start"
        style={{
          paddingTop: `calc(${BANNER_TOP_PADDING}px + env(safe-area-inset-top))`, // Safe area for text only
          paddingBottom: BANNER_BOTTOM_PADDING,
        }}
      >
        <div className="flex flex-col items-center w-full px-4">
          <div
            className={`text-[2.15rem] sm:text-[2.6rem] font-bold text-white text-center drop-shadow-sm ${dancingScriptClass}`}
            style={{
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}
          >
            My Meals
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            See what you ate each day in a sweet way ✨
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// CALENDAR COMPONENT (CLEANED)
// ============================================================================
function Calendar({
  mealLists,
  onDateClick,
}: {
  mealLists: MealList[];
  onDateClick: (mealList: MealList) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Create a map of dates that have meal lists
  const mealListDates = new Set(mealLists.map((m) => m.date));

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );
  const startOfCalendar = new Date(startOfMonth);
  startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());

  const endOfCalendar = new Date(endOfMonth);
  endOfCalendar.setDate(endOfCalendar.getDate() + (6 - endOfCalendar.getDay()));

  // Generate calendar day array - ALWAYS 42 days (6 weeks)
  const calendarDays = [];
  const current = new Date(startOfCalendar);
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const year = currentDate.getFullYear();

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const hasMeals = (date: Date) => {
    return mealListDates.has(formatDateKey(date));
  };

  const handleDateClick = (date: Date) => {
    const dateKey = formatDateKey(date);
    const mealList = mealLists.find((m) => m.date === dateKey);
    if (mealList) {
      onDateClick(mealList);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div
      className="w-full max-w-lg mx-auto flex flex-col justify-center"
      style={{ height: 'calc(100vh - 300px)' }}
    >
      {/* Month Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-full transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2
          className={`text-2xl font-bold text-gray-800 ${dancingScript.className}`}
        >
          {monthName} {year}
        </h2>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-full transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const hasMealData = hasMeals(date);

          return (
            <motion.button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!hasMealData}
              className={`
              relative h-12 w-12 mx-auto flex items-center justify-center text-sm font-medium
              transition-all duration-200 rounded-full
              ${!isCurrentMonthDay ? 'text-gray-300' : 'text-gray-700'}
              ${isTodayDate ? 'relative' : ''}
              ${hasMealData ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
              ${
                hasMealData && isCurrentMonthDay
                  ? 'bg-gradient-to-br from-purple-200/30 via-pink-200/20 to-purple-300/30 text-purple-800 shadow-sm border border-purple-200/30'
                  : ''
              }
            `}
              whileHover={hasMealData ? { scale: 1.05 } : {}}
              whileTap={hasMealData ? { scale: 0.95 } : {}}
              aria-label={`${date.getDate()} ${hasMealData ? '(has meals)' : ''}`}
            >
              {date.getDate()}

              {/* Today indicator */}
              {isTodayDate && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-[10px] font-medium text-purple-700 px-1.5 py-0.5 whitespace-nowrap">
                    TODAY
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT (CLEANED)
// ============================================================================
export default function MealsPage() {
  const [mealLists, setMealLists] = useState<MealList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMealList, setActiveMealList] = useState<MealList | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyAutoKey, setStoryAutoKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { navigate } = useNavigation();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches meal dates on component mount
   */
  useEffect(() => {
    const fetchMealDates = async () => {
      try {
        // Use the same authentication logic as main app
        const session = await getCurrentSession();
        let user_id: string | null = null;

        if (session?.user) {
          user_id = session.user.id;
          console.log('🔐 Meals: Using auth ID:', user_id);
        } else {
          const localUserId = getLocalUserId();
          if (localUserId) {
            user_id = localUserId;
            console.log('📱 Meals: Using local ID:', user_id);
          }
        }

        if (!user_id) {
          console.log('❌ No user ID found for meals');
          setLoading(false);
          return;
        }

        // Create minimum loading delay promise
        const minLoadingDelay = new Promise((resolve) =>
          setTimeout(resolve, 2000),
        );

        // Create data fetch promise
        const dataFetch = fetch(`/api/meals/dates?user_id=${user_id}`).then(
          async (datesRes) => {
            const datesData = await datesRes.json();

            if (datesData.mealDates && datesData.mealDates.length > 0) {
              // Store just the dates without GPT-processed content
              const mealDatesList = datesData.mealDates.map(
                (dateInfo: any) => ({
                  date: dateInfo.date,
                  created_at: dateInfo.created_at,
                  isLoaded: false, // Mark as not loaded yet
                }),
              );
              return mealDatesList;
            }
            return [];
          },
        );

        // Wait for both the data and minimum loading time
        const [mealDatesList] = await Promise.all([dataFetch, minLoadingDelay]);

        setMealLists(mealDatesList);
      } catch (error) {
        console.error('Error fetching meal dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealDates();
  }, []);

  // ============================================================================
  // STORY MODAL MANAGEMENT
  // ============================================================================

  /**
   * Reset story index when active meal list changes
   */
  useEffect(() => {
    if (activeMealList) setActiveStoryIdx(0);
  }, [activeMealList]);

  /**
   * Story auto-progression timer management
   */
  useEffect(() => {
    if (!activeMealList) return;

    const availableStories = getAvailableStories(activeMealList);
    setStoryAutoKey((prev) => prev + 1);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (activeStoryIdx >= availableStories.length - 1) {
        setActiveMealList(null);
      } else {
        setActiveStoryIdx((idx) =>
          Math.min(idx + 1, availableStories.length - 1),
        );
      }
    }, STORY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeMealList, activeStoryIdx]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Loads meal content on-demand when date is clicked
   */
  const loadMealContent = async (mealList: MealList) => {
    if (mealList.isLoaded) {
      // Already loaded, show immediately
      setActiveMealList(mealList);
      return;
    }

    // Show loading state
    setActiveMealList({
      ...mealList,
      breakfast: 'Loading...',
      lunch: 'Loading...',
      dinner: 'Loading...',
    });

    try {
      // Get user ID again
      const session = await getCurrentSession();
      const user_id = session?.user?.id || getLocalUserId();

      if (!user_id) return;

      // Process GPT content for this specific date
      const listRes = await fetch(
        `/api/meals/list?user_id=${user_id}&date=${mealList.date}`,
      );
      const listData = await listRes.json();

      if (listData.mealLists) {
        const loadedMealList = {
          ...mealList,
          ...listData.mealLists,
          isLoaded: true,
        };

        // Update the list in state
        setMealLists((prev) =>
          prev.map((item) =>
            item.date === mealList.date ? loadedMealList : item,
          ),
        );

        // Show the loaded content
        setActiveMealList(loadedMealList);
      }
    } catch (error) {
      console.error('Error loading meal content:', error);
      setActiveMealList(null);
    }
  };

  /**
   * Handles story area clicks for manual progression
   */
  const handleStoryAreaClick = () => {
    const availableStories = getAvailableStories(activeMealList!);
    if (activeStoryIdx >= availableStories.length - 1) {
      setActiveMealList(null);
    } else {
      setActiveStoryIdx((idx) =>
        Math.min(idx + 1, availableStories.length - 1),
      );
      setStoryAutoKey((prev) => prev + 1);
    }
  };

  /**
   * Handles direct story navigation via progress dots
   */
  const handleDotClick = (index: number) => {
    setActiveStoryIdx(index);
    setStoryAutoKey((prev) => prev + 1);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renders empty state when no meals are logged
   */
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl mb-6 flex items-center justify-center mx-auto">
        <span className="text-3xl" role="img" aria-label="Plate emoji">
          🍽️
        </span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        No meals logged yet
      </h2>
      <p className="text-gray-600 mb-6">
        Start logging your meals to see them here!
      </p>
      <button
        onClick={() => navigate('/')}
        className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
      >
        Log Your First Meal
      </button>
    </div>
  );

  /**
   * Renders the story modal
   */
  const renderStoryModal = () => (
    <motion.div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <motion.div
        className={`
        w-full h-screen max-h-screen flex flex-col overflow-hidden
        bg-gradient-to-br from-white/85 via-[#f6e7fc]/80 to-[#fdf6fa]/90
        select-none safe-all
        ${dmSans.className}
      `}
        onClick={handleStoryAreaClick}
        style={{
          borderRadius: 0,
          boxShadow: '0 12px 48px 0 rgba(120,80,140,0.08)',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Progress bar and close button */}
        <div className="relative flex items-center w-full pt-10 pb-2 px-6">
          <div className="flex-1 flex gap-2">
            {getAvailableStories(activeMealList!).map((tab, i) => (
              <div
                key={tab.key}
                className="flex-1 h-[3px] rounded-full bg-purple-200/60 overflow-hidden relative"
              >
                {i < activeStoryIdx && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-400 transition-all duration-300"
                    style={{ width: '100%' }}
                  />
                )}
                {i === activeStoryIdx && (
                  <div
                    key={storyAutoKey}
                    className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-200 to-purple-400"
                    style={{
                      width: '0%',
                      animation: `fillBar ${STORY_DURATION}ms linear forwards`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMealList(null);
            }}
            className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 p-2 z-20 text-xl"
            aria-label="Close meal details modal"
          >
            ×
          </button>
        </div>

        {/* CSS animation definition */}
        <style>
          {`
          @keyframes fillBar {
            from { width: 0% }
            to { width: 100% }
          }
        `}
        </style>

        {/* Modal Content */}
        <div className="flex flex-col flex-1 min-h-0 w-full px-6 pb-3 justify-start">
          {/* Date display */}
          <div className="w-full pt-8 pb-2 flex flex-col items-center">
            <div className="text-center text-gray-600 font-normal uppercase tracking-widest text-[1.15rem] sm:text-[1.25rem] select-none mb-1">
              {(() => {
                const { monthDay, year } = formatPrettyDateStacked(
                  activeMealList!.date,
                );
                return (
                  <>
                    {monthDay} <span className="block">{year}</span>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Story type label */}
          <div
            className="text-center text-gray-800 text-[2.2rem] sm:text-[2.7rem] font-semibold leading-tight mt-1 mb-6"
            style={{ letterSpacing: '-0.02em' }}
          >
            {(() => {
              const availableStories = getAvailableStories(activeMealList!);
              const tab = availableStories[activeStoryIdx];
              return `${tab.emoji} ${tab.label}`;
            })()}
          </div>

          {/* Story content text */}
          <div
            className={`
            w-full max-w-xl mx-auto px-1
            text-gray-800
            text-[1.01rem] sm:text-[1.09rem]
            leading-[1.8] select-text
            rounded-xl
            flex-1 flex items-start
            antialiased
            font-normal
            tracking-normal
          `}
            style={{
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              fontFamily: `'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`,
            }}
          >
            {(() => {
              const availableStories = getAvailableStories(activeMealList!);
              const tab = availableStories[activeStoryIdx];
              const storyContent = prettifyText(
                activeMealList![tab.key] as string,
              );
              return storyContent;
            })()}
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-1 pt-3 pb-2">
            {getAvailableStories(activeMealList!).map((tab, i) => (
              <button
                key={tab.key}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === activeStoryIdx ? 'bg-purple-400/80' : 'bg-purple-100/80'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDotClick(i);
                }}
                aria-label={`Go to ${tab.label} story`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Loading state - show full screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          {/* Animated meal icons */}
          <motion.div
            className="relative mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Floating background */}
            <motion.div
              className="absolute inset-0 w-32 h-20 mx-auto"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.05, 0.2],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl" />
            </motion.div>

            {/* Meal icons container */}
            <div className="relative flex items-center justify-center space-x-3">
              {/* Breakfast */}
              <motion.div
                className="w-14 h-14 bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
                animate={{
                  y: [-3, 3, -3],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0,
                }}
              >
                <span className="text-2xl">🌅</span>
              </motion.div>

              {/* Lunch - Center (larger) */}
              <motion.div
                className="w-18 h-18 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl z-10"
                animate={{
                  y: [-2, 4, -2],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              >
                <span className="text-3xl">🍽️</span>
              </motion.div>

              {/* Dinner */}
              <motion.div
                className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"
                animate={{
                  y: [-3, 3, -3],
                  rotate: [0, -2, 2, 0],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              >
                <span className="text-2xl">🌙</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Loading text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Loading Your Meals
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Gathering your delicious food journey...
            </p>
          </motion.div>

          {/* Progress dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center space-x-1"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8"
          >
            <motion.div
              className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <motion.p
              className="text-xs text-gray-500 mt-2"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Loading your meal calendar...
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full overflow-hidden ${dmSans.className}`}>
      {/* Back Button */}
      <motion.div
        className="fixed left-4 z-40 notch-safe"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => {
            localStorage.setItem('activeTab', 'progress');
            sessionStorage.setItem('isReturningToHome', 'true');
            navigate('/');
          }}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-pink-200/50 transition-all shadow-sm"
          aria-label="Go Back to Home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      </motion.div>

      {/* Header */}
      <MealsHeader dancingScriptClass={dancingScript.className} />

      {/* Main Content */}
      <div
        className="w-full max-w-2xl mx-auto safe-x overflow-hidden"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          height: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: '0.5rem', // ← REDUCED from 2rem to 0.5rem
          paddingBottom: '2rem',
        }}
      >
        <div className="px-4">
          {loading ? (
            <div className="text-center text-gray-400/80 text-base font-medium animate-pulse py-8">
              Loading meals…
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar mealLists={mealLists} onDateClick={loadMealContent} />
                {mealLists.length === 0 && (
                  <div className="text-center py-8 mt-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl mb-4 flex items-center justify-center mx-auto">
                      <span
                        className="text-2xl"
                        role="img"
                        aria-label="Plate emoji"
                      >
                        🍽️
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      No meals logged yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start logging your meals to see them here!
                    </p>
                    <button
                      onClick={() => {
                        localStorage.setItem('activeTab', 'meals');
                        sessionStorage.setItem('isReturningToHome', 'true');
                        navigate('/');
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      Log Your First Meal
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Story Modal */}
      <AnimatePresence>{activeMealList && renderStoryModal()}</AnimatePresence>
    </div>
  );
}
