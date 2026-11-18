// Fonepay Payment Gateway (QPay)
//
// Key facts:
// - Similar to other gateways: redirect-based (or API-driven depending on integration).
// - Assuming standard Merchant/Shared Secret API.
// - Amount: NPR PAISA.
// - HMAC/RSA signing required.

import { PaymentGatewayImpl, PaymentInitRequest, PaymentInitResult, VerificationResult, RefundResult, GatewayConfig } from '../types';

export const fonepayGateway: PaymentGatewayImpl = {
  gateway: {
    id: 'fonepay',
    name: 'Fonepay',
    supportsRecurring: false,
    supportsRefund: true,
    minAmount: 100,
    maxAmount: 100000000,
    nativeUnit: 'paisa',
  },

  async initiatePayment(request: PaymentInitRequest, config: GatewayConfig): Promise<PaymentInitResult> {
    // Fonepay integration typically involves generating a signature based on merchant credentials and amount
    // Placeholder implementation for Fonepay-specific flow
    return {
      success: false,
      status: 'failed',
      error: 'Fonepay integration is pending API documentation integration',
    };
  },

  async verifyPayment(transactionRef: string, config: GatewayConfig): Promise<VerificationResult> {
    return {
      verified: false,
      transactionId: transactionRef,
      amountPaisa: 0,
      currency: 'NPR',
      status: 'failed',
      error: 'Not implemented',
    };
  },

  async refundPayment(transactionRef: string, amountPaisa: number, config: GatewayConfig): Promise<RefundResult> {
    return { success: false, error: 'Not implemented' };
  },
};