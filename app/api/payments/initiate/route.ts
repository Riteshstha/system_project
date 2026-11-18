import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { getGateway } from '@/lib/payments/registry';
import { writeAuditLog, getClientIp } from '@/lib/audit';

// POST /api/payments/initiate
// Initiates a payment for a specific invoice.
// Security: verifies invoice ownership (clientId) before initiating.

export async function POST(req: Request) {
  const session = await requireSession();
  const clientId = session.client.id;
  const ip = getClientIp(req);

  try {
    const { invoiceId, gatewayId } = await req.json();

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId },
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    const gw = getGateway(gatewayId);
    if (!gw) {
      return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 });
    }

    // Prepare payment intent
    const intent = {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      clientId,
      amountPaisa: invoice.amountCents,
      currency: 'NPR' as const,
      customerEmail: invoice.client.email,
      customerName: invoice.client.name,
      customerPhone: invoice.client.phone || undefined,
      metadata: { invoiceId: invoice.id },
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices/${invoice.id}/success`,
      failureUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices/${invoice.id}/failed`,
    };

    // Gateway config (server-side secrets)
    const config = {
      id: gatewayId,
      credentials: {
        merchantCode: process.env[`${gatewayId.toUpperCase()}_MERCHANT_CODE`] || '',
        secretKey: process.env[`${gatewayId.toUpperCase()}_SECRET`] || '',
        publicKey: process.env[`${gatewayId.toUpperCase()}_PUBLIC_KEY`] || '',
      },
      baseUrl: process.env[`${gatewayId.toUpperCase()}_BASE_URL`] || '',
    };

    const result = await gw.initiatePayment(intent, config);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Payment initiation failed' }, { status: 500 });
    }

    // Record the pending transaction (idempotent: reuse existing pending attempt)
    const existingTx = await prisma.paymentTransaction.findFirst({
      where: { invoiceId: invoice.id, status: 'pending' },
    });

    let paymentTx;
    if (existingTx) {
      paymentTx = await prisma.paymentTransaction.update({
        where: { id: existingTx.id },
        data: { gatewayTransactionId: result.transactionId, gateway: gatewayId },
      });
    } else {
      paymentTx = await prisma.paymentTransaction.create({
        data: {
          gateway: gatewayId,
          gatewayTransactionId: result.transactionId,
          amount: invoice.amountCents,
          currency: 'NPR',
          status: 'pending',
          invoiceId: invoice.id,
          clientId: clientId,
        },
      });
    }

    await writeAuditLog({
      actorEmail: session.client.email,
      action: 'PAYMENT_INITIATED',
      entity: 'Invoice',
      entityId: invoice.id,
      detail: { gateway: gatewayId, amount: invoice.amountCents },
      ip,
      clientId,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('Payment initiation failed', e);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}