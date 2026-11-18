/**
 * Single source of truth for packages, pricing, and features.
 * Used by /pricing (view-only), /order (interactive), and /api/orders (server validation).
 * All prices in PAISA (smallest NPR unit). 1 NPR = 100 paisa.
 */

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
export type ServiceCategory = 'WEBSITE_DESIGN' | 'HOSTING' | 'DNS' | 'BUNDLE';

export interface PackageFeature {
  label: string;
  included: boolean;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  priceCentsMonthly: number; // in paisa/month
  priceCentsYearly: number;  // in paisa/month (already discounted)
  applicableTo: ServiceCategory[]; // which services this addon applies to
}

export interface PackageConfig {
  id: string;
  slug: string;              // URL-friendly identifier
  name: string;
  category: ServiceCategory;
  description: string;
  shortDescription: string;
  priceCents: number;        // base price in paisa
  billingCycle: BillingCycle;
  features: PackageFeature[];
  isPopular: boolean;
  // For hosting: resource limits
  ramMb?: number;
  cpuCores?: number;
  storageMb?: number;
  // For bundles: which sub-packages are included
  includes?: string[]; // slugs of included packages
}

// ─── Website Design Packages ───
export const designPackages: PackageConfig[] = [
  {
    id: 'design-starter',
    slug: 'design-starter',
    name: 'Starter Website',
    category: 'WEBSITE_DESIGN',
    description: 'Perfect for small businesses and personal brands needing a professional online presence.',
    shortDescription: 'Up to 5 pages, responsive design, basic SEO',
    priceCents: 5000000, // 50,000 NPR
    billingCycle: 'ONE_TIME',
    isPopular: false,
    features: [
      { label: 'Up to 5 pages', included: true },
      { label: 'Responsive design (mobile/tablet/desktop)', included: true },
      { label: 'Basic on-page SEO setup', included: true },
      { label: 'Contact form', included: true },
      { label: 'Google Analytics integration', included: true },
      { label: 'CMS (WordPress/Static)', included: true },
      { label: '2 rounds of revisions', included: true },
      { label: 'E-commerce functionality', included: false },
      { label: 'Custom animations/interactions', included: false },
      { label: 'Priority support (30 days)', included: false },
    ],
  },
  {
    id: 'design-professional',
    slug: 'design-professional',
    name: 'Professional Website',
    category: 'WEBSITE_DESIGN',
    description: 'Ideal for growing businesses needing a custom, conversion-focused website.',
    shortDescription: 'Up to 15 pages, custom design, advanced SEO, blog',
    priceCents: 12000000, // 1,20,000 NPR
    billingCycle: 'ONE_TIME',
    isPopular: true,
    features: [
      { label: 'Up to 15 pages', included: true },
      { label: 'Fully custom design (no templates)', included: true },
      { label: 'Advanced on-page SEO', included: true },
      { label: 'Blog/News section with CMS', included: true },
      { label: 'Contact & quote forms', included: true },
      { label: 'Google Analytics + Search Console', included: true },
      { label: 'CMS (WordPress/Headless)', included: true },
      { label: '3 rounds of revisions', included: true },
      { label: 'Basic e-commerce (up to 20 products)', included: true },
      { label: 'Custom animations/interactions', included: true },
      { label: 'Priority support (60 days)', included: true },
      { label: 'Multi-language support', included: false },
    ],
  },
  {
    id: 'design-enterprise',
    slug: 'design-enterprise',
    name: 'Enterprise Website',
    category: 'WEBSITE_DESIGN',
    description: 'For large organizations requiring complex functionality, integrations, and scale.',
    shortDescription: 'Unlimited pages, custom modules, integrations, multi-language',
    priceCents: 25000000, // 2,50,000 NPR
    billingCycle: 'ONE_TIME',
    isPopular: false,
    features: [
      { label: 'Unlimited pages', included: true },
      { label: 'Fully custom architecture', included: true },
      { label: 'Advanced SEO & schema markup', included: true },
      { label: 'Blog/News/Knowledge base', included: true },
      { label: 'Complex forms & workflows', included: true },
      { label: 'Full analytics setup', included: true },
      { label: 'Headless CMS or custom admin', included: true },
      { label: 'Unlimited revisions (reasonable)', included: true },
      { label: 'Full e-commerce (unlimited products)', included: true },
      { label: 'Advanced animations/interactions', included: true },
      { label: 'Priority support (90 days)', included: true },
      { label: 'Multi-language (i18n)', included: true },
      { label: 'Third-party API integrations', included: true },
      { label: 'SSO / Custom auth', included: true },
      { label: 'Performance optimization audit', included: true },
    ],
  },
];

// ─── Hosting Packages ───
export const hostingPackages: PackageConfig[] = [
  {
    id: 'hosting-starter',
    slug: 'hosting-starter',
    name: 'Starter Hosting',
    category: 'HOSTING',
    description: 'Perfect for small websites and landing pages with light traffic.',
    shortDescription: '1 GB RAM, 1 vCPU, 10 GB SSD, 100 GB bandwidth',
    priceCents: 50000, // 500 NPR/month
    billingCycle: 'MONTHLY',
    isPopular: false,
    ramMb: 1024,
    cpuCores: 1,
    storageMb: 10240,
    features: [
      { label: '1 GB RAM / 1 vCPU', included: true },
      { label: '10 GB NVMe SSD storage', included: true },
      { label: '100 GB monthly bandwidth', included: true },
      { label: 'Free SSL (Let\'s Encrypt)', included: true },
      { label: 'Daily automated backups', included: true },
      { label: 'DDoS protection', included: true },
      { label: 'Staging environment', included: false },
      { label: 'Priority support', included: false },
      { label: 'Managed updates', included: false },
      { label: 'Custom Docker images', included: false },
    ],
  },
  {
    id: 'hosting-business',
    slug: 'hosting-business',
    name: 'Business Hosting',
    category: 'HOSTING',
    description: 'Best for business websites, e-commerce, and moderate traffic applications.',
    shortDescription: '4 GB RAM, 2 vCPU, 50 GB SSD, 500 GB bandwidth',
    priceCents: 150000, // 1,500 NPR/month
    billingCycle: 'MONTHLY',
    isPopular: true,
    ramMb: 4096,
    cpuCores: 2,
    storageMb: 51200,
    features: [
      { label: '4 GB RAM / 2 vCPU', included: true },
      { label: '50 GB NVMe SSD storage', included: true },
      { label: '500 GB monthly bandwidth', included: true },
      { label: 'Free SSL (Let\'s Encrypt)', included: true },
      { label: 'Daily automated backups (7-day retention)', included: true },
      { label: 'DDoS protection', included: true },
      { label: 'Staging environment', included: true },
      { label: 'Priority support (business hours)', included: true },
      { label: 'Managed WordPress/core updates', included: true },
      { label: 'Custom Docker images', included: true },
      { label: 'Redis caching', included: true },
      { label: 'CDN integration', included: false },
    ],
  },
  {
    id: 'hosting-scale',
    slug: 'hosting-scale',
    name: 'Scale Hosting',
    category: 'HOSTING',
    description: 'For high-traffic applications, large e-commerce, and mission-critical sites.',
    shortDescription: '8 GB RAM, 4 vCPU, 150 GB SSD, 2 TB bandwidth',
    priceCents: 400000, // 4,000 NPR/month
    billingCycle: 'MONTHLY',
    isPopular: false,
    ramMb: 8192,
    cpuCores: 4,
    storageMb: 153600,
    features: [
      { label: '8 GB RAM / 4 vCPU', included: true },
      { label: '150 GB NVMe SSD storage', included: true },
      { label: '2 TB monthly bandwidth', included: true },
      { label: 'Free SSL + Wildcard option', included: true },
      { label: 'Hourly backups (30-day retention)', included: true },
      { label: 'Advanced DDoS protection', included: true },
      { label: 'Multiple staging environments', included: true },
      { label: '24/7 Priority support', included: true },
      { label: 'Fully managed (OS, stack, app)', included: true },
      { label: 'Custom Docker images & registries', included: true },
      { label: 'Redis + Memcached', included: true },
      { label: 'Enterprise CDN included', included: true },
      { label: 'Load balancing ready', included: true },
      { label: 'SLA guarantee (99.9%)', included: true },
    ],
  },
];

// ─── DNS Packages ───
export const dnsPackages: PackageConfig[] = [
  {
    id: 'dns-basic',
    slug: 'dns-basic',
    name: 'Basic DNS',
    category: 'DNS',
    description: 'Essential DNS management for domains pointing to our hosting or external providers.',
    shortDescription: 'Up to 10 records, Cloudflare proxy, email forwarding',
    priceCents: 50000, // 500 NPR/year
    billingCycle: 'YEARLY',
    isPopular: false,
    features: [
      { label: 'Up to 10 DNS records', included: true },
      { label: 'Cloudflare proxy (orange cloud)', included: true },
      { label: 'Email forwarding (up to 5 aliases)', included: true },
      { label: 'DNSSEC support', included: true },
      { label: 'API access', included: false },
      { label: 'Load balancing / failover', included: false },
      { label: 'Advanced DDoS protection', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'dns-pro',
    slug: 'dns-pro',
    name: 'Pro DNS',
    category: 'DNS',
    description: 'Advanced DNS for businesses needing reliability, performance, and automation.',
    shortDescription: 'Unlimited records, API, load balancing, analytics',
    priceCents: 150000, // 1,500 NPR/year
    billingCycle: 'YEARLY',
    isPopular: true,
    features: [
      { label: 'Unlimited DNS records', included: true },
      { label: 'Cloudflare proxy + WAF', included: true },
      { label: 'Email forwarding (unlimited)', included: true },
      { label: 'DNSSEC + DANE/TLSA', included: true },
      { label: 'Full API access (Terraform, CI/CD)', included: true },
      { label: 'Load balancing & failover', included: true },
      { label: 'Advanced DDoS protection', included: true },
      { label: 'Analytics & traffic insights', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom nameservers (vanity)', included: true },
    ],
  },
];

// ─── Bundle Packages ───
export const bundlePackages: PackageConfig[] = [
  {
    id: 'bundle-launch',
    slug: 'bundle-launch',
    name: 'Launch Bundle',
    category: 'BUNDLE',
    description: 'Everything to launch your business online: design + hosting + DNS.',
    shortDescription: 'Starter Website + Starter Hosting + Basic DNS',
    priceCents: 5550000, // 55,500 NPR (one-time design + 1 year hosting+DNS)
    billingCycle: 'ONE_TIME',
    isPopular: true,
    includes: ['design-starter', 'hosting-starter', 'dns-basic'],
    features: [
      { label: 'Starter Website (5 pages)', included: true },
      { label: 'Starter Hosting (1 year)', included: true },
      { label: 'Basic DNS (1 year)', included: true },
      { label: 'Free domain registration (.com/.np)', included: true },
      { label: 'Email accounts (5)', included: true },
      { label: 'SSL certificate', included: true },
      { label: '30 days support', included: true },
      { label: 'Migration assistance', included: false },
    ],
  },
  {
    id: 'bundle-growth',
    slug: 'bundle-growth',
    name: 'Growth Bundle',
    category: 'BUNDLE',
    description: 'Scale your online presence: professional design + business hosting + pro DNS.',
    shortDescription: 'Professional Website + Business Hosting + Pro DNS',
    priceCents: 14000000, // 1,40,000 NPR (one-time design + 1 year hosting+DNS)
    billingCycle: 'ONE_TIME',
    isPopular: false,
    includes: ['design-professional', 'hosting-business', 'dns-pro'],
    features: [
      { label: 'Professional Website (15 pages)', included: true },
      { label: 'Business Hosting (1 year)', included: true },
      { label: 'Pro DNS (1 year)', included: true },
      { label: 'Free domain registration (.com/.np)', included: true },
      { label: 'Email accounts (25)', included: true },
      { label: 'Wildcard SSL certificate', included: true },
      { label: '60 days priority support', included: true },
      { label: 'Free migration from existing host', included: true },
      { label: 'Performance optimization', included: true },
      { label: 'Staging environment', included: true },
    ],
  },
];

// ─── Add-ons ───
export const addons: Addon[] = [
  {
    id: 'extra-storage',
    name: 'Extra Storage',
    description: 'Additional NVMe SSD storage for your hosting container',
    priceCentsMonthly: 10000,  // 100 NPR/month per 10GB
    priceCentsYearly: 100000,  // 1,000 NPR/year per 10GB (17% off)
    applicableTo: ['HOSTING', 'BUNDLE'],
  },
  {
    id: 'extra-database',
    name: 'Managed Database',
    description: 'Managed PostgreSQL/MySQL/MongoDB instance with backups',
    priceCentsMonthly: 50000,  // 500 NPR/month
    priceCentsYearly: 500000,  // 5,000 NPR/year (17% off)
    applicableTo: ['HOSTING', 'BUNDLE'],
  },
  {
    id: 'ssl-wildcard',
    name: 'Wildcard SSL',
    description: 'Wildcard SSL certificate for unlimited subdomains',
    priceCentsMonthly: 25000,  // 250 NPR/month
    priceCentsYearly: 250000,  // 2,500 NPR/year (17% off)
    applicableTo: ['HOSTING', 'BUNDLE', 'DNS'],
  },
  {
    id: 'email-hosting',
    name: 'Business Email',
    description: 'Professional email hosting with 50GB mailbox per user',
    priceCentsMonthly: 5000,   // 50 NPR/month per account
    priceCentsYearly: 50000,   // 500 NPR/year per account (17% off)
    applicableTo: ['HOSTING', 'BUNDLE', 'DNS'],
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: '24/7 priority support with 1-hour response SLA',
    priceCentsMonthly: 100000, // 1,000 NPR/month
    priceCentsYearly: 1000000, // 10,000 NPR/year (17% off)
    applicableTo: ['WEBSITE_DESIGN', 'HOSTING', 'BUNDLE'],
  },
  {
    id: 'cdn-enterprise',
    name: 'Enterprise CDN',
    description: 'Global CDN with edge caching, image optimization, WAF',
    priceCentsMonthly: 50000,  // 500 NPR/month
    priceCentsYearly: 500000,  // 5,000 NPR/year (17% off)
    applicableTo: ['HOSTING', 'BUNDLE'],
  },
  {
    id: 'migration-service',
    name: 'Website Migration',
    description: 'Full migration from your current host (files, DB, DNS, testing)',
    priceCentsMonthly: 0,      // One-time only
    priceCentsYearly: 0,       // One-time only
    applicableTo: ['HOSTING', 'BUNDLE'],
  },
];

// ─── All packages combined ───
export const allPackages: PackageConfig[] = [
  ...designPackages,
  ...hostingPackages,
  ...dnsPackages,
  ...bundlePackages,
];

// ─── Helper functions ───

export function getPackageBySlug(slug: string): PackageConfig | undefined {
  return allPackages.find((p) => p.slug === slug);
}

export function getPackagesByCategory(category: ServiceCategory): PackageConfig[] {
  return allPackages.filter((p) => p.category === category);
}

export function getPopularPackages(): PackageConfig[] {
  return allPackages.filter((p) => p.isPopular);
}

/**
 * Calculate price for a package with billing cycle and add-ons.
 * Returns price in PAISA.
 */
export function calculatePackagePrice(
  pkg: PackageConfig,
  cycle: BillingCycle = 'MONTHLY',
  selectedAddons: string[] = []
): { subtotal: number; addonTotal: number; total: number; discount: number } {
  let basePrice = pkg.priceCents;

  // For hosting/DNS, adjust for yearly billing
  if (pkg.billingCycle === 'MONTHLY' && cycle === 'YEARLY') {
    basePrice = Math.round(pkg.priceCents * 12 * 0.83); // 17% yearly discount
  } else if (pkg.billingCycle === 'YEARLY' && cycle === 'MONTHLY') {
    basePrice = Math.round(pkg.priceCents / 12 * 1.2); // Monthly premium
  }
  // ONE_TIME packages ignore cycle

  // Add-ons (only for MONTHLY/YEARLY cycles)
  let addonTotal = 0;
  for (const addonId of selectedAddons) {
    const addon = addons.find((a) => a.id === addonId);
    if (addon && addon.applicableTo.includes(pkg.category)) {
      addonTotal += cycle === 'YEARLY' ? addon.priceCentsYearly : addon.priceCentsMonthly;
    }
  }

  const subtotal = basePrice;
  const total = subtotal + addonTotal;
  const discount = cycle === 'YEARLY' && pkg.billingCycle === 'MONTHLY'
    ? Math.round(pkg.priceCents * 12 * 0.17)
    : 0;

  return { subtotal, addonTotal, total, discount };
}

/**
 * Format paisa as NPR string (e.g., 5000000 -> "रू 50,000")
 */
export function formatPaisa(paisa: number): string {
  const rupees = Math.round(paisa) / 100;
  return `रू ${rupees.toLocaleString('ne-NP')}`;
}

/**
 * Get yearly price display for monthly packages
 */
export function getYearlyPrice(pkg: PackageConfig): number {
  if (pkg.billingCycle === 'MONTHLY') {
    return Math.round(pkg.priceCents * 12 * 0.83);
  }
  return pkg.priceCents;
}

/**
 * Get monthly equivalent for yearly packages
 */
export function getMonthlyEquivalent(pkg: PackageConfig): number {
  if (pkg.billingCycle === 'YEARLY') {
    return Math.round(pkg.priceCents / 12 * 1.2);
  }
  return pkg.priceCents;
}