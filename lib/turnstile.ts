// Cloudflare Turnstile verification
// Server-side verification of Turnstile tokens

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secretKey) {
    if (isProduction) {
      console.error('TURNSTILE_SECRET_KEY not set in production. Rejecting order for security.');
      return false; // Fail closed in production
    }
    console.warn('TURNSTILE_SECRET_KEY not set, skipping verification in development');
    return true; // Fail open in dev
  }

  try {
    const formData = new URLSearchParams();
    formData.set('secret', secretKey);
    formData.set('response', token);
    if (ip) formData.set('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await response.json();
    return data.success === true;
  } catch (e) {
    console.error('Turnstile verification failed', e);
    return false; // Fail closed on error
  }
}