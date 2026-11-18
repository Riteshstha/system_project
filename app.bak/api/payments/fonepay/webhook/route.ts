// Fonepay Webhook Handler
//
// Placeholder for Fonepay webhook integration.
// Implementation will depend on Fonepay's specific webhook format.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentCallback, updateInvoiceStatus, completePaymentTransaction } from '@/lib/payments/handlers';
import { writeAuditLog, getClientIp } from '@/lib/audit';

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    const payload = await req.json();

    // Fonepay webhook payload structure (to be implemented based on their API docs)
    const { transaction_id, status, amount } = payload;

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: { gatewayTransactionId: transaction_id },
    });

    if (!paymentTx || !paymentTx.invoiceId) {
      console.warn('Fonepay webhook: transaction not found', { transaction_id });
      return NextResponse.json({ success: true });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: paymentTx.invoiceId },
      include: { client: true },
    });

    if (!invoice || !invoice.client) {
      console.warn('Fonepay webhook: invoice not found', { transaction_id });
      return NextResponse.json({ success: true });
    }

    const clientId = invoice.clientId;

    const config = {
      id: 'fonepay' as const,
      credentials: {
        secretKey: process.env.FONEPAY_SECRET || '',
      },
      baseUrl: process.env.FONEPAY_BASE_URL || '',
    };

    const result = await verifyPaymentCallback('fonepay', transaction_id, config);

    if (paymentTx.status !== 'completed' && result.verified && result.status === 'completed') {
      await completePaymentTransaction(paymentTx.id, result);
      await updateInvoiceStatus(invoice.id, 'PAID', result.amountPaisa);

      await writeAuditLog({
        actorEmail: invoice.client.email,
        action: 'PAYMENT_COMPLETED',
        entity: 'Invoice',
        entityId: invoice.id,
        detail: { gateway: 'fonepay', amount: result.amountPaisa, transactionId: result.transactionId, webhook: true },
        ip,
        clientId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Fonepay webhook error', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}