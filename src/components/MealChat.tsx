'use client'

import { getOrCreateUserId, upsertMealLog } from '@/utils/mealLog'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  meal: 'breakfast' | 'lunch' | 'dinner'
  showNextMeal?: boolean
  nextMealLabel?: string
  nextMealHref?: string
  onComplete: () => void
}

const FIRST_PROMPT: Record<string, string> = {
  breakfast: "Good morning, love! ☀️ What did you have for breakfast today? ♥️",
  lunch: "Hey cutie! 🍱 What yummy thing did you eat for lunch? 🤭",
  dinner: "Hey love! 🍽️ What did you have for dinner tonight? 🥺",
}

export default function MealChat({
  meal,
  showNextMeal = false,
  nextMealLabel = '',
  nextMealHref = '',
  onComplete,
}: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([])
  const [chatEnded, setChatEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showClosing, setShowClosing] = useState(false)
  const answers = useRef<string[]>([])
  const gptReplies = useRef<string[]>([])
  const router = useRouter()
  const MAX_TURNS = 3

  // Ref for scroll
  const chatBodyRef = useRef<HTMLDivElement>(null)

  // Dynamically track window height for keyboard gap fix
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  )

  useEffect(() => {
    function handleResize() {
      setWindowHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('focus', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('focus', handleResize)
    }
  }, [])

  // Add initial message with animation delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{ sender: 'bot', text: FIRST_PROMPT[meal] }])
    }, 300) // Small delay for smooth entry

    return () => clearTimeout(timer)
  }, [meal])

  // Scroll to bottom when new message - smooth
  useEffect(() => {
    if (!chatBodyRef.current) return
    const el = chatBodyRef.current
    el.scrollTop = el.scrollHeight
  }, [messages, loading])

  async function finishChat() {
    setLoading(true)
    const today = new Date().toLocaleString("en-US", { timeZone: "America/New_York" }).slice(0, 10);
    const user_id = getOrCreateUserId()
    await upsertMealLog({
      user_id,
      date: today,
      meal,
      answers: answers.current,
      gpt_response: gptReplies.current,
    })
    setTimeout(() => {
      setChatEnded(true)
      setLoading(false)
    }, 500)
  }

  async function handleSend() {
    if (!input) return
    setMessages((msgs) => [...msgs, { sender: 'user', text: input }])
    answers.current.push(input)
    setInput('')
    setLoading(true)
    const msgHistory = [...messages, { sender: 'user', text: input }]
    const userMsgs = msgHistory.filter((m) => m.sender === 'user').length
    if (userMsgs >= MAX_TURNS) {
      setShowClosing(true)
      const res = await fetch('/api/gpt/meal-chat', {
        method: 'POST',
        body: JSON.stringify({ meal, messages: msgHistory, closing: true }),
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.reply }])
      gptReplies.current.push(data.reply)
      setLoading(false)
      setTimeout(() => finishChat(), 1400)
      return
    }
    const res = await fetch('/api/gpt/meal-chat', {
      method: 'POST',
      body: JSON.stringify({ meal, messages: msgHistory }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setMessages((msgs) => [...msgs, { sender: 'bot', text: data.reply }])
    gptReplies.current.push(data.reply)
    setLoading(false)
  }

  const systemFont = `-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif`

  return (
    <div
      className="flex flex-col w-full max-w-md mx-auto shadow-xl"
      style={{
        fontFamily: systemFont,
        height: windowHeight || '100dvh',
        minHeight: 0,
        background: '#fdf6e3',
      }}
    >
      {/* Background Gradient */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #fdf6e3 0%, #fff5fa 54%, #e6e6fa 100%)',
        }}
      />

      {/* Header */}
      <div 
        className="flex-shrink-0 h-11 flex items-center justify-center relative z-20 sticky top-0"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'saturate(180%) blur(30px)',
          WebkitBackdropFilter: 'saturate(180%) blur(30px)',
          borderBottom: '0.5px solid rgba(232, 164, 201, 0.15)',
          fontFamily: systemFont,
          boxShadow: '0 1px 10px rgba(232, 164, 201, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div className="flex items-center justify-between w-full px-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-8 h-8 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Go back"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-gray-600">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 12H5m0 0l7 7m-7-7l7-7"
              />
            </svg>
          </button>
          
          <div className="flex items-center gap-2.5">
            <span className="text-lg">
              {meal === 'breakfast' ? '🍳' : meal === 'lunch' ? '🥪' : '🍜'}
            </span>
            <h1 className="text-[17px] font-semibold text-gray-800 tracking-[-0.41px] leading-[22px]">
              {meal ? meal.charAt(0).toUpperCase() + meal.slice(1) : 'Chat'}
            </h1>
          </div>
          
          <div className="w-8 h-8"></div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatBodyRef}
        className="flex-1 w-full px-4 py-6 flex flex-col justify-start overflow-y-auto"
        style={{
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          background: 'transparent',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <div
              key={`${msg.sender}-${i}`}
              className={`
                flex w-full mb-1.5 relative
                ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}
              `}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: i === 0 ? 0.15 : 0
                }}
                className={`
                  relative px-4 py-2.5 max-w-[75%] break-words select-text
                  ${msg.sender === 'user'
                    ? 'rounded-[22px] rounded-br-[8px] text-white'
                    : 'rounded-[22px] rounded-bl-[8px] text-black'
                  }
                `}
                style={{
                  fontFamily: systemFont,
                  fontSize: '17px',
                  lineHeight: '22px',
                  letterSpacing: '-0.41px',
                  fontWeight: msg.sender === 'user' ? '400' : '400',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #E8A4C9 0%, #D4A5D6 100%)'
                    : 'rgba(255, 255, 255, 0.75)',
                  boxShadow: msg.sender === 'user'
                    ? '0 1px 3px rgba(232, 164, 201, 0.15), 0 1px 2px rgba(232, 164, 201, 0.1)'
                    : '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                  border: msg.sender === 'bot' ? '0.5px solid rgba(0, 0, 0, 0.04)' : 'none',
                }}
              >
                {msg.text}
              </motion.div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start mb-1.5">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ 
                  duration: 0.25, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  type: "spring",
                  stiffness: 350,
                  damping: 25
                }}
                className="px-4 py-2.5 rounded-[22px] rounded-bl-[8px] max-w-[75%]"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '0.5px solid rgba(0, 0, 0, 0.04)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Bar */}
      {!chatEnded && (
        <div 
          className="flex-shrink-0 w-full px-4 pb-[env(safe-area-inset-bottom)] mb-6 sticky bottom-0"
          style={{
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}
        >
          <form
            className="flex items-center gap-3"
            onSubmit={e => {
              e.preventDefault()
              if (!loading && !chatEnded && !showClosing) handleSend()
            }}
          >
            <div className="relative flex-1">
              <input
                disabled={loading}
                className="
                  w-full px-5 py-3 text-black placeholder-gray-500 outline-none transition-all duration-200
                  disabled:opacity-60
                "
                style={{
                  fontFamily: systemFont,
                  fontSize: '17px',
                  lineHeight: '22px',
                  letterSpacing: '-0.41px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '0.5px solid rgba(0, 0, 0, 0.04)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  paddingRight: '52px', // Make room for send button
                }}
                type="text"
                placeholder={loading ? 'Wait for my reply…' : 'Message'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                autoComplete="off"
                inputMode="text"
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
                  background: input.trim() && !loading 
                    ? 'linear-gradient(135deg, #E8A4C9 0%, #D4A5D6 100%)'
                    : 'rgba(142, 142, 147, 0.6)',
                  boxShadow: input.trim() && !loading
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
      {chatEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              type: "spring", 
              stiffness: 300, 
              damping: 25 
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
              fontFamily: systemFont,
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
                >
                  <span className="relative z-10">{nextMealLabel}</span>
                  <div 
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
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
      )}
    </div>
  )
}
