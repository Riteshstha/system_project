// POST /api/orders - Create new order with validation, server-side price calc, and emails
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmation, sendOrderToCompany } from '@/lib/email';
import { checkOrderRateLimit, recordOrderAttempt } from '@/lib/ratelimit';
import { verifyTurnstile } from '@/lib/turnstile';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { allPackages, addons, getPackageBySlug, calculatePackagePrice, type BillingCycle } from '@/lib/packages';

// ─── Validation Schema ───
const orderSchema = z.object({
  // Services
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
  phone: z.string().min(1, 'Phone required').max(30),
  company: z.string().max(120).optional(),
  notes: z.string().max(5000).optional(),

  // Security
  turnstileToken: z.string().min(1, 'Security check required'),

  // Totals (from client, but we RECOMPUTE server-side)
  totals: z.object({
    subtotal: z.number().int().nonnegative(),
    addonTotal: z.number().int().nonnegative(),
    discount: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
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
      await writeAuditLog({
        actorEmail: 'anonymous',
        action: 'ORDER_VALIDATION_FAILED',
        entity: 'Order',
        detail: { ip, issues: parsed.error.issues },
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid order data', issues: parsed.error.issues },
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

    // ─── Verify Turnstile ───
    const turnstileValid = await verifyTurnstile(data.turnstileToken, ip);
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

    // ─── Server-Side Price Calculation (Source of Truth) ───
    let serverSubtotal = 0;
    let serverAddonTotal = 0;
    let serverDiscount = 0;
    const selectionDetails: any = {
      services: [],
      addons: [],
      domain: null,
      currentHost: data.currentHost || null,
    };

    for (const slug of data.selectedServices) {
      const pkg = getPackageBySlug(slug);
      if (!pkg) {
        return NextResponse.json(
          { error: `Package "${slug}" not found or unavailable` },
          { status: 400 }
        );
      }

      const calc = calculatePackagePrice(pkg, data.billingCycle, data.selectedAddons);
      serverSubtotal += calc.subtotal;
      serverAddonTotal += calc.addonTotal;
      serverDiscount += calc.discount;

      selectionDetails.services.push({
        slug: pkg.slug,
        name: pkg.name,
        category: pkg.category,
        priceCents: pkg.priceCents,
        billingCycle: pkg.billingCycle,
        appliedCycle: data.billingCycle,
        subtotal: calc.subtotal,
        addonTotal: calc.addonTotal,
        discount: calc.discount,
        total: calc.subtotal + calc.addonTotal,
      });
    }

    // Add-ons detail
    for (const addonId of data.selectedAddons) {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        const price = data.billingCycle === 'YEARLY' ? addon.priceCentsYearly : addon.priceCentsMonthly;
        selectionDetails.addons.push({
          id: addon.id,
          name: addon.name,
          priceCents: price,
          cycle: data.billingCycle,
        });
      }
    }

    // Domain
    if (data.domainType !== 'none' && data.domainName?.trim()) {
      selectionDetails.domain = {
        type: data.domainType,
        name: data.domainName.trim(),
      };
    }

    const serverTotal = serverSubtotal + serverAddonTotal;

    // Verify client total matches server total (allow small rounding diff)
    if (Math.abs(serverTotal - data.totals.total) > 100) { // 1 NPR tolerance
      await writeAuditLog({
        actorEmail: data.email,
        action: 'ORDER_PRICE_MISMATCH',
        entity: 'Order',
        detail: { clientTotal: data.totals.total, serverTotal, ip },
        ip,
      });
      return NextResponse.json(
        { error: 'Price mismatch. Please refresh and try again.' },
        { status: 400 }
      );
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

    // ─── Create Order ───
    const order = await prisma.order.create({
      data: {
        clientId,
        clientName: data.fullName.trim(),
        clientEmail: data.email.toLowerCase().trim(),
        clientPhone: data.phone.trim(),
        packageId: data.selectedServices[0], // primary package for relation
        selectionJson: JSON.stringify(selectionDetails),
        totalCents: serverTotal,
        currency: 'NPR',
        status: 'PENDING',
        advancePct: data.selectedServices.some(s => getPackageBySlug(s)?.category === 'WEBSITE_DESIGN') ? 50 : 0,
        advanceCents: data.selectedServices.some(s => getPackageBySlug(s)?.category === 'WEBSITE_DESIGN')
          ? Math.round(serverTotal * 0.5)
          : 0,
        notes: data.notes?.trim() || null,
      },
    });

    // Update with order number
    await prisma.order.update({
      where: { id: order.id },
      data: { selectionJson: JSON.stringify({ ...selectionDetails, orderNumber }) },
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
          totalCents: order.totalCents,
          currency: order.currency,
          selection: selectionDetails,
        }),
        sendOrderToCompany({
          orderId: orderNumber,
          clientName: order.clientName,
          clientEmail: order.clientEmail,
          clientPhone: order.clientPhone ?? undefined,
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
        services: selectionDetails.services.map((s: any) => s.slug),
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