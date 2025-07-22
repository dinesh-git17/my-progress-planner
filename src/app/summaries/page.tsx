'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { getOrCreateUserId } from '@/utils/mealLog';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
type Summary = {
  date: string;
  breakfast_summary: string | null;
  lunch_summary: string | null;
  dinner_summary: string | null;
  full_day_summary: string | null;
};

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Story tab configuration for modal display
 * Maps summary data keys to user-friendly labels and emojis
 */
const STORY_TABS = [
  { key: 'breakfast_summary', label: 'Breakfast', emoji: '🍳' },
  { key: 'lunch_summary', label: 'Lunch', emoji: '🥪' },
  { key: 'dinner_summary', label: 'Dinner', emoji: '🍽️' },
  { key: 'full_day_summary', label: 'Day Summary', emoji: '💖' },
] as const;

/**
 * UI timing and layout constants
 */
const UI_CONSTANTS = {
  STORY_DURATION: 20000,
  BANNER_CURVE_HEIGHT: 100, // ← INCREASED from 80 to 120
  BANNER_TOP_PADDING: 35, // ← INCREASED from 32 to 40
  BANNER_BOTTOM_PADDING: 28, // ← INCREASED from 22 to 30
  BANNER_TEXT_HEIGHT: 80, // ← INCREASED from 74 to 90
} as const;

/**
 * Calculated total header height for layout positioning
 */
const BANNER_TOTAL_HEIGHT =
  UI_CONSTANTS.BANNER_CURVE_HEIGHT +
  UI_CONSTANTS.BANNER_TOP_PADDING +
  UI_CONSTANTS.BANNER_BOTTOM_PADDING +
  UI_CONSTANTS.BANNER_TEXT_HEIGHT;

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
    const month = parseInt(parts[1]) - 1;
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

// ============================================================================
// HEADER COMPONENT (CLEANED)
// ============================================================================

/**
 * Proper header with waves extending downward from solid background
 * Matches the reference design with clean header and flowing bottom waves
 */
/**
 * Complete header using SVG with built-in wavy bottom
 * Much cleaner approach - single SVG element creates entire header shape
 */
function SummariesHeader({
  dancingScriptClass,
}: {
  dancingScriptClass: string;
}) {
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
          paddingTop: `calc(${UI_CONSTANTS.BANNER_TOP_PADDING}px + env(safe-area-inset-top))`, // Safe area for text only
          paddingBottom: UI_CONSTANTS.BANNER_BOTTOM_PADDING,
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
            Summaries
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            A gentle way to track your meal journey and celebrate your daily
            wins <Sparkles className="inline w-5 h-5 text-white ml-1" />
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// CALENDAR COMPONENT (CLEANED)
// ============================================================================

/**
 * Interactive calendar component for summary navigation
 */
function Calendar({
  summaries,
  onDateClick,
}: {
  summaries: Summary[];
  onDateClick: (summary: Summary) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Create optimized lookup set for summary dates
  const summaryDates = new Set(summaries.map((s) => s.date));

  // Calculate calendar grid boundaries
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

  // Calendar utility functions
  const isToday = (date: Date): boolean =>
    date.toDateString() === today.toDateString();
  const isCurrentMonth = (date: Date): boolean =>
    date.getMonth() === currentDate.getMonth();
  const formatDateKey = (date: Date): string =>
    date.toISOString().split('T')[0];
  const hasSummary = (date: Date): boolean =>
    summaryDates.has(formatDateKey(date));

  /**
   * Handles date selection and triggers summary modal
   */
  const handleDateClick = (date: Date): void => {
    const dateKey = formatDateKey(date);
    const summary = summaries.find((s) => s.date === dateKey);
    if (summary) {
      onDateClick(summary);
    }
  };

  /**
   * Navigation handler for month switching
   */
  const navigateMonth = (direction: 'prev' | 'next'): void => {
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
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

      {/* Day of week headers */}
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

      {/* Calendar grid with date buttons */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const hasSummaryData = hasSummary(date);

          return (
            <motion.button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!hasSummaryData}
              className={`
                relative h-12 w-12 mx-auto flex items-center justify-center text-sm font-medium
                transition-all duration-200 rounded-full
                ${!isCurrentMonthDay ? 'text-gray-300' : 'text-gray-700'}
                ${isTodayDate ? 'relative' : ''}
                ${hasSummaryData ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                ${
                  hasSummaryData && isCurrentMonthDay
                    ? 'bg-gradient-to-br from-purple-200/30 via-pink-200/20 to-purple-300/30 text-purple-800 shadow-sm border border-purple-200/30'
                    : ''
                }
              `}
              whileHover={hasSummaryData ? { scale: 1.05 } : {}}
              whileTap={hasSummaryData ? { scale: 0.95 } : {}}
              aria-label={`${date.getDate()} ${hasSummaryData ? '(has summary)' : ''}`}
            >
              {date.getDate()}

              {/* Today indicator overlay */}
              {isTodayDate && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-[10px] font-medium text-purple-700 bg-purple-100/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
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
// MAIN PAGE COMPONENT (CLEANED)
// ============================================================================

/**
 * Main summaries page component
 * Simplified without notch extensions and background transparency issues
 */
export default function SummariesPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyAutoKey, setStoryAutoKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { navigate } = useNavigation();

  // ============================================================================
  // DATA FETCHING & INITIALIZATION
  // ============================================================================

  /**
   * Fetch summaries data on component mount
   */
  useEffect(() => {
    const fetchSummaries = async (): Promise<void> => {
      try {
        const user_id = getOrCreateUserId();
        const res = await fetch(`/api/summaries?user_id=${user_id}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch summaries: ${res.status}`);
        }

        const data = await res.json();
        setSummaries(data.summaries || []);
      } catch (error) {
        console.error('Error fetching summaries:', error);
        setSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  /**
   * Reset story index when active summary changes
   */
  useEffect(() => {
    if (activeSummary) setActiveStoryIdx(0);
  }, [activeSummary]);

  /**
   * Story auto-progression timer management
   */
  useEffect(() => {
    if (!activeSummary) return;

    const availableStories = getAvailableStories(activeSummary);
    setStoryAutoKey((prev) => prev + 1);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (activeStoryIdx >= availableStories.length - 1) {
        setActiveSummary(null);
      } else {
        setActiveStoryIdx((idx) =>
          Math.min(idx + 1, availableStories.length - 1),
        );
      }
    }, UI_CONSTANTS.STORY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeSummary, activeStoryIdx]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Filters summary data to return only available story slides
   */
  const getAvailableStories = (summary: Summary) => {
    return STORY_TABS.filter((tab) => summary[tab.key as keyof Summary]);
  };

  /**
   * Handles story area clicks for manual progression
   */
  const handleStoryAreaClick = (): void => {
    const availableStories = getAvailableStories(activeSummary!);
    if (activeStoryIdx >= availableStories.length - 1) {
      setActiveSummary(null);
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
  const handleDotClick = (index: number): void => {
    setActiveStoryIdx(index);
    setStoryAutoKey((prev) => prev + 1);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`h-screen w-full overflow-hidden ${dmSans.className}`}>
      {/* Back navigation button */}
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
          >
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
      </motion.div>

      {/* Fixed header component */}
      <SummariesHeader dancingScriptClass={dancingScript.className} />

      {/* Main calendar content area */}
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
            <div
              className="flex items-center justify-center"
              style={{
                height: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px - 4rem)`,
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Loading summaries
                  </p>
                  <p className="text-sm text-gray-500">
                    Gathering your meal journey ✨
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar
                  summaries={summaries}
                  onDateClick={setActiveSummary}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Instagram-style story modal */}
      <AnimatePresence>
        {activeSummary && (
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
                  {getAvailableStories(activeSummary).map((tab, i) => (
                    <div
                      key={tab.key}
                      className="flex-1 h-[3px] rounded-full bg-purple-200/60 overflow-hidden relative"
                    >
                      {/* Completed story indicator */}
                      {i < activeStoryIdx && (
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-400 transition-all duration-300"
                          style={{ width: '100%' }}
                        />
                      )}
                      {/* Active story progress bar */}
                      {i === activeStoryIdx && (
                        <div
                          key={storyAutoKey}
                          className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-200 to-purple-400"
                          style={{
                            width: '0%',
                            animation: `fillBar ${UI_CONSTANTS.STORY_DURATION}ms linear forwards`,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSummary(null);
                  }}
                  className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 p-2 z-20 text-xl"
                  aria-label="Close summary modal"
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

              {/* Modal content */}
              <div className="flex flex-col flex-1 min-h-0 w-full px-6 pb-3 justify-start">
                {/* Date display */}
                <div className="w-full pt-8 pb-2 flex flex-col items-center">
                  <div className="text-center text-gray-600 font-normal uppercase tracking-widest text-[1.15rem] sm:text-[1.25rem] select-none mb-1">
                    {(() => {
                      const { monthDay, year } = formatPrettyDateStacked(
                        activeSummary.date,
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
                    const availableStories = getAvailableStories(activeSummary);
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
                    const availableStories = getAvailableStories(activeSummary);
                    const tab = availableStories[activeStoryIdx];
                    const storyContent = prettifyText(
                      activeSummary[tab.key as keyof Summary] as string,
                    );
                    return storyContent;
                  })()}
                </div>

                {/* Navigation dots */}
                <div className="flex items-center justify-center gap-1 pt-3 pb-2">
                  {getAvailableStories(activeSummary).map((tab, i) => (
                    <button
                      key={tab.key}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        i === activeStoryIdx
                          ? 'bg-purple-400/80'
                          : 'bg-purple-100/80'
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
        )}
      </AnimatePresence>
    </div>
  );
}
