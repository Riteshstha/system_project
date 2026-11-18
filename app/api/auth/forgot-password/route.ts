// POST /api/auth/forgot-password
// Sends a password reset link to the provided email.
// Generic response regardless of whether the email exists.
// Rate-limited.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkLoginRateLimit, record2FAAttempt } from '@/lib/ratelimit';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { randomBytes } from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data' },
      { status: 400 }
    );
  }

  // Rate limit
  const rateLimit = await checkLoginRateLimit(ip, parsed.data.email);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Find the client (doesn't matter if it exists)
  const client = await prisma.client.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (client) {
    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await prisma.client.update({
      where: { id: client.id },
      data: { resetToken: token, resetExpiresAt: expiresAt },
    });

    // TODO: Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
    console.log(`Password reset link for ${client.email}: ${resetUrl}`);

    await writeAuditLog({
      actorEmail: client.email,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'Client',
      entityId: client.id,
      detail: { ip },
      ip,
    });
  }

  // Always return the same generic response
  return NextResponse.json({ ok: true });
}