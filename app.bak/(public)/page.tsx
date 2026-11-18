import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// Simple inline SVG icons - all same size and style
function CheckCircleIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GlobeIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function DnsIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.827 12.176a17.66 17.66 0 015.82 0c.46.257.957.333 1.36.11 1.2-.667 2.105-2.014 2.105-3.428 0-1.761-1.173-2.708-2.703-3.276a28 28 0 00-5.59-.164A29.01 29.01 0 0012 2.5V.5M9.5 15h5a.5.5 0 010 1h-5a.5.5 0 010-1zm0-3h5a.5.5 0 010 1h-5a.5.5 0 010-1zm0-3h5a.5.5 0 010 1h-5a.5.5 0 010-1z" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function UsersIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function TeamIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let packages: Array<{ id: string; name: string; category: string; description: string; priceCents: number }> = [];
  try {
    packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { priceCents: 'asc' }],
    });
  } catch (e) {
    console.warn('DB query failed on homepage render:', e);
  }

  const design = packages.filter((p) => p.category === 'WEBSITE_DESIGN');

  return (
    <>
      {/* Hero Section - Dark gradient */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="page-container py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
              We design, build and host your website — in one team.
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100 leading-relaxed">
              Website design, hosting and managed DNS handled by the same accountable team.
              From the first mockup to 24/7 support.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up delay-200">
              <Link
                href="/order"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-accent/25"
              >
                Get Started
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border-2 border-slate-600 text-slate-300 font-semibold px-8 py-4 rounded-xl hover:bg-slate-800 hover:border-accent/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section - Dark background */}
      <section className="bg-slate-900 py-20 lg:py-28">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-heading animate-fade-in-up">What We Do</h2>
            <p className="section-subtitle animate-fade-in-up delay-100 text-center">
              We provide all the digital services you need to establish and grow your online presence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Website Design */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all duration-300 card-lift animate-fade-in-up delay-100 group">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/40 transition-colors">
                <CheckCircleIcon className="text-accent group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">Website Design</h3>
              <p className="text-slate-400 text-base leading-relaxed text-center">
                One-time projects from simple landing pages to full web apps. Custom design built for your brand.
              </p>
            </div>

            {/* Hosting */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all duration-300 card-lift animate-fade-in-up delay-200 group">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/40 transition-colors">
                <GlobeIcon className="text-emerald-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">Hosting</h3>
              <p className="text-slate-400 text-base leading-relaxed text-center">
                Containerized hosting in reputable datacenters with resource limits, automatic HTTPS and backups.
              </p>
            </div>

            {/* DNS Management - Fixed icon */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all duration-300 card-lift animate-fade-in-up delay-300 group">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/40 transition-colors">
                <DnsIcon className="text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">DNS Management</h3>
              <p className="text-slate-400 text-base leading-relaxed text-center">
                Managed DNS through Cloudflare. Add or edit records from your portal with validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section - Dark background */}
      <section className="bg-slate-950">
        <div className="page-container py-20 lg:py-28">
          <div className="text-center mb-16">
            <h2 className="section-heading animate-fade-in-up">Why Choose Us</h2>
            <p className="section-subtitle animate-fade-in-up delay-100 text-center">
              We combine expertise, reliability, and unmatched local support to deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Secure Hosting */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up delay-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldIcon className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white mb-2">Secure Hosting</h3>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Isolated containers, automatic HTTPS and regular backups keep your site safe and online 24/7.
                  </p>
                </div>
              </div>
            </div>

            {/* Nepal-based Support */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up delay-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <UsersIcon className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white mb-2">Nepal-based Support</h3>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Reach us in Kathmandu during office hours. We speak English and Nepali fluently.
                  </p>
                </div>
              </div>
            </div>

            {/* One Team */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up delay-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
                  <TeamIcon className="text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white mb-2">One Team</h3>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Design, hosting and DNS handled by the same team, so nothing falls through the cracks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Dark background */}
      <section className="bg-slate-950">
        <div className="page-container py-20 lg:py-28 text-center">
          <h2 className="section-heading animate-fade-in-up">Ready to Get Started?</h2>
          <p className="section-subtitle animate-fade-in-up delay-100 max-w-2xl mx-auto">
            Request a package and our team will contact you with a detailed quote within 4 business hours.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-up delay-200">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Browse Pricing
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 font-bold border-2 border-slate-700 px-8 py-4 rounded-xl hover:bg-slate-700 hover:border-accent/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}