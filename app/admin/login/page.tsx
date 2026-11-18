import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Admin Sign In — Acme Web Studio',
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text">
            Acme<span className="text-accent">.</span>Web
          </h1>
          <p className="mt-2 text-subtle">Admin Panel - Redirecting to login portal...</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-xl">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-subtle">Loading...</div>}>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.location.href = 'https://acmewebportal.duckdns.org/admin/login' + (window.location.search || '');
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