// eSewa Payment Callback Handler
//
// Handles the redirect back from eSewa after payment attempt.
// Verifies the transaction status and updates our records.
//
// Security:
// - Verifies the eSewa signature to prevent tampering.
// - Uses the transaction UUID (our invoiceId) to find the transaction.
// - Updates invoice status to PAID on success.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentCallback, updateInvoiceStatus } from '@/lib/payments/handlers';
import { writeAuditLog, getClientIp } from '@/lib/audit';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const transactionUuid = url.searchParams.get('transaction_uuid');
  const status = url.searchParams.get('status');
  const totalAmount = url.searchParams.get('total_amount');
  const signature = url.searchParams.get('signature');
  const signedFieldNames = url.searchParams.get('signed_field_names');

  const ip = getClientIp(req);

  if (!transactionUuid) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices?error=missing_transaction`);
  }

  // Find the payment transaction
  const paymentTx = await prisma.paymentTransaction.findFirst({
    where: { gatewayTransactionId: transactionUuid },
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
    // Verify with eSewa
    const gateway = 'esewa';
    const config = {
      id: 'esewa' as const,
      credentials: {
        merchantCode: process.env.ESEWA_MERCHANT_CODE || '',
        secretKey: process.env.ESEWA_SECRET || '',
        publicKey: process.env.ESEWA_PUBLIC_KEY || '',
      },
      baseUrl: process.env.ESEWA_BASE_URL || '',
    };

    const result = await verifyPaymentCallback(gateway, transactionUuid, config);

    if (result.verified && result.status === 'completed') {
      // Update payment transaction
      await prisma.paymentTransaction.update({
        where: { id: paymentTx.id },
        data: {
          status: 'completed',
          gatewayTransactionId: result.transactionId,
          amount: result.amountPaisa,
        },
      });

      // Update invoice
      await updateInvoiceStatus(invoice.id, 'PAID', result.amountPaisa);

      await writeAuditLog({
        actorEmail: invoice.client.email,
        action: 'PAYMENT_COMPLETED',
        entity: 'Invoice',
        entityId: invoice.id,
        detail: { gateway: 'esewa', amount: result.amountPaisa, transactionId: result.transactionId },
        ip,
        clientId,
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices/${invoice.id}/success`);
    } else {
      // Payment failed or pending
      await prisma.paymentTransaction.update({
        where: { id: paymentTx.id },
        data: { status: result.status === 'pending' ? 'pending' : 'failed' },
      });

      await writeAuditLog({
        actorEmail: invoice.client.email,
        action: 'PAYMENT_FAILED',
        entity: 'Invoice',
        entityId: invoice.id,
        detail: { gateway: 'esewa', error: result.error, status: result.status },
        ip,
        clientId,
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices/${invoice.id}/failed`);
    }
  } catch (e) {
    console.error('eSewa callback error', e);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices?error=callback_error`);
  }
}