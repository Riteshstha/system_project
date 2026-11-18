'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [code, setCode] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

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
        return;
      }

      if (data.requires2fa) {
        setRequires2fa(true);
        setTwoFAToken(data.twoFAToken);
        return;
      }

      // Route admins to the admin panel, clients to the dashboard.
      let destination = next;
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const me = await meRes.json();
          // If the user is an admin, always redirect to /admin
          if (me.client?.roles?.includes('ADMIN')) {
            destination = '/admin';
          }
        }
      } catch {}

      // Force a hard navigation to ensure session cookies are fully loaded
      window.location.href = destination;
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
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
        return;
      }

      let destination = next;
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const me = await meRes.json();
          if (me.client?.roles?.includes('ADMIN')) destination = '/admin';
        }
      } catch {}
      router.push(destination);
      router.refresh();
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={requires2fa ? handle2FA : handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-error-soft border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!requires2fa ? (
        <>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
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
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
      <p className="mt-4 text-center text-sm">
        <a href="/forgot-password" className="text-subtle hover:text-ink">
          Forgot your password?
        </a>
      </p>
    </form>
  );
}