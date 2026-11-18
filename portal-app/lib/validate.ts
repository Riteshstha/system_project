import { z } from 'zod';

// ---- Shared validation schemas (Phase 1) ----
// Zod runs on the server before anything hits the DB. This is our
// first line of defense against malformed input / SQL injection.

export const moneySchema = z
  .number()
  .int('Amount must be a whole number')
  .nonnegative('Amount cannot be negative');

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email is too long');

export const phoneSchema = z
  .string()
  .regex(
    /^\+?[0-9]\d{6,18}$/,
    'Phone must be digits, optionally starting with + and country code'
  )
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(120, 'Name is too long');

// The order form payload. `selection` is whatever the pricing page
// produced; we re-validate the total server-side so the client cannot
// tamper with the price.
export const orderSchema = z.object({
  clientName: nameSchema,
  clientEmail: emailSchema,
  clientPhone: phoneSchema,
  packageId: z.string().min(1, 'Please select a package'),
  selection: z.object({
    website: z
      .object({ packageId: z.string(), priceCents: z.number().int() })
      .optional(),
    hosting: z
      .object({ packageId: z.string(), priceCents: z.number().int() })
      .optional(),
    dns: z
      .object({ packageId: z.string(), priceCents: z.number().int() })
      .optional(),
    extras: z.array(z.string()).optional(),
  }),
  totalCents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3).default('USD'),
  notes: z.string().max(2000).optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;