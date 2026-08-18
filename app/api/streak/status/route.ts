import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/userAuth';
import { prisma } from '@/lib/prisma';
import { recordUserActivity, getUserStreakStatus } from '@/lib/streakEngineServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let email = searchParams.get('email');

    // Extract client IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    let user: any = null;
    if (email) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { username: { equals: email, mode: 'insensitive' } }
          ]
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    // Automatically record activity and get updated streak status
    const status = await recordUserActivity(user.id, ip);
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    console.error('[StreakStatus API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { username: { equals: email, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    const status = await recordUserActivity(user.id, ip);
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    console.error('[StreakStatus POST API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}