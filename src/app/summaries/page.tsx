'use client'

import { getOrCreateUserId } from '@/utils/mealLog'
import { motion } from 'framer-motion'
import { DM_Sans, Dancing_Script } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['500', '700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' })

type Summary = {
  date: string
  breakfast_summary: string | null
  lunch_summary: string | null
  dinner_summary: string | null
  full_day_summary: string | null
}

const storyTabs = [
  { key: "breakfast_summary", label: "Breakfast", emoji: "🍳" },
  { key: "lunch_summary", label: "Lunch", emoji: "🥪" },
  { key: "dinner_summary", label: "Dinner", emoji: "🍽️" },
  { key: "full_day_summary", label: "Day Summary", emoji: "💖" }
]

function formatPrettyDateStacked(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return { monthDay: dateString, year: '' }
  const monthDay = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric'
  })
  const year = date.getFullYear()
  return { monthDay, year }
}

function prettifyText(str: string | null) {
  if (!str) return ''
  let s = str.trim()
  s = s.charAt(0).toUpperCase() + s.slice(1)
  if (!/[.?!…]$/.test(s)) s += '.'
  return s
}

const STORY_DURATION = 20000 // ms
const BANNER_CURVE_HEIGHT = 44
const BANNER_TOP_PADDING = 32
const BANNER_BOTTOM_PADDING = 22
const BANNER_TEXT_HEIGHT = 74
const BANNER_TOTAL_HEIGHT = BANNER_CURVE_HEIGHT + BANNER_TOP_PADDING + BANNER_BOTTOM_PADDING + BANNER_TEXT_HEIGHT

function SummariesHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
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
          background: 'linear-gradient(135deg, #fdf6e3 0%, #fff5fa 54%, #e6e6fa 100%)',
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
            }}>
            Summaries
          </div>
          <div className="text-lg sm:text-xl text-purple-700/80 font-medium text-center max-w-lg mx-auto mt-2 px-2 leading-tight" style={{ fontFamily: "inherit" }}>
            A gentle way to track your meal journey and celebrate your daily wins ✨
          </div>
        </div>
        {/* SVG flush at the bottom, curve is the mask */}
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
            <linearGradient id="curveGradient" x1="0" y1="0" x2="500" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fdf6e3" />
              <stop offset="0.54" stopColor="#fff5fa" />
              <stop offset="1" stopColor="#e6e6fa" />
            </linearGradient>
          </defs>
          <path
            d="M0 0C82 40 418 40 500 0V44H0V0Z"
            fill="url(#curveGradient)"
          />
        </svg>
      </div>
    </header>
  )
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null)
  const [activeStoryIdx, setActiveStoryIdx] = useState(0)
  const [storyAutoKey, setStoryAutoKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSummaries = async () => {
      const user_id = getOrCreateUserId()
      const res = await fetch(`/api/summaries?user_id=${user_id}`)
      const data = await res.json()
      setSummaries(data.summaries || [])
      setLoading(false)
    }
    fetchSummaries()
  }, [])

  useEffect(() => {
    if (activeSummary) setActiveStoryIdx(0)
  }, [activeSummary])

  useEffect(() => {
    if (!activeSummary) return

    const availableStories = getAvailableStories(activeSummary)
    setStoryAutoKey(prev => prev + 1)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (activeStoryIdx >= availableStories.length - 1) {
        setActiveSummary(null)
      } else {
        setActiveStoryIdx(idx => Math.min(idx + 1, availableStories.length - 1))
      }
    }, STORY_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line
  }, [activeSummary, activeStoryIdx])

  function getAvailableStories(summary: Summary) {
    return storyTabs.filter(tab => summary[tab.key as keyof Summary])
  }
  function handleStoryAreaClick() {
    const availableStories = getAvailableStories(activeSummary!)
    if (activeStoryIdx >= availableStories.length - 1) {
      setActiveSummary(null)
    } else {
      setActiveStoryIdx(idx => Math.min(idx + 1, availableStories.length - 1))
      setStoryAutoKey(prev => prev + 1)
    }
  }
  function handleDotClick(i: number) {
    setActiveStoryIdx(i)
    setStoryAutoKey(prev => prev + 1)
  }

  const BG_GRADIENT = "linear-gradient(135deg, #fdf6e3 0%, #fff5fa 54%, #e6e6fa 100%)"

  return (
    <div className={`relative min-h-screen w-full flex flex-col overflow-hidden ${dmSans.className}`}>
      {/* Fixed gradient background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: BG_GRADIENT }}
      />
      {/* Back Button */}
      <motion.div
        className="absolute left-4 top-4 z-40"
        initial={{ opacity: 0, x: -10 }}  // Starts slightly off-screen to the left
        animate={{ opacity: 1, x: 0 }}   // Moves to the normal position
        exit={{ opacity: 0, x: -10 }}    // Moves off-screen to the left on exit
        transition={{ duration: 0.3 }}   // Smooth transition time
        style={{
          position: 'fixed',  // Make sure it's fixed
          zIndex: 40,         // Ensure it's above other content
          top: '16px',        // Keep it fixed from the top
          left: '16px',       // Keep it fixed from the left
          willChange: 'opacity'  // Optimize rendering for opacity change
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="p-3 bg-white/80 text-gray-900 rounded-full shadow-md hover:bg-purple-100/70 focus:ring-2 focus:ring-purple-300 transition-all"
          aria-label="Go Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
      </motion.div>

      {/* Banner fixed above */}
      <SummariesHeader dancingScriptClass={dancingScript.className} />

      {/* Cards area - only this scrolls, fully transparent, hides under banner */}
      <div
        className="flex-1 w-full max-w-2xl mx-auto flex flex-col relative z-10"
        style={{
          paddingTop: `${BANNER_TOTAL_HEIGHT - BANNER_CURVE_HEIGHT}px`,
          minHeight: 0,
          height: `calc(100dvh - 0px)`,
          overflow: 'hidden',
        }}
      >
        <div
          className="flex-1 overflow-y-auto px-3 pt-14 pb-8"
          style={{
            borderRadius: 0,
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            height: '100%',
            zIndex: 10,
            background: 'transparent'
          }}
        >
          {loading ? (
            <div className="mt-14 text-center text-gray-400/80 text-base font-medium animate-pulse">Loading summaries…</div>
          ) : summaries.length === 0 ? (
            <div className="mt-14 text-center text-gray-400/80 text-lg font-normal">No summaries yet. Start logging your meals 💖</div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {summaries.map((summary, idx) => (
                <button
                  key={summary.date}
                  className={`
                    flex items-center justify-center w-full h-[230px] sm:h-[260px] rounded-3xl
                    bg-gradient-to-br from-[#fdf6e3] via-[#f8e1f7] to-[#e9e6fa]
                    shadow-xl border-[1.5px] border-white/20
                    transition-all hover:scale-[1.02] active:scale-95 focus:ring-2 focus:ring-purple-100
                    cursor-pointer
                  `}
                  onClick={() => setActiveSummary(summary)}
                  style={{
                    boxShadow: '0 6px 24px 0 rgba(180,120,220,0.08)',
                  }}
                >
                  {(() => {
                    const { monthDay, year } = formatPrettyDateStacked(summary.date)
                    return (
                      <span className="flex flex-col items-center justify-center w-full">
                        <span
                          className={`text-[2.05rem] sm:text-[2.4rem] text-center text-gray-700 ${dancingScript.className}`}
                          style={{
                            letterSpacing: '0.008em',
                            fontWeight: 600,
                            lineHeight: 1.08,
                            textShadow: '0 2px 18px rgba(210,140,200,0.08)',
                          }}
                        >
                          {monthDay}
                        </span>
                        <span
                          className={`text-[1.16rem] sm:text-[1.32rem] text-center text-gray-500 ${dancingScript.className}`}
                          style={{
                            fontWeight: 500,
                            marginTop: '0.13em',
                          }}
                        >
                          {year}
                        </span>
                      </span>
                    )
                  })()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* IG-Style Story Modal */}
      {activeSummary && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
          <div
            className={`
              w-full h-[100dvh] max-h-[100dvh] flex flex-col animate-fadein overflow-hidden
              bg-gradient-to-br from-white/85 via-[#f6e7fc]/80 to-[#fdf6fa]/90
              select-none
              ${dmSans.className}
            `}
            onClick={handleStoryAreaClick}
            style={{
              borderRadius: 0,
              boxShadow: '0 12px 48px 0 rgba(120,80,140,0.08)',
              minHeight: '100dvh',
              maxHeight: '100dvh'
            }}
          >
            {/* Modal Top: Progress bar & Close */}
            <div className="relative flex items-center w-full pt-10 pb-2 px-6">
              <div className="flex-1 flex gap-2">
                {getAvailableStories(activeSummary).map((tab, i) => (
                  <div
                    key={tab.key}
                    className="flex-1 h-[3px] rounded-full bg-purple-200/60 overflow-hidden relative"
                  >
                    {i < activeStoryIdx && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-400 transition-all duration-300" style={{ width: '100%' }} />
                    )}
                    {i === activeStoryIdx && (
                      <div
                        key={storyAutoKey}
                        className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-200 to-purple-400"
                        style={{
                          width: '0%',
                          animation: `fillBar ${STORY_DURATION}ms linear forwards`
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Close Button */}
              <button
                onClick={e => { e.stopPropagation(); setActiveSummary(null) }}
                className="absolute right-2 top-1 text-gray-400 bg-transparent hover:bg-purple-100/70 rounded-none p-2 shadow-sm z-20"
                aria-label="Close"
                style={{
                  backdropFilter: 'blur(3px)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#444',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                X
              </button>
            </div>
            <style>
              {`
                @keyframes fillBar {
                  from { width: 0% }
                  to { width: 100% }
                }
              `}
            </style>
            {/* Modal Content, fills page */}
            <div className="flex flex-col flex-1 min-h-0 w-full px-6 pb-3 justify-start">
              {/* Date */}
              <div className="w-full pt-8 pb-2 flex flex-col items-center">
                <div className="text-center text-purple-600/80 font-medium uppercase tracking-widest text-[1.15rem] sm:text-[1.25rem] select-none mb-1">
                  {(() => {
                    const { monthDay, year } = formatPrettyDateStacked(activeSummary.date)
                    return (
                      <>
                        {monthDay} <span className="block">{year}</span>
                      </>
                    )
                  })()}
                </div>
              </div>
              {/* Label */}
              <div className="text-center text-purple-700 text-[2.2rem] sm:text-[2.7rem] font-semibold leading-tight mt-1 mb-6" style={{ letterSpacing: '-0.02em' }}>
                {(() => {
                  const availableStories = getAvailableStories(activeSummary)
                  const tab = availableStories[activeStoryIdx]
                  return `${tab.emoji} ${tab.label}`
                })()}
              </div>
              {/* Story text: fills rest */}
                <div
                  className={`
                    w-full max-w-xl mx-auto px-1
                    text-gray-600/90
                    text-[1.01rem] sm:text-[1.09rem]
                    leading-[1.8] select-text
                    rounded-xl
                    flex-1 flex items-start
                    antialiased
                    font-[500]
                    tracking-wide
                    italic
                  `}
                  style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    fontFamily: `'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`
                  }}
                >
                  {(() => {
                    const availableStories = getAvailableStories(activeSummary)
                    const tab = availableStories[activeStoryIdx]
                    const storyContent = prettifyText(activeSummary[tab.key as keyof Summary] as string)
                    return storyContent
                  })()}
                </div>


              {/* Dots at the bottom */}
              <div className="flex items-center justify-center gap-1 pt-3 pb-2">
                {getAvailableStories(activeSummary).map((tab, i) => (
                  <button
                    key={tab.key}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${i === activeStoryIdx ? 'bg-purple-400/80' : 'bg-purple-100/80'}`}
                    onClick={e => { e.stopPropagation(); handleDotClick(i) }}
                    aria-label={tab.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
