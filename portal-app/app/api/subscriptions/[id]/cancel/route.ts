// POST /api/subscriptions/[id]/cancel - Admin cancel subscription
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { writeAuditLog, getClientIp } from '@/lib/audit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin();
  const ip = getClientIp(req);

  try {
    const sub = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { client: true, order: { include: { package: true } } },
    });

    await writeAuditLog({
      actorEmail: session.client.email,
      action: 'SUBSCRIPTION_CANCELLED_ADMIN',
      entity: 'Subscription',
      entityId: sub.id,
      detail: { clientId: sub.clientId, package: sub.order?.package?.name },
      ip,
      clientId: sub.clientId,
    });

    return NextResponse.json({ ok: true, subscription: sub });
  } catch (e) {
    console.error('Admin cancel subscription failed', e);
    return NextResponse.json({ error: 'Could not cancel subscription' }, { status: 500 });
  }
}