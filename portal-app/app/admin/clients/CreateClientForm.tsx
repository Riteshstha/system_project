'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
    clientName: string | null;
  clientEmail: string | null;
  package: { name: string };
  createdAt: Date;
}

export default function CreateClientForm({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCreatedClient(null);

    try {
      const res = await fetch('/api/admin/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, orderId: orderId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create client');
        return;
      }
      setCreatedClient({ email: data.email, password: data.defaultPassword });
      setName('');
      setEmail('');
      setPhone('');
      setOrderId('');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (createdClient) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-emerald-900 mb-4">✓ Client Created Successfully</h3>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium text-slate-700">Email:</span> <span className="text-slate-900">{createdClient.email}</span></p>
          <p><span className="font-medium text-slate-700">Default Password:</span> <span className="text-slate-900 font-mono bg-white px-2 py-1 rounded">{createdClient.password}</span></p>
        </div>
        <p className="mt-4 text-sm text-emerald-700">
          Share these credentials with the client. They can log in immediately at <a href="/login" className="underline font-medium">/login</a>
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Create Another Client
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
      {error && (
        <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="jane@company.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="+977 9800000000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Link to Existing Order
        </label>
        <select
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">— No order —</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.id.slice(0, 8)} — {o.package.name} — {o.clientName}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </div>
    </form>
  );
}
