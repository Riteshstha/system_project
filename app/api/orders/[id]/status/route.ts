// PATCH /api/orders/[id]/status
// Updates the order status. Only admins can change status.
// Status is the ONLY state machine — nothing else flips it.
//
// Security decisions:
// - Requires admin session (verified in middleware + page).
// - Validates status is one of the allowed enum values.
// - Writes an audit log entry for every status change.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { writeAuditLog, getClientIp } from '@/lib/audit';

const VALID_STATUSES = [
  'PENDING',
  'QUOTE_SENT',
  'ADVANCE_PAID',
  'IN_PROGRESS',
  'READY',
  'ACTIVE',
  'CANCELLED',
  'SUSPENDED',
];

const statusSchema = z.object({
  status: z.string().refine((s) => VALID_STATUSES.includes(s), 'Invalid status'),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireSession();

  if (!session.client.roles.includes('ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const order = await prisma.order.update({
      where: { id },
      data: { status: data.status as any },
      include: { package: true, client: true },
    });

    await writeAuditLog({
      actorEmail: session.client.email,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'Order',
      entityId: order.id,
      detail: {
        newStatus: data.status,
        previousStatus: order.status,
        package: (order as any).package?.name,
        clientEmail: order.clientEmail,
      },
      ip: getClientIp(req),
      clientId: order.clientId || undefined,
    });

    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    console.error('Status update failed', e);
    return NextResponse.json(
      { error: 'Could not update status' },
      { status: 500 }
    );
  }
}