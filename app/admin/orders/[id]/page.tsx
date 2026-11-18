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
  'CONTACTED',
  'QUOTE_SENT',
  'CONFIRMED',
  'ADVANCE_PAID',
  'PAID',
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
          <h1 className="text-2xl font-bold text-ink">Order not found</h1>
          <a href="/admin/orders" className="text-accent hover:underline">Back to orders</a>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="mb-6">
        <a href="/admin/orders" className="text-sm text-accent hover:underline">← Back to orders</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-line shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Order Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="text-subtle">Order ID</dt>
            <dd className="font-medium text-ink">#{order.id.slice(0, 8)}</dd>
            <dt className="text-subtle">Order Number</dt>
            <dd className="font-bold text-accent text-lg">{orderNumber || `#${order.id.slice(0, 8)}`}</dd>
            <dt className="text-subtle">Source</dt>
            <dd>
              {order.source === 'QUOTE' ? (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-canvas text-ink">
                  QUOTE REQUEST
                </span>
              ) : (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-canvas text-muted">
                  ORDER
                </span>
              )}
            </dd>
            <dt className="text-subtle">Services</dt>
            <dd className="font-medium text-ink">
              <div className="space-y-1">
                {services.length > 0 ? (
                  services.map((svc: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        svc.category === 'WEBSITE_DESIGN' ? 'bg-accent-soft text-accent' :
                        svc.category === 'HOSTING' ? 'bg-success-soft text-success' :
                        svc.category === 'DNS' ? 'bg-accent-soft text-accent' :
                        'bg-warning-soft text-warning'
                      }`}>
                        {svc.category.replace('_', ' ')}
                      </span>
                      <span className="font-medium">{svc.name}</span>
                      <span className="text-sm text-subtle">({svc.appliedCycle || svc.billingCycle})</span>
                    </div>
                  ))
                ) : (
                  // Fallback to old format
                  <>
                    {selectedPackages.website && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-accent-soft text-accent px-2 py-0.5 rounded">Design</span>
                        {selectedPackages.website.name}
                      </div>
                    )}
                    {selectedPackages.hosting && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-success-soft text-success px-2 py-0.5 rounded">Hosting</span>
                        {selectedPackages.hosting.name}
                      </div>
                    )}
                    {selectedPackages.dns && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-accent-soft text-accent px-2 py-0.5 rounded">DNS</span>
                        {selectedPackages.dns.name}
                      </div>
                    )}
                  </>
                )}
              </div>
            </dd>
            <dt className="text-subtle">Calculated Total</dt>
            <dd className="font-bold text-ink">{formatPaisa(order.totalCents)}</dd>
            <dt className="text-subtle">Quoted Price (Admin)</dt>
            <dd className="font-bold text-accent">
              {order.quotedPriceCents ? formatPaisa(order.quotedPriceCents) : '—'}
            </dd>
            <dt className="text-subtle">Advance (50%)</dt>
            <dd className="font-medium text-ink">{formatPaisa(order.advanceCents)}</dd>
            <dt className="text-subtle">Currency</dt>
            <dd className="font-medium text-ink">{order.currency}</dd>
            <dt className="text-subtle">Billing Cycle</dt>
            <dd className="font-medium text-ink">{services[0]?.appliedCycle || '—'}</dd>
            {addons.length > 0 && (
              <>
                <dt className="text-subtle">Add-ons</dt>
                <dd className="font-medium text-ink">
                  <div className="space-y-1">
                    {addons.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs bg-success-soft text-success px-2 py-0.5 rounded">Add-on</span>
                        {a.name}
                      </div>
                    ))}
                  </div>
                </dd>
              </>
            )}
            {domain && (
              <>
                <dt className="text-subtle">Domain</dt>
                <dd className="font-medium text-ink">
                  {domain.name} ({domain.type === 'new' ? 'New registration' : 'Existing'})
                </dd>
              </>
            )}
            {currentHost && (
              <>
                <dt className="text-subtle">Current Host</dt>
                <dd className="font-medium text-ink">{currentHost}</dd>
              </>
            )}
            <dt className="text-subtle">Terms Accepted</dt>
            <dd className="font-medium">
              {order.termsAccepted ? (
                <span className="text-success font-semibold">✓ Yes</span>
              ) : (
                <span className="text-subtle">Not accepted</span>
              )}
            </dd>
            {order.termsAcceptedAt && (
              <>
                <dt className="text-subtle">Terms Accepted At</dt>
                <dd className="font-medium text-ink">{new Date(order.termsAcceptedAt).toLocaleString()}</dd>
              </>
            )}
            <dt className="text-subtle">Created</dt>
            <dd className="font-medium text-ink">{new Date(order.createdAt).toLocaleString()}</dd>
            <dt className="text-subtle">Updated</dt>
            <dd className="font-medium text-ink">{new Date(order.updatedAt).toLocaleString()}</dd>
          </dl>

          {order.notes && (
            <div className="mt-6">
              <dt className="text-subtle text-sm">Client Notes</dt>
              <dd className="mt-1 text-sm text-ink whitespace-pre-wrap">{order.notes}</dd>
            </div>
          )}
          {order.internalNotes && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <dt className="text-ink text-sm font-semibold">Internal Notes (Admin Only)</dt>
              <dd className="mt-1 text-sm text-ink whitespace-pre-wrap">{order.internalNotes}</dd>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-line shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Status</h2>
          <OrderDetailStatusForm orderId={order.id} initialStatus={order.status} />

          {order.subscription && (
            <div className="mt-6 pt-6 border-t border-line">
              <h3 className="font-semibold text-ink mb-2">Subscription</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-subtle">Status</dt>
                <dd className="font-medium">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    order.subscription.status === 'ACTIVE' ? 'bg-success-soft text-success' :
                    order.subscription.status === 'PAST_DUE' ? 'bg-warning-soft text-warning' :
                    order.subscription.status === 'SUSPENDED' ? 'bg-red-100 text-error' :
                    'bg-canvas text-muted'
                  }`}>
                    {order.subscription.status}
                  </span>
                </dd>
                <dt className="text-subtle">Current Period</dt>
                <dd className="font-medium">
                  {new Date(order.subscription.currentPeriodStart).toLocaleDateString()} →
                  {new Date(order.subscription.currentPeriodEnd).toLocaleDateString()}
                </dd>
                <dt className="text-subtle">Grace Ends</dt>
                <dd className="font-medium">
                  {order.subscription.graceEndsAt ? new Date(order.subscription.graceEndsAt).toLocaleDateString() : '—'}
                </dd>
                <dt className="text-subtle">Suspended</dt>
                <dd className="font-medium">
                  {order.subscription.suspendedAt ? new Date(order.subscription.suspendedAt).toLocaleDateString() : 'No'}
                </dd>
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-surface rounded-xl border border-line shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-ink mb-4">Client</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <dt className="text-subtle">Name</dt>
          <dd className="font-medium text-ink">{order.client?.name || order.clientName}</dd>
          <dt className="text-subtle">Email</dt>
          <dd className="font-medium text-ink">{order.client?.email || order.clientEmail}</dd>
          <dt className="text-subtle">Phone</dt>
          <dd className="font-medium text-ink">{order.client?.phone || order.clientPhone || '—'}</dd>
          <dt className="text-subtle">Company</dt>
          <dd className="font-medium text-ink">{order.company || '—'}</dd>
          <dt className="text-subtle">Role</dt>
          <dd className="font-medium text-ink">{order.client?.roles || 'CLIENT'}</dd>
        </dl>
      </div>

      {/* Invoices */}
      <div className="bg-surface rounded-xl border border-line shadow-sm p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Invoices ({order.invoices.length})</h2>
        {order.invoices.length === 0 ? (
          <p className="text-subtle">No invoices for this order.</p>
        ) : (
          <div className="space-y-3">
            {order.invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-4 bg-canvas rounded-lg">
                <div>
                  <p className="font-medium text-ink">
                    Invoice #{inv.id.slice(0, 8)} — {inv.description}
                  </p>
                  <p className="text-sm text-subtle">
                    Due: {new Date(inv.dueDate).toLocaleDateString()} | Created: {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-ink">{formatPaisa(inv.amountCents)}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    inv.status === 'PAID' ? 'bg-success-soft text-success' :
                    inv.status === 'UNPAID' ? 'bg-warning-soft text-warning' :
                    inv.status === 'CANCELLED' ? 'bg-red-100 text-error' :
                    'bg-canvas text-muted'
                  }`}>
                    {inv.status}
                  </span>
                  {inv.status === 'UNPAID' && (
                    <a href="/dashboard/billing" className="text-sm text-accent hover:underline">Pay</a>
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
