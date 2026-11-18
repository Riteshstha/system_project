import { Metadata } from 'next';
import Link from 'next/link';
import { contactConfig, getMailto, getTel, getWhatsApp } from '@/lib/contact';
import { Card } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Contact — Acme Web Studio',
};

export default function ContactPage() {
  return (
    <div className="page-container py-16 md:py-24">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Contact</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">Contact us</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Have a question or ready to start your project? Reach our team directly, or start an order online.
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Our team</h2>
          <div className="space-y-4">
            {contactConfig.team.map((member) => (
              <Card key={member.name} hover>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-lg font-semibold text-accent">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-ink">{member.name}</p>
                    <p className="mt-1 text-muted">{member.role}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <a href={getTel(member.phone)} className="text-ink hover:text-accent">
                        {member.phone}
                      </a>
                      <a href={getMailto(member.email)} className="text-ink hover:text-accent">
                        {member.email}
                      </a>
                      <a
                        href={getWhatsApp(member.phone, `Hi ${member.name.split(' ')[0]}, I'd like to discuss a project.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-success hover:underline"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-2xl font-semibold text-ink">Company</h2>
            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-medium text-ink">Address</dt>
                <dd className="mt-1 text-muted">
                  {contactConfig.company.address}, {contactConfig.company.city}, {contactConfig.company.country}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Working hours</dt>
                <dd className="mt-1 text-muted">{contactConfig.company.workingHours}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Email</dt>
                <dd className="mt-1">
                  <a href={getMailto(contactConfig.company.email)} className="text-muted hover:text-accent">
                    {contactConfig.company.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Phone</dt>
                <dd className="mt-1">
                  <a href={getTel(contactConfig.company.phone)} className="text-muted hover:text-accent">
                    {contactConfig.company.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </Card>

          {contactConfig.social && (
            <Card className="bg-surface border border-line">
              <h2 className="font-display text-lg font-semibold text-ink">Follow</h2>
              <div className="mt-4 flex gap-3">
                {contactConfig.social.linkedin && (
                  <a
                    href={contactConfig.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
                  >
                    LinkedIn
                  </a>
                )}
                {contactConfig.social.twitter && (
                  <a
                    href={contactConfig.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
                  >
                    X
                  </a>
                )}
                {contactConfig.social.github && (
                  <a
                    href={contactConfig.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </Card>
          )}

          <div className="rounded-lg bg-surface border border-line p-8 text-center text-text">
            <h2 className="font-display text-2xl font-semibold">Ready to start?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Place your order online. We’ll have a detailed quote ready within 4 business hours.
            </p>
            <Link href="/order" className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}>
              Start an Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
