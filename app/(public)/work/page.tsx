import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'How We Work — Acme Web Studio',
};

export default function HowWeWorkPage() {
  return (
    <div className="page-container py-16 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Process</p>
      <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        How we design, host and run your website.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        One team, one accountable owner. Here is exactly what happens from the moment you request a package
        to the day your site is live.
      </p>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">1. Our process</h2>
        <ol className="mt-8 space-y-6">
          {[
            {
              step: 'Request a package',
              text: 'You pick a design package and optionally add hosting and DNS. Submit your details and any project notes.',
            },
            {
              step: 'Quote and advance payment',
              text: 'Our team scopes the work and sends a final quote. For design work, an advance payment is collected before build starts.',
            },
            {
              step: 'Design and build',
              text: 'We create the mockup, build the site, and iterate with you until it is exactly right.',
            },
            {
              step: 'Launch',
              text: 'We configure DNS, deploy to a secured container, and hand you access to your portal.',
            },
          ].map((item, i) => (
            <li key={item.step} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-ink">{item.step}</h3>
                <p className="mt-1 text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">2. How we host</h2>
        <p className="mt-3 max-w-3xl text-muted">
          Each client website runs in its own isolated container on our secured server. A reverse proxy handles
          automatic HTTPS, and we monitor uptime and resource use around the clock.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { t: 'Isolation', d: 'Your site cannot see or be affected by other clients.' },
            { t: 'Automatic HTTPS', d: 'All traffic is encrypted from day one.' },
            { t: 'Backups & monitoring', d: 'Regular backups and uptime monitoring keep you safe.' },
          ].map((c) => (
            <Card key={c.t}>
              <h3 className="font-semibold text-ink">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">3. How DNS works</h2>
        <p className="mt-3 max-w-3xl text-muted">
          We manage your domain DNS through our managed DNS provider. You point your nameservers to us once,
          and we manage the records. You can view and edit your records inside your portal.
        </p>
        <Card className="mt-6">
          <ol className="space-y-3 text-sm text-muted">
            <li>
              <strong className="text-ink">1.</strong> You update your domain nameservers to point to us.
            </li>
            <li>
              <strong className="text-ink">2.</strong> We create the required records (A, CNAME, MX, TXT).
            </li>
            <li>
              <strong className="text-ink">3.</strong> You review and manage records from your portal.
            </li>
          </ol>
        </Card>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">4. Client portal</h2>
        <p className="mt-3 max-w-3xl text-muted">After you activate your account, your portal shows:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          <li>Orders and project status.</li>
          <li>Invoices and payments.</li>
          <li>Subscriptions and renewal dates.</li>
          <li>The status of your website container.</li>
          <li>Your DNS records.</li>
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">5. Admin portal</h2>
        <p className="mt-3 max-w-3xl text-muted">
          Our team uses the admin portal to manage clients, orders and quotes, subscriptions and deployments.
          Every action is recorded in an audit log so nothing is ever lost.
        </p>
      </section>

      <div className="mt-16 text-center">
        <Link href="/order" className={buttonClasses({ size: 'lg' })}>
          Start an Order
        </Link>
      </div>
    </div>
  );
}
