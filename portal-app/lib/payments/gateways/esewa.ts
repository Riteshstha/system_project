// eSewa Payment Gateway (v2 API)
// Documentation: https://developer.esewa.com.np/
//
// Key facts:
// - eSewa v2 uses a POST form to redirect the user to their payment page.
// - Amount is in NPR RUPEES (not paisa). Our internal amount is in paisa.
//   Conversion: amountInPaisa / 100 = amountInRupees
// - Signature: HMAC-SHA256(secret_key, "total_amount={amount},transaction_uuid={uuid},product_code={productCode}")
// - Verification: POST to /api/epay/transaction/status/ with the same signature format
// - Product code: 'EPAYTEST' for test, your merchant code for live.

import crypto from 'crypto';
import { PaymentGatewayImpl, PaymentInitRequest, PaymentInitResult, VerificationResult, GatewayConfig } from '../types';

export const esewaGateway: PaymentGatewayImpl = {
  gateway: {
    id: 'esewa',
    name: 'eSewa',
    supportsRecurring: false,
    supportsRefund: false,
    minAmount: 100, // 1 NPR minimum
    maxAmount: 10000000, // 100,000 NPR maximum
    nativeUnit: 'rupees',
  },

  async initiatePayment(request: PaymentInitRequest, config: GatewayConfig): Promise<PaymentInitResult> {
    const { credentials, baseUrl } = config;
    const merchantCode = credentials.merchantCode;
    const secretKey = credentials.secretKey;

    if (!merchantCode || !secretKey) {
      return { success: false, status: 'failed', error: 'eSewa credentials not configured' };
    }

    // eSewa expects amount in RUPEES. Convert paisa -> rupees.
    const amountRupees = Math.round(request.amountPaisa / 100);
    const totalAmount = amountRupees;
    const taxAmount = 0;
    const productServiceCharge = 0;
    const productDeliveryCharge = 0;

    // Build the signature: HMAC-SHA256(secret_key, "total_amount={amount},transaction_uuid={uuid},product_code={productCode}")
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${request.invoiceId},product_code=${merchantCode}`;
    const signature = crypto.createHmac('sha256', secretKey).update(signatureMessage).digest('hex');

    // Build the form data for eSewa v2
    const formData = new URLSearchParams();
    formData.set('amount', String(amountRupees));
    formData.set('tax_amount', String(taxAmount));
    formData.set('total_amount', String(totalAmount));
    formData.set('transaction_uuid', request.invoiceId);
    formData.set('product_code', merchantCode);
    formData.set('product_service_charge', String(productServiceCharge));
    formData.set('product_delivery_charge', String(productDeliveryCharge));
    formData.set('success_url', request.successUrl);
    formData.set('failure_url', request.failureUrl);
    formData.set('signed_field_names', 'total_amount,transaction_uuid,product_code');
    formData.set('signature', signature);

    const paymentUrl = `${baseUrl}/api/epay/main/v2/form?${formData.toString()}`;

    return {
      success: true,
      transactionId: request.invoiceId,
      paymentUrl,
      status: 'pending',
    };
  },

  async verifyPayment(transactionRef: string, config: GatewayConfig): Promise<VerificationResult> {
    const { credentials, baseUrl } = config;
    const merchantCode = credentials.merchantCode;
    const secretKey = credentials.secretKey;

    if (!merchantCode || !secretKey) {
      return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: 'eSewa credentials not configured' };
    }

    // Build the signature for verification
    // eSewa v2 verification expects the same signature format
    const signatureMessage = `total_amount=0,transaction_uuid=${transactionRef},product_code=${merchantCode}`;
    const signature = crypto.createHmac('sha256', secretKey).update(signatureMessage).digest('hex');

    const formData = new URLSearchParams();
    formData.set('product_code', merchantCode);
    formData.set('transaction_uuid', transactionRef);
    formData.set('total_amount', '0'); // Not verified in the signature
    formData.set('signature', signature);

    try {
      const response = await fetch(`${baseUrl}/api/epay/transaction/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: `HTTP ${response.status}` };
      }

      const data = await response.json();

      // eSewa returns: { status: "COMPLETE" | "PENDING" | "FAILED", ... }
      const status = data.status;
      const verified = status === 'COMPLETE';
      const amountPaisa = data.total_amount ? Math.round(Number(data.total_amount) * 100) : 0; // Convert rupees to paisa

      return {
        verified,
        transactionId: data.transaction_uuid || transactionRef,
        amountPaisa,
        currency: 'NPR',
        status: verified ? 'completed' : status === 'PENDING' ? 'pending' : 'failed',
        paidAt: verified ? new Date() : undefined,
      };
    } catch (e) {
      return { verified: false, transactionId: transactionRef, amountPaisa: 0, currency: 'NPR', status: 'failed', error: String(e) };
    }
  },

  async refundPayment(transactionRef: string, amountPaisa: number, config: GatewayConfig): Promise<{ success: boolean; refundId?: string; error?: string }> {
    return { success: false, error: 'eSewa does not support refunds via API' };
  },
};