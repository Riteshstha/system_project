// Seed the first admin user into the database.
// Usage: npx tsx scripts/seed-first-admin.ts <email> <password> [name]
//
// This is the ONLY way to create the first admin. All other accounts are
// created through the admin portal invitation flow.
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/seed-first-admin.ts <email> <password> [name]');
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await prisma.client.findFirst({
    where: { roles: { contains: 'ADMIN' } },
  });

  if (existing) {
    console.log(`An admin user already exists: ${existing.email}`);
    console.log('Use the admin portal to create additional admins if needed.');
    await prisma.$disconnect();
    return;
  }

  const hash = await hashPassword(password);
  const admin = await prisma.client.create({
    data: {
      email,
      name,
      passwordHash: hash,
      roles: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`Created first admin: ${admin.email} (id=${admin.id})`);
  console.log('You can now log in at /admin/login with these credentials.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});