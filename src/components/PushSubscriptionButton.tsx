'use client'
import { useState } from "react"

export function PushSubscriptionButton() {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function subscribeToPush() {
    try {
      // Ask for permission
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') throw new Error('Notification permission denied')
      setEnabled(true)
      setError(null)
      // (Continue with push subscription code here)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="my-3 flex flex-col items-center">
      <button
        onClick={subscribeToPush}
        className={`px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold text-base shadow-md transition hover:scale-105 disabled:opacity-70`}
        disabled={enabled}
      >
        {enabled ? 'Notifications enabled! 💌' : 'Enable Notifications'}
      </button>
      {error && <span className="text-red-500 text-sm mt-2">{error}</span>}
    </div>
  )
}
