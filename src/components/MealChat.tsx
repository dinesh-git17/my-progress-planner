'use client';

import DoneModal from '@/components/DoneModal';
import { useNavigation } from '@/contexts/NavigationContext';
import { upsertMealLog } from '@/utils/mealLog';
import { getPendingSyncCount, logMealWithFallback } from '@/utils/sw-utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Dancing_Script } from 'next/font/google';
import React, { useEffect, useRef, useState } from 'react';
import { FaHome } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);

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
  const finishChat = async () => {
    setLoading(true);

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
        // Special handling for dinner completion
        if (meal === 'dinner') {
          // For dinner, show DoneModal directly instead of chatEnded
          setShowDoneModal(true);
          setLoading(false);
        } else {
          // For other meals, use regular completion flow
          setChatEnded(true);
          setLoading(false);
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
        }, 300);
      }, 250);

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
      {/* Bot Avatar - Only show for bot messages and not for the most recent one if loading */}
      {msg.sender === 'bot' && !(loading && index === messages.length - 1) && (
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

  /**
   * Handles done day modal
   */
  const handleFinishDay = async () => {
    try {
      // First, complete the dinner chat (save the meal data)
      await finishChat();

      // Show the done modal instead of navigating
      console.log('🎉 Dinner completed, showing done modal');
      setShowDoneModal(true);
    } catch (error) {
      console.error('Error completing dinner:', error);
      // Fallback to regular onComplete if there's an error
      onComplete();
    }
  };

  /**
   * Renders completion overlay - Modern transparent glassmorphism design covering entire screen
   */
  const renderCompletionOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Full-screen transparent glassmorphism background - covers header too */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(236, 72, 153, 0.02) 0%, rgba(168, 85, 247, 0.015) 50%, rgba(244, 114, 182, 0.02) 100%)',
          backdropFilter: 'saturate(110%) blur(40px)',
          WebkitBackdropFilter: 'saturate(110%) blur(40px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          type: 'spring',
          stiffness: 280,
          damping: 20,
        }}
        className="relative z-10 mx-6 w-full max-w-sm flex flex-col items-center text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'saturate(160%) blur(30px)',
          WebkitBackdropFilter: 'saturate(160%) blur(30px)',
          borderRadius: '28px',
          boxShadow: `
        0 32px 80px rgba(0, 0, 0, 0.08),
        0 16px 40px rgba(0, 0, 0, 0.04),
        0 8px 20px rgba(0, 0, 0, 0.02),
        inset 0 1px 0 rgba(255, 255, 255, 0.4),
        inset 0 -1px 0 rgba(0, 0, 0, 0.03)
      `,
          border: '1px solid rgba(255, 255, 255, 0.25)',
          padding: '48px 32px',
        }}
      >
        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-10"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
          }}
        >
          {/* Primary Message - sparkles style */}
          <h2
            className="text-gray-800 font-bold text-center"
            style={{
              fontSize: 'clamp(18px, 5vw, 24px)',
              lineHeight: '1.2',
              letterSpacing: '-0.4px',
              fontWeight: '800',
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.7)',
              marginBottom: '24px',
            }}
          >
            {meal === 'dinner'
              ? 'What a complete, perfect day '
              : meal === 'breakfast'
                ? 'What a perfect start to your day '
                : "You're powering through perfectly "}
            <GiSparkles
              className="text-pink-500 inline ml-1"
              style={{
                fontSize: '0.9em',
                verticalAlign: 'baseline',
              }}
            />
          </h2>
          {/* Secondary Message */}
          <p
            className="text-gray-600 font-medium text-center"
            style={{
              fontSize: '15px',
              lineHeight: '20px',
              letterSpacing: '-0.1px',
              fontWeight: '600',
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              textShadow: '0 0.5px 1px rgba(255, 255, 255, 0.5)',
            }}
          >
            {meal === 'dinner'
              ? 'You should be so proud, sweetheart 💖'
              : meal === 'breakfast'
                ? 'Ready to keep this energy going?'
                : 'Dinner time is going to be special!'}
          </p>
        </motion.div>

        {/* Button Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="space-y-4 w-full"
        >
          {/* Primary CTA - Home Button (AuthPrompt style) */}
          <motion.button
            onClick={() => {
              sessionStorage.setItem('isReturningToHome', 'true');
              navigate('/');
            }}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="
          group w-full rounded-xl font-semibold
          transition-all duration-300
          flex items-center justify-center gap-3
          text-white
        "
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
              boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.25)',
              minHeight: 'max(48px, 12vw)',
              maxHeight: '56px',
              padding: 'clamp(0.75rem, 3vw, 1rem) 1.5rem',
              fontSize: 'clamp(1rem, 4vw, 1.125rem)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #db2777 0%, #ec4899 100%)';
              e.currentTarget.style.boxShadow =
                '0 8px 25px 0 rgba(236, 72, 153, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)';
              e.currentTarget.style.boxShadow =
                '0 4px 14px 0 rgba(236, 72, 153, 0.25)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #ec4899';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            aria-label="Return to home page"
          >
            <span>Home</span>
            <FaHome
              className="transition-transform group-hover:scale-110"
              style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}
            />
          </motion.button>

          {/* Secondary CTA - Go to Next Meal or Finish Day */}
          {showNextMeal && nextMealHref && (
            <>
              {/* Subtle separator */}
              <div className="relative py-2">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div
                    className="w-full border-t"
                    style={{ borderColor: 'rgba(209, 213, 219, 0.4)' }}
                  />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-4 font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#6B7280',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
                    }}
                  >
                    or
                  </span>
                </div>
              </div>

              <motion.button
                onClick={async () => {
                  // Special handling for "Finish Day" (dinner completion)
                  if (nextMealLabel === 'Finish Day') {
                    try {
                      await handleFinishDay();
                    } catch (error) {
                      console.error('Error completing dinner:', error);
                      // Fallback to regular onComplete if there's an error
                      onComplete();
                    }
                  } else {
                    // Regular meal completion flow
                    onComplete();
                  }
                }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                className="
              group w-full rounded-xl font-medium
              border-2 transition-all duration-300
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
                style={{
                  borderColor: 'rgba(209, 213, 219, 0.5)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ec4899',
                  minHeight: 'max(44px, 10vw)',
                  maxHeight: '52px',
                  padding: 'clamp(0.625rem, 2.5vw, 0.875rem) 1.25rem',
                  fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#ec4899';
                    e.currentTarget.style.background =
                      'rgba(236, 72, 153, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor =
                      'rgba(209, 213, 219, 0.5)';
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #ec4899';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
                aria-label={`Continue to ${nextMealLabel}`}
              >
                {nextMealLabel === 'Finish Day' && loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                    <span>Finishing...</span>
                  </div>
                ) : (
                  <span>{nextMealLabel}</span>
                )}
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
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

        {/* Chat Complete Overlay - Only show for non-dinner meals or when DoneModal isn't shown */}
        <AnimatePresence>
          {chatEnded && !showDoneModal && renderCompletionOverlay()}
        </AnimatePresence>

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
