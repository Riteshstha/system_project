// TODO: Add seed data for portal app
// You might want to run this after generating Prisma client

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding portal app...');

  // Create an admin user if not exists
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.client.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    await prisma.client.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        phone: '+1234567890',
        passwordHash: hashedPassword,
        roles: 'ADMIN',
        status: 'ACTIVE',
        mfaEnabled: false,
      },
    });
    console.log('Created admin user:', adminEmail);
  }

  // Create a regular client user if not exists
  const clientEmail = 'client@example.com';
  const existingClient = await prisma.client.findUnique({
    where: { email: clientEmail },
  });

  if (!existingClient) {
    const hashedPassword = await bcrypt.hash('default@321', 10);
    await prisma.client.create({
      data: {
        email: clientEmail,
        name: 'Client User',
        phone: '+1234567891',
        passwordHash: hashedPassword,
        roles: 'CLIENT',
        status: 'ACTIVE',
        mfaEnabled: false,
      },
    });
    console.log('Created client user:', clientEmail);
  }

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });