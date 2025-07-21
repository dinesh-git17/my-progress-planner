import { NotificationNavigationHandler } from '@/components/NotificationNavigationHandler';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import React from 'react';
import './globals.css';
// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================
export const metadata: Metadata = {
  title: {
    default: 'Sweethearty',
    template: '%s | Sweethearty',
  },
  description:
    'Track your meals with love and support - your personal nutrition companion',
  keywords: [
    'meal tracking',
    'nutrition',
    'health',
    'habits',
    'progress',
    'wellness',
    'food diary',
  ],
  authors: [{ name: 'Sweethearty Team' }],
  creator: 'Sweethearty',
  publisher: 'Sweethearty',

  // PWA manifest
  manifest: '/manifest.json',

  // Prevent automatic formatting of contact info
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // 🔥 ENHANCED: Apple PWA configuration with comprehensive splash screen support
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // Allows content to extend into notch
    title: 'My Progress',
    startupImage: [
      // iPhone 15 Pro Max, iPhone 15 Plus, iPhone 14 Pro Max
      {
        url: '/splash/iphone-15-pro-max.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 15 Pro, iPhone 15, iPhone 14 Pro
      {
        url: '/splash/iphone-15-pro.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 14, iPhone 13, iPhone 12
      {
        url: '/splash/iphone-14.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 14 Plus, iPhone 13 Pro Max, iPhone 12 Pro Max
      {
        url: '/splash/iphone-14-plus.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 13 mini, iPhone 12 mini
      {
        url: '/splash/iphone-13-mini.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone SE 3rd gen, iPhone SE 2nd gen
      {
        url: '/splash/iphone-se.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPhone 11 Pro Max, iPhone XS Max
      {
        url: '/splash/iphone-11-pro-max.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 11, iPhone XR
      {
        url: '/splash/iphone-11.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPhone 11 Pro, iPhone XS, iPhone X
      {
        url: '/splash/iphone-11-pro.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 8 Plus, iPhone 7 Plus, iPhone 6s Plus, iPhone 6 Plus
      {
        url: '/splash/iphone-8-plus.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 8, iPhone 7, iPhone 6s, iPhone 6
      {
        url: '/splash/iphone-8.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Pro 12.9" (6th gen, 5th gen, 4th gen, 3rd gen)
      {
        url: '/splash/ipad-pro-12-9.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Pro 11" (4th gen, 3rd gen, 2nd gen, 1st gen)
      {
        url: '/splash/ipad-pro-11.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Air (5th gen, 4th gen), iPad Pro 10.5"
      {
        url: '/splash/ipad-air.png',
        media:
          '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad (10th gen, 9th gen, 8th gen, 7th gen), iPad Air (3rd gen, 2nd gen)
      {
        url: '/splash/ipad.png',
        media:
          '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad mini (6th gen, 5th gen)
      {
        url: '/splash/ipad-mini.png',
        media:
          '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },

  // Icons configuration
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-touch-icon-144x144.png', sizes: '144x144' },
    ],
  },

  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Sweethearty',
    title: 'Sweethearty - Track Your Nutrition Journey',
    description:
      'Build healthy eating habits with our intuitive meal tracking app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sweethearty - Meal Tracking App',
      },
    ],
  },

  // Robots configuration
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// ============================================================================
// VIEWPORT CONFIGURATION - PWA NATIVE OPTIMIZATION
// ============================================================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f5ede6',
};

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.className} suppressHydrationWarning>
      <head>
        {/* ==============================================
            PWA NATIVE VIEWPORT - MANUAL OVERRIDE
            ============================================== */}

        {/* Critical: Manual viewport meta for maximum device compatibility */}
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1, user-scalable=no"
        />

        {/* ==============================================
            PERFORMANCE OPTIMIZATION
            ============================================== */}

        {/* Preconnect to external domains for better font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* ==============================================
            MOBILE OPTIMIZATION
            ============================================== */}

        {/* Prevent automatic phone number detection */}
        <meta
          name="format-detection"
          content="telephone=no, date=no, address=no, email=no"
        />

        {/* Edge compatibility */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* ==============================================
            PWA OPTIMIZATION
            ============================================== */}

        {/* Enhanced PWA meta tags for native-like experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="My Progress" />

        {/* ==============================================
            SECURITY HEADERS
            ============================================== */}

        {/* Essential security headers for production */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />

        {/* Content Security Policy - optimized for Supabase + OpenAI */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://api.openai.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        />

        {/* ==============================================
            PWA THEME COLORS
            ============================================== */}

        <meta name="msapplication-TileColor" content="#f5ede6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${dmSans.className} antialiased`}>
        <NotificationNavigationHandler />
        {children}
      </body>
    </html>
  );
}
