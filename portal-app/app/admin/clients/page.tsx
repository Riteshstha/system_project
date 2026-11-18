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
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Create Client</h2>
        <CreateClientForm orders={unlinkedOrders} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Subs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">No clients yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}