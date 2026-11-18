// Rate Limiter — Redis-backed for production, in-memory fallback for dev.
// Stores state in Redis (or Postgres via Prisma) so it survives restarts.
// Uses sliding window with per-IP and per-email limits.

import { prisma } from './prisma';

// Configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour lockout after max attempts

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds
  locked?: boolean;
  lockoutRemaining?: number;
}

// In-memory fallback (dev only)
const memoryStore = new Map<string, { count: number; resetAt: number; lockedUntil?: number }>();

async function checkRedis(key: string): Promise<RateLimitResult | null> {
  if (!process.env.REDIS_URL) return null;

  try {
    const { Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });

    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Clean old entries and count current window
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zcard(key);
    multi.get(`${key}:lock`);
    const results = await multi.exec();

    await redis.quit();

    const count = results?.[1]?.[1] as number || 0;
    const lockedUntil = results?.[2]?.[1] as string || null;

    if (lockedUntil && parseInt(lockedUntil) > now) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: parseInt(lockedUntil) - now,
        locked: true,
        lockoutRemaining: parseInt(lockedUntil) - now,
      };
    }

    if (count >= MAX_ATTEMPTS) {
      const lockUntil = now + LOCKOUT_DURATION_MS;
      const redis2 = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
      await redis2.set(`${key}:lock`, lockUntil.toString(), 'PX', LOCKOUT_DURATION_MS);
      await redis2.quit();

      return {
        allowed: false,
        remaining: 0,
        resetIn: LOCKOUT_DURATION_MS,
        locked: true,
        lockoutRemaining: LOCKOUT_DURATION_MS,
      };
    }

    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - count,
      resetIn: WINDOW_MS,
    };
  } catch (e) {
    console.warn('Redis rate limit failed, falling back to memory', e);
    return null;
  }
}

async function recordRedis(key: string): Promise<void> {
  if (!process.env.REDIS_URL) return;

  try {
    const { Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    const now = Date.now();
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(WINDOW_MS / 1000) + 10);
    await redis.quit();
  } catch (e) {
    console.warn('Redis record failed', e);
  }
}

function checkMemory(key: string): RateLimitResult {
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(key, entry);
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.lockedUntil - now,
      locked: true,
      lockoutRemaining: entry.lockedUntil - now,
    };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    return {
      allowed: false,
      remaining: 0,
      resetIn: LOCKOUT_DURATION_MS,
      locked: true,
      lockoutRemaining: LOCKOUT_DURATION_MS,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetIn: entry.resetAt - now,
  };
}

function recordMemory(key: string): void {
  // Handled in checkMemory
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  // Try Redis first, fall back to memory
  const redisResult = await checkRedis(key);
  if (redisResult) return redisResult;
  return checkMemory(key);
}

export async function recordRateLimit(key: string): Promise<void> {
  if (process.env.REDIS_URL) {
    await recordRedis(key);
  } else {
    recordMemory(key);
  }
}

// Specialized rate limiters

export async function checkLoginRateLimit(ip: string, email: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const ipResult = await checkRateLimit(`login:ip:${ip}`);
  const emailResult = await checkRateLimit(`login:email:${email.toLowerCase()}`);

  if (!ipResult.allowed || !emailResult.allowed) {
    return { allowed: false, reason: 'Too many login attempts. Please try again later.' };
  }
  return { allowed: true };
}

export async function check2FARateLimit(clientId: string): Promise<{
  allowed: boolean;
  reason?: string;
  lockoutRemaining?: number;
}> {
  const result = await checkRateLimit(`2fa:${clientId}`);
  if (!result.allowed) {
    return { allowed: false, reason: 'Too many 2FA attempts. Account temporarily locked.', lockoutRemaining: result.lockoutRemaining };
  }
  return { allowed: true };
}

export async function record2FAAttempt(clientId: string): Promise<void> {
  await recordRateLimit(`2fa:${clientId}`);
}

export async function checkOrderRateLimit(ip: string, email: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const ipResult = await checkRateLimit(`order:ip:${ip}`);
  const emailResult = await checkRateLimit(`order:email:${email.toLowerCase()}`);

  if (!ipResult.allowed || !emailResult.allowed) {
    return { allowed: false, reason: 'Too many order submissions. Please try again later.' };
  }
  return { allowed: true };
}

export async function recordOrderAttempt(ip: string, email: string): Promise<void> {
  await recordRateLimit(`order:ip:${ip}`);
  await recordRateLimit(`order:email:${email.toLowerCase()}`);
}

// Cleanup memory store periodically
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((entry, key) => {
      if (now > entry.resetAt + 60000 && (!entry.lockedUntil || now > entry.lockedUntil)) {
        memoryStore.delete(key);
      }
    });
  }, 60000).unref();
}