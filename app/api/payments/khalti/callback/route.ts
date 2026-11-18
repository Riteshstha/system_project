// Khalti Payment Callback Handler
//
// Handles the redirect back from Khalti after payment attempt.
// Verifies the transaction status and updates our records.
//
// Security:
// - Verifies the Khalti transaction by calling their verification API.
// - Uses the transaction ID to find the payment transaction.
// - Updates invoice status to PAID on success.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentCallback, updateInvoiceStatus, completePaymentTransaction } from '@/lib/payments/handlers';
import { writeAuditLog, getClientIp } from '@/lib/audit';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const transactionId = url.searchParams.get('transaction_id');
  const status = url.searchParams.get('status');
  const amount = url.searchParams.get('amount');

  const ip = getClientIp(req);

  if (!transactionId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices?error=missing_transaction`);
  }

  // Find the payment transaction
  const paymentTx = await prisma.paymentTransaction.findFirst({
    where: { gatewayTransactionId: transactionId },
  });

  if (!paymentTx || !paymentTx.invoiceId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices?error=transaction_not_found`);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: paymentTx.invoiceId },
    include: { client: true },
  });

  if (!invoice || !invoice.client) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices?error=invoice_not_found`);
  }

  const clientId = invoice.clientId;

  try {
    const config = {
      id: 'khalti' as const,
      credentials: {
        secretKey: process.env.KHALTI_SECRET || '',
      },
      baseUrl: process.env.KHALTI_BASE_URL || 'https://khalti.com',
    };

    const result = await verifyPaymentCallback('khalti', transactionId, config);

    if (result.verified && result.status === 'completed') {
      await completePaymentTransaction(paymentTx.id, result);
      await updateInvoiceStatus(invoice.id, 'PAID', result.amountPaisa);

      await writeAuditLog({
        actorEmail: invoice.client.email,
        action: 'PAYMENT_COMPLETED',
        entity: 'Invoice',
        entityId: invoice.id,
        detail: { gateway: 'khalti', amount: result.amountPaisa, transactionId: result.transactionId },
        ip,
        clientId,
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices/${invoice.id}/success`);
    } else {
      await prisma.paymentTransaction.update({
        where: { id: paymentTx.id },
        data: { status: result.status === 'pending' ? 'pending' : 'failed' },
      });

      await writeAuditLog({
        actorEmail: invoice.client.email,
        action: 'PAYMENT_FAILED',
        entity: 'Invoice',
        entityId: invoice.id,
        detail: { gateway: 'khalti', error: result.error, status: result.status },
        ip,
        clientId,
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices/${invoice.id}/failed`);
    }
  } catch (e) {
    console.error('Khalti callback error', e);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices?error=callback_error`);
  }
}