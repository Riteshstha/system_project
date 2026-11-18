import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/health/db
// Readiness probe — returns 200 if DB is reachable, 503 otherwise.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('DB health check failed', e);
    return NextResponse.json(
      {
        ok: false,
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}