'use client';

import { useRouter } from 'next/navigation';

export default function CancelSubscriptionButton({ subId }: { subId: string }) {
  const router = useRouter();

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    const res = await fetch(`/api/subscriptions/${subId}/cancel`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    } else {
      alert('Failed to cancel subscription.');
    }
  }

  return (
    <button
      onClick={handleCancel}
      className="text-sm text-red-700 hover:underline"
    >
      Cancel
    </button>
  );
}