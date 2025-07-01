self.addEventListener('push', function (event) {
  const data = event.data?.json() || {}
  const title = data.title || 'Progress Planner'
  const options = {
    body: data.body || 'Gentle reminder: log your meal, love! 💖',
    icon: '/apple-touch-icon.png', // adjust to your app icon
    badge: '/apple-touch-icon.png',
    data: data.url || '/',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data || '/'))
})
