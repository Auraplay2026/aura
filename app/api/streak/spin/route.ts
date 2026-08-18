import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/userAuth';
import { prisma } from '@/lib/prisma';
import { claimDailySpinReward } from '@/lib/streakEngineServer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, prizeIndex } = await request.json().catch(() => ({}));

    if (!email || prizeIndex === undefined) {
      return NextResponse.json({ error: 'Email and prizeIndex are required.' }, { status: 400 });
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

    const result = await claimDailySpinReward(user.id, email, Number(prizeIndex));
    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === 'SPIN_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Daily lucky spin already claimed today.' }, { status: 409 });
    }
    console.error('[Streak Spin API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}