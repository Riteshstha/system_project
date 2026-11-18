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
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-64 bg-ink text-white/60 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="text-xl font-bold text-white">
            Acme<span className="text-accent">.</span>Web
          </Link>
          <p className="mt-1 text-xs text-subtle">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            📊 Dashboard
          </Link>
          <Link href="/admin/clients" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            👥 Clients
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            📦 Orders
          </Link>
          <Link href="/admin/quotes" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            💬 Quote Requests
          </Link>
          <Link href="/admin/packages" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            📦 Packages & Pricing
          </Link>
          <Link href="/admin/subscriptions" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            💳 Subscriptions
          </Link>
          <Link href="/admin/audit" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white">
            📋 Audit Log
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-subtle">Administrator</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface/5 hover:text-white text-subtle">
              🚪 Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-surface border-b border-line px-8 py-4">
          <h1 className="text-xl font-bold text-ink">Admin Panel</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}