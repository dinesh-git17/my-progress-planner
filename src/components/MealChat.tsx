'use client';

import BreakfastModal from '@/components/BreakfastModal';
import DoneModal from '@/components/DoneModal';
import LunchModal from '@/components/LunchModal';
import { useNavigation } from '@/contexts/NavigationContext';
import { upsertMealLog } from '@/utils/mealLog';
import { getPendingSyncCount, logMealWithFallback } from '@/utils/sw-utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Dancing_Script } from 'next/font/google';
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
  const [processingComplete, setProcessingComplete] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [showBreakfastModal, setShowBreakfastModal] = useState(false);
  const [showLunchModal, setShowLunchModal] = useState(false);
  const [chatCompleted, setChatCompleted] = useState(false);

  // Refs for data persistence during chat
  const answers = useRef<string[]>([]);
  const gptReplies = useRef<string[]>([]);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const realInputRef = useRef<HTMLInputElement>(null);

  // Add overlay state for smooth transitions
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [initialViewportHeight, setInitialViewportHeight] = useState(0);

  const getUserName = async (): Promise<string> => {
    return localStorage.getItem('mealapp_quote_name') || 'unknown_user';
  };

  const { navigate } = useNavigation();

  // ============================================================================
  // INITIALIZATION & EFFECTS
  // ============================================================================

  /**
   * Simple viewport-based keyboard detection with scroll prevention
   */
  useEffect(() => {
    // Store initial viewport height
    setInitialViewportHeight(window.innerHeight);

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;

      // Keyboard is likely open if viewport shrunk by more than 150px
      const keyboardOpen = heightDifference > 150;

      setIsKeyboardOpen(keyboardOpen);

      if (keyboardOpen) {
        // AGGRESSIVE viewport locking - prevent iOS from moving the page
        document.body.style.position = 'fixed';
        document.body.style.top = '0px';
        document.body.style.left = '0px';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // SUPER AGGRESSIVE FIX: Lock header position with !important
        const headerElement = document.querySelector('header');
        if (headerElement) {
          headerElement.style.setProperty('position', 'fixed', 'important');
          headerElement.style.setProperty('top', '0px', 'important');
          headerElement.style.setProperty('left', '0px', 'important');
          headerElement.style.setProperty('right', '0px', 'important');
          headerElement.style.setProperty('width', '100%', 'important');
          headerElement.style.setProperty('z-index', '9999', 'important');
          headerElement.style.setProperty(
            'transform',
            'translateZ(0)',
            'important',
          );
          headerElement.style.setProperty(
            'will-change',
            'transform',
            'important',
          );
          // Prevent any viewport changes from affecting it
          headerElement.style.setProperty('margin', '0', 'important');
          headerElement.style.setProperty(
            'padding-top',
            'env(safe-area-inset-top)',
            'important',
          );
        }

        // Force scroll position to top
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      } else {
        // Restore normal page behavior when keyboard closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // RESTORE header position
        const headerElement = document.querySelector('header');
        if (headerElement) {
          headerElement.style.position = '';
          headerElement.style.top = '';
          headerElement.style.left = '';
          headerElement.style.right = '';
          headerElement.style.transform = '';
        }

        // Reset scroll position
        window.scrollTo(0, 0);
      }
    };

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }

      // Cleanup: restore normal styles
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      // RESTORE header position on cleanup
      const headerElement = document.querySelector('header');
      if (headerElement) {
        headerElement.style.position = '';
        headerElement.style.top = '';
        headerElement.style.left = '';
        headerElement.style.right = '';
        headerElement.style.transform = '';
      }
    };
  }, [initialViewportHeight]);

  useEffect(() => {
    // Minimum loading time for smooth animation
    const timer = setTimeout(() => {
      setInitialLoading(false);
      // Then start the chat after loading completes
      setTimeout(() => {
        setMessages([{ sender: 'bot', text: FIRST_PROMPT[meal] }]);
        setTimeout(() => scrollToBottom(), 100);
      }, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [meal]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOffline = !navigator.onLine;
      setOfflineMode(isOffline);
      console.log(isOffline ? '📴 App went offline' : '🌐 App back online');
    };

    const updatePendingCount = async () => {
      try {
        const count = await getPendingSyncCount();
        setPendingSyncCount(count);
        setShowOfflineIndicator(count > 0 || offlineMode);
      } catch (error) {
        console.error('Error getting pending sync count:', error);
      }
    };

    // Set initial state
    updateOnlineStatus();
    updatePendingCount();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('online', updatePendingCount); // Also update count when back online

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 10000); // Every 10 seconds

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('online', updatePendingCount);
      clearInterval(interval);
    };
  }, [offlineMode]);

  /**
   * Scroll to bottom after keyboard state changes
   */
  useEffect(() => {
    if (!chatBodyRef.current) return;

    // Only scroll if we have messages and keyboard state has stabilized
    if (messages.length > 0) {
      // Wait for keyboard transition to complete (300ms) + buffer
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 400); // Slightly longer than container transition

      return () => clearTimeout(timeoutId);
    }
  }, [isKeyboardOpen, messages]); // Trigger when keyboard state OR messages change

  // ============================================================================
  // CHAT HANDLERS
  // ============================================================================

  /**
   * Completes the chat session and saves meal log
   */
  /**
   * Completes the chat session and saves meal log
   */
  const finishChat = async () => {
    setProcessingComplete(true);
    setChatCompleted(true);

    try {
      const today = new Date()
        .toLocaleString('en-US', { timeZone: 'America/New_York' })
        .slice(0, 10);

      // Prepare chat messages in the format expected by offline storage
      const chatMessages = messages.map((msg, index) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: Date.now() - (messages.length - index) * 1000, // Approximate timestamps
      }));

      if (navigator.onLine) {
        // Try your existing online flow first
        try {
          await upsertMealLog({
            user_id: userId,
            date: today,
            meal,
            answers: answers.current,
            gpt_response: gptReplies.current,
          });

          console.log('✅ Meal logged successfully online');
        } catch (error) {
          console.warn(
            'Online meal logging failed, falling back to offline:',
            error,
          );

          // Fallback to offline storage
          const userName = await getUserName();
          const result = await logMealWithFallback({
            userId,
            userName,
            meal,
            chatMessages,
            generateSummary: true,
          });

          if (result.success) {
            console.log('📱 Meal saved offline, will sync when online');
            setPendingSyncCount(await getPendingSyncCount());
          } else {
            throw new Error('Failed to save meal offline');
          }
        }
      } else {
        // We're offline, store for later sync
        const userName = await getUserName();
        const result = await logMealWithFallback({
          userId,
          userName,
          meal,
          chatMessages,
          generateSummary: true,
        });

        if (result.success) {
          console.log('📱 Meal logged offline, will sync when online');
          setPendingSyncCount(await getPendingSyncCount());
        } else {
          throw new Error('Failed to save meal offline');
        }
      }

      setTimeout(() => {
        setLoading(false);

        // 🔥 HERE'S THE FIX: Show appropriate modal based on meal type
        if (meal === 'breakfast') {
          console.log('🍳 Showing breakfast modal');
          setShowBreakfastModal(true);
        } else if (meal === 'lunch') {
          console.log('🥪 Showing lunch modal');
          setShowLunchModal(true);
        } else if (meal === 'dinner') {
          console.log('🍽️ Showing done modal');
          setShowDoneModal(true);
        }

        // Set chat ended for non-dinner meals (optional, for state consistency)
        if (meal !== 'dinner') {
          setChatEnded(true);
        }
      }, 1500);
    } catch (error) {
      console.error('Error in finishChat:', error);
      setLoading(false);
      // You might want to show an error message to the user here
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

      setTimeout(() => {
        // 1. Stop showing the typing indicator first
        setLoading(false);

        // 2. THEN wait for its exit animation to finish (e.g. 300ms)
        setTimeout(() => {
          setMessages((msgs) => [...msgs, botMessage]);
          gptReplies.current.push(data.reply);

          // Finish chat AFTER the final bot message is displayed
          if (isLastTurn) {
            setTimeout(() => finishChat(), 1000);
          }
        }, 300);
      }, 250);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setLoading(false);

      // Add fallback message
      const fallbackMessage: Message = {
        sender: 'bot',
        text: "I'm having trouble right now, but I'm sure your meal was wonderful! 💕",
      };
      setMessages((msgs) => [...msgs, fallbackMessage]);
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !loading &&
      !chatEnded &&
      !showClosing &&
      !processingComplete &&
      input.trim()
    ) {
      handleSend();
    }
  };

  const scrollToBottom = () => {
    if (!chatBodyRef.current) return;

    const el = chatBodyRef.current;

    console.log('🔍 Before scroll check:', {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      isKeyboardOpen: isKeyboardOpen,
    });

    const isNearBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 150;

    console.log('📝 Should scroll?', isNearBottom);

    if (isNearBottom) {
      // Force layout recalculation
      el.offsetHeight;

      const targetScroll = el.scrollHeight - el.clientHeight;

      console.log('🎯 Scrolling to:', targetScroll);

      // Immediate scroll (no delays here - the effect handles timing)
      el.scrollTop = targetScroll;

      console.log('✅ Scroll applied. Current scrollTop:', el.scrollTop);
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
      className={`flex w-full ${
        msg.sender === 'user' ? 'justify-end' : 'justify-start'
      }`}
      style={{
        marginBottom: msg.sender === 'user' ? '25px' : '12px',
      }}
      data-message={`${msg.sender}-${index}`}
    >
      {/* Bot Avatar - Always show for bot messages */}
      {msg.sender === 'bot' && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-md text-lg">
            🤖
          </div>
        </div>
      )}

      <div
        className={`${msg.sender === 'user' ? 'max-w-[75%]' : 'max-w-[75%]'}`}
        style={{ position: 'relative' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -5 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0,
          }}
          className={`
          relative px-4 py-2.5 break-words select-text
          ${
            msg.sender === 'user'
              ? 'rounded-[20px] rounded-tr-[4px] text-white'
              : 'rounded-[20px] rounded-tl-[4px] text-black'
          }
        `}
          style={{
            fontFamily: SYSTEM_FONT,
            fontSize: '16px',
            lineHeight: '21px',
            letterSpacing: '-0.32px',
            fontWeight: '400',
            background:
              msg.sender === 'user'
                ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)'
                : 'rgba(255, 255, 255, 0.35)',
            boxShadow:
              msg.sender === 'user'
                ? `
                0 4px 20px rgba(236, 72, 153, 0.35),
                0 2px 8px rgba(236, 72, 153, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
                : `
                0 8px 32px rgba(0, 0, 0, 0.06),
                0 4px 16px rgba(0, 0, 0, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            backdropFilter:
              msg.sender === 'bot' ? 'saturate(180%) blur(25px)' : 'none',
            WebkitBackdropFilter:
              msg.sender === 'bot' ? 'saturate(180%) blur(25px)' : 'none',
            border:
              msg.sender === 'bot' ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
          }}
        >
          {msg.text}
        </motion.div>

        {/* Read Status - Absolutely positioned to not affect bubble layout */}
        {msg.sender === 'user' && (
          <div
            className="text-xs text-right"
            style={{
              position: 'absolute',
              bottom: '-22px',
              right: '0px',
              minWidth: '1020px',
              height: '20px',
              opacity: index < messages.length - 1 ? 1 : 0,
              transition: 'opacity 0.3s ease',
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            {index < messages.length - 1 && (
              <span className="flex items-center justify-end gap-1 text-gray-400 whitespace-nowrap">
                <span>
                  Read{' '}
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
                <svg
                  className="w-3.5 h-3.5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <svg
                  className="w-3.5 h-3.5 text-blue-500 -ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Renders typing indicator
   */
  const renderTypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="px-4 py-2.5 rounded-[20px] rounded-tl-[4px] max-w-[75%]"
      style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'saturate(180%) blur(25px)',
        WebkitBackdropFilter: 'saturate(180%) blur(25px)',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.4)',
        border: '1px solid rgba(255,255,255,0.4)',
      }}
    >
      <div className="flex gap-1">
        {[0, 150, 300].map((delay, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </motion.div>
  );

  const renderOfflineIndicator = () => {
    if (!showOfflineIndicator) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 p-3 shadow-sm"
        style={{
          fontFamily: SYSTEM_FONT,
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {offlineMode ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-amber-800 font-medium">
                  You're offline
                </span>
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                <span className="text-sm text-amber-800 font-medium">
                  {pendingSyncCount} meal{pendingSyncCount > 1 ? 's' : ''}{' '}
                  pending sync
                </span>
              </>
            ) : null}
          </div>
        </div>

        {offlineMode && (
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            Your meals will be saved and synced when connection returns.
          </p>
        )}
      </motion.div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Loading state - show full screen
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          {/* Animated chat bubble icon */}
          <motion.div
            className="relative mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg"
              animate={{
                y: [-2, 2, -2],
                rotate: [0, 1, -1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="text-3xl">💬</span>
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
              Starting {meal.charAt(0).toUpperCase() + meal.slice(1)} Chat
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Getting ready to hear about your delicious meal...
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
        </motion.div>
      </div>
    );
  }
  return (
    <>
      {renderOfflineIndicator()}
      <div
        className="flex flex-col w-full max-w-md mx-auto shadow-xl"
        style={{
          fontFamily: SYSTEM_FONT,
          background:
            'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%)',
          height: '100vh',
          position: 'absolute', // Critical for iOS PWA
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
            background: 'rgba(255, 255, 255, 0.35)', // ✅ Much more opaque for contrast
            backdropFilter: 'saturate(180%) blur(25px)',
            WebkitBackdropFilter: 'saturate(180%) blur(25px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)', // ✅ Adds depth
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Back Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('isReturningToHome', 'true');
                navigate('/');
              }}
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
            bottom: isKeyboardOpen ? '350px' : '100px',
            padding: '20px 16px 100px 16px',
            WebkitOverflowScrolling: 'touch',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderRadius: '20px 20px 0 0',
            border: '0.5px solid rgba(255, 255, 255, 0.15)',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            scrollBehavior: 'smooth',
            minHeight: 0,
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            paddingBottom: '100px',
            transition: 'bottom 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
          {messages.map(renderMessage)}
          <AnimatePresence initial={false}>
            {loading && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center mb-3"
                style={{
                  minHeight: '48px',
                }}
              >
                {/* Bot Avatar for typing indicator */}
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-md text-lg">
                    🤖
                  </div>
                </div>

                {/* Typing Dots */}
                <div
                  className="px-4 py-2.5 rounded-[20px] rounded-tl-[4px] max-w-[75%]"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'saturate(180%) blur(25px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(25px)',
                    boxShadow:
                      '0 8px 32px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
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
            )}
          </AnimatePresence>
        </div>
        {/* Input Bar - Only This Moves Up */}
        {!chatEnded && (
          <div
            className={`w-full px-4 py-4 transition-all duration-500 ${
              chatCompleted ? 'blur-sm opacity-50' : ''
            }`}
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
              pointerEvents: chatCompleted ? 'none' : 'auto',
            }}
          >
            <form className="flex items-center gap-3" onSubmit={handleSubmit}>
              <div className="relative flex-1">
                <input
                  ref={realInputRef}
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
                    background: 'rgba(255, 255, 255, 0.25)', // ✅ Enhanced glass effect
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `
                    0 4px 16px rgba(0, 0, 0, 0.08),
                    0 2px 8px rgba(0, 0, 0, 0.04),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                    backdropFilter: 'saturate(180%) blur(30px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(30px)',
                    paddingRight: '52px',
                  }}
                  type="text"
                  placeholder={
                    processingComplete
                      ? 'Saving your meal data...'
                      : loading || chatEnded || showClosing
                        ? 'Wait for my reply…'
                        : 'Message'
                  }
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
        {/* Chat Complete Overlay - Only show for non-dinner meals or when DoneModal isn't shown */}

        <AnimatePresence>
          {chatCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              {/* Only show text and loading bar if no modals are open */}
              {!showBreakfastModal && !showLunchModal && !showDoneModal && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-center px-8 py-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'saturate(180%) blur(25px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(25px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <p
                    className="text-lg font-medium text-gray-800 mb-4"
                    style={{ fontFamily: SYSTEM_FONT }}
                  >
                    Saving your data...
                  </p>

                  {/* Loading bar */}
                  <div
                    className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden"
                    style={{ background: 'rgba(0, 0, 0, 0.1)' }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <BreakfastModal
          isOpen={showBreakfastModal}
          onClose={() => setShowBreakfastModal(false)}
          onNavigateToLunch={() => {
            setShowBreakfastModal(false);
            navigate('/lunch');
          }}
        />
        <LunchModal
          isOpen={showLunchModal}
          onClose={() => setShowLunchModal(false)}
          onNavigateToDinner={() => {
            setShowLunchModal(false);
            navigate('/dinner');
          }}
        />
        <DoneModal
          isOpen={showDoneModal}
          onClose={() => setShowDoneModal(false)}
          onNavigateHome={() => {
            setShowDoneModal(false);
            navigate('/');
          }}
        />
      </div>
    </>
  );
}
