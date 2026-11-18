// Audit logging — who did what, when.
//
// Security decisions:
// - Never log secrets (passwords, tokens, TOTP secrets, card numbers).
// - detail is JSON; we strip any key that looks like a secret before writing.
// - ip is captured from the request for forensic traceability.

import { prisma } from './prisma';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'secret',
  'totpSecret',
  'mfaSecret',
  'apiKey',
  'apiToken',
  'card',
  'stripe',
  'esewa',
  'khalti',
  'eSewa',
  'Khalti',
  'Stripe',
  'RESEND_API_KEY',
  'SESSION_SECRET',
  'DATABASE_URL',
]);

export function sanitizeDetail(detail: unknown): unknown {
  if (!detail || typeof detail !== 'object') return detail;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 2000) {
      sanitized[key] = value.slice(0, 2000) + '...[truncated]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function writeAuditLog(input: {
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: unknown;
  ip?: string;
  clientId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail: input.actorEmail,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        detail: input.detail ? JSON.stringify(sanitizeDetail(input.detail)) : null,
        ip: input.ip,
        clientId: input.clientId,
      },
    });
  } catch (e) {
    // Audit failure must never break the main operation
    console.error('Audit log write failed', e);
  }
}

// Extract IP from request headers (handles X-Forwarded-For from proxies)
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}