import type { ReactNode } from "react"
import "./globals.css"

export const metadata = {
  title: "Progress Planner",
  description: "A loving meal log and motivation app.",
  icons: [
    { rel: "icon", url: "/icon-192.png" },
    { rel: "apple-touch-icon", url: "/public/apple-touch-icon.png" }
  ],
  manifest: "/manifest.json",
  other: {
    "theme-color": "#fda085",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Progress Planner"
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
<head>
  <link rel="manifest" href="/public/manifest.json" />
  <link rel="icon" href="/icon-192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/public/apple-touch-icon.png" />
  <meta name="theme-color" content="#fda085" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Progress Planner" />
</head>

      <body className="font-sans bg-background text-foreground">{children}</body>
    </html>
  )
}
