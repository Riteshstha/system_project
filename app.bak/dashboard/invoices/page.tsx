import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { formatCents, formatPaisa } from '@/lib/money';
import { getGateway } from '@/lib/payments/registry';
import DashboardLayout from '../DashboardLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Invoices — Acme Web Studio',
};

export default async function InvoicesPage() {
  const session = await requireSession();
  const client = session.client;

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    UNPAID: 'bg-warning-soft text-warning',
    PAID: 'bg-success-soft text-success',
    CANCELLED: 'bg-red-100 text-error',
    REFUNDED: 'bg-line text-ink',
  };

  return (
    <DashboardLayout clientName={client.name}>
      <h1 className="text-2xl font-bold text-ink mb-6">Invoices</h1>

      {invoices.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line shadow-sm p-12 text-center">
          <p className="text-subtle">You have no invoices yet.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-canvas">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                  Paid At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-canvas">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-ink">
                      #{invoice.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-subtle">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {invoice.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-ink">
                    {formatPaisa(invoice.amountCents)}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-subtle">
                    {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        statusColors[invoice.status] || 'bg-canvas text-muted'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {invoice.status === 'UNPAID' ? (
                      <Link
                        href="/dashboard/billing"
                        className="text-sm text-accent hover:underline font-medium"
                      >
                        Pay Now →
                      </Link>
                    ) : (
                      <span className="text-xs text-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}