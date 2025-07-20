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
