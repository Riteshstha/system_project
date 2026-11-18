// POST /api/auth/activate
// Activates a pending client account by setting their password.
// Single-use, expires in 48 hours.
// Rate-limited.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { checkLoginRateLimit, record2FAAttempt } from '@/lib/ratelimit';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { randomBytes } from 'crypto';

const activateSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const body = await req.json();
  const parsed = activateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data' },
      { status: 400 }
    );
  }

  // Rate limit
  const rateLimit = await checkLoginRateLimit(ip, 'activation');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const { token, password } = parsed.data;

  // Find the client with this invite token
  const client = await prisma.client.findFirst({
    where: { inviteToken: token },
  });

  if (!client || !client.inviteExpiresAt || client.inviteExpiresAt < new Date()) {
    // Generic response
    return NextResponse.json(
      { error: 'Invalid or expired activation link' },
      { status: 400 }
    );
  }

  // Hash password and activate
  const passwordHash = await hashPassword(password);
  await prisma.client.update({
    where: { id: client.id },
    data: {
      passwordHash,
      status: 'ACTIVE',
      inviteToken: null,
      inviteExpiresAt: null,
    },
  });

  await writeAuditLog({
    actorEmail: client.email,
    action: 'ACCOUNT_ACTIVATED',
    entity: 'Client',
    entityId: client.id,
    detail: { ip },
    ip,
  });

  return NextResponse.json({ ok: true });
}