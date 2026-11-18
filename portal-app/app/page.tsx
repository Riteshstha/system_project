import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acme Web Studio — Login Portal',
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <h1 className="text-3xl font-bold text-ink animate-fade-in">
          Acme<span className="text-accent">.</span>Web
        </h1>
        <p className="mt-4 text-muted animate-fade-in delay-100">Please choose how you'd like to sign in</p>
        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="block w-full bg-brand text-brand-fg font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up delay-200"
          >
            Client Login
          </Link>
          <Link
            href="/admin/login"
            className="block w-full bg-ink text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up delay-300"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}