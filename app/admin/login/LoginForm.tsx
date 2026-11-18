'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [code, setCode] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.requires2fa) {
        setRequires2fa(true);
        setTwoFAToken(data.twoFAToken);
        setLoading(false);
        return;
      }

      // Force a hard navigation to /admin to ensure session cookies are fully loaded by the browser
      window.location.href = next;
    } catch (e) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFAToken, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      window.location.href = next;
    } catch (e) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={requires2fa ? handle2FA : handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-error-soft/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!requires2fa ? (
        <>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="admin@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-sm text-text text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="123456"
            autoFocus
          />
          <p className="mt-2 text-xs text-subtle">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
      >
        {loading ? 'Please wait...' : requires2fa ? 'Verify' : 'Sign In'}
      </button>
    </form>
  );
}
