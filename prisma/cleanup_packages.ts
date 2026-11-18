import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete old duplicate packages (short names that don't match new naming)
  const oldNames = ['Basic', 'Business', 'Custom', 'DNS Add-on', 'Pro', 'Standard', 'Starter'];
  for (const name of oldNames) {
    const pkg = await prisma.package.findFirst({ where: { name } });
    if (pkg) {
      await prisma.package.delete({ where: { id: pkg.id } });
      console.log(`Deleted: ${pkg.name} (${pkg.category})`);
    }
  }

  const remaining = await prisma.package.findMany({ where: { slug: { not: null } } });
  console.log(`\nRemaining packages: ${remaining.length}`);
  remaining.forEach(p => console.log(`  ${p.name} (${p.category}) - slug: ${p.slug}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());