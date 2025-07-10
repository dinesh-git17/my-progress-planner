#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 CACHE KILLER - Destroying all PWA caches...\n');

// 1. Kill Next.js cache
try {
  const nextCacheDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('✅ Deleted .next cache directory');
  }
} catch (error) {
  console.log('⚠️  Could not delete .next cache:', error.message);
}

// 2. Clear npm cache
try {
  execSync('npm cache clean --force', { stdio: 'pipe' });
  console.log('✅ Cleared npm cache');
} catch (error) {
  console.log('⚠️  Could not clear npm cache:', error.message);
}

// 3. Create browser cache killer script
const browserScript = `
// 🔥 BROWSER CACHE KILLER
(async function() {
  console.log('🔥 Killing all browser caches...');
  
  // Kill service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('🗑️ Unregistered SW:', registration.scope);
    }
  }
  
  // Kill all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('🗑️ Deleted cache:', cacheName);
    }
  }
  
  // Kill storage (except user data)
  const userKeys = ['user_id', 'user_name'];
  Object.keys(localStorage).forEach(key => {
    if (!userKeys.includes(key)) {
      localStorage.removeItem(key);
      console.log('🗑️ Cleared localStorage:', key);
    }
  });
  
  sessionStorage.clear();
  console.log('🗑️ Cleared sessionStorage');
  
  console.log('\\n✅ ALL CACHES DESTROYED!');
  console.log('🔄 Reloading page...');
  
  setTimeout(() => location.reload(), 1000);
})();
`;

console.log('\n📋 COPY AND RUN THIS IN YOUR BROWSER CONSOLE:');
console.log('=' * 60);
console.log(browserScript);
console.log('=' * 60);

console.log('\n🚀 NOW RUN: npm run dev');
console.log('🎯 Your caching issues should be COMPLETELY GONE!');
