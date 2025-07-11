/**
 * Gradient Notch Extension Fix
 * JavaScript solution for applying gradients in iOS notch areas when CSS fails
 * File: public/gradient-fix.js
 */

(function () {
  'use strict';

  // Configuration
  const GRADIENT_CONFIG = {
    colors: [
      { stop: 0, color: '#f5ede6' },
      { stop: 0.54, color: '#f7edf5' },
      { stop: 1, color: '#d8d8f0' },
    ],
    canvasSize: 300, // Higher resolution for better quality
    direction: 135, // degrees
  };

  /**
   * Creates a canvas-based gradient image
   * @returns {string} Data URL of the gradient image
   */
  function createCanvasGradient() {
    const canvas = document.createElement('canvas');
    canvas.width = GRADIENT_CONFIG.canvasSize;
    canvas.height = GRADIENT_CONFIG.canvasSize;
    const ctx = canvas.getContext('2d');

    // Calculate gradient direction (135 degrees)
    const angle = ((GRADIENT_CONFIG.direction - 90) * Math.PI) / 180;
    const x1 = 0;
    const y1 = 0;
    const x2 = Math.cos(angle) * GRADIENT_CONFIG.canvasSize;
    const y2 = Math.sin(angle) * GRADIENT_CONFIG.canvasSize;

    // Create linear gradient
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

    // Add color stops
    GRADIENT_CONFIG.colors.forEach(({ stop, color }) => {
      gradient.addColorStop(stop, color);
    });

    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GRADIENT_CONFIG.canvasSize, GRADIENT_CONFIG.canvasSize);

    return canvas.toDataURL('image/png', 0.9);
  }

  /**
   * Applies the gradient to the HTML element
   */
  function applyGradient() {
    const html = document.documentElement;

    try {
      const gradientDataUrl = createCanvasGradient();

      // Apply gradient background with proper settings
      html.style.backgroundImage = `url('${gradientDataUrl}')`;
      html.style.backgroundSize = 'cover';
      html.style.backgroundAttachment = 'fixed';
      html.style.backgroundPosition = 'center';
      html.style.backgroundRepeat = 'no-repeat';

      console.log('🎨 Gradient successfully applied to notch area');

      // Optional: Add a class to indicate gradient is loaded
      html.classList.add('gradient-loaded');
    } catch (error) {
      console.error('Failed to apply gradient:', error);
      // Keep the solid color fallback from CSS
    }
  }

  /**
   * Alternative method: Create a fixed overlay div
   */
  function createGradientOverlay() {
    // Remove existing overlay
    const existing = document.getElementById('js-gradient-overlay');
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'js-gradient-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: calc(-100px - env(safe-area-inset-top, 0px)) !important;
      left: calc(-100px - env(safe-area-inset-left, 0px)) !important;
      right: calc(-100px - env(safe-area-inset-right, 0px)) !important;
      bottom: calc(-100px - env(safe-area-inset-bottom, 0px)) !important;
      width: calc(100vw + 200px + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px)) !important;
      height: calc(100vh + 200px + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)) !important;
      background: linear-gradient(135deg, #f5ede6 0%, #f7edf5 54%, #d8d8f0 100%) !important;
      z-index: -10000 !important;
      pointer-events: none !important;
    `;

    // Insert at the beginning of body
    if (document.body) {
      document.body.insertBefore(overlay, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.insertBefore(overlay, document.body.firstChild);
      });
    }

    console.log('🎨 Gradient overlay div created');
  }

  /**
   * Main initialization function
   */
  function initialize() {
    console.log('🎨 Initializing gradient notch extension...');

    // Method 1: Try canvas gradient on HTML element
    applyGradient();

    // Method 2: Fallback overlay div after short delay
    setTimeout(function () {
      createGradientOverlay();
    }, 500);

    console.log('🎨 Gradient notch extension initialized');
  }

  /**
   * Re-initialize when needed
   */
  function reinitialize() {
    setTimeout(function () {
      initialize();
    }, 200);
  }

  function initGradientFix() {
    try {
      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }

      // Re-apply when PWA comes back into focus
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
          reinitialize();
        }
      });

      // Re-apply when window gains focus
      window.addEventListener('focus', reinitialize);

      // Re-apply on orientation change
      window.addEventListener('orientationchange', function () {
        setTimeout(reinitialize, 300);
      });

      // Re-apply on resize (for good measure)
      window.addEventListener('resize', function () {
        clearTimeout(window.gradientResizeTimeout);
        window.gradientResizeTimeout = setTimeout(reinitialize, 300);
      });
    } catch (error) {
      console.error('Gradient fix initialization failed:', error);

      // Ultimate fallback: ensure solid color is applied
      try {
        document.documentElement.style.backgroundColor = '#f5ede6';
        document.documentElement.style.minHeight = '-webkit-fill-available';
        console.log('🎨 Applied solid color fallback');
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
      }
    }
  }

  // Self-initialize
  initGradientFix();
})();
