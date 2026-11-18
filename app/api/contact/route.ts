// POST /api/contact
// Accepts contact form submissions, saves as PENDING order in database, and sends email.
// Supports optional package selections from pricing page.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkLoginRateLimit } from '@/lib/ratelimit';
import { writeAuditLog, getClientIp } from '@/lib/audit';
import { verifyTurnstile } from '@/lib/turnstile';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  turnstileToken: z.string().optional(),
  // Optional package selections from pricing page
  designPackage: z.string().optional(),
  hostingPackage: z.string().optional(),
  dnsPackage: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, email, phone, message, turnstileToken, designPackage, hostingPackage, dnsPackage } = parsed.data;

  // Verify Turnstile if token provided
  if (turnstileToken) {
    const turnstileValid = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileValid) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }
  }

  // Check rate limit
  const rateLimit = await checkLoginRateLimit(ip, 'contact-form');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
  }

  // Create selection JSON with descriptive names (no DB package lookup needed)
  const selection = {
    website: designPackage ? { packageId: designPackage, name: designPackage } : undefined,
    hosting: hostingPackage ? { packageId: hostingPackage, name: hostingPackage } : undefined,
    dns: dnsPackage ? { packageId: dnsPackage, name: dnsPackage } : undefined,
  };

  // Map package names to IDs
  const pkgMapping: Record<string, string> = {
    'Basic Website': 'cmvtxxbox0000oqzoskx8ocd6',
    'Professional Website': 'cmvtxxbox0001oqzoze441qzr',
    'Advanced Website': 'cmvtxxbox0002oqzoqt0y1l87',
    'Starter Hosting': 'cmvtxxbox0003oqzoqgv28dck',
    'Business Hosting': 'cmvtxxbox0004oqzordbmjtp0',
    'Business Plus': 'cmvtxxbox0005oqzo5svvawvg',
  };

  const order = await prisma.order.create({
    data: {
      clientName: name,
      clientEmail: email,
      clientPhone: phone || null,
      packageId: pkgMapping[designPackage || ''] || 'cmvtxxbox0000oqzoskx8ocd6',
      selectionJson: JSON.stringify(selection),
      totalCents: 0,
      currency: 'NPR',
      status: 'PENDING',
      notes: message,
    },
  });

  // Send notification email to company
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@acmewebstudio.com',
      to: process.env.COMPANY_EMAIL || 'info@acmewebstudio.com',
      subject: `New Quote Request - ${name}`,
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Selected Packages:</strong></p>
        <ul>
          ${designPackage ? `<li>Website Design: ${designPackage}</li>` : ''}
          ${hostingPackage ? `<li>Hosting: ${hostingPackage}</li>` : ''}
          ${dnsPackage ? `<li>DNS Service: ${dnsPackage}</li>` : ''}
        </ul>
        <p><strong>Message:</strong></p>
        <pre style="white-space: pre-wrap;">${message}</pre>
        <p><em>Submitted from ${ip} on ${new Date().toLocaleString()}</em></p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders">View in Admin Panel</a></p>
      `,
    });
  } catch (e) {
    console.error('Failed to send quote request email:', e);
  }

  await writeAuditLog({
    actorEmail: email,
    action: 'QUOTE_REQUEST',
    entity: 'Order',
    entityId: order.id,
    detail: { ip, name, designPackage, hostingPackage, dnsPackage },
    ip,
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
