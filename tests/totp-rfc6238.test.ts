// RFC 6238 Test Vector Verification for TOTP Implementation
// These are the OFFICIAL test vectors from RFC 6238 Appendix A
// Our implementation MUST pass all of them

import { describe, it, expect } from 'vitest';
import { generateTotpCode, runRfc6238TestVectors, verifyTotpCode } from '@/lib/totp';

describe('TOTP — RFC 6238 Test Vectors (Official)', () => {
  it('passes all RFC 6238 Appendix A test vectors', () => {
    const results = runRfc6238TestVectors();

    // Log details for debugging
    for (const detail of results.details) {
      if (!detail.passed) {
        console.error(`FAILED: ${detail.name}`);
        console.error(`  Expected: ${detail.expected}`);
        console.error(`  Generated: ${detail.generated}`);
      }
    }

    expect(results.failed).toBe(0);
    expect(results.passed).toBe(results.details.length);
  });

  it('verifies codes within ±1 time step window', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const timestamp = 59 * 1000;
    const code = generateTotpCode(secret, timestamp, 8);

    // Should verify at exact time
    expect(verifyTotpCode(secret, code, timestamp)).toBe(true);

    // Should verify at +30 seconds (next time step)
    expect(verifyTotpCode(secret, code, timestamp + 30000)).toBe(true);

    // Should verify at -30 seconds (previous time step)
    expect(verifyTotpCode(secret, code, timestamp - 30000)).toBe(true);

    // Should NOT verify at +60 seconds (outside window)
    expect(verifyTotpCode(secret, code, timestamp + 60000)).toBe(false);

    // Should NOT verify at -60 seconds (outside window)
    expect(verifyTotpCode(secret, code, timestamp - 60000)).toBe(false);
  });

  it('rejects invalid codes', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const timestamp = 59 * 1000;

    expect(verifyTotpCode(secret, '00000000', timestamp)).toBe(false);
    expect(verifyTotpCode(secret, '12345678', timestamp)).toBe(false);
    expect(verifyTotpCode(secret, '', timestamp)).toBe(false);
  });

  it('handles different digit lengths', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const timestamp = 59 * 1000;

    const code6 = generateTotpCode(secret, timestamp, 6);
    const code7 = generateTotpCode(secret, timestamp, 7);
    const code8 = generateTotpCode(secret, timestamp, 8);

    expect(code6.length).toBe(6);
    expect(code7.length).toBe(7);
    expect(code8.length).toBe(8);

    // Each should verify at their respective lengths
    expect(verifyTotpCode(secret, code6, timestamp)).toBe(true);
    expect(verifyTotpCode(secret, code7, timestamp)).toBe(true);
    expect(verifyTotpCode(secret, code8, timestamp)).toBe(true);
  });
});