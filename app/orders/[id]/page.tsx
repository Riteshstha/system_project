'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { formatPaisa } from '@/lib/money';

interface Package {
  id: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  billingCycle: string;
}

interface Order {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  status: string;
  totalCents: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  package: Package;
  selectionJson: string;
}

const STATUS_TIMELINE = [
  { key: 'PENDING', label: 'Order Placed', icon: '📝' },
  { key: 'QUOTE_SENT', label: 'Quote Sent', icon: '📨' },
  { key: 'ADVANCE_PAID', label: 'Advance Paid', icon: '💳' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: '⚡' },
  { key: 'READY', label: 'Ready', icon: '✅' },
  { key: 'ACTIVE', label: 'Active', icon: '🚀' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-warning', dot: 'bg-amber-500' },
  QUOTE_SENT: { bg: 'bg-blue-50', text: 'text-accent', dot: 'bg-blue-500' },
  ADVANCE_PAID: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-ink', dot: 'bg-purple-500' },
  READY: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  ACTIVE: { bg: 'bg-success-soft', text: 'text-success', dot: 'bg-success-soft0' },
  CANCELLED: { bg: 'bg-error-soft', text: 'text-error', dot: 'bg-error-soft0' },
  SUSPENDED: { bg: 'bg-canvas', text: 'text-ink', dot: 'bg-slate-400' },
};

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-ink mb-2">Order not found</h1>
          <p className="text-muted mb-6">
            We couldn't find that order. Please check the URL and try again.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-ink text-white font-semibold px-6 py-3 rounded-xl hover:bg-ink transition-all"
          >
            View Pricing
          </Link>
        </div>
      </Layout>
    );
  }

  const parsedSelection = (() => {
    try {
      return JSON.parse(order.selectionJson || '{}');
    } catch {
      return {};
    }
  })();

  const currentStatusIndex = STATUS_TIMELINE.findIndex(
    (s) => s.key === order.status
  );
  const statusConfig = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-ink via-ink to-ink text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href="/pricing"
            className="inline-block text-brand-200 hover:text-white text-sm mb-6 transition-colors"
          >
            ← Back to pricing
          </Link>
          <div className="flex items-center gap-4 mb-2">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusConfig.dot} bg-opacity-20 text-white`}>
              {order.status}
            </span>
            <span className="text-brand-200 text-sm">
              #{order.id.slice(0, 8)}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-2">{order.package.name}</h1>
          <p className="text-white/70 text-lg">
            Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-ink mb-6">Project Status</h2>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-line rounded-full" />
            <div
              className="absolute top-5 left-0 h-1 bg-ink rounded-full transition-all duration-500"
              style={{ width: `${(currentStatusIndex / (STATUS_TIMELINE.length - 1)) * 100}%` }}
            />

            {STATUS_TIMELINE.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <div key={step.key} className="relative flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                      isCompleted
                        ? 'bg-ink text-white shadow-lg scale-110'
                        : 'bg-line text-subtle'
                    } ${isCurrent ? 'ring-4 ring-accent/30' : ''}`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`mt-3 text-xs font-semibold text-center max-w-[80px] ${
                      isCompleted ? 'text-ink' : 'text-subtle'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl border border-line shadow-sm p-6">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-accent-soft rounded-lg flex items-center justify-center text-lg">📦</span>
              Package Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-subtle">Package</span>
                <span className="font-medium text-ink">{order.package.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">Category</span>
                <span className="font-medium text-ink">{order.package.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">Billing</span>
                <span className="font-medium text-ink">{order.package.billingCycle.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-line">
                <span className="text-subtle">Total Amount</span>
                <span className="font-bold text-accent">{formatPaisa(order.totalCents)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-line shadow-sm p-6">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-success-soft rounded-lg flex items-center justify-center text-lg">👤</span>
              Your Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-subtle mb-1">Full Name</div>
                <div className="font-medium text-ink">{order.clientName}</div>
              </div>
              <div>
                <div className="text-subtle mb-1">Email Address</div>
                <div className="font-medium text-ink">{order.clientEmail}</div>
              </div>
              {order.clientPhone && (
                <div>
                  <div className="text-subtle mb-1">Phone Number</div>
                  <div className="font-medium text-ink">{order.clientPhone}</div>
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="md:col-span-2 bg-surface rounded-2xl border border-line shadow-sm p-6">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-warning-soft rounded-lg flex items-center justify-center text-lg">📝</span>
                Project Notes
              </h3>
              <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Status History (if multiple updates) */}
        <div className="mt-6 bg-surface rounded-2xl border border-line shadow-sm p-6">
          <h3 className="font-bold text-ink mb-4">Order Information</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-subtle">Order ID</span>
              <p className="font-mono text-ink mt-1">{order.id}</p>
            </div>
            <div>
              <span className="text-subtle">Created</span>
              <p className="font-medium text-ink mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-subtle">Last Updated</span>
              <p className="font-medium text-ink mt-1">
                {new Date(order.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/pricing"
            className="inline-block text-accent font-semibold hover:text-accent transition-colors"
          >
            → Back to Pricing
          </Link>
        </div>
      </div>
    </Layout>
  );
}
