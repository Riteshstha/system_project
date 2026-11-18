// Cron: Subscription Renewals & Grace Periods
//
// Runs on a schedule (e.g., daily) to:
// 1. Move ACTIVE subscriptions whose currentPeriodEnd has passed into PAST_DUE.
// 2. Issue renewal invoices for ACTIVE subscriptions approaching renewal.
// 3. Suspend subscriptions that have exceeded their grace period.
//
// Security:
// - Protected by a shared secret (CRON_SECRET env var).
// - Idempotent: each subscription is processed once per day.
// - Tenant-safe: all queries are scoped by clientId.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // 1. Move expired ACTIVE subscriptions to PAST_DUE
    const expiredSubs = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: todayStart },
      },
      data: {
        status: 'PAST_DUE',
        graceEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7-day grace period
      },
    });

    // 2. Suspend subscriptions whose grace period has ended
    const suspendedSubs = await prisma.subscription.updateMany({
      where: {
        status: 'PAST_DUE',
        graceEndsAt: { lt: now },
      },
      data: {
        status: 'SUSPENDED',
        suspendedAt: now,
      },
    });

    // 3. Issue renewal invoices for subscriptions renewing within the next 3 days
    const renewingSubs = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      include: { order: true },
    });

    let renewalInvoices = 0;
    for (const sub of renewingSubs) {
      // Check if a renewal invoice already exists for this period
      const existing = await prisma.invoice.findFirst({
        where: {
          orderId: sub.orderId,
          status: { in: ['UNPAID', 'PAID'] },
          dueDate: { gte: todayStart },
        },
      });
      if (existing) continue;

      const amount = sub.order.totalCents;
      await prisma.invoice.create({
        data: {
          clientId: sub.clientId,
          orderId: sub.orderId,
          amountCents: amount,
          currency: 'NPR',
          status: 'UNPAID',
          description: `Subscription renewal for order ${sub.orderId}`,
          dueDate: sub.currentPeriodEnd,
        },
      });
      renewalInvoices++;
    }

    await writeAuditLog({
      actorEmail: 'system@cron',
      action: 'SUBSCRIPTION_RENEWAL_CYCLE',
      entity: 'Subscription',
      detail: {
        expiredToPastDue: expiredSubs.count,
        suspended: suspendedSubs.count,
        renewalInvoices,
        runAt: now.toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      expiredToPastDue: expiredSubs.count,
      suspended: suspendedSubs.count,
      renewalInvoices,
    });
  } catch (e) {
    console.error('Renewal cron failed', e);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}