import Link from 'next/link';
import { signOutAction } from '../dashboard/actions';

export default function AdminLayout({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-64 bg-sidebar text-muted flex flex-col">
        <div className="p-6 border-b border-line">
          <Link href="/admin" className="text-xl font-bold text-text">
            Acme<span className="text-accent">.</span>Web
          </Link>
          <p className="mt-1 text-xs text-subtle">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            📊 Dashboard
          </Link>
          <Link href="/admin/clients" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            👥 Clients
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            📦 Orders
          </Link>
          <Link href="/admin/quotes" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            💬 Quote Requests
          </Link>
          <Link href="/admin/packages" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            📦 Packages & Pricing
          </Link>
          <Link href="/admin/subscriptions" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            💳 Subscriptions
          </Link>
          <Link href="/admin/audit" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text">
            📋 Audit Log
          </Link>
        </nav>

        <div className="p-4 border-t border-line">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-text truncate">{adminName}</p>
            <p className="text-xs text-subtle">Administrator</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-bg-elevated hover:text-text text-subtle">
              🚪 Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-surface border-b border-line px-8 py-4">
          <h1 className="text-xl font-bold text-text">Admin Panel</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}