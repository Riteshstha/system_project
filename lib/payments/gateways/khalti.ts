// Khalti Payment Gateway (v2 API)
// Documentation: https://docs.khalti.com/
//
// Key facts:
// - Khalti expects amount in NPR PAISA (integer). Our internal unit is paisa — no conversion.
// - Initiate: POST /api/v2/ with JSON body, Authorization: Bearer <secret_key>.
// - Returns a payment_url to redirect the user.
// - Verify: POST /api/v2/transaction/verify/ with { transaction_id, amount }.
// - Refund: POST /api/v2/transaction/refund/ (amount in paisa).
// - We NEVER store the secret_key; it is injected per-request from env.

import { PaymentGatewayImpl, PaymentInitRequest, PaymentInitResult, VerificationResult, RefundResult, GatewayConfig } from '../types';

export const khaltiGateway: PaymentGatewayImpl = {
  gateway: {
    id: 'khalti',
    name: 'Khalti',
    supportsRecurring: false,
    supportsRefund: true,
    minAmount: 100, // 1 NPR minimum
    maxAmount: 100000000, // 1,000,000 NPR maximum
    nativeUnit: 'paisa',
  },

  async initiatePayment(request: PaymentInitRequest, config: GatewayConfig): Promise<PaymentInitResult> {
    const { credentials, baseUrl } = config;
    const secretKey = credentials.secretKey;

    if (!secretKey) {
      return { success: false, status: 'failed', error: 'Khalti secret key not configured' };
    }

    const purchaseOrderId = request.invoiceId;
    const body = {
      amount: request.amountPaisa, // paisa — no conversion
      purchase_order_id: purchaseOrderId,
      purchase_order_details: request.metadata?.invoiceId ? `Invoice ${request.metadata.invoiceId}` : undefined,
      customer_info: {
        name: request.customerName,
        email: request.customerEmail,
        phone: request.customerPhone || undefined,
      },
      return_url: request.successUrl,
      website_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
    };

    try {
      const response = await fetch(`${baseUrl}/api/v2/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data?.detail || data?.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        transactionId: data.transaction_id,
        paymentUrl: data.payment_url,
        status: 'pending',
      };
    } catch (e) {
      return { success: false, status: 'failed', error: String(e) };
    }
  },

  async verifyPayment(transactionRef: string, config: GatewayConfig): Promise<VerificationResult> {
    const { credentials, baseUrl } = config;
    const secretKey = credentials.secretKey;

    if (!secretKey) {
      return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: 'Khalti secret key not configured' };
    }

    try {
      const response = await fetch(`${baseUrl}/api/v2/transaction/verify/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: transactionRef, amount: 0 }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: data?.detail || `HTTP ${response.status}` };
      }

      const status = data.status;
      const verified = status === 'Completed';
      const amountPaisa = Number(data.amount) || 0;

      return {
        verified,
        transactionId: data.transaction_id || transactionRef,
        amountPaisa,
        currency: 'NPR',
        status: verified ? 'completed' : status === 'Pending' ? 'pending' : 'failed',
        paidAt: verified ? new Date() : undefined,
      };
    } catch (e) {
      return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: String(e) };
    }
  },

  async refundPayment(transactionRef: string, amountPaisa: number, config: GatewayConfig): Promise<RefundResult> {
    const { credentials, baseUrl } = config;
    const secretKey = credentials.secretKey;

    if (!secretKey) {
      return { success: false, error: 'Khalti secret key not configured' };
    }

    try {
      const response = await fetch(`${baseUrl}/api/v2/transaction/refund/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: transactionRef, amount: amountPaisa }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data?.detail || `HTTP ${response.status}` };
      }

      return { success: true, refundId: data.refund_id };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },
};