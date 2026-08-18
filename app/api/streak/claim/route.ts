import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/userAuth';
import { prisma } from '@/lib/prisma';
import { claimDailyStreakReward } from '@/lib/streakEngineServer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({}));

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

    const result = await claimDailyStreakReward(user.id, email);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === 'DAILY_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Daily streak reward already claimed today.' }, { status: 409 });
    }
    console.error('[Streak Claim API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}