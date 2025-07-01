'use client'
import { useState } from "react"

export function PushSubscriptionButton() {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i)
      outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  async function subscribeToPush() {
    try {
      const reg = await navigator.serviceWorker.ready

      // Ask for notification permission
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') throw new Error('Notification permission denied')

      const vapidPublicKey = 'BAEWVqKa9ASTlGbc7Oo_BJGAsYBtlYAS1IkI1gKMz5Ot6WnNQuP-WQ2u3sDRDV4Ca5kZQwo8aKOshT3wOrUugxk'

      // Subscribe for push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Send subscription object to your backend to save
      const response = await fetch('/api/push/save-subscription', {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to save subscription')
      setEnabled(true)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      setEnabled(false)
    }
  }

  return (
    <div className="my-3 flex flex-col items-center">
      <button
        onClick={subscribeToPush}
        className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold text-base shadow-md transition hover:scale-105 disabled:opacity-70"
        disabled={enabled}
      >
        {enabled ? 'Notifications enabled! 💌' : 'Enable Notifications'}
      </button>
      {error && <span className="text-red-500 text-sm mt-2">{error}</span>}
    </div>
  )
}
