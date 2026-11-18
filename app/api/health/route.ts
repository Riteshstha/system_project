import { NextResponse } from 'next/server';

// GET /api/health
// Liveness probe — returns 200 if the process is up.
export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'acme-web-studio',
  });
}