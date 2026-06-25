import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, positionId, currentMarketPrice } = await request.json();

    if (!email || !positionId || currentMarketPrice === undefined) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const parsedPrice = Number(currentMarketPrice);
    if (typeof currentMarketPrice !== 'number' || isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Current market price must be a valid finite number >= 0.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock user row first to prevent race conditions
      await tx.$queryRaw`SELECT id FROM "User" WHERE email = ${email} FOR UPDATE`;
      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const position = await tx.position.findUnique({
        where: { id: positionId },
      });

      if (!position) {
        throw new Error('POSITION_NOT_FOUND');
      }

      if (position.userId !== user.id) {
        throw new Error('UNAUTHORIZED_POSITION');
      }

      const wallet = user.accountType === 'real' ? 'real' : 'demo';
      if (position.walletType !== wallet) {
        throw new Error('WALLET_TYPE_MISMATCH');
      }

      const payout = Math.round((position.shares * (currentMarketPrice / 100)) * 100) / 100;
      const balance = wallet === 'real' ? user.realBalance : user.demoBalance;
      const newBalance = Math.round((balance + payout) * 100) / 100;

      // Update user balance
      const updateData = wallet === 'real' 
        ? { realBalance: newBalance } 
        : { demoBalance: newBalance };

      await tx.user.update({
        where: { email },
        data: updateData,
      });

      // Delete position
      await tx.position.delete({
        where: { id: positionId },
      });

      // Create Transaction
      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const transaction = await tx.transaction.create({
        data: {
          id: txId,
          userId: user.id,
          type: 'cashout',
          amount: payout,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Cashed out ${position.shares.toFixed(1)} shares of ${position.marketTitle} at ${currentMarketPrice}%`,
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
    console.error("Cashout API Error:", err);
    if (err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    if (err.message === 'POSITION_NOT_FOUND') {
      return NextResponse.json({ error: 'Position not found.' }, { status: 404 });
    }
    if (err.message === 'UNAUTHORIZED_POSITION') {
      return NextResponse.json({ error: 'Unauthorized position ownership.' }, { status: 403 });
    }
    if (err.message === 'WALLET_TYPE_MISMATCH') {
      return NextResponse.json({ error: 'Position wallet type does not match current account context.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process prediction cashout.', details: err?.message }, { status: 500 });
  }
}
