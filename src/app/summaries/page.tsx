'use client'

import { getOrCreateUserId } from '@/utils/mealLog'
import { Inter } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
const inter = Inter({ subsets: ['latin'], weight: ['600', '700'] })

type Summary = {
  date: string
  breakfast_summary: string | null
  lunch_summary: string | null
  dinner_summary: string | null
  full_day_summary: string | null
}

const cardGradients = [
  "from-[#f9f9fc] via-[#fff3f7] to-[#f0f5ff]",
  "from-[#fcf6ff] via-[#f7fbff] to-[#f5f5f7]",
  "from-[#fdf7fa] via-[#f9fbfa] to-[#f1f1ff]",
  "from-[#fafbfd] via-[#f6f0ff] to-[#f6faff]",
]

const storyTabs = [
  { key: "breakfast_summary", label: "Breakfast", emoji: "🍳" },
  { key: "lunch_summary", label: "Lunch", emoji: "🥪" },
  { key: "dinner_summary", label: "Dinner", emoji: "🍽️" },
  { key: "full_day_summary", label: "Day Summary", emoji: "💖" }
]

function formatPrettyDate(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).replace(/,/g, '')
}
function prettifyText(str: string | null) {
  if (!str) return ''
  let s = str.trim()
  s = s.charAt(0).toUpperCase() + s.slice(1)
  if (!/[.?!…]$/.test(s)) s += '.'
  return s
}

const STORY_DURATION = 18000 // ms

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null)
  const [activeStoryIdx, setActiveStoryIdx] = useState(0)
  const [storyAutoKey, setStoryAutoKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // --- Timer/auto-advance ---
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

  return (
    <div className={`relative h-[100dvh] min-h-0 w-full flex flex-col ${inter.className}`} style={{ background: '#fafbfc' }}>
      {/* Fixed BG */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(135deg, #f9f9fc 0%, #f8f6ff 54%, #f1f7ff 100%)',
        }} />

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 flex-shrink-0 h-[54px] flex items-center justify-center bg-white/50 border-b border-white/20 text-[1.13rem] font-semibold text-gray-700 select-none backdrop-blur-md z-20 shadow-none">
        📝 Your Meal Summaries
      </div>

      {/* Scrollable Cards Area */}
      <div className="flex-1 min-h-0 pt-[54px] w-full max-w-2xl mx-auto z-10 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-6 pb-8">
          {loading ? (
            <div className="mt-14 text-center text-gray-400/80 text-base font-medium animate-pulse">Loading summaries…</div>
          ) : summaries.length === 0 ? (
            <div className="mt-14 text-center text-gray-400/80 text-lg font-normal">No summaries yet. Start logging your meals 💖</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {summaries.map((summary, idx) => (
                <button
                  key={summary.date}
                  className={`
                    flex items-center justify-center w-full h-[150px] sm:h-[168px] rounded-2xl
                    bg-gradient-to-br ${cardGradients[idx % cardGradients.length]}
                    shadow-md border-[1.5px] border-white/30 
                    transition-all hover:scale-[1.018] active:scale-[0.98] focus:ring-2 focus:ring-blue-100
                    cursor-pointer
                  `}
                  onClick={() => setActiveSummary(summary)}
                  style={{
                    boxShadow: '0 4px 16px 0 rgba(220,80,150,0.10)',
                  }}
                >
                  <span
                    className="text-[1.23rem] sm:text-[1.62rem] tracking-tight text-center w-full text-gray-700"
                    style={{
                      letterSpacing: '0.012em',
                    }}
                  >
                    {formatPrettyDate(summary.date)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal with Fullscreen Story Player */}
      {activeSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div
            className={`
              relative w-full h-full max-h-[100dvh] px-0 py-0 flex flex-col items-center animate-fadein overflow-hidden
              bg-gradient-to-br from-white/85 via-[#f4f6fc]/80 to-[#f8fafd]/90
              shadow-lg
              select-none
              ${inter.className}
            `}
            onClick={handleStoryAreaClick}
            style={{
              borderRadius: '0', // True fullscreen, no visible border
              boxShadow: '0 12px 48px 0 rgba(80,110,140,0.07)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={e => { e.stopPropagation(); setActiveSummary(null) }}
              className="absolute top-4 right-5 text-gray-400 bg-white/70 hover:bg-gray-200/80 rounded-full p-2 shadow-sm z-20 border border-gray-200"
              aria-label="Close"
              style={{ backdropFilter: 'blur(3px)' }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Progress Bar IG style */}
            <div className="w-full flex gap-2 px-7 pt-9 pb-4">
              {(() => {
                const availableStories = getAvailableStories(activeSummary)
                return availableStories.map((tab, i) => (
                  <div
                    key={tab.key}
                    className="flex-1 h-[3px] rounded-full bg-gray-200/80 overflow-hidden relative"
                  >
                    {/* Completed */}
                    {i < activeStoryIdx && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400 transition-all duration-300" style={{ width: '100%' }} />
                    )}
                    {/* Current story: animate width */}
                    {i === activeStoryIdx && (
                      <div
                        key={storyAutoKey}
                        className="absolute inset-0 bg-gradient-to-r from-blue-300 via-pink-300 to-blue-400"
                        style={{
                          width: '0%',
                          animation: `fillBar ${STORY_DURATION}ms linear forwards`
                        }}
                      />
                    )}
                  </div>
                ))
              })()}
            </div>
            {/* Keyframes for fillBar */}
            <style>
              {`
                @keyframes fillBar {
                  from { width: 0% }
                  to { width: 100% }
                }
              `}
            </style>
            {/* Story Content */}
            <div className="flex-1 w-full flex flex-col items-center justify-center px-5 pb-10 select-none">
              {(() => {
                const availableStories = getAvailableStories(activeSummary)
                const tab = availableStories[activeStoryIdx]
                const storyContent = prettifyText(activeSummary[tab.key as keyof Summary] as string)
                if (!storyContent) return null
                return (
                  <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
                    <div className="text-center text-gray-600 font-medium mb-4 uppercase tracking-widest text-[1rem] select-none">
                      {formatPrettyDate(activeSummary.date)}
                    </div>
                    <div className="text-center text-gray-800 text-[2.1rem] sm:text-[2.7rem] font-semibold leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
                      {tab.emoji} {tab.label}
                    </div>
                    <div className="text-center text-gray-700/90 text-[1.23rem] leading-relaxed font-normal w-full max-w-xl mx-auto px-1 select-text">
                      {storyContent}
                    </div>
                  </div>
                )
              })()}
            </div>
            {/* Dot navigation (optional, for touch nav) */}
            <div className="flex items-center justify-center gap-1 pb-4">
              {getAvailableStories(activeSummary).map((tab, i) => (
                <button
                  key={tab.key}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${i === activeStoryIdx ? 'bg-blue-400/80' : 'bg-gray-300/80'}`}
                  onClick={e => { e.stopPropagation(); handleDotClick(i) }}
                  aria-label={tab.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
