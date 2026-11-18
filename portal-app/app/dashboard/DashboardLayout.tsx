import Link from 'next/link';
import { signOutAction } from './actions';

export default function DashboardLayout({
  children,
  clientName,
}: {
  children: React.ReactNode;
  clientName: string;
}) {
  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white/60 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Acme<span className="text-accent">.</span>Web
          </Link>
          <p className="mt-1 text-xs text-subtle">Client Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/dashboard/orders"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            📦 Orders & Projects
          </Link>
          <Link
            href="/dashboard/subscriptions"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            💳 Subscriptions
          </Link>
          <Link
            href="/dashboard/invoices"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            🧾 Invoices
          </Link>
          <Link
            href="/dashboard/website"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            🌐 Website Status
          </Link>
          <Link
            href="/dashboard/dns"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            🔧 DNS Records
          </Link>
          <Link
            href="/dashboard/billing"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white"
          >
            💰 Billing
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{clientName}</p>
            <p className="text-xs text-subtle">Client account</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white text-subtle"
            >
              🚪 Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <header className="bg-surface border-b border-line px-8 py-4">
          <h1 className="text-xl font-bold text-ink">Client Dashboard</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}