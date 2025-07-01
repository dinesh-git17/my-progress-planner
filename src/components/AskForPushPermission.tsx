'use client'
import { useEffect, useState } from 'react'
import OneSignal from 'react-onesignal'

export default function AskForPushPermission() {
  const [ready, setReady] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const check = async () => {
      if (typeof window !== 'undefined' && window.OneSignal) {
        try {
          const isEnabled = await (OneSignal as any).isPushNotificationsEnabled()
          setSubscribed(isEnabled)
          setReady(true)
        } catch {
          setReady(false)
        }
      }
    }
    check()
  }, [])

  if (subscribed) return <div className="text-green-600 font-semibold mt-6">Notifications enabled 🎉</div>

  return (
    <button
      disabled={!ready}
      onClick={() => ready && (OneSignal as any).Slidedown.prompt()}
      className={`rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 px-6 py-3 text-white font-bold shadow-lg transition hover:scale-105 active:scale-95 mt-6 ${
        !ready ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      Enable Notifications
    </button>
  )
}
