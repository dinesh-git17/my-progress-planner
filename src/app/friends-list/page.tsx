'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useEffect, useState } from 'react';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * UI timing and layout constants
 */
const UI_CONSTANTS = {
  BANNER_CURVE_HEIGHT: 100,
  BANNER_TOP_PADDING: 35,
  BANNER_BOTTOM_PADDING: 28,
  BANNER_TEXT_HEIGHT: 80,
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
// TYPES
// ============================================================================

interface Friend {
  user_id: string;
  name: string;
  friend_code: string;
  created_at: string;
  displayName?: string;
  friendshipAge?: string;
  displayFriendCode?: string;
}

interface FriendsResponse {
  success: boolean;
  friends: Friend[];
  count: number;
  user_id: string;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get initials from a name for avatar display
 */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Format date for display
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

function FriendsListHeader({
  dancingScriptClass,
  friendsCount,
}: {
  dancingScriptClass: string;
  friendsCount: number;
}) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        background: 'transparent',
      }}
    >
      {/* SVG that creates the entire header shape with wavy bottom */}
      <svg
        className="w-full"
        viewBox="0 0 500 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          height: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`,
        }}
      >
        {/* Gradient definition - matches homepage friends tab */}
        <defs>
          <linearGradient
            id="friendsListHeaderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        {/* Single path with wavy bottom */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#friendsListHeaderGradient)"
        />
      </svg>

      {/* Text content positioned absolutely over the SVG */}
      <div
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start"
        style={{
          paddingTop: `calc(${UI_CONSTANTS.BANNER_TOP_PADDING}px + env(safe-area-inset-top))`,
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
            My Friends
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-white" />
            {friendsCount} friend{friendsCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FriendsListPage() {
  const { navigate } = useNavigation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Initialize user ID from localStorage
   */
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      navigate('/');
      return;
    }
    setUserId(storedUserId);
  }, [navigate]);

  /**
   * Fetch friends list data
   */
  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create minimum loading delay promise
        const minLoadingDelay = new Promise((resolve) =>
          setTimeout(resolve, 2000),
        );

        // Create data fetch promise
        const dataFetch = fetch(`/api/friends/list?user_id=${userId}`).then(
          async (response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: FriendsResponse = await response.json();

            if (!data.success) {
              throw new Error(data.error || 'Failed to fetch friends');
            }

            return data;
          },
        );

        // Wait for both the data and minimum loading time
        const [data] = await Promise.all([dataFetch, minLoadingDelay]);

        // The API already provides enhanced friends data with friendshipAge calculated
        // We just need to add displayName fallback for any missing names
        const enhancedFriends = data.friends.map((friend) => ({
          ...friend,
          displayName: friend.displayName || friend.name || 'Anonymous Friend',
        }));

        setFriends(enhancedFriends);
      } catch (err: any) {
        console.error('Error fetching friends:', err);
        setError(err.message || 'Failed to load friends');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Navigate back to home page
   */
  const handleBackClick = () => {
    sessionStorage.setItem('isReturningToHome', 'true');
    navigate('/');
  };

  /**
   * Navigate to friend's detail page
   */
  const handleFriendClick = (friendId: string) => {
    navigate(`/friends/${friendId}`);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render loading state with modern animation
   */
  const renderLoading = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4">
      {/* Main loading container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="text-center"
      >
        {/* Animated friends icons */}
        <motion.div
          className="relative mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Floating background circles */}
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
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-xl" />
          </motion.div>

          {/* Friend avatars container */}
          <div className="relative flex items-center justify-center space-x-2">
            {/* Friend 1 */}
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"
              animate={{
                y: [-3, 3, -3],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0,
              }}
            >
              <span className="text-white text-lg font-bold">A</span>
            </motion.div>

            {/* Friend 2 - Center (larger) */}
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl z-10"
              animate={{
                y: [-2, 4, -2],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            >
              <span className="text-white text-xl font-bold">👥</span>
            </motion.div>

            {/* Friend 3 */}
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg"
              animate={{
                y: [-3, 3, -3],
                rotate: [0, -2, 2, 0],
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            >
              <span className="text-white text-lg font-bold">B</span>
            </motion.div>
          </div>

          {/* Connection lines */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-0.5"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-blue-300 via-indigo-400 to-blue-300 rounded-full opacity-60" />
          </motion.div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading Your Friends
          </h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Gathering your connections and friendship details...
          </p>
        </motion.div>

        {/* Animated progress dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center space-x-1.5"
        >
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
              animate={{
                scale: [0.7, 1.3, 0.7],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: index * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

        {/* Loading steps indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8"
        >
          <motion.div
            className="w-56 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          <motion.p
            className="text-xs text-gray-500 mt-3"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Fetching friend codes and profiles...
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="text-red-500 text-4xl mb-4">😕</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Oops!</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </motion.div>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="text-6xl mb-4">👥</div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">No Friends Yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        You haven't added any friends yet. Start connecting with others to share
        your progress!
      </p>
      <button
        onClick={() => navigate('/friends')}
        className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
      >
        Add Your First Friend
      </button>
    </motion.div>
  );

  /**
   * Render friends list
   */
  const renderFriendsList = () => (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {friends.map((friend, index) => (
        <motion.button
          key={friend.user_id}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.06,
            ease: [0.4, 0, 0.2, 1],
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleFriendClick(friend.user_id)}
          className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40 hover:shadow-xl transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase shadow-md">
              {getInitials(friend.displayName) || '👤'}
            </div>

            {/* Friend Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-blue-600 transition-colors">
                {friend.displayName}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {friend.friendshipAge}
                </p>
                {friend.friend_code && (
                  <p className="text-xs text-gray-400 font-mono">
                    {friend.friend_code.slice(0, 3)}{' '}
                    {friend.friend_code.slice(3)}
                  </p>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state - show full screen
  if (loading) {
    return renderLoading();
  }

  return (
    <div className={`h-screen w-full overflow-hidden ${dmSans.className}`}>
      {/* Header */}
      <FriendsListHeader
        dancingScriptClass={dancingScript.className}
        friendsCount={friends.length}
      />

      {/* Back Button */}
      <motion.button
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        onClick={handleBackClick}
        className="fixed left-4 z-40 p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-blue-200/50 transition-all shadow-sm notch-safe"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Main Content */}
      <div
        className="w-full max-w-2xl mx-auto safe-x overflow-hidden"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          height: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: `calc(0.1rem + env(safe-area-inset-top))`,
          paddingBottom: '2rem',
        }}
      >
        <div className="px-4 h-full overflow-y-auto">
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            {error && renderError()}
            {!loading && !error && friends.length === 0 && renderEmptyState()}
            {!loading && !error && friends.length > 0 && renderFriendsList()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
