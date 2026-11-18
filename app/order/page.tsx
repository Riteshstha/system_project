'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import {
  allPackages,
  addons,
  getPackageBySlug,
  type PackageConfig,
  type BillingCycle,
  type Addon,
} from '@/lib/packages';
import { getSession as getSessionClient, type Session } from '@/lib/session-client';

const STEPS = [
  { key: 'services', label: 'Services', icon: '📦' },
  { key: 'configure', label: 'Configure', icon: '⚙️' },
  { key: 'details', label: 'Your Details', icon: '👤' },
  { key: 'review', label: 'Review', icon: '✅' },
];

const STEP_ORDER: ('services' | 'configure' | 'details' | 'review')[] = ['services', 'configure', 'details', 'review'];

interface OrderState {
  // Step 1: Services
  selectedServices: string[]; // package slugs
  // Step 2: Configure
  billingCycle: BillingCycle;
  selectedAddons: string[]; // addon ids
  domainType: 'new' | 'existing' | 'none';
  domainName: string;
  currentHost: string; // for hosting migration
  // Step 3: Details
  fullName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  // Step 4: Terms
  termsAccepted: boolean;
}

const initialState: OrderState = {
  selectedServices: [],
  billingCycle: 'MONTHLY',
  selectedAddons: [],
  domainType: 'none',
  domainName: '',
  currentHost: '',
  fullName: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
  termsAccepted: false,
};

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<'services' | 'configure' | 'details' | 'review'>('services');
  const [order, setOrder] = useState<OrderState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Initialize from URL params and session
  useEffect(() => {
    const plan = searchParams.get('plan');
    const cycle = searchParams.get('cycle') as BillingCycle | null;

    // Load session
    getSessionClient().then(setSession).catch(() => {});

    if (plan) {
      const pkg = getPackageBySlug(plan);
      if (pkg) {
        setOrder((prev) => ({
          ...prev,
          selectedServices: [plan],
          billingCycle: cycle || (pkg.billingCycle === 'MONTHLY' ? 'MONTHLY' : 'YEARLY'),
          step: 'configure',
        }));
      }
    }
  }, [searchParams]);

  // Listen for Turnstile token
  useEffect(() => {
    const handler = (e: Event) => {
      const token = (e as CustomEvent).detail;
      setTurnstileToken(token);
    };
    window.addEventListener('turnstile-success', handler);
    return () => window.removeEventListener('turnstile-success', handler);
  }, []);

  // Step navigation
  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const goToStep = useCallback((targetStep: typeof step) => {
    const currentIndex = STEP_ORDER.indexOf(step);
    const targetIndex = STEP_ORDER.indexOf(targetStep);
    if (targetIndex <= currentIndex + 1) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Validation per step
  const validateStep = useCallback((targetStep: typeof step): boolean => {
    switch (targetStep) {
      case 'services':
        if (order.selectedServices.length === 0) {
          setError('Please select at least one service');
          return false;
        }
        break;
      case 'configure':
        if (order.domainType === 'new' && !order.domainName.trim()) {
          setError('Please enter a domain name');
          return false;
        }
        if (order.domainType === 'existing' && !order.domainName.trim()) {
          setError('Please enter your existing domain name');
          return false;
        }
        if (order.selectedServices.some(s => getPackageBySlug(s)?.category === 'HOSTING') && !order.currentHost.trim()) {
          // Optional but recommended
        }
        break;
      case 'details':
        if (!order.fullName.trim()) {
          setError('Full name is required');
          return false;
        }
        if (!order.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
          setError('Valid email is required');
          return false;
        }
        if (!order.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        break;
    }
    setError(null);
    return true;
  }, [order]);

  const handleNext = () => {
    if (validateStep(step)) {
      nextStep();
    }
  };

  // Handle form updates
  const updateOrder = (field: keyof OrderState, value: any) => {
    setOrder((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (slug: string) => {
    setOrder((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(slug)
        ? prev.selectedServices.filter((s) => s !== slug)
        : [...prev.selectedServices, slug],
    }));
  };

  const toggleAddon = (addonId: string) => {
    setOrder((prev) => ({
      ...prev,
      selectedAddons: prev.selectedAddons.includes(addonId)
        ? prev.selectedAddons.filter((a) => a !== addonId)
        : [...prev.selectedAddons, addonId],
    }));
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep('details')) return;
    if (!order.termsAccepted) {
      setError('Please accept the Terms & Services');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...order,
          turnstileToken: turnstileToken || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Handle field-level validation errors
        if (data.issues) {
          const fieldErrors = data.issues as Record<string, string[]>;
          // Collect all error messages
          const messages = Object.entries(fieldErrors).flatMap(([field, messages]) =>
            messages.map(msg => `${field}: ${msg}`)
          );
          throw new Error(messages.join('; '));
        }
        throw new Error(data.error || 'Failed to submit order');
      }

      // Reset form to initial state and go back to first step
      setOrder(initialState);
      setStep('services');
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'services':
        return <StepServices order={order} onChange={updateOrder} toggleService={toggleService} />;
      case 'configure':
        return <StepConfigure order={order} onChange={updateOrder} toggleAddon={toggleAddon} packages={allPackages} addons={addons} />;
      case 'details':
        return <StepDetails order={order} onChange={updateOrder} session={session} />;
      case 'review':
        return <StepReview order={order} onChange={updateOrder} onSubmit={handleSubmit} loading={loading} error={error} />;
    }
  };

  if (submitted && orderId) {
    return (
      <Layout>
        <OrderSuccess orderId={orderId} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-canvas py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Progress Stepper */}
          <div className="mb-10 animate-fade-in-up">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const currentIndex = STEP_ORDER.indexOf(step);
                const isComplete = i < currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={s.key} className="flex flex-col items-center relative">
                    {i < STEPS.length - 1 && (
                      <div
                        className={`absolute top-5 left-[50%] w-full h-1 z-0 ${
                          isComplete ? 'bg-ink' : 'bg-line'
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                        isComplete
                          ? 'bg-accent text-white'
                          : isCurrent
                          ? 'bg-accent text-white ring-4 ring-accent/30'
                          : 'bg-line text-subtle'
                      }`}
                    >
                      {isComplete ? '✓' : s.icon}
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center w-24 ${isCurrent ? 'text-accent' : 'text-subtle'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-3 animate-fade-in-up delay-100">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 p-4 bg-error-soft border border-error/20 text-error rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {renderStep()}

                {/* Navigation */}
                <div className="mt-8 flex justify-between pt-6 border-t border-line">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={prevStep}
                    disabled={step === 'services'}
                  >
                    ← Back
                  </Button>
                  <div className="flex gap-3">
                    {step !== 'review' && (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleNext}
                      >
                        Next →
                      </Button>
                    )}
                    {step === 'review' && (
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={loading || !order.termsAccepted}
                      >
                        {loading ? 'Submitting...' : 'Submit Order'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummaryPanel
                order={order}
                step={step}
                packages={allPackages}
                addons={addons}
              />
            </div>
          </div>
        </div>

        {/* Turnstile widget */}
        <div
          className="turnstile mt-4"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="light"
        />
      </div>
    </Layout>
  );
}

// ─── Step 1: Services ───
function StepServices({ order, onChange, toggleService }: any) {
  const design = allPackages.filter(p => p.category === 'WEBSITE_DESIGN');
  const hosting = allPackages.filter(p => p.category === 'HOSTING');
  const dns = allPackages.filter(p => p.category === 'DNS');
  const bundles = allPackages.filter(p => p.category === 'BUNDLE');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">What do you need?</h1>
        <p className="text-muted">Select one or more services. Bundles include everything you need.</p>
      </div>

      {/* Bundles */}
      <section>
        <h2 className="text-xl font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-accent">🎁</span> Complete Bundles (Best Value)
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {bundles.map((pkg) => (
            <ServiceCard key={pkg.slug} pkg={pkg} selected={order.selectedServices.includes(pkg.slug)} onClick={toggleService} />
          ))}
        </div>
      </section>

      {/* Individual Services */}
      <section>
        <h2 className="text-xl font-semibold text-ink mb-4">Or Build Your Own</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Website Design', packages: design, icon: '🎨' },
            { label: 'Hosting', packages: hosting, icon: '🖥️' },
            { label: 'DNS', packages: dns, icon: '🌐' },
          ].map(({ label, packages, icon }) => (
            <div key={label} className="md:col-span-1">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">{icon} {label}</h3>
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <ServiceCard key={pkg.slug} pkg={pkg} selected={order.selectedServices.includes(pkg.slug)} onClick={toggleService} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {order.selectedServices.length > 0 && (
        <div className="bg-accent-soft border border-accent/30 rounded-xl p-4">
          <p className="font-medium text-ink mb-2">
            Selected: {order.selectedServices.map((s: string) => getPackageBySlug(s)?.name).join(', ')}
          </p>
          <p className="text-sm text-accent">Click "Next" to configure your selection.</p>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ pkg, selected, onClick }: { pkg: PackageConfig; selected: boolean; onClick: (slug: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(pkg.slug)}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
        selected
          ? 'border-accent bg-accent-soft ring-2 ring-accent/20'
          : 'border-line hover:border-accent/40 hover:bg-canvas'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-ink">{pkg.name}</h4>
          <p className="text-sm text-muted mt-1">{pkg.shortDescription}</p>
        </div>
        {pkg.isPopular && (
          <span className="text-xs font-bold bg-accent text-white px-2 py-0.5 rounded-full">Popular</span>
        )}
      </div>
    </button>
  );
}

// ─── Step 2: Configure ───
function StepConfigure({ order, onChange, toggleAddon, packages, addons }: {
  order: OrderState;
  onChange: (field: keyof OrderState, value: any) => void;
  toggleAddon: (id: string) => void;
  packages: PackageConfig[];
  addons: Addon[];
}) {
  // Filter addons applicable to selected services
  const categories = order.selectedServices.map((s: string) => getPackageBySlug(s)?.category).filter(Boolean);
  const applicableAddons = addons.filter(a => a.applicableTo.some(cat => categories.includes(cat)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">Configure Your Order</h1>
        <p className="text-muted">Choose billing cycle, add-ons, and domain options.</p>
      </div>

      {/* Billing Cycle */}
      <section className="bg-surface rounded-2xl border border-line p-6">
        <h3 className="font-semibold text-ink mb-4">Billing Cycle</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {['MONTHLY', 'YEARLY'].map((cycle) => (
            <label
              key={cycle}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                order.billingCycle === cycle
                  ? 'border-accent bg-accent-soft'
                  : 'border-line hover:border-accent/40'
              }`}
            >
              <input
                type="radio"
                name="billingCycle"
                value={cycle}
                checked={order.billingCycle === cycle}
                onChange={() => onChange('billingCycle', cycle)}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}</p>
                  <p className="text-sm text-subtle">
                    {cycle === 'YEARLY' ? 'Save 17% vs monthly' : 'Pay month to month'}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      {applicableAddons.length > 0 && (
        <section className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold text-ink mb-4">Add-ons</h3>
          <div className="space-y-3">
            {applicableAddons.map((addon) => (
              <AddonToggle key={addon.id} addon={addon} selected={order.selectedAddons.includes(addon.id)} onToggle={toggleAddon} cycle={order.billingCycle} />
            ))}
          </div>
        </section>
      )}

      {/* Domain */}
      <section className="bg-surface rounded-2xl border border-line p-6">
        <h3 className="font-semibold text-ink mb-4">Domain Name</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {['new', 'existing', 'none'].map((type) => (
              <label
                key={type}
                className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${
                  order.domainType === type
                    ? 'border-accent bg-accent-soft'
                    : 'border-line hover:border-accent/40'
                }`}
              >
                <input
                  type="radio"
                  name="domainType"
                  value={type}
                  checked={order.domainType === type}
                  onChange={() => onChange('domainType', type)}
                  className="sr-only"
                />
                <p className="font-medium text-ink capitalize">{type === 'new' ? 'New Domain' : type === 'existing' ? 'Use Existing' : 'No Domain'}</p>
                <p className="text-xs text-subtle mt-1">
                  {type === 'new' ? 'Free .com/.np with bundles' : type === 'existing' ? 'Point to our servers' : 'Decide later'}
                </p>
              </label>
            ))}
          </div>

          {(order.domainType === 'new' || order.domainType === 'existing') && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-ink mb-1">
                Domain Name
              </label>
              <input
                type="text"
                value={order.domainName}
                onChange={(e) => onChange('domainName', e.target.value)}
                placeholder={order.domainType === 'new' ? 'mybusiness.com' : 'mybusiness.com'}
                className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              />
              <p className="text-xs text-subtle">
                {order.domainType === 'new'
                  ? 'We\'ll check availability and register it for you.'
                  : 'Make sure to update your nameservers to ours after ordering.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Current Host (for migration) */}
      {order.selectedServices.some(s => getPackageBySlug(s)?.category === 'HOSTING') && (
        <section className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold text-ink mb-4">Current Website (Optional)</h3>
          <p className="text-muted mb-4">If you have an existing site, we can migrate it for free with Business/Scale hosting.</p>
          <input
            type="text"
            value={order.currentHost}
            onChange={(e) => onChange('currentHost', e.target.value)}
            placeholder="Current hosting provider / URL (e.g., Bluehost, AWS, example.com)"
            className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
          />
        </section>
      )}
    </div>
  );
}

function AddonToggle({ addon, selected, onToggle, cycle }: { addon: Addon; selected: boolean; onToggle: (id: string) => void; cycle: BillingCycle }) {
  return (
    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
      selected ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/40'
    }`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(addon.id)}
        className="w-5 h-5 text-accent rounded border-line focus:ring-accent"
      />
      <div className="flex-1">
        <p className="font-medium text-ink">{addon.name}</p>
        <p className="text-sm text-subtle">{addon.description}</p>
      </div>
    </label>
  );
}

// ─── Step 3: Details ───
function StepDetails({ order, onChange, session }: { order: OrderState; onChange: any; session: Session | null }) {
  // Prefill from session
  useEffect(() => {
    if (session) {
      onChange('fullName', session.client.name);
      onChange('email', session.client.email);
    }
  }, [session, onChange]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">Your Details</h1>
        <p className="text-muted">This is the only place we collect your personal information.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-line p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={order.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={order.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={order.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              placeholder="+977 98..."
              pattern="^(\+977)?9[78]\d{8}$"
              title="Enter a valid Nepali mobile number (e.g., 9866775566 or +9779866775566)"
            />
            <p className="mt-1 text-xs text-subtle">Format: 98XXXXXXXX or +97798XXXXXXXX</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Company / Organization</label>
            <input
              type="text"
              value={order.company}
              onChange={(e) => onChange('company', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              placeholder="Acme Corp (optional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-1">Project Details / Notes</label>
          <textarea
            value={order.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
            placeholder="Tell us about your project goals, timeline, specific requirements..."
          />
        </div>
      </div>

      <div className="bg-success-soft border border-success/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <div>
            <p className="font-medium text-ink">Your data is safe</p>
            <p className="text-sm text-success mt-1">We only use this to contact you about your order. We never sell or share your information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review ───
function StepReview({ order, onChange, onSubmit, loading, error }: {
  order: OrderState;
  onChange: (field: keyof OrderState, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  const selectedPackages = order.selectedServices.map((s: string) => getPackageBySlug(s)).filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">Review & Submit</h1>
        <p className="text-muted">Please review your order before submitting.</p>
      </div>

      {/* Friendly pricing note */}
      <div className="bg-accent-soft border border-accent/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="font-medium text-ink">Pricing Discussion</p>
            <p className="text-sm text-accent mt-1">Our sales team will contact you shortly to discuss pricing and finalize your order.</p>
          </div>
        </div>
      </div>

      {/* Services Summary */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-accent">📦</span> Services
        </h3>
        <div className="space-y-4">
          {selectedPackages.map((pkg) => (
            <div key={pkg!.slug} className="flex items-center justify-between p-4 bg-canvas rounded-xl">
              <div>
                <p className="font-medium text-ink">{pkg!.name}</p>
                <p className="text-sm text-subtle">{pkg!.category.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons Summary */}
      {order.selectedAddons.length > 0 && (
        <div className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="text-success">⚡</span> Add-ons
          </h3>
          <div className="space-y-3">
            {order.selectedAddons.map((addonId: string) => {
              const addon = addons.find(a => a.id === addonId);
              if (!addon) return null;
              return (
                <div key={addonId} className="p-3 bg-canvas rounded-xl">
                  <span className="text-ink">{addon.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Domain */}
      {(order.domainType === 'new' || order.domainType === 'existing') && (
        <div className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="text-accent">🌐</span> Domain
          </h3>
          <p className="text-ink">{order.domainName} ({order.domainType === 'new' ? 'New registration' : 'Existing domain'})</p>
        </div>
      )}

      {/* Current Host */}
      {order.currentHost && (
        <div className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="text-purple-600">📦</span> Migration
          </h3>
          <p className="text-ink">Current host: {order.currentHost}</p>
        </div>
      )}

      {/* Contact Details */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-warning">👤</span> Contact Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-subtle">Name: </span><span className="font-medium text-ink">{order.fullName}</span></div>
          <div><span className="text-subtle">Email: </span><span className="font-medium text-ink">{order.email}</span></div>
          <div><span className="text-subtle">Phone: </span><span className="font-medium text-ink">{order.phone}</span></div>
          {order.company && <div><span className="text-subtle">Company: </span><span className="font-medium text-ink">{order.company}</span></div>}
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={order.termsAccepted}
            onChange={(e) => onChange('termsAccepted', e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-line text-accent focus:ring-accent cursor-pointer"
            aria-label="I have read and agree to the Terms & Services"
          />
          <div>
            <p className="font-medium text-ink group-hover:text-ink transition-colors">
              I have read and agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Terms & Services
              </a>
            </p>
            <p className="text-sm text-subtle mt-1">
              By submitting, you agree to our terms and privacy policy.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

// ─── Order Summary Panel ───
function OrderSummaryPanel({ order, step, packages, addons }: {
  order: OrderState;
  step: 'services' | 'configure' | 'details' | 'review';
  packages: PackageConfig[];
  addons: Addon[];
}) {
  const selectedPackages = order.selectedServices.map((s: string) => getPackageBySlug(s)).filter(Boolean);

  return (
    <div className="sticky top-24 animate-fade-in-up delay-200">
      <div className="bg-surface text-text rounded-3xl p-6 border border-line">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          Order Summary
        </h2>

        {order.selectedServices.length === 0 ? (
          <div className="text-center py-8 text-subtle">
            <svg className="w-16 h-16 mx-auto mb-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <p className="text-sm">Nothing selected yet. Choose a package to get started.</p>
          </div>
        ) : (
          <>
            {/* Services - show selections without prices */}
            <div className="space-y-4 mb-6">
              {selectedPackages.map((pkg) => {
                if (!pkg) return null;
                return (
                  <div key={pkg.slug} className="bg-bg-elevated/50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-text">{pkg.name}</p>
                        <p className="text-xs text-subtle">{pkg.category.replace('_', ' ')}</p>
                      </div>
                      <span className="text-xs font-medium bg-accent-soft text-accent whitespace-nowrap px-2 py-0.5 rounded-full">
                        {order.billingCycle === 'YEARLY' && pkg.billingCycle === 'MONTHLY' ? 'Yearly' : pkg.billingCycle === 'MONTHLY' ? 'Monthly' : 'One-time'}
                      </span>
                    </div>
                    <p className="text-xs text-subtle line-clamp-2">{pkg.shortDescription}</p>
                  </div>
                );
              })}
            </div>

            {/* Add-ons */}
            {order.selectedAddons.length > 0 && (
              <div className="border-t border-line pt-4 mb-6">
                <p className="font-medium text-muted mb-3">Add-ons</p>
                <div className="space-y-2">
                  {order.selectedAddons.map((addonId: string) => {
                    const addon = addons.find((a: Addon) => a.id === addonId);
                    if (!addon) return null;
                    return (
                      <div key={addonId} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-success rounded-full"></span>
                        <span className="text-text-muted">{addon.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Domain */}
            {(order.domainType === 'new' || order.domainType === 'existing') && order.domainName && (
              <div className="border-t border-line pt-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-accent">🌐</span>
                  <span className="text-text-muted">{order.domainName}</span>
                  <span className="text-xs text-subtle">({order.domainType === 'new' ? 'New' : 'Existing'})</span>
                </div>
              </div>
            )}

            {/* Current Host */}
            {order.currentHost && (
              <div className="border-t border-line pt-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400">📦</span>
                  <span className="text-text-muted">Migration from: {order.currentHost}</span>
                </div>
              </div>
            )}

            {/* Replaced Total with friendly sales-call note */}
            <div className="border-t border-line pt-4 mt-6">
              <div className="bg-accent-soft rounded-xl p-4 text-center">
                <p className="text-accent text-sm font-medium">Pricing Discussion</p>
                <p className="text-text-muted text-xs mt-1">Our sales team will contact you shortly to discuss pricing and finalize your order.</p>
              </div>
            </div>

            {/* Progress hint */}
            <div className="mt-6 pt-4 border-t border-line">
              <p className="text-xs text-subtle text-center">
                Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length} —{' '}
                <span className="font-medium text-text capitalize">{step}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Success Page ───
function OrderSuccess({ orderId }: { orderId: string }) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center py-20 px-6">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-ink mb-2">Order Submitted!</h1>
        <p className="text-muted mb-6">Thank you for your order. We've received it and will review shortly.</p>

        <div className="bg-accent-soft border border-accent/30 rounded-xl p-4 mb-6">
          <p className="font-medium text-ink">Pricing Discussion</p>
          <p className="text-sm text-accent mt-1">Our sales team will contact you shortly to discuss pricing and finalize your order.</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-6 mb-6">
          <p className="text-sm text-subtle mb-1">Your Order ID</p>
          <p className="text-2xl font-bold text-accent font-mono">{orderId}</p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p>✅ Confirmation email sent to your inbox</p>
          <p>📋 Our team will review within 4 business hours</p>
          <p>📞 We'll contact you to confirm details & next steps</p>
        </div>
        <div className="mt-8 space-y-3">
          <Link href="/pricing" className="block w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-all">
            View Pricing
          </Link>
          <Link href="/contact" className="block w-full text-accent font-semibold hover:text-accent/80 transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function OrderPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-canvas flex items-center justify-center py-20 px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </Layout>
    }>
      <OrderPageContent />
    </Suspense>
  );
}
