// src/components/OneSignalInit.tsx
'use client'
import { useEffect } from "react"
import OneSignal from "react-onesignal"

export default function OneSignalInit() {
  useEffect(() => {
    OneSignal.init({
      appId: "a0de7d92-0e79-41df-9912-5d3af0715033",
      safari_web_id: "web.onesignal.auto.5694d1e9-fcaa-415d-b1f1-1ef52daca700",
      notifyButton: {
        enable: true,
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': 'Enable Notifications',
          'tip.state.subscribed': "You're subscribed to notifications",
          'tip.state.blocked': "You've blocked notifications",
          'message.prenotify': "Click to enable notifications",
          'message.action.subscribed': "Thanks for subscribing!",
          'message.action.resubscribed': "You're subscribed!",
          'message.action.unsubscribed': "You won't receive notifications",
          'message.action.subscribing': "Subscribing...",
          'dialog.main.title': "Manage Notifications",
          'dialog.main.button.subscribe': "Subscribe",
          'dialog.main.button.unsubscribe': "Unsubscribe",
          'dialog.blocked.title': "Unblock Notifications",
          'dialog.blocked.message': "Follow these steps to allow notifications:"
        }
      },
      allowLocalhostAsSecureOrigin: true // for local testing, remove on prod
    })
  }, [])

  return null
}
