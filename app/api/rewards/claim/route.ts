import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, rewardType, amount, details } = await request.json();

    if (!email || !rewardType || amount === undefined) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    if (amount < 0 && rewardType !== 'cashier_withdraw') {
      return NextResponse.json({ error: 'Amount cannot be negative.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const wallet = user.accountType === 'real' ? 'real' : 'demo';
      const balance = wallet === 'real' ? user.realBalance : user.demoBalance;

      const eighteenHoursAgo = Date.now() - 18 * 60 * 60 * 1000;
      let detailsToUse = details || `Claimed ${rewardType} reward`;
      let finalAmount = amount;
      let transactionType = 'deposit';

      if (rewardType === 'daily') {
        if (amount > 5000) {
          throw new Error('DAILY_REWARD_EXCEEDED');
        }
        const isStreakClaim = detailsToUse.startsWith('Claimed Daily Reward');
        const existingDailyClaim = await tx.transaction.findFirst({
          where: {
            userId: user.id,
            timestamp: { gte: eighteenHoursAgo },
            details: isStreakClaim 
              ? { startsWith: 'Claimed Daily Reward' }
              : 'Daily Bonus Drop',
          },
        });
        if (existingDailyClaim) {
          throw new Error('DAILY_ALREADY_CLAIMED');
        }
      } else if (rewardType === 'spin') {
        if (amount > 10000) {
          throw new Error('SPIN_REWARD_EXCEEDED');
        }
        const existingSpinClaim = await tx.transaction.findFirst({
          where: {
            userId: user.id,
            timestamp: { gte: eighteenHoursAgo },
            details: { startsWith: 'Spin the Wheel' },
          },
        });
        if (existingSpinClaim) {
          throw new Error('SPIN_ALREADY_CLAIMED');
        }
      } else if (rewardType === 'weekly') {
        if (amount > 1500) {
          throw new Error('WEEKLY_REWARD_EXCEEDED');
        }
        const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
        const existingWeeklyClaim = await tx.transaction.findFirst({
          where: {
            userId: user.id,
            timestamp: { gte: sixDaysAgo },
            details: 'Weekly VIP Drop',
          },
        });
        if (existingWeeklyClaim) {
          throw new Error('WEEKLY_ALREADY_CLAIMED');
        }
      } else if (rewardType === 'monthly') {
        if (amount > 5000) {
          throw new Error('MONTHLY_REWARD_EXCEEDED');
        }
        const twentyFiveDaysAgo = Date.now() - 25 * 24 * 60 * 60 * 1000;
        const existingMonthlyClaim = await tx.transaction.findFirst({
          where: {
            userId: user.id,
            timestamp: { gte: twentyFiveDaysAgo },
            details: 'Monthly Super Drop',
          },
        });
        if (existingMonthlyClaim) {
          throw new Error('MONTHLY_ALREADY_CLAIMED');
        }
      } else if (rewardType === 'rakeback') {
        const maxRakeback = Math.min(25000, user.totalWagered * 0.05);
        const previousClaims = await tx.transaction.findMany({
          where: {
            userId: user.id,
            details: 'Instant Rakeback',
          },
        });
        const totalPreviousClaimed = previousClaims.reduce((sum, t) => sum + t.amount, 0);
        const maxAllowedNow = Math.max(0, maxRakeback - totalPreviousClaimed);

        if (amount > maxAllowedNow + 1) {
          throw new Error('RAKEBACK_LIMIT_EXCEEDED');
        }
      } else if (rewardType === 'cashier_deposit') {
        transactionType = 'deposit';
      } else if (rewardType === 'cashier_withdraw') {
        transactionType = 'withdraw';
        const absAmount = Math.abs(amount);
        if (balance < absAmount) {
          throw new Error('INSUFFICIENT_FUNDS');
        }
        finalAmount = -absAmount;
      } else if (rewardType === 'concierge') {
        if (amount > 5000) {
          throw new Error('CONCIERGE_REWARD_EXCEEDED');
        }
      }

      const newBalance = Math.round((balance + finalAmount) * 100) / 100;

      const updateData = wallet === 'real' 
        ? { realBalance: newBalance } 
        : { demoBalance: newBalance };

      await tx.user.update({
        where: { email },
        data: updateData,
      });

      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const transaction = await tx.transaction.create({
        data: {
          id: txId,
          userId: user.id,
          type: transactionType,
          amount: Math.abs(finalAmount),
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: detailsToUse,
          status: 'Completed',
          walletType: wallet,
        },
      });

      return {
        newBalance,
        transaction,
      };
    });

    return NextResponse.json({
      success: true,
      balance: result.newBalance,
      transaction: result.transaction,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Reward Claim API Error:", err);
    if (err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    if (err.message === 'DAILY_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Daily reward already claimed today.' }, { status: 400 });
    }
    if (err.message === 'SPIN_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Spin the wheel reward already claimed today.' }, { status: 400 });
    }
    if (err.message === 'WEEKLY_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Weekly VIP drop already claimed within last 6 days.' }, { status: 400 });
    }
    if (err.message === 'MONTHLY_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Monthly Super drop already claimed within last 25 days.' }, { status: 400 });
    }
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'INSUFFICIENT_FUNDS' }, { status: 400 });
    }
    if (
      err.message === 'DAILY_REWARD_EXCEEDED' ||
      err.message === 'SPIN_REWARD_EXCEEDED' ||
      err.message === 'WEEKLY_REWARD_EXCEEDED' ||
      err.message === 'MONTHLY_REWARD_EXCEEDED' ||
      err.message === 'RAKEBACK_LIMIT_EXCEEDED' ||
      err.message === 'CONCIERGE_REWARD_EXCEEDED'
    ) {
      return NextResponse.json({ error: `Reward limit exceeded: ${err.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process reward claim.', details: err?.message }, { status: 500 });
  }
}
