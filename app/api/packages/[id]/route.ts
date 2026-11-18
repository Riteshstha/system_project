// PATCH /api/packages/[id] - Update/Deactivate package (Admin only)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { writeAuditLog, getClientIp } from '@/lib/audit';

const updatePackageSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  priceCents: z.number().int().min(0).optional(),
  billingCycle: z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY']).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin();
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = updatePackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: parsed.data,
    });

    await writeAuditLog({
      actorEmail: session.client.email,
      action: 'PACKAGE_UPDATED',
      entity: 'Package',
      entityId: pkg.id,
      detail: parsed.data,
      ip,
    });

    return NextResponse.json({ ok: true, package: pkg });
  } catch (e) {
    console.error('Update package failed', e);
    return NextResponse.json({ error: 'Could not update package' }, { status: 500 });
  }
}