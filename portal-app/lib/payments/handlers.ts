// Payment Handlers
//
// Centralized payment verification and status update logic.
// Used by both callback routes and webhook handlers.

import { prisma } from '@/lib/prisma';
import { getGateway } from './registry';
import { VerificationResult, GatewayConfig } from './types';

export async function verifyPaymentCallback(
  gatewayId: string,
  transactionRef: string,
  config: GatewayConfig
): Promise<VerificationResult> {
  const gw = getGateway(gatewayId);
  if (!gw) {
    return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: 'Unknown gateway' };
  }
  return gw.verifyPayment(transactionRef, config);
}

export async function updateInvoiceStatus(invoiceId: string, status: 'PAID' | 'UNPAID' | 'CANCELLED' | 'REFUNDED', amountPaisa?: number) {
  const updateData: Record<string, unknown> = { status };
  if (status === 'PAID') {
    updateData.paidAt = new Date();
    if (amountPaisa !== undefined) {
      updateData.amountCents = amountPaisa; // Schema uses amountCents but we store paisa
    }
  }
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  });
}

export async function recordPaymentTransaction(data: {
  gateway: string;
  gatewayTransactionId: string;
  amountPaisa: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  invoiceId: string;
  clientId: string;
  orderId?: string;
}) {
  return prisma.paymentTransaction.create({
    data: {
      gateway: data.gateway,
      gatewayTransactionId: data.gatewayTransactionId,
      amount: data.amountPaisa,
      currency: data.currency,
      status: data.status,
      invoiceId: data.invoiceId,
      clientId: data.clientId,
      orderId: data.orderId,
    },
  });
}

export async function completePaymentTransaction(
  paymentTxId: string,
  result: VerificationResult
) {
  const updateData: Record<string, unknown> = {
    status: result.status,
    updatedAt: new Date(),
  };
  if (result.status === 'completed') {
    updateData.amount = result.amountPaisa;
  }
  return prisma.paymentTransaction.update({
    where: { id: paymentTxId },
    data: updateData,
  });
}