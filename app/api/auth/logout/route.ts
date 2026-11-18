// POST /api/auth/logout
// Destroys the current session (DB row + cookie) so the token is unusable.
//
// Security decisions:
// - Revokes the session row in the DB so a stolen JWT cannot be replayed
//   even if the cookie is cleared on the client.
// - Idempotent: logging out when already logged out is fine.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://acmewebportal.duckdns.org',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function POST(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  const token = match ? match.slice(SESSION_COOKIE_NAME.length + 1) : undefined;

  if (token) {
    const decoded = verifySessionToken(token);
    if (decoded) {
      // Delete the session row if it exists (best-effort)
      await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    }
  }

  const response = NextResponse.json({ ok: true }, { headers: corsHeaders() });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}