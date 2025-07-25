'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Message = {
  text: string;
  sender: 'bot' | 'user';
};
type Answers = { breakfast: string; lunch: string; dinner: string };

const INITIAL_BOT_MESSAGES = [
  {
    text: "Hey love, let's start with breakfast or coffee—what did you have this morning?",
    sender: 'bot' as const,
  },
];

export default function MealLogPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_BOT_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [mealStage, setMealStage] = useState(0); // 0=breakfast, 1=lunch, 2=dinner, 3=done
  const [answers, setAnswers] = useState<Answers>({
    breakfast: '',
    lunch: '',
    dinner: '',
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { navigate } = useNavigation();

  // Always scroll to bottom on new message or keyboard
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // iOS/Android keyboard fix: scroll to bottom on viewport resize
  useLayoutEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const focusInput = () => {
    if (inputRef.current && !chatEnded) inputRef.current.focus();
  };

  // Main chat send handler
  const handleSend = async () => {
    if (!input.trim() || loading || chatEnded) return;
    const userMessage: Message = { text: input.trim(), sender: 'user' };

    // Save answer per meal stage
    if (mealStage === 0) setAnswers((a) => ({ ...a, breakfast: input.trim() }));
    else if (mealStage === 1)
      setAnswers((a) => ({ ...a, lunch: input.trim() }));
    else if (mealStage === 2)
      setAnswers((a) => ({ ...a, dinner: input.trim() }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const history = [...messages, userMessage].map((msg) => ({
      role: msg.sender === 'bot' ? 'assistant' : 'user',
      content: msg.text,
    }));

    let newStage = mealStage;
    if (mealStage === 0) newStage = 1;
    else if (mealStage === 1) newStage = 2;
    else if (mealStage === 2) newStage = 3;

    const res = await fetch('/api/gpt/meal-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, mealStage: newStage }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { text: data.reply, sender: 'bot' }]);
    setMealStage(newStage);
    setLoading(false);
    if (newStage === 3) {
      setChatEnded(true);
      // Save answers to Supabase via API
      fetch('/api/admin/log-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            ...answers,
            dinner: mealStage === 2 ? input.trim() : answers.dinner,
          },
        }),
      });
    }
  };

  return (
    <main className="w-full h-[100dvh] min-h-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f6d365] to-[#fda085] overflow-hidden">
      {/* Back navigation button */}
      <motion.div
        className="fixed left-4 z-40 notch-safe"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate('/')}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-pink-200/50 transition-all shadow-sm"
          aria-label="Go Back to Home"
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
      </motion.div>

      <section
        className="w-full max-w-sm flex flex-col h-full min-h-0 overflow-hidden relative shadow-xl rounded-3xl bg-white/90 safe-x"
        style={{
          marginTop: 'max(1rem, env(safe-area-inset-top))',
          marginBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Chat area */}
        <div
          className="flex-1 flex flex-col overflow-y-auto px-3 min-h-0"
          onClick={focusInput}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            transition: 'background 0.3s',
            paddingTop: 'calc(1.25rem + env(safe-area-inset-top))',
            paddingBottom: 'calc(8vh + env(safe-area-inset-bottom))',
          }}
        >
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
                    borderBottomRightRadius:
                      msg.sender === 'user' ? '0.7rem' : '1.25rem',
                    borderBottomLeftRadius:
                      msg.sender === 'bot' ? '0.7rem' : '1.25rem',
                    boxShadow:
                      msg.sender === 'user'
                        ? '0 1px 8px 0 #fda08522'
                        : '0 1px 8px 0 #d6ba8555',
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef}></div>
        </div>
        {/* Input area */}
        <form
          className={`flex gap-2 items-center p-2 bg-white/90 backdrop-blur-md border-t border-orange-100 transition-all ${
            chatEnded ? 'opacity-60 pointer-events-none' : ''
          }`}
          style={{
            borderBottomLeftRadius: '1.2rem',
            borderBottomRightRadius: '1.2rem',
            minHeight: '52px',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading && !chatEnded) handleSend();
          }}
        >
          <input
            type="text"
            style={{ position: 'absolute', left: '-9999px', top: 0 }}
            tabIndex={-1}
            aria-hidden
          />
          <input
            ref={inputRef}
            disabled={loading || chatEnded}
            className="flex-1 px-3 py-2 rounded-xl border border-orange-200 bg-white placeholder-gray-400 text-gray-700 text-[1rem] shadow-inner focus:ring-2 focus:ring-orange-200 outline-none transition"
            type="text"
            placeholder={
              chatEnded
                ? 'See you tomorrow, love!'
                : loading
                  ? 'Thinking…'
                  : 'Type your answer…'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="off"
            inputMode="text"
            style={{
              minHeight: '2rem',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            disabled={loading || chatEnded}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold text-base shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-60"
            style={{
              minHeight: '2rem',
            }}
          >
            Send
          </button>
        </form>
        {chatEnded && (
          <div
            className="flex justify-center"
            style={{
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
            }}
          >
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold text-base shadow-md transition hover:scale-105 mt-3"
            >
              Back to Home
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
