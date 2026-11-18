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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Audit Log</h1>
      <p className="text-sm text-slate-500 mb-6">
        Shows the last 100 security-relevant events. No secrets are stored.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Actor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-3 text-sm text-slate-900">
                  {log.actorEmail}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-slate-900">
                  {log.action}
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">
                  {log.entity}
                  {log.entityId && (
                    <span className="text-xs text-slate-400">
                      {' '}
                      #{log.entityId.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-xs text-slate-500">{log.ip || '—'}</td>
                <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate">
                  {log.detail || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">No audit events yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}
