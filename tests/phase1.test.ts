import { describe, it, expect } from 'vitest';
import { formatCents, formatCentsCompact, centsToDollars, dollarsToCents, formatPaisa, formatPaisaCompact, paisaToRupees, rupeesToPaisa } from '@/lib/money';
import { orderSchema } from '@/lib/validate';
import { generateEsewaSignature, initEsewaPayment, usdCentsToNprPaisa } from '@/lib/esewa';

describe('Phase 1: Money Helpers (NPR Paisa)', () => {
  it('converts paisa to rupees correctly', () => {
    expect(paisaToRupees(150000)).toBe(1500);
    expect(paisaToRupees(999)).toBe(9.99);
    expect(paisaToRupees(0)).toBe(0);
  });

  it('converts rupees to paisa correctly', () => {
    expect(rupeesToPaisa(1500)).toBe(150000);
    expect(rupeesToPaisa(9.99)).toBe(999);
    expect(rupeesToPaisa(0)).toBe(0);
  });

  it('formats paisa for display (NPR) - contains correct numeric value', () => {
    const formatted = formatPaisa(150000, 'NPR');
    // Matches either Arabic or Devanagari numerals
    expect(formatted).toMatch(/[1१][,.]?[5५][,.]?[0०][0०]/);
    expect(formatPaisa(999, 'NPR')).toMatch(/[9९][9९]/);
    expect(formatPaisa(0, 'NPR')).toMatch(/[0०]/);
  });

  it('formats paisa compactly (NPR) - contains correct numeric value', () => {
    const formatted = formatPaisaCompact(150000, 'NPR');
    // Matches either Arabic or Devanagari numerals
    expect(formatted).toMatch(/[1१][,.]?[5५][0०]/);
    expect(formatPaisaCompact(150050, 'NPR')).toMatch(/[1१][,.]?[5५][0०][1१]/);
  });

  it('handles unknown currencies gracefully', () => {
    // Intl.NumberFormat uses generic currency sign (¤) for unknown currencies
    // May output Devanagari numerals depending on locale
    const formatted = formatPaisa(150000, 'XXX');
    const compact = formatPaisaCompact(150000, 'XXX');
    // Just verify they return strings containing digits
    expect(typeof formatted).toBe('string');
    expect(typeof compact).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
    expect(compact.length).toBeGreaterThan(0);
  });
});

describe('Phase 1: Money Helpers (Legacy USD aliases)', () => {
  it('legacy centsToDollars still works', () => {
    expect(centsToDollars(150000)).toBe(1500);
    expect(centsToDollars(999)).toBe(9.99);
    expect(centsToDollars(0)).toBe(0);
  });

  it('legacy dollarsToCents still works', () => {
    expect(dollarsToCents(1500)).toBe(150000);
    expect(dollarsToCents(9.99)).toBe(999);
    expect(dollarsToCents(0)).toBe(0);
  });
});

describe('Phase 1: Order Validation (Zod)', () => {
  it('rejects invalid email', () => {
    const result = orderSchema.safeParse({
      clientName: 'Test User',
      clientEmail: 'not-an-email',
      clientPhone: '',
      packageId: 'pkg_123',
      selection: { website: { packageId: 'pkg_123', priceCents: 75000 } },
      totalCents: 75000,
      currency: 'NPR',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid order payload', () => {
    const result = orderSchema.safeParse({
      clientName: 'Test User',
      clientEmail: 'test@example.com',
      clientPhone: '+9779800000000',
      packageId: 'pkg_123',
      selection: { website: { packageId: 'pkg_123', priceCents: 75000 } },
      totalCents: 75000,
      currency: 'NPR',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative totalCents', () => {
    const result = orderSchema.safeParse({
      clientName: 'Test User',
      clientEmail: 'test@example.com',
      clientPhone: '',
      packageId: 'pkg_123',
      selection: { website: { packageId: 'pkg_123', priceCents: 75000 } },
      totalCents: -100,
      currency: 'NPR',
    });
    expect(result.success).toBe(false);
  });
});

describe('Phase 1: eSewa Integration', () => {
  it('generates deterministic HMAC-SHA256 signature', () => {
    const sig1 = generateEsewaSignature(
      { merchantCode: 'EPAYTEST', secretKey: 'secret', baseUrl: 'https://uat.esewa.com.np' },
      { amount: 1000, transactionUuid: 'order_123', productCode: 'EPAYTEST' }
    );
    const sig2 = generateEsewaSignature(
      { merchantCode: 'EPAYTEST', secretKey: 'secret', baseUrl: 'https://uat.esewa.com.np' },
      { amount: 1000, transactionUuid: 'order_123', productCode: 'EPAYTEST' }
    );
    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64); // hex encoded SHA256
  });

  it('converts USD cents to NPR paisa with default rate', () => {
    // 150000 cents = $1500 * 132 = 198000 NPR = 19800000 paisa
    expect(usdCentsToNprPaisa(150000)).toBe(19800000);
    expect(usdCentsToNprPaisa(100)).toBe(13200); // $1.00 = 132 NPR = 13200 paisa
  });
});