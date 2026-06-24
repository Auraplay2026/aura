import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, marketId, marketTitle, side, investment, currentPrice } = await request.json();

    if (!email || !marketId || !marketTitle || !side || investment === undefined || currentPrice === undefined) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const parsedInvestment = Number(investment);
    const parsedPrice = Number(currentPrice);

    if (
      typeof investment !== 'number' || isNaN(parsedInvestment) || !isFinite(parsedInvestment) || parsedInvestment <= 0 ||
      typeof currentPrice !== 'number' || isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0
    ) {
      return NextResponse.json({ error: 'Investment and currentPrice must be valid positive finite numbers.' }, { status: 400 });
    }

    if (side !== 'yes' && side !== 'no') {
      return NextResponse.json({ error: 'Invalid side (must be yes or no).' }, { status: 400 });
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

      if (balance < investment) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      const shares = investment / (currentPrice / 100);
      const newBalance = Math.round((balance - investment) * 100) / 100;

      // Update user balance
      const updateData = wallet === 'real' 
        ? { realBalance: newBalance, totalWagered: { increment: investment } } 
        : { demoBalance: newBalance };
      
      const updatedUser = await tx.user.update({
        where: { email },
        data: updateData,
      });

      // Recalculate and update VIP level if real balance
      if (wallet === 'real') {
        const totalWagered = updatedUser.totalWagered;
        let resolvedVip = updatedUser.vipLevel || 'Bronze';
        if (!updatedUser.manualVipLevel || updatedUser.manualVipLevel === 'Auto') {
          if (totalWagered >= 5000000) resolvedVip = 'Diamond';
          else if (totalWagered >= 1000000) resolvedVip = 'Platinum';
          else if (totalWagered >= 250000) resolvedVip = 'Gold';
          else if (totalWagered >= 50000) resolvedVip = 'Silver';
          else resolvedVip = 'Bronze';
        } else {
          resolvedVip = updatedUser.manualVipLevel;
        }
        if (resolvedVip !== updatedUser.vipLevel) {
          await tx.user.update({
            where: { email },
            data: { vipLevel: resolvedVip }
          });
        }
      }

      // Create Position
      const position = await tx.position.create({
        data: {
          userId: user.id,
          marketId,
          marketTitle,
          side,
          shares,
          buyPrice: currentPrice,
          investment,
          timestamp: Date.now(),
          walletType: wallet,
        },
      });

      // Create Transaction
      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const transaction = await tx.transaction.create({
        data: {
          id: txId,
          userId: user.id,
          type: 'trade',
          amount: investment,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Bought ${shares.toFixed(1)} shares of ${marketTitle} (${side.toUpperCase()})`,
          status: 'Completed',
          walletType: wallet,
        },
      });

      return {
        newBalance,
        position,
        transaction,
      };
    });

    return NextResponse.json({
      success: true,
      balance: result.newBalance,
      position: result.position,
      transaction: result.transaction,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Trade API Error:", err);
    if (err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'INSUFFICIENT_FUNDS' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process prediction trade.', details: err?.message }, { status: 500 });
  }
}
