import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatPaisa } from '@/lib/money';
import AdminLayout from '../AdminLayout';
import { ModalTrigger, EditPackageButton, ToggleActiveButton, ModalCloseButton } from './PackageActions';

export const metadata: Metadata = {
  title: 'Packages & Pricing — Admin — Acme Web Studio',
};

const CATEGORIES = ['WEBSITE_DESIGN', 'HOSTING', 'DNS'] as const;

export default async function AdminPackagesPage() {
  const session = await requireAdmin();

  const packages = await prisma.package.findMany({
    orderBy: [{ category: 'asc' }, { priceCents: 'asc' }],
  });

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Packages & Pricing</h1>
        <ModalTrigger
          id="create-package-modal"
          className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90"
        >
          + Add Package
        </ModalTrigger>
      </div>

      {CATEGORIES.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold text-ink mb-3 capitalize">
            {category.toLowerCase().replace('_', ' ')}
          </h2>
          <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-canvas">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Billing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {packages
                  .filter((p) => p.category === category)
                  .map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-canvas">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-ink">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted max-w-xs truncate">
                        {pkg.description}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-ink">
                        {formatPaisa(pkg.priceCents)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {pkg.billingCycle}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            pkg.active ? 'bg-success-soft text-success' : 'bg-canvas text-muted'
                          }`}
                        >
                          {pkg.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <EditPackageButton
                          className="text-sm text-accent hover:underline mr-3"
                        />
                        <ToggleActiveButton
                          active={pkg.active}
                          className="text-sm text-error hover:underline"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {packages.filter((p) => p.category === category).length === 0 && (
              <div className="px-6 py-8 text-center text-subtle">No packages in this category.</div>
            )}
          </div>
        </div>
      ))}

      {/* Create Package Modal */}
      <div id="create-package-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
        <div className="bg-surface rounded-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-ink mb-6">Create Package</h2>
          <form id="create-package-form" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Name</label>
              <input name="name" required className="w-full border border-line rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Category</label>
              <select name="category" required className="w-full border border-line rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="WEBSITE_DESIGN">Website Design</option>
                <option value="HOSTING">Hosting</option>
                <option value="DNS">DNS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Description</label>
              <textarea name="description" required rows={3} className="w-full border border-line rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Price (NPR)</label>
              <input name="priceCents" type="number" required min="0" className="w-full border border-line rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Billing Cycle</label>
              <select name="billingCycle" required className="w-full border border-line rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="ONE_TIME">One Time</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <ModalCloseButton id="create-package-modal" className="px-4 py-2 border border-line rounded-lg text-ink hover:bg-canvas">Cancel</ModalCloseButton>
              <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">Create</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}