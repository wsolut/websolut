'use strict';

const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

process.env.BACKEND_PORT = process.env.BACKEND_PORT || '5555';
process.env.VITE_OUT_DIR_PATH = path.join(process.env.OUT_DIR_PATH || './tmp', 'public/spa');

if (!path.isAbsolute(process.env.VITE_OUT_DIR_PATH)) {
  process.env.VITE_OUT_DIR_PATH = path.resolve(process.cwd(), process.env.VITE_OUT_DIR_PATH);
}

// Run npx vite build --watch with the loaded environment
try {
  execSync('cd ../desktop && npx vite build --watch --mode development', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env
  });
} catch (error) {
  console.error('Error running vite build --watch:', error);
  process.exit(1);
}
