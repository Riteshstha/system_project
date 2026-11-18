'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
  clientId: string | null;
}

const statuses = [
  'PENDING',
  'QUOTE_SENT',
  'ADVANCE_PAID',
  'IN_PROGRESS',
  'READY',
  'ACTIVE',
  'CANCELLED',
  'SUSPENDED',
];

export default function OrderStatusForm({
  orderId,
  currentStatus,
  clientId,
}: OrderStatusFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === currentStatus) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
        setStatus(currentStatus);
        return;
      }

      router.refresh();
    } catch (e) {
      alert('Failed to update status');
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={saving}
        className="text-xs border border-line rounded px-2 py-1 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {status !== currentStatus && (
        <button
          type="submit"
          disabled={saving}
          className="text-xs bg-accent text-white px-2 py-1 rounded hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? '...' : 'Save'}
        </button>
      )}
    </form>
  );
}