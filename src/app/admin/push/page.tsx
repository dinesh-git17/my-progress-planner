'use client'
import React, { useState } from 'react'

export default function AdminPushPage() {
  const [password, setPassword] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthorized(true) // Always authorize—API will check password
  }

  async function handleSend() {
    setSending(true)
    setStatus(null)
    const res = await fetch('/api/admin/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, title, body, url }),
    })
    const data = await res.json()
    setStatus(data.ok ? 'Sent!' : `Error: ${data.error}`)
    setSending(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 flex items-center justify-center">
      <section className="bg-white/90 rounded-3xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-pink-500">Admin: Send Push Notification</h1>
        {!authorized ? (
          <form onSubmit={handleAuth} className="flex flex-col items-center w-full">
            <input
              type="password"
              className="mb-3 px-4 py-2 border rounded-full w-full"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              className="bg-pink-400 text-white font-semibold rounded-full px-6 py-2 mb-2"
              type="submit"
            >Login</button>
            {status && <div className="text-red-500 text-sm">{status}</div>}
          </form>
        ) : (
          <>
            <input
              className="mb-3 px-4 py-2 border rounded-full w-full"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="mb-3 px-4 py-2 border rounded-xl w-full"
              placeholder="Message body"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
            />
            <input
              className="mb-3 px-4 py-2 border rounded-full w-full"
              placeholder="URL to open (optional, e.g. /log)"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold rounded-full px-8 py-2 mt-2 shadow-lg"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Push Notification'}
            </button>
            {status && <div className="mt-4 text-center text-pink-600">{status}</div>}
          </>
        )}
      </section>
    </main>
  )
}
