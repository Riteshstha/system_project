import { Metadata } from 'next';
import { Suspense } from 'react';

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
          <p className="mt-2 text-muted">Redirecting to login portal...</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-sm">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-subtle">Loading...</div>}>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.location.href = 'http://localhost:3200/login' + (window.location.search || '');
                `,
              }}
            />
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          </Suspense>
        </div>
      </div>
    </main>
  );
}