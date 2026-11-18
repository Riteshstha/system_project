'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { contactConfig } from '@/lib/contact';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';

const nav = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/work', label: 'Work' },
  { href: '/contact', label: 'Contact' },
];

// Portal URL from env (defaults to localhost:3200)
const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://acmewebportal.duckdns.org';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOrderPage = pathname === '/order';
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
            Acme<span className="text-accent">.</span>Web
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-ink',
                  pathname === item.href && 'text-ink',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <a
              href={`${portalUrl}/login`}
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              Enter Portal
            </a>
            <Link
              href="/order"
              className={buttonClasses({ variant: 'primary', size: 'sm', className: isOrderPage ? 'opacity-90' : '' })}
            >
              Start an Order
            </Link>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Menu</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="mobile-menu" role="dialog" aria-modal aria-label="Mobile menu">
          <button type="button" className="absolute inset-0" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="mobile-menu-panel">
            <div className="mb-8 flex items-center justify-between">
              <p className="font-display font-semibold">Menu</p>
              <button type="button" onClick={() => setOpen(false)} className="text-muted" aria-label="Close menu">
                Close
              </button>
            </div>
            <nav className="flex flex-col gap-4 text-base font-medium">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="text-ink">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-2">
              <a
                href={`${portalUrl}/login`}
                className={buttonClasses({ variant: 'secondary' })}
                onClick={() => setOpen(false)}
              >
                Enter Portal
              </a>
              <Link href="/order" className={buttonClasses({ variant: 'primary' })} onClick={() => setOpen(false)}>
                Start an Order
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t border-line bg-surface text-text">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold">
              Acme<span className="text-accent">.</span>Web
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Website design, hosting, and managed DNS from one team in {contactConfig.company.city}.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Product</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <Link href="/pricing" className="hover:text-text">
                Pricing
              </Link>
              <Link href="/order" className="hover:text-text">
                Start an Order
              </Link>
              <Link href="/work" className="hover:text-text">
                How we work
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Company</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <Link href="/contact" className="hover:text-text">
                Contact
              </Link>
              <a href={`mailto:${contactConfig.company.email}`} className="hover:text-text">
                {contactConfig.company.email}
              </a>
              <p>
                {contactConfig.company.address}, {contactConfig.company.city}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Legal</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <Link href="/terms" className="hover:text-text">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-text">
                Privacy
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-subtle">
            © {new Date().getFullYear()} Acme Web Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}