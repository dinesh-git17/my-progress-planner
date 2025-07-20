'use client';

import { upsertMealLog } from '@/utils/mealLog';
import { AnimatePresence, motion } from 'framer-motion';
import { Dancing_Script } from 'next/font/google';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface Props {
  meal: 'breakfast' | 'lunch' | 'dinner';
  userId: string;
  showNextMeal?: boolean;
  nextMealLabel?: string;
  nextMealHref?: string;
  onComplete: () => void;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const FIRST_PROMPT: Record<string, string> = {
  breakfast: 'Good morning, love! ☀️ What did you have for breakfast today? ♥️',
  lunch: 'Hey cutie! 🍱 What yummy thing did you eat for lunch? 🤭',
  dinner: 'Hey love! 🍽️ What did you have for dinner tonight? 🥺',
};

const MAX_TURNS = 3;

const SYSTEM_FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif`;

// ============================================================================
// MAIN COMPONENT (CLEANED)
// ============================================================================
export default function MealChat({
  meal,
  userId,
  showNextMeal = false,
  nextMealLabel = '',
  nextMealHref = '',
  onComplete,
}: Props) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatEnded, setChatEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClosing, setShowClosing] = useState(false);

  // Refs for data persistence during chat
  const answers = useRef<string[]>([]);
  const gptReplies = useRef<string[]>([]);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [initialViewportHeight, setInitialViewportHeight] = useState(0);

  const router = useRouter();

  // ============================================================================
  // INITIALIZATION & EFFECTS
  // ============================================================================

  /**
   * Initialize chat with first bot message
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{ sender: 'bot', text: FIRST_PROMPT[meal] }]);
    }, 300);

    return () => clearTimeout(timer);
  }, [meal]);

  /**
   * Single smooth auto-scroll
   */
  useEffect(() => {
    if (!chatBodyRef.current) return;

    const scrollToBottom = () => {
      const el = chatBodyRef.current;
      if (!el) return;

      // Single smooth scroll to bottom
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    };

    // Single scroll attempt with small delay for DOM updates
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, loading]);

  /**
   * Keyboard state change scroll (gentler approach)
   */
  useEffect(() => {
    if (!chatBodyRef.current) return;

    // Only scroll if we're not already at the bottom
    const scrollToBottomGently = () => {
      const el = chatBodyRef.current;
      if (!el) return;

      const isAtBottom =
        el.scrollHeight - el.scrollTop <= el.clientHeight + 100;

      // Only auto-scroll if user was already near the bottom
      if (isAtBottom) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth',
        });
      }
    };

    // Gentle scroll after keyboard animation completes
    const timeoutId = setTimeout(scrollToBottomGently, 350); // After transform animation

    return () => clearTimeout(timeoutId);
  }, [isKeyboardOpen]);

  /**
   * iOS keyboard detection with page scroll prevention
   */
  useEffect(() => {
    // Store initial viewport height
    setInitialViewportHeight(window.innerHeight);

    // iOS keyboard detection using focus/blur events
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      // Check if focused element can trigger keyboard
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Delay to ensure keyboard animation starts
        setTimeout(() => {
          setIsKeyboardOpen(true);

          // PREVENT PAGE SCROLLING ONLY WHEN KEYBOARD IS OPEN
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';

          // BUT ALLOW THE CHAT CONTAINER TO SCROLL
          if (chatBodyRef.current) {
            chatBodyRef.current.style.touchAction = 'pan-y';
            chatBodyRef.current.style.overflowY = 'auto';
          }

          // Prevent iOS from pushing viewport up
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;

          // Auto-scroll to bottom after keyboard opens
          setTimeout(() => {
            if (chatBodyRef.current) {
              chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
          }, 300);

          // Additional aggressive scrolls for iOS
          setTimeout(() => {
            if (chatBodyRef.current) {
              chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
          }, 600);

          setTimeout(() => {
            if (chatBodyRef.current) {
              chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
          }, 1000);
        }, 100);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        setIsKeyboardOpen(false);

        // RESTORE PAGE SCROLLING
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // Reset any scroll position
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Auto-scroll to bottom after keyboard closes
        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          }
        }, 300);
      }, 100);
    };

    // Add global event listeners
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);

      // Cleanup: restore scrolling on unmount
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ============================================================================
  // CHAT HANDLERS
  // ============================================================================

  /**
   * Completes the chat session and saves meal log
   */
  const finishChat = async () => {
    setLoading(true);

    try {
      const today = new Date()
        .toLocaleString('en-US', { timeZone: 'America/New_York' })
        .slice(0, 10);

      await upsertMealLog({
        user_id: userId,
        date: today,
        meal,
        answers: answers.current,
        gpt_response: gptReplies.current,
      });

      setTimeout(() => {
        setChatEnded(true);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error saving meal log:', error);
      setLoading(false);
      // Still show chat ended state even if save fails
      setChatEnded(true);
    }
  };

  /**
   * Handles sending user message and getting AI response
   */
  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    answers.current.push(input);
    setInput('');
    setLoading(true);

    try {
      const msgHistory = [...messages, userMessage];
      const userMsgs = msgHistory.filter((m) => m.sender === 'user').length;

      // Check if this is the final turn
      const isLastTurn = userMsgs >= MAX_TURNS;
      if (isLastTurn) {
        setShowClosing(true);
      }

      // Get AI response
      const response = await fetch('/api/gpt/meal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal,
          messages: msgHistory,
          closing: isLastTurn,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const botMessage: Message = { sender: 'bot', text: data.reply };

      setMessages((msgs) => [...msgs, botMessage]);
      gptReplies.current.push(data.reply);
      setLoading(false);

      // FORCE SCROLL TO NEW MESSAGE
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 100);

      // Finish chat if this was the last turn
      if (isLastTurn) {
        setTimeout(() => finishChat(), 1400);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setLoading(false);

      // Add fallback message
      const fallbackMessage: Message = {
        sender: 'bot',
        text: "I'm having trouble right now, but I'm sure your meal was wonderful! 💕",
      };
      setMessages((msgs) => [...msgs, fallbackMessage]);

      // SINGLE SMOOTH SCROLL FOR FALLBACK MESSAGE
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTo({
            top: chatBodyRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 200);
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && !chatEnded && !showClosing && input.trim()) {
      handleSend();
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renders individual message bubble
   */
  const renderMessage = (msg: Message, index: number) => (
    <div
      key={`${msg.sender}-${index}`}
      className={`flex w-full mb-1.5 ${
        msg.sender === 'user' ? 'justify-end' : 'justify-start'
      }`}
      data-message={`${msg.sender}-${index}`} // Add data attribute for targeting
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: index === 0 ? 0.15 : 0,
        }}
        className={`
         relative px-4 py-2.5 max-w-[75%] break-words select-text
         ${
           msg.sender === 'user'
             ? 'rounded-[22px] rounded-br-[8px] text-white'
             : 'rounded-[22px] rounded-bl-[8px] text-black'
         }
       `}
        style={{
          fontFamily: SYSTEM_FONT,
          fontSize: '17px',
          lineHeight: '22px',
          letterSpacing: '-0.41px',
          fontWeight: '400',
          background:
            msg.sender === 'user'
              ? 'linear-gradient(135deg, #E8A4C9 0%, #D4A5D6 100%)'
              : 'rgba(255, 255, 255, 0.75)',
          boxShadow:
            msg.sender === 'user'
              ? '0 1px 3px rgba(232, 164, 201, 0.15), 0 1px 2px rgba(232, 164, 201, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          border:
            msg.sender === 'bot' ? '0.5px solid rgba(0, 0, 0, 0.04)' : 'none',
        }}
      >
        {msg.text}
      </motion.div>
    </div>
  );

  /**
   * Renders typing indicator
   */
  const renderTypingIndicator = () => (
    <div className="flex justify-start mb-1.5">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{
          duration: 0.25,
          ease: [0.25, 0.46, 0.45, 0.94],
          type: 'spring',
          stiffness: 350,
          damping: 25,
        }}
        className="px-4 py-2.5 rounded-[22px] rounded-bl-[8px] max-w-[75%]"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          border: '0.5px solid rgba(0, 0, 0, 0.04)',
          boxShadow:
            '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            {[0, 150, 300].map((delay, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  /**
   * Renders completion overlay
   */
  const renderCompletionOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.4,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className="mx-4 max-w-sm w-full px-8 py-10 flex flex-col items-center text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'saturate(180%) blur(40px)',
          WebkitBackdropFilter: 'saturate(180%) blur(40px)',
          borderRadius: '20px',
          boxShadow: `
           0 32px 64px rgba(0, 0, 0, 0.08),
           0 16px 32px rgba(0, 0, 0, 0.04),
           inset 0 1px 0 rgba(255, 255, 255, 0.4),
           inset 0 -1px 0 rgba(0, 0, 0, 0.02)
         `,
          border: '0.5px solid rgba(255, 255, 255, 0.25)',
          fontFamily: SYSTEM_FONT,
        }}
      >
        <div
          className="mb-8 text-gray-700"
          style={{
            fontSize: '18px',
            lineHeight: '23px',
            letterSpacing: '-0.24px',
            fontWeight: '500',
            textShadow: '0 0.5px 1px rgba(255, 255, 255, 0.9)',
          }}
        >
          {meal === 'dinner'
            ? 'All done for today! You did amazing 💖'
            : `Yay! Ready for ${meal === 'breakfast' ? 'lunch' : 'dinner'}?`}
        </div>

        <div className="flex flex-col gap-4 w-full">
          {showNextMeal && nextMealHref && (
            <button
              onClick={() => onComplete()}
              className="w-full py-3.5 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #E8A4C9 0%, #D4A5D6 100%)',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '500',
                letterSpacing: '-0.24px',
                boxShadow: `
                 0 4px 20px rgba(232, 164, 201, 0.25),
                 0 2px 8px rgba(232, 164, 201, 0.15),
                 inset 0 1px 0 rgba(255, 255, 255, 0.2)
               `,
                border: '0.5px solid rgba(255, 255, 255, 0.1)',
              }}
              aria-label={`Continue to ${nextMealLabel}`}
            >
              <span className="relative z-10">{nextMealLabel}</span>
              <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  borderRadius: '16px',
                }}
              />
            </button>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 text-gray-600 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
            style={{
              background: 'rgba(120, 120, 128, 0.12)',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '500',
              letterSpacing: '-0.24px',
              boxShadow: `
               0 2px 10px rgba(0, 0, 0, 0.04),
               0 1px 4px rgba(0, 0, 0, 0.02),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -0.5px 0 rgba(0, 0, 0, 0.04)
             `,
              border: '0.5px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
            aria-label="Return to home page"
          >
            <span className="relative z-10">Home</span>
            <div
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
              }}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div
      className="flex flex-col w-full max-w-md mx-auto shadow-xl"
      style={{
        fontFamily: SYSTEM_FONT,
        background: '#fdf6e3',
        height: '100vh',
        position: 'fixed', // Critical for iOS PWA
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '448px',
        overflow: 'hidden', // Prevent scrolling
        touchAction: 'none', // Prevent touch scrolling on main container
        WebkitOverflowScrolling: 'auto', // Disable momentum scrolling
      }}
      onTouchMove={(e) => {
        // Prevent page scrolling, but allow chat to handle its own events
        e.preventDefault();
      }}
    >
      {/* Fixed Header - iOS Safe */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '0.5px solid rgba(0, 0, 0, 0.08)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-8 h-8 text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go Back to Home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>

          {/* Center: Meal Title */}
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={`${meal} emoji`}>
              {meal === 'breakfast' ? '🍳' : meal === 'lunch' ? '🫐' : '🍜'}
            </span>
            <div
              className="text-lg font-semibold text-gray-900"
              style={{
                fontFamily: SYSTEM_FONT,
                letterSpacing: '-0.02em',
              }}
            >
              {meal ? meal.charAt(0).toUpperCase() + meal.slice(1) : 'Chat'}
            </div>
          </div>

          {/* Right: Menu/Options (placeholder for now) */}
          <div className="w-8 h-8" />
        </div>
      </header>

      {/* Chat Messages - Adjust Height for Keyboard */}
      <div
        ref={chatBodyRef}
        className="w-full px-4 py-4 flex flex-col justify-start overflow-y-auto"
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 56px)',
          left: 0,
          right: 0,
          bottom: isKeyboardOpen ? '350px' : '100px', // CHANGE HEIGHT for available space
          WebkitOverflowScrolling: 'touch',
          background: 'transparent',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          scrollBehavior: 'auto',
          minHeight: 0,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          paddingBottom: '100px', // Increased space for input bar
          transition: 'bottom 0.3s ease', // SMOOTH height transition
        }}
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom =
            el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
          console.log('Scroll position:', {
            scrollTop: el.scrollTop,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            isAtBottom,
          });
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map(renderMessage)}
          {loading && renderTypingIndicator()}
        </AnimatePresence>
      </div>

      {/* Input Bar - Only This Moves Up */}
      {!chatEnded && (
        <div
          className="w-full px-4 py-4"
          style={{
            position: 'absolute',
            bottom: '0px', // Always at bottom
            left: 0,
            right: 0,
            background: 'transparent',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            transform: isKeyboardOpen
              ? 'translateY(-350px)'
              : 'translateY(0px)', // ONLY INPUT BAR MOVES
            transition: 'transform 0.3s ease', // Smooth animation
            zIndex: 40,
          }}
        >
          <form className="flex items-center gap-3" onSubmit={handleSubmit}>
            <div className="relative flex-1">
              <input
                disabled={loading}
                className="
               w-full px-5 py-3 text-black placeholder-gray-500 outline-none transition-all duration-200
               disabled:opacity-60
             "
                style={{
                  fontFamily: SYSTEM_FONT,
                  fontSize: '17px',
                  lineHeight: '22px',
                  letterSpacing: '-0.41px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '0.5px solid rgba(0, 0, 0, 0.04)',
                  boxShadow:
                    '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  paddingRight: '52px',
                }}
                type="text"
                placeholder={loading ? 'Wait for my reply…' : 'Message'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus={
                  typeof window !== 'undefined' && window.innerWidth > 768
                } // Only autofocus on desktop
                autoComplete="off"
                inputMode="text"
                aria-label="Type your message"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="
               absolute right-1.5 top-1/2 -translate-y-1/2
               flex items-center justify-center w-8 h-8 transition-all duration-200
               disabled:opacity-40 disabled:scale-95
               hover:scale-105 active:scale-95
             "
                style={{
                  borderRadius: '20px',
                  background:
                    input.trim() && !loading
                      ? 'linear-gradient(135deg, #E8A4C9 0%, #D4A5D6 100%)'
                      : 'rgba(142, 142, 147, 0.6)',
                  boxShadow:
                    input.trim() && !loading
                      ? '0 2px 8px rgba(232, 164, 201, 0.25), 0 1px 3px rgba(232, 164, 201, 0.15)'
                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
                aria-label="Send message"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="text-white"
                  aria-hidden="true"
                >
                  <path
                    d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Complete Overlay */}
      <AnimatePresence>
        {chatEnded && renderCompletionOverlay()}
      </AnimatePresence>
    </div>
  );
}
