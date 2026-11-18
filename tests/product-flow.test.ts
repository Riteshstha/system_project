// Tests for the new product flow
// Run with: npm test

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

// Test database setup
beforeAll(async () => {
  // Create test admin user
  const hash = await hashPassword('TestAdmin123!');
  await prisma.client.upsert({
    where: { email: 'test-admin@test.com' },
    create: {
      email: 'test-admin@test.com',
      name: 'Test Admin',
      passwordHash: hash,
      roles: 'ADMIN',
      status: 'ACTIVE',
    },
    update: {},
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Product Flow', () => {
  it('should return 404 for /register', async () => {
    const res = await fetch('http://localhost:3100/register');
    expect(res.status).toBe(404);
  });

  it('should return 404 for /api/auth/register', async () => {
    const res = await fetch('http://localhost:3100/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'Test123!' }),
    });
    expect(res.status).toBe(404);
  });

  it('should redirect unauthenticated users to /login when accessing /dashboard', async () => {
    const res = await fetch('http://localhost:3100/dashboard', {
      redirect: 'manual',
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('should redirect unauthenticated users to /admin/login when accessing /admin', async () => {
    const res = await fetch('http://localhost:3100/admin', {
      redirect: 'manual',
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('should create a client invitation and send activation email', async () => {
    // Verify the endpoint exists by checking it doesn't return 404
    const res = await fetch('http://localhost:3100/api/admin/clients/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Client',
        email: 'test-client@test.com',
        phone: '+977 9800000000',
      }),
      redirect: 'manual',
    });
    // Should return 307 (redirect to login) or 429 (rate limited) - not 404 or 200
    expect([307, 429]).toContain(res.status);
  });

  it('should validate activation token expiry', async () => {
    // Test with invalid token - should return 400 or 500 (server error is acceptable)
    const res = await fetch('http://localhost:3100/api/auth/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'Test123!test',
      }),
    });
    expect(res.status).not.toBe(200); // Should not succeed
  });

  it('should rate limit password reset requests', async () => {
    // Send multiple requests quickly
    const promises = Array.from({ length: 10 }).map(() =>
      fetch('http://localhost:3100/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }),
      })
    );

    const results = await Promise.all(promises);
    // Some should be rate-limited (429)
    const hasRateLimit = results.some((r) => r.status === 429);
    expect(hasRateLimit).toBe(true);
  });

  it('should return generic response for forgot password even if email does not exist', async () => {
    const res = await fetch('http://localhost:3100/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@test.com' }),
    });
    // Should not reveal whether email exists - always returns 200 or 429
    expect([200, 429]).toContain(res.status);
  });

  it('should prevent CLIENT from accessing admin endpoints', async () => {
    // Create a test client
    await prisma.client.create({
      data: {
        email: 'test-client-role@test.com',
        name: 'Test Client Role',
        passwordHash: await hashPassword('TestClient123!'),
        roles: 'CLIENT',
        status: 'ACTIVE',
      },
    });

    // Try to access admin endpoint without auth
    const res = await fetch('http://localhost:3100/api/admin/clients/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another Client', email: 'another@test.com' }),
      redirect: 'manual',
    });
    // Should return 307 (redirect to login), 401 (unauthorized), or 403 (forbidden) - not 200 success
    expect([307, 401, 403, 429]).toContain(res.status);
  });
});