'use client';

import { getOrCreateUserId } from '@/utils/mealLog';
import { AnimatePresence, motion } from 'framer-motion';
import { DM_Sans, Dancing_Script, Inter } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });
const inter = Inter({ subsets: ['latin'], weight: '400', style: 'normal' });

type Summary = {
  date: string;
  breakfast_summary: string | null;
  lunch_summary: string | null;
  dinner_summary: string | null;
  full_day_summary: string | null;
};

const storyTabs = [
  { key: 'breakfast_summary', label: 'Breakfast', emoji: '🍳' },
  { key: 'lunch_summary', label: 'Lunch', emoji: '🥪' },
  { key: 'dinner_summary', label: 'Dinner', emoji: '🍽️' },
  { key: 'full_day_summary', label: 'Day Summary', emoji: '💖' },
];

function formatPrettyDateStacked(dateString: string) {
  // Handle YYYY-MM-DD format properly by parsing components
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

  // Fallback for other formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { monthDay: dateString, year: '' };

  const monthDay = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
  const year = date.getFullYear();
  return { monthDay, year: year.toString() };
}
function prettifyText(str: string | null) {
  if (!str) return '';
  let s = str.trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.?!…]$/.test(s)) s += '.';
  return s;
}

const STORY_DURATION = 20000; // ms
const BANNER_CURVE_HEIGHT = 44;
const BANNER_TOP_PADDING = 32;
const BANNER_BOTTOM_PADDING = 22;
const BANNER_TEXT_HEIGHT = 74;
const BANNER_TOTAL_HEIGHT =
  BANNER_CURVE_HEIGHT +
  BANNER_TOP_PADDING +
  BANNER_BOTTOM_PADDING +
  BANNER_TEXT_HEIGHT;

function SummariesHeader({
  dancingScriptClass,
}: {
  dancingScriptClass: string;
}) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        height: BANNER_TOTAL_HEIGHT,
        minHeight: BANNER_TOTAL_HEIGHT,
        pointerEvents: 'none',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <div
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #f5ede6 0%, #f7edf5 54%, #d8d8f0 100%)',
          height: '100%',
        }}
      >
        <div
          className="flex flex-col items-center w-full px-4 z-10"
          style={{
            pointerEvents: 'auto',
            paddingTop: BANNER_TOP_PADDING,
            paddingBottom: BANNER_BOTTOM_PADDING,
          }}
        >
          <div
            className={`text-[2.15rem] sm:text-[2.6rem] font-bold text-gray-900 text-center drop-shadow-sm ${dancingScriptClass}`}
            style={{
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}
          >
            Summaries
          </div>
          <div className="text-lg sm:text-xl text-gray-600 font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            A gentle way to track your meal journey and celebrate your daily
            wins ✨
          </div>
        </div>
        {/* SVG flush at the bottom, curve is the mask */}
        <svg
          className="absolute left-0 bottom-0 w-full"
          viewBox="0 0 500 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            display: 'block',
            zIndex: 11,
            pointerEvents: 'none',
            height: BANNER_CURVE_HEIGHT,
          }}
        >
          <defs>
            <linearGradient
              id="curveGradient"
              x1="0"
              y1="0"
              x2="500"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f5ede6" />
              <stop offset="0.54" stopColor="#f7edf5" />
              <stop offset="1" stopColor="#d8d8f0" />
            </linearGradient>
          </defs>
          <path
            d="M0 0C82 40 418 40 500 0V44H0V0Z"
            fill="url(#curveGradient)"
          />
        </svg>
      </div>
    </header>
  );
}

function Calendar({
  summaries,
  onDateClick,
}: {
  summaries: Summary[];
  onDateClick: (summary: Summary) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Create a map of dates that have summaries
  const summaryDates = new Set(summaries.map((s) => s.date));

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

  const calendarDays = [];
  const current = new Date(startOfCalendar);

  while (current <= endOfCalendar) {
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

  const hasSummary = (date: Date) => {
    return summaryDates.has(formatDateKey(date));
  };

  const handleDateClick = (date: Date) => {
    const dateKey = formatDateKey(date);
    const summary = summaries.find((s) => s.date === dateKey);
    if (summary) {
      onDateClick(summary);
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
    <div className="w-full max-w-lg mx-auto h-full flex flex-col justify-center">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-full hover:bg-purple-100/50 transition-colors"
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
          className="p-2 rounded-full hover:bg-purple-100/50 transition-colors"
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
                    ? 'bg-gradient-to-br from-purple-200/70 via-pink-200/60 to-purple-300/70 text-purple-800 shadow-sm border border-purple-200/50'
                    : ''
                }
              `}
              whileHover={hasSummaryData ? { scale: 1.05 } : {}}
              whileTap={hasSummaryData ? { scale: 0.95 } : {}}
            >
              {date.getDate()}

              {/* Today indicator */}
              {isTodayDate && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
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

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyAutoKey, setStoryAutoKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSummaries = async () => {
      const user_id = getOrCreateUserId();
      const res = await fetch(`/api/summaries?user_id=${user_id}`);
      const data = await res.json();
      setSummaries(data.summaries || []);
      setLoading(false);
    };
    fetchSummaries();
  }, []);

  useEffect(() => {
    if (activeSummary) setActiveStoryIdx(0);
  }, [activeSummary]);

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
    }, STORY_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line
  }, [activeSummary, activeStoryIdx]);

  function getAvailableStories(summary: Summary) {
    return storyTabs.filter((tab) => summary[tab.key as keyof Summary]);
  }

  function handleStoryAreaClick() {
    const availableStories = getAvailableStories(activeSummary!);
    if (activeStoryIdx >= availableStories.length - 1) {
      setActiveSummary(null);
    } else {
      setActiveStoryIdx((idx) =>
        Math.min(idx + 1, availableStories.length - 1),
      );
      setStoryAutoKey((prev) => prev + 1);
    }
  }

  function handleDotClick(i: number) {
    setActiveStoryIdx(i);
    setStoryAutoKey((prev) => prev + 1);
  }

  const BG_GRADIENT =
    'linear-gradient(135deg, #f5ede6 0%, #f7edf5 54%, #d8d8f0 100%)';

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden fixed inset-0 ${dmSans.className}`}
    >
      {/* Fixed gradient background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: BG_GRADIENT }}
      />

      {/* Back Button */}
      <motion.div
        className="absolute left-4 top-4 z-40"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          zIndex: 40,
          top: '16px',
          left: '16px',
          willChange: 'opacity',
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-pink-200/50 transition-all shadow-sm"
          aria-label="Go Back"
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

      {/* Banner fixed above */}
      <SummariesHeader dancingScriptClass={dancingScript.className} />

      {/* Calendar area - fixed height, no scrolling */}
      <div
        className="flex-1 w-full max-w-2xl mx-auto flex flex-col relative z-10"
        style={{
          marginTop: `${BANNER_TOTAL_HEIGHT - 70}px`,
          height: `calc(100vh - ${BANNER_TOTAL_HEIGHT - 70}px)`,
          overflow: 'hidden',
        }}
      >
        <div
          className="h-full px-3 flex items-start justify-center"
          style={{
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div className="text-center text-gray-400/80 text-base font-medium animate-pulse">
              Loading summaries…
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="h-full"
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

      {/* IG-Style Story Modal */}
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
                w-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden
                bg-gradient-to-br from-white/85 via-[#f6e7fc]/80 to-[#fdf6fa]/90
                select-none
                ${dmSans.className}
              `}
              onClick={handleStoryAreaClick}
              style={{
                borderRadius: 0,
                boxShadow: '0 12px 48px 0 rgba(120,80,140,0.08)',
                minHeight: '100dvh',
                maxHeight: '100dvh',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Modal Top: Progress bar & Close */}
              <div className="relative flex items-center w-full pt-10 pb-2 px-6">
                <div className="flex-1 flex gap-2">
                  {getAvailableStories(activeSummary).map((tab, i) => (
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
                    setActiveSummary(null);
                  }}
                  className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 bg-transparent rounded-none p-2 z-20"
                  aria-label="Close"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#888',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                >
                  X
                </button>
              </div>
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
                {/* Date */}
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

                {/* Label */}
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

                {/* Story text */}
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

                {/* Dots at the bottom */}
                <div className="flex items-center justify-center gap-1 pt-3 pb-2">
                  {getAvailableStories(activeSummary).map((tab, i) => (
                    <button
                      key={tab.key}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${i === activeStoryIdx ? 'bg-purple-400/80' : 'bg-purple-100/80'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDotClick(i);
                      }}
                      aria-label={tab.label}
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
