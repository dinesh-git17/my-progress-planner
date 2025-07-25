'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useEffect, useState } from 'react';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface Friend {
  user_id: string;
  name: string;
  friend_code: string;
  friendship_created_at: string;
}

type TabType = 'my-code' | 'add-friend' | 'friends-list';

interface Message {
  type: 'success' | 'error';
  text: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * UI timing and layout constants
 */
const UI_CONSTANTS = {
  BANNER_CURVE_HEIGHT: 100, // ← INCREASED from 44 to 100
  BANNER_TOP_PADDING: 35, // ← INCREASED from 32 to 35
  BANNER_BOTTOM_PADDING: 28, // ← INCREASED from 22 to 28
  BANNER_TEXT_HEIGHT: 80, // ← INCREASED from 74 to 80
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
// HEADER COMPONENT (CLEANED)
// ============================================================================
function FriendsHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
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
        {/* Gradient definition - matches homepage friends tab */}
        <defs>
          <linearGradient
            id="friendsHeaderGradient"
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

        {/* Single path with wavy bottom - matches summaries style */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#friendsHeaderGradient)"
        />
      </svg>

      {/* Text content positioned absolutely over the SVG - RESPECTS SAFE AREA */}
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
            Friends
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            Connect with friends and share your progress 👥
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats friend code for display (ABC123 -> ABC123)
 */
function formatFriendCode(code: string): string {
  return code.replace(/(.{3})(.{3})/, '$1$2');
}

/**
 * Copies text to clipboard with fallback for older browsers
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for iOS and older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

// ============================================================================
// MAIN COMPONENT (CLEANED)
// ============================================================================
export default function FriendsPage() {
  const { navigate } = useNavigation();

  // State management
  const [activeTab, setActiveTab] = useState<TabType>('my-code');
  const [userId, setUserId] = useState<string>('');
  const [myFriendCode, setMyFriendCode] = useState<string>('');
  const [friendCodeInput, setFriendCodeInput] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // ============================================================================
  // INITIALIZATION & DATA FETCHING
  // ============================================================================

  /**
   * Get user ID from localStorage on mount
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
   * Fetch user's friend code and friends list
   */
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        // Create minimum loading delay promise
        const minLoadingDelay = new Promise((resolve) =>
          setTimeout(resolve, 2000),
        );

        // Create data fetch promises
        const fetchPromises = async () => {
          // Get my friend code
          const codeResponse = await fetch(
            `/api/user/friend-code?user_id=${userId}`,
          );
          if (codeResponse.ok) {
            const codeData = await codeResponse.json();
            setMyFriendCode(codeData.friendCode || '');
          }

          // Get friends list
          const friendsResponse = await fetch(
            `/api/friends/list?user_id=${userId}`,
          );
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            setFriends(friendsData.friends || []);
          }
        };

        // Wait for both the data and minimum loading time
        await Promise.all([fetchPromises(), minLoadingDelay]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load friends data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Securely handles adding a new friend with JWT authentication
   */
  const handleAddFriend = async () => {
    if (!friendCodeInput.trim() || !userId) return;

    setAddFriendLoading(true);
    setMessage(null);

    try {
      // Get the current user's JWT token for authentication
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setMessage({
          type: 'error',
          text: 'Please log in again to add friends',
        });
        return;
      }

      console.log('🔒 Adding friend with authentication...');

      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include JWT token for authentication
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          friendCode: friendCodeInput.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Added ${data.friendName} as a friend! 🎉`,
        });
        setFriendCodeInput('');

        // Refresh friends list
        const friendsResponse = await fetch(
          `/api/friends/list?user_id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData.friends || []);
        }
      } else {
        // Enhanced error handling for security-related errors
        if (response.status === 401) {
          setMessage({
            type: 'error',
            text: 'Authentication failed - please log in again',
          });
        } else if (response.status === 429) {
          setMessage({
            type: 'error',
            text: 'Too many requests - please wait a moment and try again',
          });
        } else if (response.status === 404) {
          setMessage({
            type: 'error',
            text: 'Friend code not found - please check and try again',
          });
        } else if (response.status === 409) {
          setMessage({
            type: 'error',
            text: data.error || 'Already friends or cannot add yourself',
          });
        } else {
          setMessage({
            type: 'error',
            text: data.error || 'Failed to add friend',
          });
        }
      }
    } catch (error) {
      console.error('Add friend error:', error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage({
          type: 'error',
          text: 'Network error - please check your connection and try again',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setAddFriendLoading(false);
    }
  };

  // ============================================================================
  // ADMIN FUNCTION (for admin panel or support tools)
  // ============================================================================

  /**
   * Admin version of add friend function using admin password
   * Should only be used in admin interfaces or support tools
   */
  async function adminAddFriend(
    userId: string,
    friendCode: string,
    adminPassword: string,
  ) {
    try {
      console.log('🔧 Admin adding friend...');

      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use admin password in header (more secure than body)
          'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify({
          userId,
          friendCode: friendCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Admin add friend failed: ${data.error || 'Unknown error'}`,
        );
      }

      console.log('✅ Admin add friend completed successfully');

      return {
        success: true,
        friendName: data.friendName,
        authMethod: 'admin',
      };
    } catch (error: any) {
      console.error('💥 Admin add friend operation failed:', error);

      return {
        success: false,
        error: error.message,
        code: 'ADMIN_ADD_FRIEND_FAILED',
      };
    }
  }

  /**
   * Handles copying friend code to clipboard
   */
  const handleCopyFriendCode = async () => {
    if (!myFriendCode) return;

    const success = await copyToClipboard(myFriendCode);

    if (success) {
      setMessage({ type: 'success', text: 'Friend code copied! 📋' });
    } else {
      setMessage({
        type: 'error',
        text: `Copy failed. Please copy manually: ${myFriendCode}`,
      });
    }
  };

  /**
   * Handles tab switching
   */
  const handleTabSwitch = (tabId: TabType) => {
    setActiveTab(tabId);
    setMessage(null);
  };

  /**
   * Handles navigation to friend's profile
   */
  const handleFriendClick = (friendUserId: string) => {
    navigate(`/friends/${friendUserId}`);
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
        {/* Animated management icons */}
        <motion.div
          className="relative mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Floating background circles */}
          <motion.div
            className="absolute inset-0 w-36 h-28 mx-auto"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.08, 0.25],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl" />
          </motion.div>

          {/* Management tools container */}
          <div className="relative flex items-center justify-center space-x-4">
            {/* Friend Code Card */}
            <motion.div
              className="w-14 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg"
              animate={{
                y: [-4, 4, -4],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0,
              }}
            >
              <span className="text-white text-xs font-bold">🏷️</span>
            </motion.div>

            {/* Central Management Hub */}
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl z-10 relative"
              animate={{
                y: [-3, 5, -3],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.6,
              }}
            >
              <span className="text-white text-2xl font-bold">⚙️</span>

              {/* Orbiting dots */}
              <motion.div
                className="absolute w-2 h-2 bg-white rounded-full"
                animate={{
                  rotate: 360,
                  x: [12, 0, -12, 0, 12],
                  y: [0, 12, 0, -12, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <motion.div
                className="absolute w-1.5 h-1.5 bg-blue-200 rounded-full"
                animate={{
                  rotate: -360,
                  x: [-8, 0, 8, 0, -8],
                  y: [0, -8, 0, 8, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 2,
                }}
              />
            </motion.div>

            {/* Add Friend Plus */}
            <motion.div
              className="w-14 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg"
              animate={{
                y: [-4, 4, -4],
                rotate: [0, -3, 3, 0],
              }}
              transition={{
                duration: 2.9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.2,
              }}
            >
              <span className="text-white text-lg font-bold">➕</span>
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
            Setting Up Friends
          </h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Loading your friend code and managing connections...
          </p>
        </motion.div>

        {/* Management steps indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center space-x-2 mb-8"
        >
          {['Code', 'Add', 'Manage'].map((step, index) => (
            <motion.div
              key={step}
              className="flex items-center space-x-1"
              animate={{
                scale: [0.9, 1.1, 0.9],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: index * 0.4,
                ease: 'easeInOut',
              }}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />
              <span className="text-xs text-gray-600 font-medium">{step}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6"
        >
          <motion.div
            className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          <motion.p
            className="text-xs text-gray-500 mt-4"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Generating your unique friend code...
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );

  // Update the loading check to use full screen
  if (loading) {
    return renderLoading();
  }
  /**
   * Renders the message banner
   */
  const renderMessage = () => {
    if (!message) return null;

    return (
      <div
        className={`p-3 rounded-xl text-sm font-medium transition-all ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}
        role="alert"
        aria-live="polite"
      >
        {message.text}
      </div>
    );
  };

  /**
   * Renders the tab navigation
   */
  const renderTabs = () => {
    const tabs = [
      { id: 'my-code' as TabType, label: 'My Code', emoji: '🏷️' },
      { id: 'add-friend' as TabType, label: 'Add', emoji: '➕' },
      { id: 'friends-list' as TabType, label: 'Friends', emoji: '👥' },
    ];

    return (
      <div className="flex bg-white/90 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabSwitch(tab.id)}
            className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === tab.id}
          >
            <span className="mr-1" role="img" aria-hidden="true">
              {tab.emoji}
            </span>
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Renders the My Code tab content
   */
  const renderMyCodeTab = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
      <div className="text-center">
        <div className="text-4xl mb-4" role="img" aria-label="Tag emoji">
          🏷️
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Your Friend Code
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Share this code with friends so they can add you!
        </p>

        {myFriendCode ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 border-2 border-dashed border-blue-300">
              <div
                className="text-3xl font-bold tracking-wider text-gray-800"
                aria-label={`Friend code: ${formatFriendCode(myFriendCode)}`}
              >
                {formatFriendCode(myFriendCode)}
              </div>
            </div>

            <button
              onClick={handleCopyFriendCode}
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              aria-label="Copy friend code to clipboard"
            >
              📋 Copy Code
            </button>
          </div>
        ) : (
          <div className="text-gray-500">
            <div className="animate-pulse bg-gray-200 h-12 rounded-xl mb-4" />
            <p>Loading your friend code...</p>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Renders the Add Friend tab content
   */
  const renderAddFriendTab = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4" role="img" aria-label="Plus emoji">
          ➕
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Add a Friend</h2>
        <p className="text-sm text-gray-600">
          Enter your friend's code to start following their progress!
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="friend-code-input" className="sr-only">
            Friend Code
          </label>
          <input
            id="friend-code-input"
            type="text"
            value={friendCodeInput}
            onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xl font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            aria-describedby="friend-code-help"
          />
          <p id="friend-code-help" className="sr-only">
            Enter a 6-character friend code
          </p>
        </div>

        <button
          onClick={handleAddFriend}
          disabled={!friendCodeInput.trim() || addFriendLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-300/40"
          aria-label="Add friend using the entered code"
        >
          {addFriendLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Adding...
            </span>
          ) : (
            '🤝 Add Friend'
          )}
        </button>
      </div>
    </div>
  );

  /**
   * Renders the Friends List tab content
   */
  const renderFriendsListTab = () => {
    if (friends.length === 0) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40 text-center">
          <div className="text-4xl mb-4" role="img" aria-label="People emoji">
            👥
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            No Friends Yet
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Add some friends to start sharing your progress!
          </p>
          <button
            onClick={() => handleTabSwitch('add-friend')}
            className="px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-300/40"
          >
            Add Your First Friend
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            You have {friends.length} friend{friends.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {friends.map((friend) => (
            <button
              key={friend.user_id}
              onClick={() => handleFriendClick(friend.user_id)}
              className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40 hover:shadow-xl transition-all text-left focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              aria-label={`View ${friend.name || 'Friend'}'s progress`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  aria-hidden="true"
                >
                  {(friend.name || 'F')[0].toUpperCase()}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">
                    {friend.name || 'Friend'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Code: {friend.friend_code}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl" role="img" aria-label="Eyes emoji">
                    👀
                  </div>
                  <p className="text-xs text-gray-500">View Progress</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Loading state - show full screen
  if (loading) {
    return renderLoading();
  }

  return (
    <div className={`h-screen w-full overflow-hidden ${dmSans.className}`}>
      {/* Back Button */}
      <div className="fixed left-4 z-40 notch-safe">
        <button
          onClick={() => {
            sessionStorage.setItem('isReturningToHome', 'true');
            navigate('/');
          }}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-blue-200/50 transition-all shadow-sm"
          aria-label="Go back to home"
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
      </div>

      {/* Header */}
      <FriendsHeader dancingScriptClass={dancingScript.className} />

      {/* Main Content */}
      <div
        className="w-full max-w-2xl mx-auto safe-x overflow-hidden"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          height: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: `calc(0.1rem + env(safe-area-inset-top))`, // Match summaries page
          paddingBottom: '2rem',
        }}
      >
        <div className="px-4 h-full overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400/80 text-base font-medium animate-pulse py-8">
              Loading your friends…
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-md mx-auto">
              {/* Message Banner */}
              {renderMessage()}

              {/* Tab Navigation */}
              {renderTabs()}

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'my-code' && renderMyCodeTab()}
                {activeTab === 'add-friend' && renderAddFriendTab()}
                {activeTab === 'friends-list' && renderFriendsListTab()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
