// src/components/HomePageSkeleton.tsx
'use client';

import { motion } from 'framer-motion';

/**
 * Skeleton placeholder for homepage that matches the real layout dimensions
 * Prevents layout shift when navigating back to homepage
 */
export default function HomePageSkeleton() {
  // Get active tab from session storage to match gradient
  const getActiveTab = (): 'meals' | 'progress' | 'friends' => {
    if (typeof window === 'undefined') return 'meals';

    const savedTab = sessionStorage.getItem('mealapp_active_tab') as
      | 'meals'
      | 'progress'
      | 'friends';

    return savedTab && ['meals', 'progress', 'friends'].includes(savedTab)
      ? savedTab
      : 'meals';
  };

  const activeTab = getActiveTab();

  // Get gradient colors based on active tab (same logic as homepage)
  const getHeaderGradientColors = (tab: 'meals' | 'progress' | 'friends') => {
    switch (tab) {
      case 'meals':
        return {
          start: '#ec4899',
          middle: '#f472b6',
          end: '#e879f9',
        };
      case 'progress':
        return {
          start: '#a855f7',
          middle: '#c084fc',
          end: '#d8b4fe',
        };
      case 'friends':
        return {
          start: '#3b82f6',
          middle: '#60a5fa',
          end: '#93c5fd',
        };
      default:
        return {
          start: '#ec4899',
          middle: '#f472b6',
          end: '#e879f9',
        };
    }
  };

  const gradientColors = getHeaderGradientColors(activeTab);

  return (
    <motion.div
      className="h-screen w-full bg-gradient-to-br from-pink-100 to-purple-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Wave SVG Header Skeleton - matches real homepage */}
      <header
        className="fixed top-0 left-0 w-full z-30"
        style={{
          background: 'transparent',
        }}
      >
        <svg
          className="w-full"
          viewBox="0 0 500 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            height: 'calc(363px + env(safe-area-inset-top))', // Matches homepage header
          }}
        >
          <defs>
            <linearGradient
              id="skeletonHeaderGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="50%" stopColor={gradientColors.middle} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>

          {/* Wave path - matches homepage design */}
          <path
            d="M0 0 L500 0 L500 200 C400 240 350 180 250 220 C150 260 100 200 0 240 L0 0 Z"
            fill="url(#skeletonHeaderGradient)"
            className="animate-pulse"
          />
        </svg>

        {/* Header content skeleton positioned over SVG */}
        <div
          className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start"
          style={{
            paddingTop: 'calc(35px + env(safe-area-inset-top))',
            paddingBottom: '28px',
          }}
        >
          <div className="flex flex-col items-center w-full px-4">
            {/* Title skeleton */}
            <div className="h-12 w-48 bg-white/20 rounded-lg animate-pulse mb-4" />
            {/* Subtitle skeleton */}
            <div className="h-6 w-32 bg-white/20 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-24 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main content skeleton positioned much lower and centered */}
      <div
        className="w-full max-w-lg mx-auto px-4 flex flex-col justify-center items-center"
        style={{
          paddingTop: 'calc(363px + env(safe-area-inset-top) + 80px)', // Much more space below header
          height: 'calc(100vh - 363px - env(safe-area-inset-top) - 180px)', // Leave space for bottom nav
        }}
      >
        {/* Smaller tab content card skeleton */}
        <div className="bg-white/90 rounded-3xl shadow-xl p-4 animate-pulse w-full max-w-sm">
          <div className="space-y-3">
            <div className="h-6 w-24 bg-gray-200 rounded-lg" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-2 w-full bg-gray-200 rounded" />
              <div className="h-2 w-4/5 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation skeleton - matches homepage tabs with dynamic active state */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100">
        <div
          className="w-full max-w-lg mx-auto py-2 px-4"
          style={{
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex items-center justify-around">
            {/* Three tab buttons with dynamic active state */}
            {[
              { name: 'Meals', key: 'meals' },
              { name: 'Progress', key: 'progress' },
              { name: 'Friends', key: 'friends' },
            ].map((tab, i) => {
              const isActive = tab.key === activeTab;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${
                          activeTab === 'meals'
                            ? 'from-pink-400 to-pink-500'
                            : activeTab === 'progress'
                              ? 'from-purple-400 to-purple-500'
                              : 'from-blue-400 to-blue-500'
                        } shadow-lg`
                      : ''
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded ${isActive ? 'bg-white/80' : 'bg-gray-200'} animate-pulse mb-1`}
                  />
                  <div
                    className={`w-8 h-3 rounded ${isActive ? 'bg-white/80' : 'bg-gray-200'} animate-pulse`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
