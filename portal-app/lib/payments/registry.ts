// Payment Gateway Registry
//
// Single source of truth for all registered gateways.
// Gateways are registered here and selected by id.
// Server-side credentials are injected per-request from env (never stored).

import { esewaGateway } from './gateways/esewa';
import { khaltiGateway } from './gateways/khalti';
import { fonepayGateway } from './gateways/fonepay';
import { mockGateway } from './gateways/mock';
import { PaymentGatewayImpl, PaymentGateway } from './types';

// Test-only mock gateway — registered in test or dev.
const gateways: PaymentGatewayImpl[] = [esewaGateway, khaltiGateway, fonepayGateway];
gateways.unshift(mockGateway);

export const gatewayList: PaymentGateway[] = gateways.map((g) => g.gateway);

export function getGateway(id: string): PaymentGatewayImpl | undefined {
  return gateways.find((g) => g.gateway.id === id);
}

export function listGateways(): PaymentGateway[] {
  return gatewayList;
}