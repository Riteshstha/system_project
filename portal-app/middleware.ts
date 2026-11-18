// Portal App Middleware - Runs on Edge runtime (no Node.js APIs available)
// Protects /admin and /dashboard routes by checking for session cookies.
// The actual JWT verification and role-based access control are done in
// server-side handlers (requireSession/requireAdmin in lib/session.ts).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get session cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Protect admin routes (login page is public)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect client dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
  ],
};