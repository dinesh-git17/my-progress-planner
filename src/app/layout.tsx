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

  // 🔥 UPDATED: Notch-aware Apple PWA configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // ✅ CHANGED: Semi-transparent status bar for notch
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
// 🔥 UPDATED: NOTCH-EMBRACING VIEWPORT CONFIGURATION
// ============================================================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // ✅ ADDED: Extend content into notch area
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
            🔥 NOTCH-AWARE VIEWPORT META TAG
            ============================================== */}
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
            🔥 NOTCH-AWARE PWA META TAGS
            ============================================== */}

        {/* Mobile web app capable */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="My Progress" />
        <meta name="application-name" content="My Progress Planner" />

        {/* ==============================================
            SECURITY HEADERS
            ============================================== */}

        {/* Content Security Policy - production ready */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://api.openai.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        />

        {/* Additional security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />

        {/* ==============================================
            PWA THEME COLORS
            ============================================== */}

        <meta name="theme-color" content="#f5ede6" />
        <meta name="msapplication-TileColor" content="#f5ede6" />
        <meta name="msapplication-navbutton-color" content="#f5ede6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* ==============================================
            🔥 NOTCH-AWARE APPLE SPLASH SCREENS
            ============================================== */}

        {/* iPhone 15 Pro Max, 14 Pro Max (430×932 @3x = 1290×2796) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 15 Plus, 14 Plus (428×926 @3x = 1284×2778) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 15 Pro, 15, 14 Pro (393×852 @3x = 1179×2556) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14, 13, 13 Pro, 12, 12 Pro (390×844 @3x = 1170×2532) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 13 mini, 12 mini (375×812 @3x = 1125×2436) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 11 Pro Max, XS Max (414×896 @3x = 1242×2688) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 11, XR (414×896 @2x = 828×1792) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPhone SE (3rd gen), 8, 7, 6s, 6 (375×667 @2x = 750×1334) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus (414×736 @3x = 1242×2208) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPad Pro 12.9" (1024×1366 @2x = 2048×2732) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPad Pro 11" (834×1194 @2x = 1668×2388) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPad Air, iPad 10.9" (820×1180 @2x = 1640×2360) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1640x2360.png"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPad Mini (768×1024 @2x = 1536×2048) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* ==============================================
            🔥 SAFE AREA INSET CSS VARIABLES
            ============================================== */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --safe-area-inset-top: env(safe-area-inset-top);
                --safe-area-inset-right: env(safe-area-inset-right);
                --safe-area-inset-bottom: env(safe-area-inset-bottom);
                --safe-area-inset-left: env(safe-area-inset-left);
              }
            `,
          }}
        />
      </head>

      {/* ==============================================
          🔥 BODY ELEMENT - TRANSPARENT FOR NOTCH
          ============================================== */}
      <body className="antialiased">
        {/* Service Worker Registration (you may need to add this component) */}
        {/* <ServiceWorkerRegister /> */}

        {/* Main application content */}
        {children}

        {/* ==============================================
            THEME INITIALIZATION SCRIPT
            Prevents FOUC (Flash of Unstyled Content)
            ============================================== */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
                  
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.setProperty('--initial-theme', theme);
                } catch (error) {
                  document.documentElement.setAttribute('data-theme', 'light');
                  console.warn('Theme initialization failed:', error);
                }
              })();
            `,
          }}
        />

        {/* ==============================================
            🔥 NOTCH DETECTION & SAFE AREA MONITORING
            ============================================== */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Detect notch presence
                function hasNotch() {
                  const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0;
                  return top > 0;
                }

                // Monitor safe area changes (device rotation, etc.)
                function updateSafeAreaStatus() {
                  const hasNotchDevice = hasNotch();
                  document.documentElement.setAttribute('data-has-notch', hasNotchDevice ? 'true' : 'false');
                  
                  // Optional: Log for debugging
                  if (hasNotchDevice) {
                    console.log('🔥 Notch detected - using safe area insets');
                  }
                }

                // Initial check
                updateSafeAreaStatus();

                // Listen for orientation changes
                window.addEventListener('orientationchange', () => {
                  setTimeout(updateSafeAreaStatus, 100);
                });

                // Listen for resize events (fold/unfold, etc.)
                window.addEventListener('resize', updateSafeAreaStatus);
              })();
            `,
          }}
        />

        {/* ==============================================
            WEB VITALS MONITORING (OPTIONAL)
            Uncomment for production performance monitoring
            ============================================== */}
        {/* 
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('PerformanceObserver' in window) {
                  new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                  }).observe({ entryTypes: ['largest-contentful-paint'] });
                  
                  new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                      console.log('FID:', entry.processingStart - entry.startTime);
                    });
                  }).observe({ entryTypes: ['first-input'] });
                }
              })();
            `,
          }}
        />
        */}
      </body>
    </html>
  );
}
