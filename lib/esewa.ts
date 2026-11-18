// eSewa Payment Gateway Integration (Phase 3a)
// Reference: https://developer.esewa.com.np/
// This is the V2 "ePay" API (not the legacy iframe).

import crypto from 'crypto';

export interface EsewaConfig {
  merchantCode: string;
  secretKey: string;
  baseUrl: string; // 'https://uat.esewa.com.np' (test) or 'https://epay.esewa.com.np' (live)
}

export interface EsewaPaymentInitRequest {
  amount: number; // in paisa (smallest unit for NPR)
  transactionUuid: string; // our order ID
  productCode: string; // e.g. 'EPAYTEST' for test, your merchant code for live
  productServiceCharge: number;
  productDeliveryCharge: number;
  successUrl: string;
  failureUrl: string;
}

export interface EsewaPaymentInitResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

/**
 * Generate the signature for eSewa payment initiation.
 * Signature = HMAC_SHA256(secretKey, `total_amount=${amount},transaction_uuid=${uuid},product_code=${productCode}`)
 */
export function generateEsewaSignature(config: EsewaConfig, params: {
  amount: number;
  transactionUuid: string;
  productCode: string;
}): string {
  const message = `total_amount=${params.amount},transaction_uuid=${params.transactionUuid},product_code=${params.productCode}`;
  return crypto.createHmac('sha256', config.secretKey).update(message).digest('hex');
}

/**
 * Initialize an eSewa payment — returns the payment URL to redirect the user.
 * The actual payment happens on eSewa's site; they redirect back to successUrl/failureUrl.
 */
export async function initEsewaPayment(
  config: EsewaConfig,
  request: EsewaPaymentInitRequest
): Promise<EsewaPaymentInitResponse> {
  const signature = generateEsewaSignature(config, {
    amount: request.amount,
    transactionUuid: request.transactionUuid,
    productCode: request.productCode,
  });

  // Build the form data that eSewa expects
  const formData = new URLSearchParams();
  formData.set('amount', request.amount.toString());
  formData.set('tax_amount', '0');
  formData.set('total_amount', request.amount.toString());
  formData.set('transaction_uuid', request.transactionUuid);
  formData.set('product_code', request.productCode);
  formData.set('product_service_charge', request.productServiceCharge.toString());
  formData.set('product_delivery_charge', request.productDeliveryCharge.toString());
  formData.set('success_url', request.successUrl);
  formData.set('failure_url', request.failureUrl);
  formData.set('signed_field_names', 'total_amount,transaction_uuid,product_code');
  formData.set('signature', signature);

  const paymentUrl = `${config.baseUrl}/api/epay/main/v2/form?${formData.toString()}`;

  return { success: true, paymentUrl };
}

/**
 * Verify eSewa payment status via their API.
 * Called from our success/failure callback or webhook.
 */
export async function verifyEsewaPayment(
  config: EsewaConfig,
  transactionUuid: string,
  productCode: string
): Promise<{ success: boolean; status?: string; amount?: number; error?: string }> {
  const signature = generateEsewaSignature(config, {
    amount: 0, // not used in verification
    transactionUuid,
    productCode,
  });

  const formData = new URLSearchParams();
  formData.set('product_code', productCode);
  formData.set('transaction_uuid', transactionUuid);
  formData.set('total_amount', '0'); // placeholder, not verified
  formData.set('signature', signature);

  try {
    const res = await fetch(`${config.baseUrl}/api/epay/transaction/status/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await res.json();

    // eSewa returns: { status: 'COMPLETE' | 'PENDING' | 'FAILED', ... }
    return {
      success: data.status === 'COMPLETE',
      status: data.status,
      amount: data.total_amount,
    };
  } catch (e) {
    console.error('eSewa verification failed', e);
    return { success: false, error: 'Verification request failed' };
  }
}

/**
 * Convert USD cents to NPR paisa (approximate).
 * In production, fetch a live rate or use a fixed internal rate.
 */
export function usdCentsToNprPaisa(usdCents: number, rate = 132): number {
  // 1 USD = 132 NPR (adjust as needed)
  return Math.round((usdCents / 100) * rate * 100); // NPR has 2 decimal places (paisa)
}