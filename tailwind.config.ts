import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },

      // 🔥 SAFE AREA SPACING UTILITIES
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',

        // Combined safe area values
        'safe-x': 'max(1rem, env(safe-area-inset-left))',
        'safe-y': 'max(1rem, env(safe-area-inset-top))',

        // Header calculations
        'header-height': '5rem',
        'header-safe': 'calc(env(safe-area-inset-top) + 5rem)',
      },

      // 🔥 SAFE AREA PADDING UTILITIES
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',

        // Minimum padding with safe areas
        'safe-top-min': 'max(1rem, env(safe-area-inset-top))',
        'safe-bottom-min': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-left-min': 'max(1rem, env(safe-area-inset-left))',
        'safe-right-min': 'max(1rem, env(safe-area-inset-right))',

        // Header-aware padding
        'safe-top-header': 'calc(env(safe-area-inset-top) + 5rem)',
      },

      // 🔥 SAFE AREA MARGIN UTILITIES
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',

        // Negative margins for full-bleed
        '-safe-left': 'calc(-1 * max(1rem, env(safe-area-inset-left)))',
        '-safe-right': 'calc(-1 * max(1rem, env(safe-area-inset-right)))',
      },

      // 🔥 SAFE AREA INSET UTILITIES (for positioning)
      inset: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // Enhanced typography scale
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      // Enhanced animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        floating: 'floating 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // Custom keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },

      // Enhanced shadows
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.05)',
        medium: '0 4px 16px rgba(0, 0, 0, 0.1)',
        large: '0 8px 32px rgba(0, 0, 0, 0.15)',
        glass: '0 8px 32px rgba(255, 255, 255, 0.1)',
        focus: '0 0 0 4px rgba(139, 92, 246, 0.1)',
      },

      // Glass morphism backdrop filters
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
      },

      // Enhanced border radius
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // Custom gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient':
          'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))',
        'main-gradient':
          'linear-gradient(135deg, #f5ede6 0%, #f1e8e1 50%, #ede4dd 100%)',
        'dark-gradient':
          'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
      },

      // Container queries support
      screens: {
        xs: '475px',
        'container-xs': '475px',
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px',
      },
    },
  },

  // 🔥 SAFELIST: Ensure safe area utilities are never purged
  safelist: [
    // Safe area padding utilities
    'pt-safe-top',
    'pt-safe-top-min',
    'pt-safe-top-header',
    'pb-safe-bottom',
    'pb-safe-bottom-min',
    'pl-safe-left',
    'pl-safe-left-min',
    'pr-safe-right',
    'pr-safe-right-min',

    // Safe area margin utilities
    'mt-safe-top',
    'mb-safe-bottom',
    'ml-safe-left',
    'mr-safe-right',
    '-ml-safe-left',
    '-mr-safe-right',

    // Safe area positioning utilities
    'top-safe-top',
    'bottom-safe-bottom',
    'left-safe-left',
    'right-safe-right',

    // Combined safe area utilities (from globals.css)
    'safe-top',
    'safe-bottom',
    'safe-left',
    'safe-right',
    'safe-x',
    'safe-y',
    'safe-all',
    'notch-safe',
    'notch-safe-left',
    'notch-safe-right',
    'fixed-header-top',
    'content-below-header',
    'full-bleed',
    'safe-container',

    // Theme utilities
    'glass-effect',
    'floating-animation',
    'gpu-accelerated',

    // Loading screen utilities
    'loading-screen',
    'loading-screen-image',
    'loading-screen-content',

    // iOS/Android specific
    'ios-safe-area',
    'ios-safe-area-top',
    'ios-safe-area-bottom',
    'android-safe-area',

    // Animation classes that might be used dynamically
    'animate-fade-in',
    'animate-slide-up',
    'animate-slide-down',
    'animate-scale-in',
    'animate-floating',
    'animate-pulse-slow',
  ],

  plugins: [
    // 🔥 CUSTOM PLUGIN: Safe area utilities
    function ({ addUtilities, theme }: { addUtilities: any; theme: any }) {
      const safeAreaUtilities = {
        // Combined safe area utilities
        '.safe-area-x': {
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        },
        '.safe-area-y': {
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        },
        '.safe-area-all': {
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        },

        // Full viewport utilities
        '.min-h-screen-safe': {
          minHeight: ['100vh', '100dvh'],
        },
        '.h-screen-safe': {
          height: ['100vh', '100dvh'],
        },

        // Container utilities
        '.container-safe': {
          width: '100%',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        },

        // Glass morphism utilities
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      };

      addUtilities(safeAreaUtilities);
    },

    // 🔥 CUSTOM PLUGIN: PWA utilities
    function ({ addUtilities }: { addUtilities: any }) {
      const pwaUtilities = {
        // Touch optimizations
        '.touch-optimized': {
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        },

        // App-like scrolling
        '.app-scroll': {
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
        },

        // Hardware acceleration
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          willChange: 'transform',
        },

        // Hide native scrollbars
        '.hide-scrollbar': {
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      };

      addUtilities(pwaUtilities);
    },
  ],
};

export default config;
