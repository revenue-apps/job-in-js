#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Job Application API Server...');
console.log('📋 Loading configuration...');

// Start the server
const server = spawn('node', [join(__dirname, 'src/api/server.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

// Handle server process
server.on('spawn', () => {
  console.log('✅ Server process started');
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Server stopped gracefully');
  } else {
    console.error(`❌ Server exited with code ${code}`);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping server...');
  server.kill('SIGTERM');
}); 