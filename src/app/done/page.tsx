'use client'

import { useRouter } from 'next/navigation'

export default function DonePage() {
  const router = useRouter()

  return (
    <main className="w-full h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#f6d365] to-[#fda085]">
      <div className="max-w-sm mx-auto p-8 rounded-3xl bg-white/80 text-center shadow-xl flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-pink-600">All Done!</h1>
        <p className="text-lg mb-8 font-medium text-gray-700">
          You did so well today, love. I’m proud of you for nourishing yourself—one meal at a time. <br />
          Can’t wait to cheer you on tomorrow! 💖
        </p>
        <span className="text-5xl animate-bounce mb-6">🌸</span>
        <button
          onClick={() => router.push('/')}
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white text-base font-semibold shadow-md transition hover:scale-105"
        >
          Return Home
        </button>
      </div>
    </main>
  )
}
