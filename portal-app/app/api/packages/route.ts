// POST /api/packages - Create package (Admin only)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { writeAuditLog, getClientIp } from '@/lib/audit';

// GET /api/packages - List active packages (Public)
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: { priceCents: 'asc' },
    });
    return NextResponse.json({ packages });
  } catch (e) {
    console.error('List packages failed', e);
    return NextResponse.json({ error: 'Could not fetch packages' }, { status: 500 });
  }
}

const createPackageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['WEBSITE_DESIGN', 'HOSTING', 'DNS']),
  description: z.string().min(1, 'Description is required'),
  priceCents: z.number().int().min(0),
  billingCycle: z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY']),
  ramMb: z.number().int().optional(),
  cpuCores: z.number().optional(),
  storageMb: z.number().int().optional(),
  dnsIncluded: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = createPackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        priceCents: data.priceCents,
        billingCycle: data.billingCycle,
        ramMb: data.ramMb || 0,
        cpuCores: data.cpuCores || 0,
        storageMb: data.storageMb || 0,
        dnsIncluded: data.dnsIncluded || false,
        active: true,
      },
    });

    await writeAuditLog({
      actorEmail: session.client.email,
      action: 'PACKAGE_CREATED',
      entity: 'Package',
      entityId: pkg.id,
      detail: { name: pkg.name, category: pkg.category, priceCents: pkg.priceCents },
      ip,
    });

    return NextResponse.json({ ok: true, package: pkg });
  } catch (e) {
    console.error('Create package failed', e);
    return NextResponse.json({ error: 'Could not create package' }, { status: 500 });
  }
}