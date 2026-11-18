// PATCH /api/admin/clients/[id]
// Admin can update client status, resend invitation, or deactivate/reactivate.
//
// Security decisions:
// - Requires admin role.
// - Audit log records every change.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const updateClientSchema = z.object({
  action: z.enum(['deactivate', 'reactivate', 'resend-invite', 'delete-invite']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const { id } = await params;

  const session = await requireAdmin();
  const actorEmail = session.client.email;

  const body = await req.json();
  const parsed = updateClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  switch (parsed.data.action) {
    case 'deactivate':
      await prisma.client.update({
        where: { id },
        data: { status: 'DEACTIVATED' },
      });
      await writeAuditLog({
        actorEmail,
        action: 'CLIENT_DEACTIVATED',
        entity: 'Client',
        entityId: client.id,
        detail: { targetEmail: client.email, ip },
        ip,
      });
      return NextResponse.json({ ok: true });

    case 'reactivate':
      await prisma.client.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
      await writeAuditLog({
        actorEmail,
        action: 'CLIENT_REACTIVATED',
        entity: 'Client',
        entityId: client.id,
        detail: { targetEmail: client.email, ip },
        ip,
      });
      return NextResponse.json({ ok: true });

    case 'resend-invite':
      if (client.status !== 'PENDING_ACTIVATION') {
        return NextResponse.json(
          { error: 'Client is not in pending activation state' },
          { status: 400 }
        );
      }
      // Generate new token
      const newToken = randomBytes(32).toString('hex');
      const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await prisma.client.update({
        where: { id },
        data: { inviteToken: newToken, inviteExpiresAt: newExpiresAt },
      });
      // Send new invitation email
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const activationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/activate?token=${newToken}`;
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@acmewebstudio.com',
          to: client.email,
          subject: 'Activate your Acme Web Studio account',
          html: `
            <h2>Welcome to Acme Web Studio!</h2>
            <p>Your account has been created. Click the button below to activate it and set your password.</p>
            <a href="${activationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Activate Account
            </a>
            <p>This link will expire in 48 hours.</p>
          `,
        });
      } catch (e) {
        console.error('Failed to send invitation email:', e);
      }
      await writeAuditLog({
        actorEmail,
        action: 'INVITE_RESENT',
        entity: 'Client',
        entityId: client.id,
        detail: { targetEmail: client.email, ip },
        ip,
      });
      return NextResponse.json({ ok: true });

    case 'delete-invite':
      await prisma.client.update({
        where: { id },
        data: { inviteToken: null, inviteExpiresAt: null, status: 'DEACTIVATED' },
      });
      await writeAuditLog({
        actorEmail,
        action: 'INVITE_REVOKED',
        entity: 'Client',
        entityId: client.id,
        detail: { targetEmail: client.email, ip },
        ip,
      });
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}