'use client';

import { useState } from 'react';

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roles: string;
  status: string;
  createdAt: Date;
  _count: { orders: number; subscriptions: number };
}

export default function ClientRow({ client }: { client: ClientData }) {
  const [roles, setRoles] = useState(client.roles);
  const [status, setStatus] = useState(client.status);
  const [busy, setBusy] = useState(false);

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRoles = e.target.value;
    setRoles(newRoles);

    try {
      await fetch(`/api/clients/${client.id}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: newRoles }),
      });
    } catch (e) {
      console.error('Role update failed', e);
      setRoles(client.roles);
    }
  }

  async function handleAction(action: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === 'deactivate') setStatus('DEACTIVATED');
        if (action === 'reactivate') setStatus('ACTIVE');
        if (action === 'delete-invite') setStatus('DEACTIVATED');
      }
    } catch (e) {
      console.error('Action failed', e);
    } finally {
      setBusy(false);
    }
  }

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PENDING_ACTIVATION: 'bg-amber-100 text-amber-700',
    DEACTIVATED: 'bg-red-100 text-red-700',
  };

  return (
    <tr>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900">{client.name}</div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{client.email}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{client.phone || '—'}</td>
      <td className="px-6 py-4">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            statusColor[status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <select
          value={roles}
          onChange={handleRoleChange}
          className="text-xs border border-line rounded px-2 py-1 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="CLIENT">Client</option>
          <option value="TEAM">Team</option>
          <option value="ADMIN">Admin</option>
          <option value="CLIENT,TEAM">Client + Team</option>
          <option value="CLIENT,ADMIN">Client + Admin</option>
        </select>
      </td>
      <td className="px-6 py-4 text-sm text-slate-900">{client._count.orders}</td>
      <td className="px-6 py-4 text-sm text-slate-900">{client._count.subscriptions}</td>
      <td className="px-6 py-4 text-xs text-slate-500">
        {new Date(client.createdAt).toISOString().slice(0, 10)}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex flex-col gap-1 items-end">
          {status === 'PENDING_ACTIVATION' && (
            <>
              <button
                onClick={() => handleAction('resend-invite')}
                disabled={busy}
                className="text-xs text-accent hover:underline disabled:opacity-50"
              >
                Resend
              </button>
              <button
                onClick={() => handleAction('delete-invite')}
                disabled={busy}
                className="text-xs text-error hover:underline disabled:opacity-50"
              >
                Revoke
              </button>
            </>
          )}
          {status === 'ACTIVE' && (
            <button
              onClick={() => handleAction('deactivate')}
              disabled={busy}
              className="text-xs text-error hover:underline disabled:opacity-50"
            >
              Deactivate
            </button>
          )}
          {status === 'DEACTIVATED' && (
            <button
              onClick={() => handleAction('reactivate')}
              disabled={busy}
              className="text-xs text-success hover:underline disabled:opacity-50"
            >
              Reactivate
            </button>
          )}
          <a
            href={`/admin/clients/${client.id}`}
            className="text-xs text-accent hover:underline"
          >
            View →
          </a>
        </div>
      </td>
    </tr>
  );
}