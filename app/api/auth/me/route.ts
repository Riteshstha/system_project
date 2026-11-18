// GET /api/auth/me
// Returns the authenticated client's profile (fresh DB read).
// Used by client + admin dashboards to know who is signed in and what roles they hold.
//
// Security decisions:
// - Reads roles from the DATABASE on every request, never from the JWT.
//   A revoked or demoted role takes effect immediately.
// - Never returns the password hash or MFA secret.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://acmewebportal.duckdns.org',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function GET(req: Request) {
  // Read cookie directly (Edge-safe; no Next.js cookies() import needed here)
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  const token = match ? match.slice(SESSION_COOKIE_NAME.length + 1) : undefined;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders() });
  }

  const decoded = verifySessionToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders() });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { client: true },
  });
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders() });
  }
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders() });
  }
  if (session.clientId !== decoded.clientId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders() });
  }

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      roles: true,
      mfaEnabled: true,
      createdAt: true,
    },
  });
  if (!client) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders() });
  }

  return NextResponse.json({ ok: true, client }, { headers: corsHeaders() });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}