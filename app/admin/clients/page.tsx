import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import AdminLayout from '../AdminLayout';
import ClientRow from './ClientRow';
import CreateClientForm from './CreateClientForm';

export const metadata: Metadata = {
  title: 'Clients — Admin — Acme Web Studio',
};

export default async function AdminClientsPage() {
  const session = await requireAdmin();

  const [clients, unlinkedOrders] = await Promise.all([
    prisma.client.findMany({
      include: {
        _count: {
          select: { orders: true, subscriptions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { clientId: null },
      include: { package: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Clients</h1>
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-ink mb-4">Create Client</h2>
        <CreateClientForm orders={unlinkedOrders} />
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-canvas">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Subs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {clients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="px-6 py-12 text-center text-subtle">No clients yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}