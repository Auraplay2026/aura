import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { email, matchTitle, selection, odds, stake, side, uuid } = await request.json();

    if (!email || !matchTitle || !selection || !odds || !stake) {
      return NextResponse.json({ error: 'Missing required sportsbook bet parameters.' }, { status: 400 });
    }

    if (stake <= 0 || odds <= 1) {
      return NextResponse.json({ error: 'Stake and odds must be positive values greater than 1.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { transactions: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const accountType = user.accountType === 'real' ? 'real' : 'demo';
    const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;

    // Calculate total required amount (Lay bet liability: Stake * (Odds - 1))
    const potentialLiability = side === 'no' ? stake * (odds - 1) : 0;
    const totalRequired = stake + potentialLiability;

    if (activeBalance < totalRequired) {
      return NextResponse.json({ error: 'INSUFFICIENT_FUNDS', required: totalRequired, available: activeBalance }, { status: 400 });
    }

    const newBalance = activeBalance - totalRequired;

    // Format transaction details string
    const detailsStr = side === 'no'
      ? `Placed ₹${stake} Lay bet (Liability: ₹${potentialLiability.toFixed(2)}) on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`
      : `Placed ₹${stake} Back bet on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`;

    const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const tx: Transaction = {
      id: txId,
      type: 'trade',
      amount: totalRequired,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      details: detailsStr,
      status: 'Pending'
    };

    const updates: any = {
      balance: newBalance,
      transactions: [tx]
    };

    if (accountType === 'real') {
      updates.realBalance = newBalance;
      updates.realTransactions = [tx];
      const newTotalWagered = (user.totalWagered || 0) + totalRequired;
      updates.totalWagered = newTotalWagered;
      
      // VIP Level Calculations
      let resolvedVipLevel = user.vipLevel || 'Bronze';
      if (!user.manualVipLevel || user.manualVipLevel === 'Auto') {
        if (newTotalWagered >= 5000000) resolvedVipLevel = 'Diamond';
        else if (newTotalWagered >= 1000000) resolvedVipLevel = 'Platinum';
        else if (newTotalWagered >= 250000) resolvedVipLevel = 'Gold';
        else if (newTotalWagered >= 50000) resolvedVipLevel = 'Silver';
        else resolvedVipLevel = 'Bronze';
      } else {
        resolvedVipLevel = user.manualVipLevel;
      }
      updates.vipLevel = resolvedVipLevel;
    } else {
      updates.demoBalance = newBalance;
      updates.demoTransactions = [tx];
    }

    await updateUser(email, updates);

    return NextResponse.json({
      success: true,
      transactionId: txId,
      newBalance,
      tx
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sportsbook Bet API Error:", err);
    return NextResponse.json({ error: 'Failed to place sports wager.', details: err?.message }, { status: 500 });
  }
}
