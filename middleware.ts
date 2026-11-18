// Next.js Middleware - MUST be in project root as middleware.ts
// Runs on Edge runtime (no Node.js APIs available)
//
// Security decisions:
// - This middleware ONLY checks if a session cookie exists.
// - The actual JWT verification, DB session check, and role-based access
//   control are done in the server-side handlers (requireSession/requireAdmin).
// - This avoids redirect loops caused by JWT verification mismatches between
//   the Edge runtime and Node.js jsonwebtoken library.
// - Redirects unauthenticated users to /login with ?next=
// - Trusts X-Forwarded-For from Caddy (configured in Caddyfile)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_token';

// Get real client IP behind Caddy
function getClientIp(req: NextRequest): string {
  // Caddy sets X-Forwarded-For. Only trust if request comes from our proxy network.
  // In production, Caddy runs on same host network, so we trust the header.
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Skip middleware for static assets, API health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }

  // If no session cookie exists, redirect to the portal on port 3200
  if (!token) {
    // Protect client dashboard routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('http://localhost:3200/login', req.url));
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('http://localhost:3200/admin/login', req.url));
    }

    if (pathname === '/login') {
      return NextResponse.redirect(new URL('http://localhost:3200/login', req.url));
    }
  }

  // Add IP header for downstream handlers
  const response = NextResponse.next();
  response.headers.set('x-client-ip', getClientIp(req));
  return response;
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/portal',
    '/portal/:path*',
    '/admin',
    '/admin/:path*',
    '/login',
    '/api/orders/:path*',
    '/api/auth/:path*',
    '/api/clients/:path*',
    '/api/payments/:path*',
    '/api/admin/:path*',
  ],
};