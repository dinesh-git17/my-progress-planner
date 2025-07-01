'use client'
import { getOrCreateUserId, upsertMealLog } from '@/utils/mealLog'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

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
  dinner: "Hey love! 🍽️ What did you have for dinner tonight? 🥺"
}

export default function MealChat({
  meal,
  showNextMeal = false,
  nextMealLabel = '',
  nextMealHref = '',
  onComplete,
}: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { sender: 'bot', text: FIRST_PROMPT[meal] }
  ])
  const [chatEnded, setChatEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showClosing, setShowClosing] = useState(false)
  const answers = useRef<string[]>([])
  const router = useRouter()

  // End after this many user messages
  const MAX_TURNS = 3

  async function finishChat() {
    setLoading(true)
    const today = new Date().toISOString().slice(0,10)
    const user_id = getOrCreateUserId()
    await upsertMealLog({
      user_id,
      date: today,
      meal,
      answers: answers.current
    })
    setTimeout(() => {
      setChatEnded(true)
      setLoading(false)
    }, 500)
  }

  async function handleSend() {
    if (!input) return
    setMessages(msgs => [...msgs, { sender: 'user', text: input }])
    answers.current.push(input)
    setInput('')
    setLoading(true)

    // Prepare message history
    const msgHistory = [
      ...messages,
      { sender: 'user', text: input }
    ]

    const userMsgs = msgHistory.filter(m => m.sender === 'user').length
    if (userMsgs >= MAX_TURNS) {
      // Show closing message from GPT
      setShowClosing(true)
      const res = await fetch('/api/gpt/meal-chat', {
        method: 'POST',
        body: JSON.stringify({ meal, messages: msgHistory, closing: true }),
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      setMessages(msgs => [...msgs, { sender: 'bot', text: data.reply }])
      setLoading(false)
      // Wait a bit, then save and show CTA
      setTimeout(finishChat, 1400)
      return
    }

    // Otherwise, continue normal chat
    const res = await fetch('/api/gpt/meal-chat', {
      method: 'POST',
      body: JSON.stringify({ meal, messages: msgHistory }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setMessages(msgs => [...msgs, { sender: 'bot', text: data.reply }])
    setLoading(false)
  }

  return (
    <main className="w-full h-[100dvh] min-h-0 flex items-center justify-center bg-gradient-to-br from-[#f6d365] to-[#fda085] overflow-hidden">
      <section className="w-full max-w-sm flex flex-col h-full min-h-0 overflow-hidden relative shadow-xl rounded-3xl bg-white/90 my-2">
        <div className="flex-1 flex flex-col overflow-y-auto px-3 pt-5 pb-6 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -22 }}
                transition={{ duration: 0.19 }}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`px-3 py-1.5 mb-1 rounded-xl shadow-sm leading-snug break-words text-[1rem] font-medium
                  ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-pink-400 to-yellow-400 text-white self-end'
                      : 'bg-white/95 border border-orange-50 text-gray-800 self-start'
                  }`}
                  style={{
                    maxWidth: '78%',
                    fontSize: '1rem',
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="flex justify-start"
              >
                <div className="px-3 py-1.5 mb-1 rounded-xl bg-white/95 border border-orange-50 text-gray-500 italic self-start shadow-sm animate-pulse">
                  typing…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Chat input bar, hidden when closing or ended */}
        {!chatEnded && !showClosing && (
          <form
            className="flex gap-2 items-center p-2 bg-white/90 backdrop-blur-md border-t border-orange-100 transition-all"
            style={{
              borderBottomLeftRadius: '1.2rem',
              borderBottomRightRadius: '1.2rem',
              minHeight: '52px',
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
            }}
            onSubmit={e => {
              e.preventDefault()
              if (!loading && !chatEnded && !showClosing) handleSend()
            }}
          >
            <input
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-xl border border-orange-200 bg-white placeholder-gray-400 text-gray-700 text-[1rem] shadow-inner focus:ring-2 focus:ring-orange-200 outline-none transition"
              type="text"
              placeholder={loading ? "Wait for my reply…" : "Type your answer…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              autoComplete="off"
              inputMode="text"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold text-base shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        )}
        {/* Chat ended: show CTA */}
        {chatEnded && (
          <div className="flex flex-col items-center pb-5 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.38 }}
              className="text-center mb-2 text-lg text-pink-600 font-semibold"
            >
              {meal === 'dinner'
                ? "All done for today! You did amazing 💖"
                : `Yay! Ready for ${meal === 'breakfast' ? 'lunch' : 'dinner'}?`}
            </motion.div>
            <div className="flex gap-2 w-full justify-center">
              {/* Next Meal / Finish Day */}
              {showNextMeal && nextMealHref && (
                <button
                  onClick={() => onComplete()}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold text-base shadow-md transition hover:scale-105"
                >
                  {nextMealLabel}
                </button>
              )}
              {/* Return Home */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-gray-300 to-orange-200 text-gray-700 font-semibold text-base shadow-md transition hover:scale-105"
              >
                Home
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
