'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminPushPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setStatus('Error: Title and message are required');
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      // Get the admin password from session storage or prompt user
      const adminPassword =
        process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'changeme'; // You might want to handle this differently

      const res = await fetch('/api/admin/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword, // In production, you might want to handle this more securely
          title,
          body,
          url,
        }),
      });

      const data = await res.json();
      setStatus(
        data.ok
          ? `Successfully sent to ${data.sent} devices!`
          : `Error: ${data.error}`,
      );

      if (data.ok) {
        // Clear form on success
        setTitle('');
        setBody('');
        setUrl('/');
      }
    } catch (error) {
      setStatus('Error: Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-pink-600 hover:text-pink-700 transition"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-pink-600">
            Send Push Notification
          </h1>
          <div></div> {/* Spacer for flexbox centering */}
        </div>

        {/* Form */}
        <section className="bg-white/90 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:border-transparent outline-none transition"
                placeholder="Enter notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:border-transparent outline-none transition resize-none"
                placeholder="Enter your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target URL (optional)
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:border-transparent outline-none transition"
                placeholder="e.g., /meals, /profile"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={sending}
              />
            </div>

            {/* Status Message */}
            {status && (
              <div
                className={`p-4 rounded-2xl text-center font-medium ${
                  status.includes('Error')
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}
              >
                {status}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="
                w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-purple-400
                text-white text-lg font-bold shadow-lg transition 
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                focus:outline-none focus:ring-2 focus:ring-pink-300/40
              "
            >
              {sending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Push Notification'
              )}
            </button>
          </div>
        </section>

        {/* Preview Card */}
        {(title || body) && (
          <section className="mt-8 bg-white/90 rounded-3xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Preview</h3>
            <div className="bg-gray-100 rounded-2xl p-4 border-l-4 border-pink-400">
              <div className="font-semibold text-gray-800 mb-1">
                {title || 'Notification Title'}
              </div>
              <div className="text-gray-600 text-sm">
                {body || 'Your notification message will appear here...'}
              </div>
              {url && url !== '/' && (
                <div className="text-xs text-blue-600 mt-2">Opens: {url}</div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
