'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ContactForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill package selections from URL parameters
  const designPackage = searchParams.get('design') || '';
  const hostingPackage = searchParams.get('hosting') || '';
  const dnsPackage = searchParams.get('dns') || '';

  // Show selected packages as read-only info
  const selectedPackages = [
    designPackage ? `Design: ${designPackage}` : null,
    hostingPackage ? `Hosting: ${hostingPackage}` : null,
    dnsPackage ? `DNS: ${dnsPackage}` : null,
  ].filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message,
          designPackage: designPackage || undefined,
          hostingPackage: hostingPackage || undefined,
          dnsPackage: dnsPackage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-success-soft border border-success/20 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-bold text-ink">Quote Request Sent!</h3>
        <p className="mt-2 text-success">
          Thank you for your interest! Our team will review your requirements and contact you within 24 hours with a detailed quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {selectedPackages.length > 0 && (
        <div className="bg-accent-soft border border-accent/30 rounded-lg p-4">
          <p className="text-sm font-medium text-ink mb-2">Your Selected Packages:</p>
          <ul className="text-sm text-accent space-y-1">
            {selectedPackages.map((pkg, i) => <li key={i}>• {pkg}</li>)}
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-error-soft border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Your Name *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Email Address *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="+977 9800000000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Message / Project Details *</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Tell us about your project requirements..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
      >
        {submitting ? 'Sending...' : 'Send Quote Request'}
      </button>
    </form>
  );
}
