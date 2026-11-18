import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import AdminLoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Admin Sign In — Acme Web Studio',
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Acme<span className="text-brand-400">.</span>Web
          </Link>
          <p className="mt-2 text-slate-400">Admin Panel</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-500">Loading form...</div>}>
            <AdminLoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-slate-400 hover:text-slate-300">
              ← Client portal instead
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
