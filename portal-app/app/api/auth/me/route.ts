import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    let token = null;

    if (cookieHeader) {
      const cookiePairs = cookieHeader.split(';');
      for (const pair of cookiePairs) {
        const [name, value] = pair.trim().split('=');
        if (name === 'session_token') {
          token = value;
          break;
        }
      }
    }

    const session = await getSessionFromCookie(token || undefined);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      client: session.client,
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}