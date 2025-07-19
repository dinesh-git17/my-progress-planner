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
    default: 'My Progress Planner',
    template: '%s | My Progress Planner',
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
  authors: [{ name: 'My Progress Planner Team' }],
  creator: 'My Progress Planner',
  publisher: 'My Progress Planner',

  // PWA manifest
  manifest: '/manifest.json',

  // Prevent automatic formatting of contact info
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Apple PWA configuration (optimized for native feel)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // 🔥 FIXED: Allows content to extend into notch
    title: 'My Progress',
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

  // Theme colors
  themeColor: '#f5ede6',

  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'My Progress Planner',
    title: 'My Progress Planner - Track Your Nutrition Journey',
    description:
      'Build healthy eating habits with our intuitive meal tracking app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'My Progress Planner - Meal Tracking App',
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
  viewportFit: 'cover', // 🔥 RESTORED: Essential for content extending into notch
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

        {/* 🔥 CRITICAL: Manual viewport meta for maximum device compatibility */}
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

        <meta name="theme-color" content="#f5ede6" />
        <meta name="msapplication-TileColor" content="#f5ede6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${dmSans.className} antialiased`}>{children}</body>
    </html>
  );
}
