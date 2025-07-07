import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * Production-grade metadata configuration for SEO and PWA optimization
 * Following Next.js 13+ App Router best practices
 */
export const metadata: Metadata = {
  title: {
    default: 'Progress Planner',
    template: '%s | Progress Planner',
  },
  description:
    'Track your meals and build healthy habits with Progress Planner - your personal nutrition companion.',
  keywords: [
    'meal tracking',
    'nutrition',
    'health',
    'habits',
    'progress',
    'wellness',
    'food diary',
  ],
  authors: [{ name: 'Progress Planner Team' }],
  creator: 'Progress Planner',
  publisher: 'Progress Planner',

  // Prevent automatic formatting of contact info - critical for mobile UX
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // PWA-specific metadata that integrates with manifest.json
  manifest: '/manifest.json',

  // Apple-specific PWA configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Progress Planner',
  },

  // Social media and Open Graph optimization
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://my-progress-planner-5kbt.vercel.app/recover',
    siteName: 'Progress Planner',
    title: 'Progress Planner - Track Your Nutrition Journey',
    description:
      'Build healthy eating habits with our intuitive meal tracking app',
    images: [
      {
        url: '/og-image.png', // 1200x630 recommended
        width: 1200,
        height: 630,
        alt: 'Progress Planner - Meal Tracking App',
      },
    ],
  },

  // Robots and indexing configuration
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

/**
 * Root layout component that provides the foundation for all pages
 * Implements industry-standard PWA patterns and performance optimizations
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ==============================================
            PWA CORE CONFIGURATION
            ============================================== */}

        {/* Primary PWA manifest - must be in <head> for proper discovery */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color for browser chrome and status bars */}
        <meta name="theme-color" content="#fda085" />
        <meta name="msapplication-TileColor" content="#fda085" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* ==============================================
            APPLE iOS PWA OPTIMIZATION
            Critical for iOS home screen installation
            ============================================== */}

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Progress Planner" />

        {/* Apple Touch Icons - Multiple sizes for different devices and contexts */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-touch-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/apple-touch-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-touch-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/apple-touch-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/apple-touch-icon-76x76.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/apple-touch-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/apple-touch-icon-60x60.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/apple-touch-icon-57x57.png"
        />

        {/* ==============================================
            STANDARD FAVICON CONFIGURATION
            Ensures proper icon display across all browsers
            ============================================== */}

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* ==============================================
            MOBILE WEB APP CONFIGURATION
            ============================================== */}

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Progress Planner" />

        {/* ==============================================
            VIEWPORT AND DISPLAY OPTIMIZATION
            Critical for responsive design and PWA behavior
            ============================================== */}

        {/* 
          Enhanced viewport configuration:
          - viewport-fit=cover: Handles notched devices (iPhone X+)
          - user-scalable=no: Prevents zoom issues in PWA mode
          - minimum/maximum-scale: Ensures consistent experience
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* ==============================================
            PERFORMANCE AND SECURITY OPTIMIZATIONS
            ============================================== */}

        {/* DNS prefetch for external resources - improves loading performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Preconnect to font providers for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Prevent automatic phone number detection - improves mobile UX */}
        <meta
          name="format-detection"
          content="telephone=no, date=no, address=no, email=no"
        />

        {/* Edge compatibility header */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Content Security Policy - enhanced for CDNs, Supabase and external APIs */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://api.openai.com;"
        />

        {/* ==============================================
            APPLE SPLASH SCREENS 
            Provides native app-like loading experience on iOS
            Comment out if you don't have splash screen images
            ============================================== */}

        {/* iPad Pro 12.9" */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPad Pro 11" */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPad Air 10.9" */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1668x2224.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPad 10.2" */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPhone 14 Pro Max */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 Pro */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 Plus */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 13 Pro Max */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 12 Pro Max */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone X/XS/11 Pro */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 6/7/8 Plus */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 6/7/8 */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* iPhone SE */}
        <link
          rel="apple-touch-startup-image"
          href="/splash-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>

      <body className="overflow-x-hidden antialiased">
        {/* ==============================================
            SERVICE WORKER REGISTRATION AND PWA UI
            Handles offline functionality and app updates
            ============================================== */}
        <ServiceWorkerRegister />

        {/* Main application content */}
        {children}

        {/* ==============================================
            THEME INITIALIZATION SCRIPT
            Prevents Flash of Unstyled Content (FOUC)
            Runs before React hydration for instant theme application
            ============================================== */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Initialize theme from localStorage or fallback to system preference
                  const savedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
                  
                  document.documentElement.setAttribute('data-theme', theme);
                  
                  // Set CSS custom property for theme-based calculations
                  document.documentElement.style.setProperty('--initial-theme', theme);
                } catch (error) {
                  // Fallback if localStorage is unavailable (incognito mode, etc.)
                  document.documentElement.setAttribute('data-theme', 'light');
                  console.warn('Theme initialization failed:', error);
                }
              })();
            `,
          }}
        />

        {/* ==============================================
            PERFORMANCE MONITORING (Optional)
            Uncomment and configure for production monitoring
            ============================================== */}
        {/* 
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Web Vitals monitoring
              (function() {
                if ('PerformanceObserver' in window) {
                  // Monitor Largest Contentful Paint
                  new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                  }).observe({ entryTypes: ['largest-contentful-paint'] });
                  
                  // Monitor First Input Delay
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
