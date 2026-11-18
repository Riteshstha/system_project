// POST /api/auth/2fa/verify
// Completes login after the client has provided a valid TOTP code.
// Rate-limited: max 5 failed attempts per client, then 1-hour lockout.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyTotpCode, createSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { check2FARateLimit, record2FAAttempt } from '@/lib/ratelimit';
import { writeAuditLog, getClientIp } from '@/lib/audit';

const verifySchema = z.object({
  twoFAToken: z.string().min(1),
  code: z.string().regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:3200',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: parsed.error.issues },
        { status: 400, headers: corsHeaders() }
      );
    }
    const data = parsed.data;

    // Find the temporary 2FA session
    const tempSession = await prisma.session.findUnique({
      where: { token: `2fa_${data.twoFAToken}` },
      include: { client: true },
    });

    if (!tempSession || tempSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '2FA session expired or invalid' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const client = tempSession.client;

    const rateLimit = await check2FARateLimit(client.id);
    if (!rateLimit.allowed) {
      await writeAuditLog({
        actorEmail: client.email,
        action: '2FA_RATE_LIMITED',
        entity: 'Client',
        entityId: client.id,
        detail: { ip, lockoutRemaining: rateLimit.lockoutRemaining },
        ip,
      });
      return NextResponse.json(
        { error: rateLimit.reason || 'Too many 2FA attempts.' },
        { status: 429, headers: corsHeaders() }
      );
    }

    if (!client.mfaSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const valid = verifyTotpCode(client.mfaSecret, data.code);
    if (!valid) {
      // Record failed attempt
      await record2FAAttempt(client.id);

      await writeAuditLog({
        actorEmail: client.email,
        action: '2FA_FAILED',
        entity: 'Client',
        entityId: client.id,
        detail: { ip },
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Success - delete the temporary 2FA session
    await prisma.session.delete({ where: { id: tempSession.id } });

    // Create real session
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
      action: '2FA_SUCCESS',
      entity: 'Client',
      entityId: client.id,
      detail: { ip },
      ip,
    });

    return response;
  } catch (e) {
    console.error('2FA verification failed', e);
    return NextResponse.json(
      { error: 'Could not verify 2FA. Please try again.' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}