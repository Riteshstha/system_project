import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import AdminLayout from '../AdminLayout';

export const metadata: Metadata = {
  title: 'Audit Log — Admin — Acme Web Studio',
};

export default async function AdminAuditPage() {
  const session = await requireAdmin();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <AdminLayout adminName={session.client.name}>
      <h1 className="text-2xl font-bold text-ink mb-6">Audit Log</h1>
      <p className="text-sm text-subtle mb-6">
        Shows the last 100 security-relevant events. No secrets are stored.
      </p>

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-canvas">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Actor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-canvas">
                <td className="px-6 py-3 text-xs text-subtle whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-3 text-sm text-ink">
                  {log.actorEmail}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-ink">
                  {log.action}
                </td>
                <td className="px-6 py-3 text-sm text-muted">
                  {log.entity}
                  {log.entityId && (
                    <span className="text-xs text-subtle">
                      {' '}
                      #{log.entityId.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-xs text-subtle">{log.ip || '—'}</td>
                <td className="px-6 py-3 text-xs text-subtle max-w-xs truncate">
                  {log.detail || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="px-6 py-12 text-center text-subtle">No audit events yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}