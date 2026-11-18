import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatPaisa } from '@/lib/money';
import AdminLayout from '../../AdminLayout';
import OrderDetailStatusForm from './OrderStatusUpdateForm';

export const metadata: Metadata = {
  title: 'Order Detail — Admin — Acme Web Studio',
};

const VALID_STATUSES = [
  'PENDING',
  'QUOTE_SENT',
  'ADVANCE_PAID',
  'IN_PROGRESS',
  'READY',
  'ACTIVE',
  'CANCELLED',
  'SUSPENDED',
];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      package: true,
      client: true,
      subscription: true,
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  });

  // Parse selection JSON to get actual selected packages
  let selectedPackages: any = {};
  let orderNumber: string | null = null;
  let services: any[] = [];
  let addons: any[] = [];
  let domain: any = null;
  let currentHost: string | null = null;
  try {
    selectedPackages = JSON.parse(order?.selectionJson || '{}');
    // New format
    if (selectedPackages.services) {
      services = selectedPackages.services;
      addons = selectedPackages.addons || [];
      domain = selectedPackages.domain || null;
      currentHost = selectedPackages.currentHost || null;
      orderNumber = selectedPackages.orderNumber || null;
    }
  } catch {}

  if (!order) {
    return (
      <AdminLayout adminName={session.client.name}>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900">Order not found</h1>
          <a href="/admin/orders" className="text-brand-700 hover:underline">Back to orders</a>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="mb-6">
        <a href="/admin/orders" className="text-sm text-brand-700 hover:underline">← Back to orders</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Order Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="text-slate-500">Order ID</dt>
            <dd className="font-medium text-slate-900">#{order.id.slice(0, 8)}</dd>
            <dt className="text-slate-500">Order Number</dt>
            <dd className="font-bold text-brand-600 text-lg">{orderNumber || `#${order.id.slice(0, 8)}`}</dd>
            <dt className="text-slate-500">Services</dt>
            <dd className="font-medium text-slate-900">
              <div className="space-y-1">
                {services.length > 0 ? (
                  services.map((svc: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        svc.category === 'WEBSITE_DESIGN' ? 'bg-brand-100 text-brand-700' :
                        svc.category === 'HOSTING' ? 'bg-emerald-100 text-emerald-700' :
                        svc.category === 'DNS' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {svc.category.replace('_', ' ')}
                      </span>
                      <span className="font-medium">{svc.name}</span>
                      <span className="text-sm text-slate-500">({svc.appliedCycle || svc.billingCycle})</span>
                    </div>
                  ))
                ) : (
                  // Fallback to old format
                  <>
                    {selectedPackages.website && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded">Design</span>
                        {selectedPackages.website.name}
                      </div>
                    )}
                    {selectedPackages.hosting && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Hosting</span>
                        {selectedPackages.hosting.name}
                      </div>
                    )}
                    {selectedPackages.dns && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">DNS</span>
                        {selectedPackages.dns.name}
                      </div>
                    )}
                  </>
                )}
              </div>
            </dd>
            <dt className="text-slate-500">Total</dt>
            <dd className="font-bold text-slate-900">{formatPaisa(order.totalCents)}</dd>
            <dt className="text-slate-500">Advance (50%)</dt>
            <dd className="font-medium text-slate-900">{formatPaisa(order.advanceCents)}</dd>
            <dt className="text-slate-500">Currency</dt>
            <dd className="font-medium text-slate-900">{order.currency}</dd>
            <dt className="text-slate-500">Billing Cycle</dt>
            <dd className="font-medium text-slate-900">{services[0]?.appliedCycle || '—'}</dd>
            {addons.length > 0 && (
              <>
                <dt className="text-slate-500">Add-ons</dt>
                <dd className="font-medium text-slate-900">
                  <div className="space-y-1">
                    {addons.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Add-on</span>
                        {a.name} — {formatPaisa(a.priceCents)}/{a.cycle === 'YEARLY' ? 'yr' : 'mo'}
                      </div>
                    ))}
                  </div>
                </dd>
              </>
            )}
            {domain && (
              <>
                <dt className="text-slate-500">Domain</dt>
                <dd className="font-medium text-slate-900">
                  {domain.name} ({domain.type === 'new' ? 'New registration' : 'Existing'})
                </dd>
              </>
            )}
            {currentHost && (
              <>
                <dt className="text-slate-500">Current Host</dt>
                <dd className="font-medium text-slate-900">{currentHost}</dd>
              </>
            )}
            <dt className="text-slate-500">Created</dt>
            <dd className="font-medium text-slate-900">{new Date(order.createdAt).toLocaleString()}</dd>
            <dt className="text-slate-500">Updated</dt>
            <dd className="font-medium text-slate-900">{new Date(order.updatedAt).toLocaleString()}</dd>
          </dl>

          {order.notes && (
            <div className="mt-6">
              <dt className="text-slate-500 text-sm">Notes</dt>
              <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{order.notes}</dd>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Status</h2>
          <OrderDetailStatusForm orderId={order.id} initialStatus={order.status} />

          {order.subscription && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Subscription</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    order.subscription.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    order.subscription.status === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' :
                    order.subscription.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {order.subscription.status}
                  </span>
                </dd>
                <dt className="text-slate-500">Current Period</dt>
                <dd className="font-medium">
                  {new Date(order.subscription.currentPeriodStart).toLocaleDateString()} →
                  {new Date(order.subscription.currentPeriodEnd).toLocaleDateString()}
                </dd>
                <dt className="text-slate-500">Grace Ends</dt>
                <dd className="font-medium">
                  {order.subscription.graceEndsAt ? new Date(order.subscription.graceEndsAt).toLocaleDateString() : '—'}
                </dd>
                <dt className="text-slate-500">Suspended</dt>
                <dd className="font-medium">
                  {order.subscription.suspendedAt ? new Date(order.subscription.suspendedAt).toLocaleDateString() : 'No'}
                </dd>
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Client</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <dt className="text-slate-500">Name</dt>
          <dd className="font-medium text-slate-900">{order.client?.name || order.clientName}</dd>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-900">{order.client?.email || order.clientEmail}</dd>
          <dt className="text-slate-500">Phone</dt>
          <dd className="font-medium text-slate-900">{order.client?.phone || order.clientPhone || '—'}</dd>
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium text-slate-900">{order.client?.roles || 'CLIENT'}</dd>
        </dl>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Invoices ({order.invoices.length})</h2>
        {order.invoices.length === 0 ? (
          <p className="text-slate-500">No invoices for this order.</p>
        ) : (
          <div className="space-y-3">
            {order.invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">
                    Invoice #{inv.id.slice(0, 8)} — {inv.description}
                  </p>
                  <p className="text-sm text-slate-500">
                    Due: {new Date(inv.dueDate).toLocaleDateString()} | Created: {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">{formatPaisa(inv.amountCents)}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    inv.status === 'UNPAID' ? 'bg-amber-100 text-amber-700' :
                    inv.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {inv.status}
                  </span>
                  {inv.status === 'UNPAID' && (
                    <a href="/dashboard/billing" className="text-sm text-brand-700 hover:underline">Pay</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}