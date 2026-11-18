// POST /api/orders - Create new order with validation, server-side price calc, and emails
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmation, sendOrderToCompany } from '@/lib/email';
import { checkOrderRateLimit, recordOrderAttempt } from '@/lib/ratelimit';
import { verifyTurnstile } from '@/lib/turnstile';
import { writeAuditLog, getClientIp } from '@/lib/audit';

// ─── Validation Schema ───
const orderSchema = z.object({
  // Services (array of package names)
  selectedServices: z.array(z.string().min(1)).min(1, 'At least one service required'),

  // Configure
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  selectedAddons: z.array(z.string()).default([]),
  domainType: z.enum(['new', 'existing', 'none']),
  domainName: z.string().optional(),
  currentHost: z.string().optional(),

  // Details
  fullName: z.string().min(1, 'Full name required').max(120),
  email: z.string().email('Valid email required').max(254),
  phone: z.string().min(1, 'Phone required').max(30)
    .regex(/^(\+977)?9[78]\d{8}$/, 'Phone must be a valid Nepali mobile number (e.g., 9866775566 or +9779866775566)'),
  company: z.string().max(120).optional(),
  notes: z.string().max(5000).optional(),

  // Terms acceptance
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms & Services',
  }),

  // Security
  turnstileToken: z.string().optional(),
});

// Honeypot field (must be empty)
const honeypotSchema = z.object({
  website_url: z.string().optional(), // bots fill this
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const startTime = Date.now();

  try {
    // ─── Parse & Validate ───
    const body = await req.json();

    // Check honeypot
    const hp = honeypotSchema.safeParse(body);
    if (hp.success && hp.data.website_url && hp.data.website_url.trim() !== '') {
      // Bot detected - silently "succeed" but don't create order
      await writeAuditLog({
        actorEmail: 'bot',
        action: 'ORDER_HONEYPOT_TRIGGERED',
        entity: 'Order',
        detail: { ip, ua: req.headers.get('user-agent') || 'unknown' },
        ip,
      });
      return NextResponse.json({ ok: true, orderId: 'blocked' }, { status: 200 });
    }

    // Validate main schema
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      console.error('[Order API] Validation failed:', JSON.stringify(flattened, null, 2));
      await writeAuditLog({
        actorEmail: 'anonymous',
        action: 'ORDER_VALIDATION_FAILED',
        entity: 'Order',
        detail: { ip, issues: parsed.error.issues },
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid order data', issues: flattened.fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // ─── Rate Limiting ───
    const rateLimit = await checkOrderRateLimit(ip, data.email.toLowerCase().trim());
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.reason || 'Too many order submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // ─── Verify Turnstile (optional in dev, required in production) ───
    const turnstileValid = await verifyTurnstile(data.turnstileToken || '', ip);
    if (!turnstileValid) {
      await writeAuditLog({
        actorEmail: 'anonymous',
        action: 'ORDER_TURNSTILE_FAILED',
        entity: 'Order',
        detail: { ip },
        ip,
      });
      return NextResponse.json(
        { error: 'Security check failed. Please try again.' },
        { status: 400 }
      );
    }

    // ─── Fetch Packages from Database ───
    const packages = await prisma.package.findMany({
      where: {
        slug: { in: data.selectedServices },
        active: true,
      },
    });

    if (packages.length !== data.selectedServices.length) {
      const foundSlugs = packages.map(p => p.slug);
      const missing = data.selectedServices.filter(s => !foundSlugs.includes(s));
      return NextResponse.json(
        { error: `Invalid packages: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // ─── Build Selection Details ───
    const selectionDetails: any = {
      services: packages.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        billingCycle: p.billingCycle,
        appliedCycle: data.billingCycle,
      })),
      addons: [],
      domain: null,
      currentHost: data.currentHost || null,
    };

    // Domain
    if (data.domainType !== 'none' && data.domainName?.trim()) {
      selectionDetails.domain = {
        type: data.domainType,
        name: data.domainName.trim(),
      };
    }

    // ─── Generate Order Number ───
    const year = new Date().getFullYear();
    const count = await prisma.order.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(4, '0')}`;

    // ─── Check for existing client ───
    let clientId: string | null = null;
    const existingClient = await prisma.client.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingClient) {
      clientId = existingClient.id;
    }

    // ─── Calculate Total (using DB prices) ───
    const totalCents = packages.reduce((sum, p) => sum + p.priceCents, 0);

    // ─── Create Order ───
    const order = await prisma.order.create({
      data: {
        clientId,
        clientName: data.fullName.trim(),
        clientEmail: data.email.toLowerCase().trim(),
        clientPhone: data.phone.trim(),
        company: data.company?.trim() || null,
        packageId: packages[0].id, // primary package for relation
        selectionJson: JSON.stringify(selectionDetails),
        totalCents: totalCents,
        currency: 'NPR',
        status: 'PENDING',
        source: 'ORDER',
        advancePct: packages.some(p => p.category === 'WEBSITE_DESIGN') ? 50 : 0,
        advanceCents: packages.some(p => p.category === 'WEBSITE_DESIGN')
          ? Math.round(totalCents * 0.5)
          : 0,
        notes: data.notes?.trim() || null,
        termsAccepted: data.termsAccepted,
        termsAcceptedAt: data.termsAccepted ? new Date() : null,
      },
    });

    // Update with order number
    await prisma.order.update({
      where: { id: order.id },
      data: {
        selectionJson: JSON.stringify({ ...selectionDetails, orderNumber }),
        orderNumber,
      },
    });

    // ─── Record Rate Limit ───
    await recordOrderAttempt(ip, data.email.toLowerCase().trim());

    // ─── Send Emails (best effort) ───
    try {
      await Promise.allSettled([
        sendOrderConfirmation({
          to: order.clientEmail,
          clientName: order.clientName,
          orderId: orderNumber,
          selection: selectionDetails,
        }),
        sendOrderToCompany({
          orderId: orderNumber,
          clientName: order.clientName,
          clientEmail: order.clientEmail,
          clientPhone: order.clientPhone ?? undefined,
          company: order.company ?? undefined,
          totalCents: order.totalCents,
          currency: order.currency,
          selection: selectionDetails,
          notes: order.notes ?? undefined,
        }),
      ]);
    } catch (emailErr) {
      console.error('Email send failed for order', orderNumber, emailErr);
      // Order is saved, emails can be retried from admin
    }

    // ─── Audit Log ───
    await writeAuditLog({
      actorEmail: order.clientEmail,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order.id,
      detail: {
        orderNumber,
        services: selectionDetails.services.map((s: any) => s.name),
        totalCents: order.totalCents,
        ip,
      },
      ip,
      clientId: order.clientId || undefined,
    });

    console.log(`Order ${orderNumber} created in ${Date.now() - startTime}ms`);

    return NextResponse.json(
      { ok: true, orderId: orderNumber, orderDbId: order.id },
      { status: 201 }
    );
  } catch (e) {
    console.error('POST /api/orders failed', e);
    await writeAuditLog({
      actorEmail: 'system',
      action: 'ORDER_CREATE_ERROR',
      entity: 'Order',
      detail: { error: String(e), ip },
      ip,
    });
    return NextResponse.json(
      { error: 'Could not create order. Please try again.' },
      { status: 500 }
    );
  }
}
