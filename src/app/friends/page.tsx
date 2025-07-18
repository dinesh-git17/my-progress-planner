'use client';

import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useRouter } from 'next/navigation';
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
// CONSTANTS
// ============================================================================
const BANNER_CURVE_HEIGHT = 44;
const BANNER_TOP_PADDING = 32;
const BANNER_BOTTOM_PADDING = 22;
const BANNER_TEXT_HEIGHT = 74;
const BANNER_TOTAL_HEIGHT =
  BANNER_CURVE_HEIGHT +
  BANNER_TOP_PADDING +
  BANNER_BOTTOM_PADDING +
  BANNER_TEXT_HEIGHT;

// ============================================================================
// HEADER COMPONENT (CLEANED)
// ============================================================================
function FriendsHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        height: BANNER_TOTAL_HEIGHT,
        background: '#f5ede6', // Clean solid background
      }}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Header content */}
        <div
          className="flex flex-col items-center w-full px-4"
          style={{
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
            Friends
          </div>
          <div className="text-lg sm:text-xl text-gray-600 font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            Connect with friends and share your progress 👥
          </div>
        </div>

        {/* Curved bottom border using SVG */}
        <svg
          className="absolute left-0 bottom-0 w-full"
          viewBox="0 0 500 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            height: BANNER_CURVE_HEIGHT,
          }}
        >
          <path d="M0 0C82 40 418 40 500 0V44H0V0Z" fill="#f5ede6" />
        </svg>
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
  const router = useRouter();

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
      router.push('/');
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  /**
   * Fetch user's friend code and friends list
   */
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
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
   * Handles adding a new friend
   */
  const handleAddFriend = async () => {
    if (!friendCodeInput.trim() || !userId) return;

    setAddFriendLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        );
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData.friends || []);
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to add friend',
        });
      }
    } catch (error) {
      console.error('Add friend error:', error);
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      });
    } finally {
      setAddFriendLoading(false);
    }
  };

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
    router.push(`/friends/${friendUserId}`);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

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
      { id: 'add-friend' as TabType, label: 'Add Friend', emoji: '➕' },
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
                ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg'
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
            <div className="bg-gradient-to-r from-pink-100 to-yellow-100 rounded-xl p-4 border-2 border-dashed border-pink-300">
              <div
                className="text-3xl font-bold tracking-wider text-gray-800"
                aria-label={`Friend code: ${formatFriendCode(myFriendCode)}`}
              >
                {formatFriendCode(myFriendCode)}
              </div>
            </div>

            <button
              onClick={handleCopyFriendCode}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-pink-300/40"
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
            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xl font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            aria-describedby="friend-code-help"
          />
          <p id="friend-code-help" className="sr-only">
            Enter a 6-character friend code
          </p>
        </div>

        <button
          onClick={handleAddFriend}
          disabled={!friendCodeInput.trim() || addFriendLoading}
          className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-pink-300/40"
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
            className="px-6 py-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-pink-300/40"
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
              className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40 hover:shadow-xl transition-all text-left focus:outline-none focus:ring-4 focus:ring-pink-300/40"
              aria-label={`View ${friend.name || 'Friend'}'s progress`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white"
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
  return (
    <div className={`min-h-screen w-full ${dmSans.className}`}>
      {/* Back Button */}
      <div className="fixed left-4 top-4 z-40">
        <button
          onClick={() => router.push('/')}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-pink-200/50 transition-all shadow-sm"
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
        className="w-full max-w-2xl mx-auto"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          minHeight: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
      >
        <div className="px-4">
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
