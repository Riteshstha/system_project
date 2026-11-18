import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find client by email
    const client = await prisma.client.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        roles: true,
        mfaEnabled: true,
      },
    });

    if (!client) {
      // Simulate delay to prevent user enumeration
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password using argon2id (same as main app)
    let passwordMatch = false;
    if (client.passwordHash) {
      try {
        passwordMatch = await argon2.verify(client.passwordHash, password);
      } catch {
        passwordMatch = false;
      }
    }
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if MFA is enabled
    if (client.mfaEnabled) {
      // TODO: Generate 2FA token
      return NextResponse.json({
        error: 'MFA required',
        requires2fa: true,
        twoFAToken: 'temp-token',
      }, { status: 401 });
    }

    // Create session using shared auth library
    const session = await createSession(client.id, '127.0.0.1', request.headers.get('user-agent') || undefined);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      redirectUrl: client.roles.includes('ADMIN') ? '/admin' : '/dashboard',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}