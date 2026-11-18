// Test setup - runs before each test file
import { vi } from 'vitest';

// Mock environment variables for tests
// DATABASE_URL is intentionally NOT overridden here — let each test file
// or the CI environment set it to a real PostgreSQL instance.
process.env.RESEND_API_KEY = 're_test';
process.env.EMAIL_FROM = 'test@example.com';
process.env.COMPANY_EMAIL = 'company@example.com';
process.env.ESEWA_MERCHANT_CODE = 'EPAYTEST';
process.env.ESEWA_SECRET = 'test_secret';
process.env.ESEWA_BASE_URL = 'https://uat.esewa.com.np';
process.env.SESSION_SECRET = 'test_session_secret_32_chars_long!';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock console.error to reduce noise in tests
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('eSewa verification failed')) return;
  originalError.apply(console, args);
};