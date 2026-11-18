import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Admin Sign In — Acme Web Studio',
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Acme<span className="text-brand-400">.</span>Web
          </h1>
          <p className="mt-2 text-slate-400">Admin Panel - Redirecting to login portal...</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>}>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.location.href = 'http://acmewebportal.duckdns.org/admin/login' + (window.location.search || '');
                `,
              }}
            />
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400"></div>
            </div>
          </Suspense>
        </div>
      </div>
    </main>
  );
}