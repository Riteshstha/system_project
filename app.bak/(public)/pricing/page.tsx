'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { allPackages, getPackagesByCategory, formatPaisa, getYearlyPrice, type PackageConfig, type BillingCycle } from '@/lib/packages';

export default function PricingPage() {
  const [packages, setPackages] = useState<PackageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((data) => {
        // Map DB packages to our config by slug/name
        const dbPackages = data.packages || [];
        const merged = allPackages.map((cfg) => {
          const db = dbPackages.find((p: any) => p.name === cfg.name && p.category === cfg.category);
          if (db) {
            return { ...cfg, priceCents: db.priceCents, billingCycle: db.billingCycle };
          }
          return cfg;
        });
        setPackages(merged);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to config if API fails
        setPackages(allPackages);
        setLoading(false);
      });
  }, []);

  const designPackages = getPackagesByCategory('WEBSITE_DESIGN');
  const hostingPackages = getPackagesByCategory('HOSTING');
  const dnsPackages = getPackagesByCategory('DNS');
  const bundlePackages = getPackagesByCategory('BUNDLE');

  function getDisplayPrice(pkg: PackageConfig): number {
    if (pkg.billingCycle === 'ONE_TIME') return pkg.priceCents;
    if (pkg.billingCycle === 'MONTHLY' && billingCycle === 'YEARLY') return getYearlyPrice(pkg);
    if (pkg.billingCycle === 'YEARLY' && billingCycle === 'MONTHLY') return Math.round(pkg.priceCents / 12 * 1.2);
    return pkg.priceCents;
  }

  function getBillingLabel(pkg: PackageConfig): string {
    if (pkg.billingCycle === 'ONE_TIME') return 'One-time';
    return billingCycle === 'YEARLY' ? '/year' : '/month';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ink via-ink to-ink text-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in-up">
            Transparent Pricing
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto animate-fade-in-up delay-100">
            No hidden fees. Clear prices for every service we offer. Pay monthly or save 17% yearly.
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in-up delay-200">
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${billingCycle === 'MONTHLY' ? 'text-accent' : 'text-subtle'}`}>
            Monthly
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={billingCycle === 'YEARLY'}
              onChange={(e) => setBillingCycle(e.target.checked ? 'YEARLY' : 'MONTHLY')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-line peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ink"></div>
          </label>
          <span className={`text-sm font-medium ${billingCycle === 'YEARLY' ? 'text-accent' : 'text-subtle'}`}>
            Yearly <span className="text-success font-semibold ml-1">Save 17%</span>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* 1. Website Design */}
        <section className="mb-20 animate-fade-in-up delay-300">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink">1. Website Design & Development</h2>
            <p className="text-muted mt-2">One-time payment. Custom-built for your business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {designPackages.map((pkg) => (
              <PackageCard
                key={pkg.slug}
                pkg={pkg}
                displayPrice={getDisplayPrice(pkg)}
                billingLabel={getBillingLabel(pkg)}
              />
            ))}
          </div>
        </section>

        {/* 2. Website Hosting */}
        <section className="mb-20 animate-fade-in-up delay-400">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink">2. Website Hosting</h2>
            <p className="text-muted mt-2">Recurring payment. Managed Docker container hosting.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {hostingPackages.map((pkg) => (
              <PackageCard
                key={pkg.slug}
                pkg={pkg}
                displayPrice={getDisplayPrice(pkg)}
                billingLabel={getBillingLabel(pkg)}
              />
            ))}
          </div>
        </section>

        {/* 3. DNS Service */}
        <section className="mb-20 animate-fade-in-up delay-500">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink">3. DNS Service</h2>
            <p className="text-muted mt-2">Recurring payment. Managed DNS through Cloudflare.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {dnsPackages.map((pkg) => (
              <PackageCard
                key={pkg.slug}
                pkg={pkg}
                displayPrice={getDisplayPrice(pkg)}
                billingLabel={getBillingLabel(pkg)}
              />
            ))}
          </div>
        </section>

        {/* 4. Bundles */}
        <section className="mb-20 animate-fade-in-up delay-600">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink">4. Complete Bundles</h2>
            <p className="text-muted mt-2">Best value — design, hosting & DNS together.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {bundlePackages.map((pkg) => (
              <PackageCard
                key={pkg.slug}
                pkg={pkg}
                displayPrice={getDisplayPrice(pkg)}
                billingLabel={getBillingLabel(pkg)}
              />
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-20 animate-fade-in-up delay-700">
          <h2 className="text-3xl font-bold text-ink mb-8 text-center">Compare Plans</h2>
          <ComparisonTable packages={packages} />
        </section>

        {/* FAQ */}
        <section className="mb-20 animate-fade-in-up delay-800">
          <h2 className="text-3xl font-bold text-ink mb-8 text-center">Frequently Asked Questions</h2>
          <FAQ />
        </section>
      </div>
    </div>
  );
}

// ─── Package Card Component ───
interface PackageCardProps {
  pkg: PackageConfig;
  displayPrice: number;
  billingLabel: string;
}

function PackageCard({ pkg, displayPrice, billingLabel }: PackageCardProps) {
  return (
    <div
      className={`bg-surface rounded-2xl border border-line shadow-sm hover:shadow-md  transition-all duration-300 p-8 relative ${
        pkg.isPopular ? 'border-accent ring-2 ring-accent/20' : ''
      }`}
    >
      {pkg.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-ink text-white text-xs font-bold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-ink mb-2">{pkg.name}</h3>
      <div className="text-4xl font-bold text-accent my-4">
        {formatPaisa(displayPrice)}
      </div>
      <p className="text-muted text-sm mb-4 leading-relaxed">{pkg.shortDescription}</p>
      <ul className="space-y-3 mb-6">
        {pkg.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-muted">
            <span className={`flex-shrink-0 w-5 h-5 ${feature.included ? 'text-success' : 'text-white/60'}`}>
              {feature.included ? (
                <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              )}
            </span>
            <span className={feature.included ? 'text-ink' : 'text-subtle line-through'}>{feature.label}</span>
          </li>
        ))}
      </ul>
      <div className="pt-4 border-t border-line">
        <span className="text-xs font-medium text-accent uppercase">{billingLabel}</span>
      </div>
    </div>
  );
}

// ─── Comparison Table ───
function ComparisonTable({ packages }: { packages: PackageConfig[] }) {
  const design = packages.filter(p => p.category === 'WEBSITE_DESIGN');
  const hosting = packages.filter(p => p.category === 'HOSTING');
  const dns = packages.filter(p => p.category === 'DNS');

  const rows = [
    { label: 'Pages included', design: ['Up to 5', 'Up to 15', 'Unlimited'], hosting: ['—', '—', '—'], dns: ['—', '—'] },
    { label: 'Custom design', design: ['✓', '✓ (fully custom)', '✓ (fully custom)'], hosting: ['—', '—', '—'], dns: ['—', '—'] },
    { label: 'CMS included', design: ['✓', '✓', '✓ (headless/custom)'], hosting: ['—', '—', '—'], dns: ['—', '—'] },
    { label: 'Revisions', design: ['2 rounds', '3 rounds', 'Unlimited (reasonable)'], hosting: ['—', '—', '—'], dns: ['—', '—'] },
    { label: 'E-commerce', design: ['✗', 'Basic (20 products)', 'Full (unlimited)'], hosting: ['✗', '✗', '✗'], dns: ['✗', '✗'] },
    { label: 'RAM', design: ['—', '—', '—'], hosting: ['1 GB', '4 GB', '8 GB'], dns: ['—', '—'] },
    { label: 'Storage', design: ['—', '—', '—'], hosting: ['10 GB NVMe', '50 GB NVMe', '150 GB NVMe'], dns: ['—', '—'] },
    { label: 'Bandwidth', design: ['—', '—', '—'], hosting: ['100 GB', '500 GB', '2 TB'], dns: ['—', '—'] },
    { label: 'Backups', design: ['—', '—', '—'], hosting: ['Daily (7-day)', 'Daily (7-day)', 'Hourly (30-day)'], dns: ['—', '—'] },
    { label: 'Staging', design: ['✗', '✗', '✗'], hosting: ['✗', '✓', 'Multiple'], dns: ['✗', '✗'] },
    { label: 'DNS records', design: ['—', '—', '—'], hosting: ['—', '—', '—'], dns: ['Up to 10', 'Unlimited'] },
    { label: 'Cloudflare proxy', design: ['—', '—', '—'], hosting: ['—', '—', '—'], dns: ['✓', '✓ + WAF'] },
    { label: 'API access', design: ['—', '—', '—'], hosting: ['—', '—', '—'], dns: ['✗', '✓'] },
    { label: 'Priority support', design: ['30 days', '60 days', '90 days'], hosting: ['✗', 'Business hours', '24/7'], dns: ['✗', '✓'] },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-canvas border-b border-line">
            <th className="text-left p-4 font-bold text-ink sticky left-0 bg-canvas z-10">Feature</th>
            {design.map((pkg) => (
              <th key={pkg.slug} className={`p-4 font-semibold text-ink text-center ${pkg.isPopular ? 'bg-accent-soft' : ''}`}>
                {pkg.name}
              </th>
            ))}
            {hosting.map((pkg) => (
              <th key={pkg.slug} className={`p-4 font-semibold text-ink text-center ${pkg.isPopular ? 'bg-accent-soft' : ''}`}>
                {pkg.name}
              </th>
            ))}
            {dns.map((pkg) => (
              <th key={pkg.slug} className={`p-4 font-semibold text-ink text-center ${pkg.isPopular ? 'bg-accent-soft' : ''}`}>
                {pkg.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-surface' : 'bg-canvas'}>
              <td className="p-4 font-medium text-ink sticky left-0 bg-inherit z-10">{row.label}</td>
              {row.design.map((val, j) => (
                <td key={j} className="p-4 text-center text-muted">{val}</td>
              ))}
              {row.hosting.map((val, j) => (
                <td key={j} className="p-4 text-center text-muted">{val}</td>
              ))}
              {row.dns.map((val, j) => (
                <td key={j} className="p-4 text-center text-muted">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── FAQ Component ───
const faqItems = [
  {
    q: 'Can I upgrade or downgrade my plan later?',
    a: 'Yes, absolutely. You can upgrade your hosting plan at any time — we\'ll prorate the difference. For design packages, you can add features as add-ons. Downgrades are possible at renewal.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept eSewa, Khalti, bank transfer, and major credit cards (via Stripe for international clients). All prices are in NPR.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'For design packages, we offer a full refund before design work begins. For hosting/DNS, we offer a pro-rated refund for unused time if you cancel within 30 days.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Yes! You can bring your own domain, or we can register a new one for you (free .com/.np for the first year with bundles).',
  },
  {
    q: 'What happens after I place an order?',
    a: 'Our team reviews your order within 4 business hours, confirms the scope, and sends a detailed quote. For design projects, a 50% advance starts the work.',
  },
  {
    q: 'Do you provide ongoing maintenance?',
    a: 'Yes. Our hosting plans include managed updates. For design clients, we offer priority support add-ons (30/60/90 days included based on package).',
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqItems.map((item, i) => (
        <div
          key={i}
          className="bg-surface rounded-xl border border-line overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleItem(i)}
            className="w-full flex items-center justify-between p-5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
            aria-expanded={openIndex === i}
            aria-controls={`faq-answer-${i}`}
          >
            <span className="font-semibold text-ink pr-4">{item.q}</span>
            <svg
              className={`w-5 h-5 text-subtle flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            id={`faq-answer-${i}`}
            role="region"
            aria-labelledby={`faq-question-${i}`}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: openIndex === i ? '500px' : '0',
              opacity: openIndex === i ? 1 : 0,
              paddingLeft: openIndex === i ? '1.25rem' : '1.25rem',
              paddingRight: openIndex === i ? '1.25rem' : '1.25rem',
              paddingBottom: openIndex === i ? '1.25rem' : '0',
            }}
          >
            <p className="text-muted leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}