'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { revokeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';

export async function signOutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSession(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

// Server actions MUST derive clientId from session, never accept it as argument
export async function markOrderRead(orderId: string) {
  const session = await requireSession();
  const clientId = session.client.id;

  // Tenant isolation: always filter by clientId from session
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
  });
  if (!order) {
    return { ok: false, error: 'Order not found' };
  }
  return { ok: true };
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await requireSession();
  const clientId = session.client.id;

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, clientId },
  });
  if (!subscription) {
    return { ok: false, error: 'Subscription not found' };
  }

  // Only allow cancellation if in correct state
  if (subscription.status === 'CANCELLED') {
    return { ok: false, error: 'Already cancelled' };
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'CANCELLED' },
  });

  await writeAuditLog({
    actorEmail: session.client.email,
    action: 'SUBSCRIPTION_CANCELLED',
    entity: 'Subscription',
    entityId: subscriptionId,
    detail: { clientId },
    ip: 'server-action',
  });

  return { ok: true };
}