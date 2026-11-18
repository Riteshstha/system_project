import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPassword, createSessionToken } from '@/lib/auth';
import './test-db-guard';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/system_website_test' } },
  log: ['error'],
});

const TEST_SERVER = process.env.TEST_SERVER_URL || 'http://localhost:3100';

let client: any, token: string, invoice: any, pkg: any;

async function createTestClient(email: string, name: string, roles = 'CLIENT') {
  const hash = await hashPassword('password123');
  const c = await prisma.client.create({ data: { email, name, passwordHash: hash, roles } });
  const t = createSessionToken(c.id, c.roles);
  await prisma.session.create({ data: { clientId: c.id, token: t, expiresAt: new Date(Date.now() + 86400000) } });
  return { client: c, token: t };
}

beforeAll(async () => {
  await prisma.$connect();
  await prisma.paymentTransaction.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.package.deleteMany({});

  pkg = await prisma.package.create({
    data: { name: 'Pay Test', category: 'WEBSITE_DESIGN', description: 'test', priceCents: 75000, billingCycle: 'ONE_TIME' },
  });

  const res = await createTestClient('pay@test.com', 'Pay Client');
  client = res.client;
  token = res.token;

  const order = await prisma.order.create({
    data: { clientId: client.id, clientName: 'Pay', clientEmail: 'pay@test.com', packageId: pkg.id, selectionJson: '{}', totalCents: 75000, currency: 'NPR', status: 'PENDING', advanceCents: 37500 },
  });

  invoice = await prisma.invoice.create({
    data: { clientId: client.id, orderId: order.id, amountCents: 75000, currency: 'NPR', status: 'UNPAID', description: 'Pay test', dueDate: new Date() },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeRequest(url: string, token: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${TEST_SERVER}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Cookie: `session_token=${token}`, ...options.headers },
  });
}

describe('Payment Initiation', () => {
  it('rejects initiation for an invoice belonging to another client', async () => {
    const other = await createTestClient('other@test.com', 'Other');
    const res = await makeRequest('/api/payments/initiate', other.token, {
      method: 'POST',
      body: JSON.stringify({ invoiceId: invoice.id, gatewayId: 'mock' }),
    });
    expect([403, 404]).toContain(res.status);
  });

  it('initiates payment successfully with the mock gateway', async () => {
    const res = await makeRequest('/api/payments/initiate', token, {
      method: 'POST',
      body: JSON.stringify({ invoiceId: invoice.id, gatewayId: 'mock' }),
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.paymentUrl).toContain('mock.example.com');

    // Verify the transaction was recorded
    const tx = await prisma.paymentTransaction.findFirst({
      where: { invoiceId: invoice.id, gateway: 'mock' },
    });
    expect(tx).not.toBeNull();
    expect(tx?.status).toBe('pending');
    expect(tx?.amount).toBe(75000);
  });

  it('rejects invalid gateway id', async () => {
    const res = await makeRequest('/api/payments/initiate', token, {
      method: 'POST',
      body: JSON.stringify({ invoiceId: invoice.id, gatewayId: 'nonexistent' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid gateway');
  });

  it('rejects already-paid invoice', async () => {
    const paidInvoice = await prisma.invoice.create({
      data: { clientId: client.id, orderId: invoice.orderId, amountCents: 1000, currency: 'NPR', status: 'PAID', description: 'Paid', dueDate: new Date(), paidAt: new Date() },
    });

    const res = await makeRequest('/api/payments/initiate', token, {
      method: 'POST',
      body: JSON.stringify({ invoiceId: paidInvoice.id, gatewayId: 'mock' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invoice already paid');
  });
});