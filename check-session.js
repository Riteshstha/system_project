const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/system_website_test' } },
});
(async () => {
  await prisma.$connect();
  const client = await prisma.client.findFirst({ where: { email: 'pay@test.com' } });
  console.log('Client:', client?.id, client?.email, client?.roles);
  const session = await prisma.session.findFirst({ where: { clientId: client?.id } });
  console.log('Session:', session?.token?.slice(0,20)+'...', session?.expiresAt);
  if (session) {
    try {
      const decoded = jwt.verify(session.token, 'test_session_secret_32_chars_long!');
      console.log('JWT decoded:', decoded);
    } catch(e) { console.log('JWT verify error:', e.message); }
  }
  await prisma.$disconnect();
})();