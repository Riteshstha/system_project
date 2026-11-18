import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Prices are stored in the smallest currency unit (paisa for NPR).
// E.g. Rs 1,500.00 = 150000 paisa.
const packages = [
  // ---- Website design (one-time) ----
  {
    slug: 'design-starter',
    name: 'Starter Website',
    category: 'WEBSITE_DESIGN',
    description: 'Perfect for small businesses and personal brands needing a professional online presence.',
    priceCents: 5000000, // Rs 50,000.00
    billingCycle: 'ONE_TIME',
    active: true,
  },
  {
    slug: 'design-professional',
    name: 'Professional Website',
    category: 'WEBSITE_DESIGN',
    description: 'Ideal for growing businesses needing a custom, conversion-focused website.',
    priceCents: 12000000, // Rs 120,000.00
    billingCycle: 'ONE_TIME',
    active: true,
  },
  {
    slug: 'design-enterprise',
    name: 'Enterprise Website',
    category: 'WEBSITE_DESIGN',
    description: 'Fully bespoke site or web app. Quote confirmed by our team after scoping.',
    priceCents: 0, // confirmed per-project
    billingCycle: 'ONE_TIME',
    active: true,
  },
  // ---- Hosting (monthly) ----
  {
    slug: 'hosting-starter',
    name: 'Starter Hosting',
    category: 'HOSTING',
    description: 'Shared-style hosting for small sites. 1 vCPU, 512MB RAM, 10GB storage.',
    priceCents: 50000, // Rs 500/mo
    billingCycle: 'MONTHLY',
    ramMb: 512,
    cpuCores: 1,
    storageMb: 10240,
    dnsIncluded: false,
    active: true,
  },
  {
    slug: 'hosting-business',
    name: 'Business Hosting',
    category: 'HOSTING',
    description: 'Dedicated resources for growing sites. 2 vCPU, 2GB RAM, 50GB storage.',
    priceCents: 190000, // Rs 1,900/mo
    billingCycle: 'MONTHLY',
    ramMb: 2048,
    cpuCores: 2,
    storageMb: 51200,
    dnsIncluded: false,
    active: true,
  },
  {
    slug: 'hosting-scale',
    name: 'Scale Hosting',
    category: 'HOSTING',
    description: 'High-performance container hosting. 4 vCPU, 8GB RAM, 200GB storage, priority support.',
    priceCents: 390000, // Rs 3,900/mo
    billingCycle: 'MONTHLY',
    ramMb: 8192,
    cpuCores: 4,
    storageMb: 204800,
    dnsIncluded: true,
    active: true,
  },
  // ---- DNS (add-on, monthly) ----
  {
    slug: 'dns-basic',
    name: 'Basic DNS',
    category: 'DNS',
    description: 'Managed DNS via Cloudflare. Up to 10 records, Cloudflare proxy, email forwarding.',
    priceCents: 40000, // Rs 400/mo
    billingCycle: 'MONTHLY',
    ramMb: 0,
    cpuCores: 0,
    storageMb: 0,
    dnsIncluded: true,
    active: true,
  },
  {
    slug: 'dns-pro',
    name: 'Pro DNS',
    category: 'DNS',
    description: 'Unlimited DNS records, API access, load balancing, advanced analytics.',
    priceCents: 80000, // Rs 800/mo
    billingCycle: 'MONTHLY',
    ramMb: 0,
    cpuCores: 0,
    storageMb: 0,
    dnsIncluded: true,
    active: true,
  },
  // ---- Bundles (one-time) ----
  {
    slug: 'bundle-launch',
    name: 'Launch Bundle',
    category: 'BUNDLE',
    description: 'Everything to launch your business online: design + hosting + DNS.',
    priceCents: 5550000, // Rs 55,500.00
    billingCycle: 'ONE_TIME',
    active: true,
  },
  {
    slug: 'bundle-growth',
    name: 'Growth Bundle',
    category: 'BUNDLE',
    description: 'Scale your online presence: professional design + business hosting + pro DNS.',
    priceCents: 14000000, // Rs 140,000.00
    billingCycle: 'ONE_TIME',
    active: true,
  },
];

async function main() {
  for (const p of packages) {
    await prisma.package.upsert({
      where: { name_category: { name: p.name, category: p.category } },
      update: p,
      create: p,
    });
  }
  console.log('Seed complete:', packages.length, 'packages');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());