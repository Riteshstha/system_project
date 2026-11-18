// POST /api/auth/reset-password
// Sets a new password using a valid reset token.
// Single-use, expires in 48 hours.
// Rate-limited.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { checkLoginRateLimit } from '@/lib/ratelimit';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { randomBytes } from 'crypto';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data' },
      { status: 400 }
    );
  }

  // Rate limit
  const rateLimit = await checkLoginRateLimit(ip, 'password-reset');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const { token, password } = parsed.data;

  // Find the client with this reset token
  const client = await prisma.client.findFirst({
    where: { resetToken: token },
  });

  if (!client || !client.resetExpiresAt || client.resetExpiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    );
  }

  // Hash password and activate
  const passwordHash = await hashPassword(password);
  await prisma.client.update({
    where: { id: client.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpiresAt: null,
    },
  });

  await writeAuditLog({
    actorEmail: client.email,
    action: 'PASSWORD_RESET',
    entity: 'Client',
    entityId: client.id,
    detail: { ip },
    ip,
  });

  return NextResponse.json({ ok: true });
}