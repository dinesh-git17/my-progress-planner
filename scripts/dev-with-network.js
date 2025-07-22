#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// Get all network interfaces
function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

// Start Next.js dev server
console.log('Starting Next.js development server...\n');

const next = spawn('next', ['dev', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
});

// Wait a bit for the server to start, then show network info
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Server is running at:');
  console.log('='.repeat(60));
  console.log(`  - Local:        http://localhost:3000`);

  const addresses = getNetworkAddresses();
  if (addresses.length > 0) {
    console.log('  - Network:');
    addresses.forEach(({ name, address }) => {
      console.log(`      ${name}: http://${address}:3000`);
    });
  }

  console.log('='.repeat(60) + '\n');
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  next.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  next.kill('SIGTERM');
  process.exit();
});
