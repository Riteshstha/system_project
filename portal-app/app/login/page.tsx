import { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — Acme Web Studio',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink">
            Acme<span className="text-accent">.</span>Web
          </h1>
          <p className="mt-2 text-muted">Sign in to your account</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-sm">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-subtle">Loading form...</div>}>
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-subtle">
            Don't have an account? An administrator can invite you.
          </p>
        </div>
      </div>
    </main>
  );
}