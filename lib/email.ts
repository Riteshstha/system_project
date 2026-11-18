import { Resend } from 'resend';

// Resend is our transactional email provider. We NEVER use personal
// Gmail SMTP — that breaks deliverability and auditability.
//
// Required env: RESEND_API_KEY, EMAIL_FROM, COMPANY_EMAIL

let resend: Resend | null = null;

function client(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set. See .env.example');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendOrderConfirmation(input: {
  to: string;
  clientName: string;
  orderId: string;
  selection: Record<string, unknown>;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error('EMAIL_FROM is not set');

  const html = `
<h2>Thank you for your order, ${escapeHtml(input.clientName)}!</h2>
<p>Your order <strong>${input.orderId}</strong> has been received and is
pending our review.</p>
<p><strong>Our sales team will contact you shortly to discuss pricing and finalize your order.</strong></p>
<h3>Your selection</h3>
<pre>${escapeHtml(JSON.stringify(input.selection, null, 2))}</pre>
<p>We will confirm the final quote and next steps shortly.</p>`;

  return client().emails.send({
    from,
    to: input.to,
    subject: `Order received — ${input.orderId}`,
    html,
  });
}

export async function sendOrderToCompany(input: {
  orderId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  company?: string;
  totalCents?: number;
  currency?: string;
  quotedPriceCents?: number;
  source?: string;
  selection: Record<string, unknown>;
  notes?: string;
  internalNotes?: string;
}) {
  const from = process.env.EMAIL_FROM;
  const to = process.env.COMPANY_EMAIL;
  if (!from || !to) throw new Error('EMAIL_FROM / COMPANY_EMAIL not set');

  let html = `
<h2>New order — ${input.orderId}</h2>
<p><strong>Client:</strong> ${escapeHtml(input.clientName)} &lt;${escapeHtml(input.clientEmail)}&gt;</p>
<p><strong>Phone:</strong> ${escapeHtml(input.clientPhone || '—')}</p>
${input.company ? `<p><strong>Company:</strong> ${escapeHtml(input.company)}</p>` : ''}
<h3>Selection</h3>
<pre>${escapeHtml(JSON.stringify(input.selection, null, 2))}</pre>
${input.notes ? `<p><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ''}
${input.internalNotes ? `<p><strong>Internal Notes:</strong> ${escapeHtml(input.internalNotes)}</p>` : ''}
${input.source && input.source !== 'ORDER' ? `<p><strong>Source:</strong> ${escapeHtml(input.source)}</p>` : ''}
${input.quotedPriceCents ? `<p><strong>Quoted Price:</strong> ${((input.quotedPriceCents || 0) / 100).toFixed(2)} ${input.currency || 'NPR'}</p>` : ''}`;

  return client().emails.send({
    from,
    to,
    subject: `New order ${input.orderId} — ${input.clientName}`,
    html,
  });
}

// Minimal HTML escaper — prevents stored XSS in email bodies.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
