import { Metadata } from 'next';
import { requireSession } from '@/lib/session';
import DashboardLayout from '../DashboardLayout';

export const metadata: Metadata = {
  title: 'DNS Records — Acme Web Studio',
};

export default async function DnsPage() {
  const session = await requireSession();

  return (
    <DashboardLayout clientName={session.client.name}>
      <h1 className="text-2xl font-bold text-ink mb-6">DNS Records</h1>

      <div className="bg-surface rounded-xl border border-line shadow-sm p-12 text-center">
        <div className="mx-auto w-14 h-14 bg-accent-soft rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink">DNS Management Coming Soon</h2>
        <p className="mt-2 text-subtle max-w-md mx-auto">
          We are building a self-service DNS management panel. For now, all DNS
          changes are handled by our team. Contact us to update your records.
        </p>
      </div>
    </DashboardLayout>
  );
}