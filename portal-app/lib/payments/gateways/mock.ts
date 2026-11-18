// Mock Payment Gateway (test-only)
//
// Always succeeds. Only registered when NODE_ENV === 'test'.
// Lets the payment flow tests run end-to-end without hitting real APIs.

import { PaymentGatewayImpl, PaymentInitRequest, PaymentInitResult, VerificationResult, RefundResult, PaymentGateway } from '../types';

const mockMeta: PaymentGateway = {
  id: 'mock' as any,
  name: 'Mock',
  supportsRecurring: false,
  supportsRefund: false,
  minAmount: 0,
  maxAmount: Number.MAX_SAFE_INTEGER,
  nativeUnit: 'paisa',
};

export const mockGateway: PaymentGatewayImpl = {
  gateway: mockMeta,

  async initiatePayment(request: PaymentInitRequest): Promise<PaymentInitResult> {
    return {
      success: true,
      transactionId: `mock_${request.invoiceId}`,
      paymentUrl: `https://mock.example.com/pay?tx=mock_${request.invoiceId}`,
      status: 'pending',
    };
  },

  async verifyPayment(transactionRef: string): Promise<VerificationResult> {
    return {
      verified: true,
      transactionId: transactionRef,
      amountPaisa: 75000,
      currency: 'NPR',
      status: 'completed',
      paidAt: new Date(),
    };
  },

  async refundPayment(): Promise<RefundResult> {
    return { success: true, refundId: 'mock_refund' };
  },
};