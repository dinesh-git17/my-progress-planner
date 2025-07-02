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
  const [messages, setMessages] = useState([{ sender: 'bot', text: FIRST_PROMPT[meal] }])
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

  // Scroll to bottom ONLY when new message, if overflow
  useEffect(() => {
    if (!chatBodyRef.current) return
    const el = chatBodyRef.current
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, loading])

  async function finishChat() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
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

  const fontFamily = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`

  // Height constants: header = 44px, input bar = 64px + safe-area
  const HEADER_HEIGHT = 44
  const INPUT_HEIGHT = 64 // adjust if your bar is taller/shorter

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        fontFamily,
        height: windowHeight || '100dvh', // fallback for SSR
        background: '#fdf6e3',
      }}
    >
      {/* FIXED GRADIENT BG */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(135deg, #fdf6e3 0%, #fff5fa 54%, #e6e6fa 100%)',
        }}
      />
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center bg-white/60 border-b border-white/30 text-[1.08rem] font-semibold text-gray-700 select-none backdrop-blur-md"
        style={{
          height: HEADER_HEIGHT,
          fontFamily,
        }}
      >
        {meal.charAt(0).toUpperCase() + meal.slice(1)} Chat
      </div>
      {/* Chat Messages */}
      <div
        ref={chatBodyRef}
        className="absolute left-0 right-0 w-full mx-auto py-4 flex flex-col justify-start overflow-y-auto"
        style={{
          top: HEADER_HEIGHT,
          bottom: `calc(${INPUT_HEIGHT}px + env(safe-area-inset-bottom))`,
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          background: 'transparent',
          maxWidth: '40rem',
          margin: '0 auto',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -22 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={`
                flex w-full relative
                ${msg.sender === 'user'
                  ? 'justify-end pr-[3vw]'
                  : 'justify-start pl-[3vw]'
                }
              `}
              style={{
                marginBottom: i < messages.length - 1 ? '0.20rem' : 0,
                marginTop: 0,
              }}
            >
              <div
                className={`
                  relative px-4 py-2 rounded-[1.1rem] text-[1.07rem] leading-snug shadow
                  max-w-[80vw] sm:max-w-[355px] break-words select-text
                  ${msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-pink-400 to-pink-300 text-white font-semibold'
                    : 'bg-white/95 text-gray-900 font-medium'}
                `}
                style={{
                  boxShadow: msg.sender === 'user'
                    ? '0 1.5px 7px 0 rgba(240,60,130,0.10)'
                    : '0 1.5px 7px 0 rgba(140,140,140,0.08)',
                  borderTopRightRadius: msg.sender === 'user' ? '1.6rem' : undefined,
                  borderTopLeftRadius: msg.sender === 'bot' ? '1.6rem' : undefined,
                }}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start pl-[3vw] relative"
            >
              <div className="px-4 py-2 rounded-[1.2rem] bg-white/70 text-gray-400 italic shadow-sm max-w-[54vw]">
                typing…
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Input Bar */}
      {!chatEnded && (
        <form
          className="fixed left-0 right-0 bottom-0 z-30 w-full flex items-center gap-2 px-3 pt-1 pb-[env(safe-area-inset-bottom)] bg-transparent max-w-2xl mx-auto"
          style={{
            fontFamily,
            height: INPUT_HEIGHT,
            background: 'transparent',
          }}
          onSubmit={e => {
            e.preventDefault()
            if (!loading && !chatEnded && !showClosing) handleSend()
          }}
        >
          <div className="relative flex-1 flex items-center">
            <input
              disabled={loading}
              className="
                w-full px-4 py-3 rounded-full bg-white/80
                text-gray-800 placeholder-gray-400 text-[1.07rem] shadow
                focus:ring-2 focus:ring-pink-200 outline-none transition
                border-none
              "
              style={{
                fontFamily,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                boxShadow: '0 1px 12px 0 rgba(255,182,193,0.12)',
                border: 'none'
              }}
              type="text"
              placeholder={loading ? 'Wait for my reply…' : 'Type your answer…'}
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
                absolute right-1 top-1 bottom-1 my-auto flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-pink-300 shadow
                text-white font-bold text-xl transition hover:scale-110 active:scale-95 disabled:opacity-60
                border-none outline-none
              "
              aria-label="Send"
              style={{ zIndex: 3 }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 20L20 12L4 4V10L16 12L4 14V20Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </form>
      )}
      {/* Overlay for Chat Complete */}
      {chatEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2.5px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.33, type: "spring", stiffness: 160, damping: 18 }}
            className="bg-white/95 rounded-3xl shadow-2xl max-w-xs w-full px-6 py-8 flex flex-col items-center"
            style={{ fontFamily }}
          >
            <div className="text-center mb-4 text-lg font-semibold text-pink-500">
              {meal === 'dinner'
                ? 'All done for today! You did amazing 💖'
                : `Yay! Ready for ${meal === 'breakfast' ? 'lunch' : 'dinner'}?`}
            </div>
            <div className="flex gap-2 w-full justify-center mt-2">
              {showNextMeal && nextMealHref && (
                <button
                  onClick={() => onComplete()}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-pink-300 text-white font-bold text-base shadow transition hover:scale-105"
                >
                  {nextMealLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-base shadow transition hover:scale-105"
              >
                Home
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
