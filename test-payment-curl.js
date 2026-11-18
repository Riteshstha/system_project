const { PrismaClient } = require('@prisma/client');
const { hashPassword, createSessionToken } = require('./lib/auth');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/system_website_test' } } });
(async () => {
  await prisma.$connect();
  const hash = await hashPassword('password123');
  const client = await prisma.client.create({ data: { email: 't@test.com', name: 'T', passwordHash: hash, roles: 'CLIENT' } });
  const token = createSessionToken(client.id, client.roles);
  await prisma.session.create({ data: { clientId: client.id, token, expiresAt: new Date(Date.now()+86400000) } });
  const pkg = await prisma.package.create({ data: { name: 'P', category: 'WEBSITE_DESIGN', description: 't', priceCents: 75000, billingCycle: 'ONE_TIME' } });
  const order = await prisma.order.create({ data: { clientId: client.id, clientName: 'T', clientEmail: 't@test.com', packageId: pkg.id, selectionJson: '{}', totalCents: 75000, currency: 'NPR', status: 'PENDING', advanceCents: 37500 } });
  const invoice = await prisma.invoice.create({ data: { clientId: client.id, orderId: order.id, amountCents: 75000, currency: 'NPR', status: 'UNPAID', description: 'Test', dueDate: new Date() } });
  console.log('INVOICE_ID=' + invoice.id);
  console.log('TOKEN=' + token);
  await prisma.$disconnect();
})();