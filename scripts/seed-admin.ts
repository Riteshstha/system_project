// Seed an admin user into the database.
// Usage: npx tsx scripts/seed-admin.ts <email> <password> [name]
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@acmewebstudio.com';
  const password = process.argv[3] || 'ChangeMe123!';
  const name = process.argv[4] || 'Admin';

  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists (id=${existing.id}, roles=${existing.roles})`);
    await prisma.$disconnect();
    return;
  }

  const hash = await hashPassword(password);
  const client = await prisma.client.create({
    data: { email, name, passwordHash: hash, roles: 'ADMIN' },
  });

  console.log(`Created admin: ${client.email} (id=${client.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});