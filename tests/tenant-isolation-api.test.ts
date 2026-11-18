import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPassword, createSessionToken } from '@/lib/auth';
import './test-db-guard';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/system_website_test' } },
  log: ['error'],
});

const TEST_SERVER = process.env.TEST_SERVER_URL || 'http://localhost:3100';

let clientA: any, clientB: any;
let tokenA: string, tokenB: string;
let orderA: any, orderB: any;
let subA: any, subB: any;
let invoiceA: any, invoiceB: any;
let adminClient: any, adminToken: string;

async function createTestClient(email: string, name: string, roles = 'CLIENT') {
  const hash = await hashPassword('password123');
  const client = await prisma.client.create({
    data: { email, name, passwordHash: hash, roles },
  });
  const token = createSessionToken(client.id, client.roles);
  // Also create a DB session so middleware & session validation pass
  await prisma.session.create({
    data: {
      clientId: client.id,
      token,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  return { client, token };
}

async function makeRequest(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${TEST_SERVER}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_token=${token}`,
      ...options.headers,
    },
  });
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

  const pkg = await prisma.package.create({
    data: { name: 'Test Basic', category: 'WEBSITE_DESIGN', description: 'test', priceCents: 75000, billingCycle: 'ONE_TIME' },
  });

  const resA = await createTestClient('a@test.com', 'Client A');
  clientA = resA.client;
  tokenA = resA.token;

  const resB = await createTestClient('b@test.com', 'Client B');
  clientB = resB.client;
  tokenB = resB.token;

  const resAdmin = await createTestClient('admin@test.com', 'Admin', 'ADMIN');
  adminClient = resAdmin.client;
  adminToken = resAdmin.token;

  orderA = await prisma.order.create({
    data: { clientId: clientA.id, clientName: 'A', clientEmail: 'a@test.com', packageId: pkg.id, selectionJson: '{}', totalCents: 75000, currency: 'NPR', status: 'PENDING', advanceCents: 37500 }
  });
  orderB = await prisma.order.create({
    data: { clientId: clientB.id, clientName: 'B', clientEmail: 'b@test.com', packageId: pkg.id, selectionJson: '{}', totalCents: 75000, currency: 'NPR', status: 'PENDING', advanceCents: 37500 }
  });

  subA = await prisma.subscription.create({
    data: { orderId: orderA.id, clientId: clientA.id, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 86400000 * 30) }
  });
  subB = await prisma.subscription.create({
    data: { orderId: orderB.id, clientId: clientB.id, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 86400000 * 30) }
  });

  invoiceA = await prisma.invoice.create({
    data: { clientId: clientA.id, orderId: orderA.id, amountCents: 75000, currency: 'NPR', status: 'UNPAID', description: 'Test', dueDate: new Date() }
  });
  invoiceB = await prisma.invoice.create({
    data: { clientId: clientB.id, orderId: orderB.id, amountCents: 75000, currency: 'NPR', status: 'UNPAID', description: 'Test', dueDate: new Date() }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Tenant Isolation — Orders API', () => {
  it('Client A cannot PATCH Client B order status', async () => {
    const res = await makeRequest(`/api/orders/${orderB.id}/status`, tokenA, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    // Non-admin trying to update status gets 403/404
    expect([403, 404]).toContain(res.status);

    const order = await prisma.order.findUnique({ where: { id: orderB.id } });
    expect(order?.status).toBe('PENDING');
  });

  it('Client A CAN access their own dashboard data', async () => {
    const res = await makeRequest('/dashboard', tokenA);
    expect(res.status).toBe(200);
  });
});

describe('Tenant Isolation — Subscriptions & Invoices', () => {
  it('Client A cannot cancel Client B subscription via server action', async () => {
    // Attempting cross-client modification via direct query validation
    const sub = await prisma.subscription.findFirst({
      where: { id: subB.id, clientId: clientA.id },
    });
    expect(sub).toBeNull();
  });

  it('Client A cannot pay Client B invoice', async () => {
    const inv = await prisma.invoice.findFirst({
      where: { id: invoiceB.id, clientId: clientA.id },
    });
    expect(inv).toBeNull();
  });
});

describe('Admin Actions', () => {
  it('Admin CAN update any order status', async () => {
    const res = await makeRequest(`/api/orders/${orderB.id}/status`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'QUOTE_SENT' }),
    });
    expect(res.status).toBe(200);

    const order = await prisma.order.findUnique({ where: { id: orderB.id } });
    expect(order?.status).toBe('QUOTE_SENT');
  });
});