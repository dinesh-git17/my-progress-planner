'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function PushNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const { navigate } = useNavigation();

  // Predefined message templates
  const templates = [
    {
      title: '🍳 Breakfast Reminder',
      message:
        "Good morning! Time for a nourishing breakfast to start your day right. You've got this! 💪",
    },
    {
      title: '🥗 Lunch Check-in',
      message:
        "How about a healthy lunch? Remember, you're doing amazing and I'm proud of you! 💖",
    },
    {
      title: '🍜 Dinner Time',
      message:
        "Evening, love! Don't forget to fuel your body with something delicious for dinner. 🌙✨",
    },
    {
      title: '🎉 Encouragement',
      message:
        'Just wanted to remind you how wonderful you are! Every small step counts. Keep going! 🌟',
    },
    {
      title: '💪 Motivation Boost',
      message:
        "You're stronger than you think and more capable than you know. I believe in you! 💫",
    },
  ];

  // Send push notification
  const sendPushNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Please enter both title and message');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
      };

      // If targeting specific user
      if (targetUserId.trim()) {
        payload.targetUserId = targetUserId.trim();
      }

      const response = await fetch('/api/push/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(
          `✅ Success! Sent to ${data.successful || 0} device(s). ${data.failed ? `Failed: ${data.failed}` : ''}`,
        );
        // Clear form
        setTitle('');
        setMessage('');
        setTargetUserId('');
      } else {
        setError(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all subscriptions
  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/push/list-subscriptions');
      const data = await response.json();

      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
        setShowAllSubscriptions(true);
      } else {
        setError(`Failed to load subscriptions: ${data.error}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply template
  const applyTemplate = (template: (typeof templates)[0]) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-yellow-100 safe-all">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Push Notifications 📱
            </h1>
            <p className="text-gray-600">
              Send test notifications to your users
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Quick Templates */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => applyTemplate(template)}
                className="p-3 text-left bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 rounded-xl transition-all border border-pink-200/50"
              >
                <div className="font-medium text-sm text-gray-800">
                  {template.title}
                </div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {template.message}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Send Custom Notification
          </h2>

          {/* Target User (Optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target User ID (optional - leave blank for all users)
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g., 183cc70d-9ade-4826-9e10-4499f4530d6e"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 🍳 Breakfast Reminder"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Good morning! Time for a nourishing breakfast..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </div>
          </div>

          {/* Send Button */}
          <motion.button
            onClick={sendPushNotification}
            disabled={isLoading || !title.trim() || !message.trim()}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Notification 🚀'
            )}
          </motion.button>
        </div>

        {/* Results */}
        {(result || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl mb-6 ${
              result
                ? 'bg-green-100 border border-green-200 text-green-800'
                : 'bg-red-100 border border-red-200 text-red-800'
            }`}
          >
            {result || error}
          </motion.div>
        )}

        {/* Subscription Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Manage Subscriptions
            </h2>
            <button
              onClick={loadSubscriptions}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'View All Subscriptions'}
            </button>
          </div>

          {showAllSubscriptions && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {subscriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No subscriptions found
                </p>
              ) : (
                subscriptions.map((sub, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {sub.user_id
                            ? `User: ${sub.user_id.slice(0, 8)}...`
                            : 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Endpoint: {sub.endpoint.slice(-20)}...
                        </div>
                        <div className="text-xs text-gray-400">
                          Created:{' '}
                          {new Date(sub.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {sub.user_id && (
                        <button
                          onClick={() => setTargetUserId(sub.user_id)}
                          className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded transition-colors"
                        >
                          Target
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
