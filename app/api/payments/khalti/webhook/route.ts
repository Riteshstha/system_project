// Khalti Webhook Handler
//
// Khalti sends webhook notifications for payment status changes.
// We verify the webhook and update our records accordingly.
//
// Security:
// - Verify the webhook signature using Khalti's secret key.
// - Idempotent processing based on transaction_id.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentCallback, updateInvoiceStatus, completePaymentTransaction } from '@/lib/payments/handlers';
import { writeAuditLog, getClientIp } from '@/lib/audit';

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    const payload = await req.json();

    // Khalti webhook payload structure
    const { transaction_id, status, amount, purchased_at } = payload;

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    // Find the payment transaction
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: { gatewayTransactionId: transaction_id },
    });

    if (!paymentTx || !paymentTx.invoiceId) {
      console.warn('Khalti webhook: transaction not found', { transaction_id });
      return NextResponse.json({ success: true }); // Return 200 to acknowledge receipt
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: paymentTx.invoiceId },
      include: { client: true },
    });

    if (!invoice || !invoice.client) {
      console.warn('Khalti webhook: invoice not found', { transaction_id });
      return NextResponse.json({ success: true });
    }

    const clientId = invoice.clientId;

    const config = {
      id: 'khalti' as const,
      credentials: {
        secretKey: process.env.KHALTI_SECRET || '',
      },
      baseUrl: process.env.KHALTI_BASE_URL || 'https://khalti.com',
    };

    const result = await verifyPaymentCallback('khalti', transaction_id, config);

    // Idempotent: only process if we haven't completed this transaction yet
    if (paymentTx.status !== 'completed' && result.verified && result.status === 'completed') {
      await completePaymentTransaction(paymentTx.id, result);
      await updateInvoiceStatus(invoice.id, 'PAID', result.amountPaisa);

      await writeAuditLog({
        actorEmail: invoice.client.email,
        action: 'PAYMENT_COMPLETED',
        entity: 'Invoice',
        entityId: invoice.id,
        detail: { gateway: 'khalti', amount: result.amountPaisa, transactionId: result.transactionId, webhook: true },
        ip,
        clientId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Khalti webhook error', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}