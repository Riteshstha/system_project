// Payment Gateway Abstraction Types
//
// Design:
// - All amounts are in PAISA (NPR smallest unit, integer) — our internal canonical unit.
// - Each gateway has its own native unit:
//   - eSewa: NPR RUPEES (amount = paisa / 100)
//   - Khalti: NPR PAISA (amount = paisa)
//   - Fonepay: NPR PAISA (amount = paisa)
// - The abstraction layer handles conversion transparently.
// - We NEVER store card numbers, wallet tokens, or gateway credentials.
// - Only transaction IDs, status, amount, currency, and timestamps are stored.

export type GatewayId = 'esewa' | 'khalti' | 'fonepay';

export interface PaymentGateway {
  id: GatewayId;
  name: string;
  supportsRecurring: boolean;
  supportsRefund: boolean;
  minAmount: number; // in gateway's native unit
  maxAmount: number; // in gateway's native unit
  // Native unit for this gateway: 'rupees' (eSewa) or 'paisa' (Khalti/Fonepay)
  nativeUnit: 'rupees' | 'paisa';
}

export interface PaymentInitRequest {
  invoiceId: string; // Our internal invoice ID
  orderId: string | null;
  clientId: string;
  amountPaisa: number; // Canonical amount in paisa
  currency: 'NPR';
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  metadata: Record<string, string>;
  successUrl: string;
  failureUrl: string;
}

export interface PaymentInitResult {
  success: boolean;
  transactionId?: string; // Gateway's transaction reference
  paymentUrl?: string; // For redirect-based gateways
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  transactionId: string;
  amountPaisa: number; // Amount reported by gateway, converted to paisa
  currency: 'NPR';
  status: 'completed' | 'pending' | 'failed';
  paidAt?: Date;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface GatewayConfig {
  id: GatewayId;
  credentials: Record<string, string>;
  baseUrl: string;
}

// Gateway implementations must conform to this interface
export interface PaymentGatewayImpl {
  gateway: PaymentGateway;
  initiatePayment(request: PaymentInitRequest, config: GatewayConfig): Promise<PaymentInitResult>;
  verifyPayment(transactionRef: string, config: GatewayConfig): Promise<VerificationResult>;
  refundPayment(transactionRef: string, amountPaisa: number, config: GatewayConfig): Promise<RefundResult>;
}