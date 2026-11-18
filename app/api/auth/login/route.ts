// POST /api/auth/login
// Authenticates a client and sets a session cookie.
// Rate-limited per IP and per email to prevent brute force.
//
// Security decisions:
// - Password verified with argon2id (constant-time via argon2.verify).
// - If 2FA is enabled, returns a 2FA challenge instead of a session.
// - Session token is a JWT, verified in middleware + DB-checked in pages.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkLoginRateLimit, record2FAAttempt } from '@/lib/ratelimit';
import { writeAuditLog, getClientIp } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: parsed.error.issues },
        { status: 400, headers: corsHeaders() }
      );
    }
    const data = parsed.data;

    const email = data.email.toLowerCase().trim();

    // Rate limit per IP + per email
    const rateLimit = await checkLoginRateLimit(ip, email);
    if (!rateLimit.allowed) {
      await writeAuditLog({
        actorEmail: email,
        action: 'LOGIN_RATE_LIMITED',
        entity: 'Client',
        detail: { ip },
        ip,
      });
      return NextResponse.json(
        { error: rateLimit.reason || 'Too many attempts. Please try again later.' },
        { status: 429, headers: corsHeaders() }
      );
    }

    const client = await prisma.client.findUnique({ where: { email } });
    if (!client || !client.passwordHash) {
      // Don't reveal whether the email exists
      await writeAuditLog({
        actorEmail: email,
        action: 'LOGIN_FAILED',
        entity: 'Client',
        detail: { reason: 'no_client', ip },
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const valid = await verifyPassword(data.password, client.passwordHash);
    if (!valid) {
      await writeAuditLog({
        actorEmail: email,
        action: 'LOGIN_FAILED',
        entity: 'Client',
        detail: { reason: 'bad_password', ip },
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // If 2FA is enabled, return a 2FA challenge (no session yet)
    if (client.mfaEnabled) {
      // Store a temporary login token in the DB for 2FA verification
      const tempToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

      await prisma.session.create({
        data: {
          clientId: client.id,
          token: `2fa_${tempToken}`,
          expiresAt,
          ip,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });

      return NextResponse.json({
        ok: true,
        requires2fa: true,
        twoFAToken: tempToken,
      }, { headers: corsHeaders() });
    }

    // Create session and set cookie
    const session = await createSession(client.id, ip, req.headers.get('user-agent') || undefined);

    const response = NextResponse.json(
      { ok: true, clientId: client.id, roles: client.roles },
      { status: 200, headers: corsHeaders() }
    );

    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
    });

    await writeAuditLog({
      actorEmail: client.email,
      action: 'LOGIN_SUCCESS',
      entity: 'Client',
      entityId: client.id,
      detail: { ip },
      ip,
    });

    return response;
  } catch (e) {
    console.error('Login failed', e);
    return NextResponse.json(
      { error: 'Could not log in. Please try again.' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://acmewebportal.duckdns.org',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}