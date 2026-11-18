'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function OrderDetailStatusForm({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
        setStatus(initialStatus);
      }
    } catch {
      alert('Failed to update status');
      setStatus(initialStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <select
        value={status}
        onChange={handleChange}
        disabled={loading}
        className="w-full border border-line rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      >
        {VALID_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <p className="mt-2 text-xs text-subtle">
        {loading ? 'Updating...' : 'Changes are audited.'}
      </p>
    </div>
  );
}