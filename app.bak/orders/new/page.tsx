'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';

interface Package {
  id: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  billingCycle: string;
}

function OrderForm({ token }: { token: string | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    packageId: searchParams.get('packageId') || '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((data) => {
        setPackages(data.packages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedPackage = packages.find((p) => p.id === formData.packageId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Please complete the security check');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          turnstileToken: token,
          totalCents: selectedPackage?.priceCents || 0,
          currency: 'NPR',
          selection: {
            [selectedPackage?.category.toLowerCase() || 'package']: {
              packageId: formData.packageId,
              name: selectedPackage?.name,
              priceCents: selectedPackage?.priceCents
            }
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit order');

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/orders/${data.orderId}`);
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-5 gap-12">
        {/* Form */}
        <div className="md:col-span-3">
          <h1 className="text-3xl font-bold text-ink mb-2">Start your project</h1>
          <p className="text-muted mb-8">Tell us about your business and we'll get started right away.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
                  placeholder="John Doe"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
                    placeholder="john@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
                    placeholder="+977 98..."
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Selected Package
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none appearance-none bg-surface"
                  value={formData.packageId}
                  onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                >
                  <option value="">Select a package...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — रू { (pkg.priceCents / 100).toLocaleString('ne-NP') }
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Project Details / Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none min-h-[120px]"
                  placeholder="Tell us a bit about your project goals..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Turnstile */}
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              data-callback="onTurnstileSuccess"
            ></div>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
            />
            <script dangerouslySetInnerHTML={{
              __html: `
                window.onTurnstileSuccess = function(token) {
                  const event = new CustomEvent('turnstile-success', { detail: token });
                  window.dispatchEvent(event);
                };
              `
            }} />

            {error && (
              <div className="p-4 bg-error-soft text-error rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Complete Order Submission'}
          </Button>
            <p className="text-center text-xs text-subtle mt-4">
              By submitting, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        {/* Sidebar / Summary */}
        <div className="md:col-span-2">
          <div className="bg-surface text-text rounded-3xl p-8 sticky top-8 border border-line">
            <h2 className="text-xl font-bold mb-6 text-text">Order Summary</h2>

            {selectedPackage ? (
              <div className="space-y-6">
                <div>
                  <div className="text-accent text-xs font-bold uppercase tracking-wider mb-1">Package</div>
                  <div className="text-lg font-semibold text-text">{selectedPackage.name}</div>
                  <div className="text-muted text-sm mt-1">{selectedPackage.description}</div>
                </div>

                <div className="pt-6 border-t border-line">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-accent text-xs font-bold uppercase tracking-wider mb-1">Price</div>
                      <div className="text-3xl font-bold text-text">रू {(selectedPackage.priceCents / 100).toLocaleString('ne-NP')}</div>
                    </div>
                    <div className="text-muted text-sm mb-1">{selectedPackage.billingCycle.replace('_', ' ')}</div>
                  </div>
                </div>

                {selectedPackage.category === 'WEBSITE_DESIGN' && (
                  <div className="bg-bg-elevated/50 rounded-2xl p-4 text-sm text-text-muted">
                    <div className="font-bold text-text mb-1">50% Advance Payment</div>
                    A 50% deposit (रू {(selectedPackage.priceCents / 200).toLocaleString('ne-NP')}) is required to start design projects.
                  </div>
                )}

                <div className="pt-6 border-t border-line space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Expert support included
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Cancel anytime
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted text-center py-12 border-2 border-dashed border-line rounded-2xl">
                Select a package to see summary
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderFormWrapper() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => setToken(e.detail);
    window.addEventListener('turnstile-success', handler);
    return () => window.removeEventListener('turnstile-success', handler);
  }, []);

  return <OrderForm token={token} />;
}

export default function OrderNewPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      }>
        <OrderFormWrapper />
      </Suspense>
    </Layout>
  );
}
