import { defineConfig } from 'vitest/config';
import path from 'path';
import { readFileSync } from 'fs';

// Load env vars from .env so tests can read DATABASE_URL etc.
function loadEnv() {
  try {
    const envFile = readFileSync(path.resolve(__dirname, '.env'), 'utf-8');
    for (const line of envFile.split('\n')) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key]) process.env[key] = value;
      }
    }
  } catch {
    // .env not present — rely on environment variables
  }
}
loadEnv();

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});