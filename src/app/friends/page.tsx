'use client';

import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const dmSans = DM_Sans({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });

interface Friend {
  user_id: string;
  name: string;
  friend_code: string;
  friendship_created_at: string;
}

// Header banner dimensions - same as Summaries page
const BANNER_CURVE_HEIGHT = 44;
const BANNER_TOP_PADDING = 32;
const BANNER_BOTTOM_PADDING = 22;
const BANNER_TEXT_HEIGHT = 74;
const BANNER_TOTAL_HEIGHT =
  BANNER_CURVE_HEIGHT +
  BANNER_TOP_PADDING +
  BANNER_BOTTOM_PADDING +
  BANNER_TEXT_HEIGHT;

function FriendsHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
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
            Friends
          </div>
          <div className="text-lg sm:text-xl text-gray-600 font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            Connect with friends and share your progress 👥
          </div>
        </div>

        {/* Curved bottom border using SVG for precise control */}
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

export default function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'my-code' | 'add-friend' | 'friends-list'
  >('my-code');
  const [userId, setUserId] = useState<string>('');
  const [myFriendCode, setMyFriendCode] = useState<string>('');
  const [friendCodeInput, setFriendCodeInput] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Get user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  // Fetch user's friend code and friends list
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

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
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setAddFriendLoading(false);
    }
  };

  const copyFriendCode = async () => {
    if (!myFriendCode) return;

    try {
      // Modern clipboard API (preferred)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(myFriendCode);
        setMessage({ type: 'success', text: 'Friend code copied! 📋' });
        return;
      }

      // Fallback for iOS and older browsers
      const textArea = document.createElement('textarea');
      textArea.value = myFriendCode;
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
      textArea.setSelectionRange(0, myFriendCode.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setMessage({ type: 'success', text: 'Friend code copied! 📋' });
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      setMessage({
        type: 'error',
        text: 'Copy failed. Please copy manually: ' + myFriendCode,
      });
    }
  };

  const formatFriendCode = (code: string) => {
    return code.replace(/(.{3})(.{3})/, '$1$2');
  };

  const BG_GRADIENT =
    'linear-gradient(135deg, #f5ede6 0%, #f7edf5 54%, #d8d8f0 100%)';

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden fixed inset-0 ${dmSans.className}`}
    >
      {/* Fixed gradient background - same as Summaries */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: BG_GRADIENT }}
      />

      {/* Back Button - same position as Summaries */}
      <div
        className="absolute left-4 top-4 z-40"
        style={{
          position: 'fixed',
          zIndex: 40,
          top: '16px',
          left: '16px',
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
      </div>

      {/* Banner fixed above - same as Summaries */}
      <FriendsHeader dancingScriptClass={dancingScript.className} />

      {/* Content area - same layout as Summaries */}
      <div
        className="flex-1 w-full max-w-2xl mx-auto flex flex-col relative z-10"
        style={{
          marginTop: `${BANNER_TOTAL_HEIGHT - 70}px`,
          height: `calc(100vh - ${BANNER_TOTAL_HEIGHT - 70}px)`,
          overflow: 'hidden',
        }}
      >
        <div
          className="h-full px-3 flex items-start justify-center pt-24"
          style={{
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div className="text-center text-gray-400/80 text-base font-medium animate-pulse py-20">
              Loading your friends…
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-md">
              {/* Message */}
              {message && (
                <div
                  className={`p-3 rounded-xl text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Tabs */}
              <div className="flex bg-white/90 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/40">
                {[
                  { id: 'my-code', label: 'My Code', emoji: '🏷️' },
                  { id: 'add-friend', label: 'Add Friend', emoji: '➕' },
                  { id: 'friends-list', label: 'Friends', emoji: '👥' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMessage(null);
                    }}
                    className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="mr-1">{tab.emoji}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* My Code Tab */}
                {activeTab === 'my-code' && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🏷️</div>
                      <h2 className="text-lg font-bold text-gray-800 mb-2">
                        Your Friend Code
                      </h2>
                      <p className="text-sm text-gray-600 mb-6">
                        Share this code with friends so they can add you!
                      </p>

                      {myFriendCode ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-pink-100 to-yellow-100 rounded-xl p-4 border-2 border-dashed border-pink-300">
                            <div className="text-3xl font-bold tracking-wider text-gray-800">
                              {formatFriendCode(myFriendCode)}
                            </div>
                          </div>

                          <button
                            onClick={copyFriendCode}
                            className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                          >
                            📋 Copy Code
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <div className="animate-pulse bg-gray-200 h-12 rounded-xl mb-4"></div>
                          Loading your friend code...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Friend Tab */}
                {activeTab === 'add-friend' && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
                    <div className="text-center mb-6">
                      <div className="text-4xl mb-4">➕</div>
                      <h2 className="text-lg font-bold text-gray-800 mb-2">
                        Add a Friend
                      </h2>
                      <p className="text-sm text-gray-600">
                        Enter your friend&apos;s code to start following their
                        progress!
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={friendCodeInput}
                          onChange={(e) =>
                            setFriendCodeInput(e.target.value.toUpperCase())
                          }
                          placeholder="ABC123"
                          maxLength={6}
                          className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xl font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={handleAddFriend}
                        disabled={!friendCodeInput.trim() || addFriendLoading}
                        className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                      >
                        {addFriendLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding...
                          </span>
                        ) : (
                          '🤝 Add Friend'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Friends List Tab */}
                {activeTab === 'friends-list' && (
                  <div className="space-y-4">
                    {friends.length === 0 ? (
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40 text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">
                          No Friends Yet
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                          Add some friends to start sharing your progress!
                        </p>
                        <button
                          onClick={() => setActiveTab('add-friend')}
                          className="px-6 py-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                        >
                          Add Your First Friend
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600">
                            You have {friends.length} friend
                            {friends.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {friends.map((friend) => (
                            <div
                              key={friend.user_id}
                              onClick={() =>
                                router.push(`/friends/${friend.user_id}`)
                              }
                              className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40 hover:shadow-xl transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white">
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
                                  <div className="text-2xl">👀</div>
                                  <p className="text-xs text-gray-500">
                                    View Progress
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
