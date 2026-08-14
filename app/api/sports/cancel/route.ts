import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, transactionId, positionId } = await request.json();
    const targetId = positionId || transactionId;

    if (!email || !targetId) {
      return NextResponse.json({ error: 'Missing cancel parameters: email, transactionId or positionId.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const result = await prisma.$transaction(async (txClient) => {
      // Lock user row by email OR username to prevent race conditions
      const lockedRows: any[] = await txClient.$queryRaw`
        SELECT id FROM "User"
        WHERE LOWER(email) = LOWER(${email}) OR LOWER(username) = LOWER(${email})
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        return { error: 'User profile not found.', status: 404 };
      }

      const user = await txClient.user.findFirst({
        where: { id: lockedRows[0].id },
        include: { transactions: true, positions: true }
      });

      if (!user) {
        return { error: 'User profile not found.', status: 404 };
      }

      // Locate target position or transaction
      const dbPos = user.positions.find((p: any) => p.id === targetId || p.marketId === targetId);
      const dbTx = user.transactions.find((t: any) => t.id === targetId || (dbPos && t.details?.includes(dbPos.marketTitle)));

      let refundAmount = dbPos ? dbPos.investment : 100;
      let details = dbPos ? dbPos.marketTitle : (dbTx ? dbTx.details : "Sports Bet");

      if (dbTx) {
        refundAmount = dbTx.amount;
      }

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;
      const newBalance = Math.round((activeBalance + refundAmount) * 100) / 100;

      // Update original transaction status to Failed / Cancelled
      const updatedDetails = details.replace('Placed', 'Cancelled');
      const updatedTx: Transaction = {
        id: dbTx ? dbTx.id : (targetId || `TX-${Date.now()}`),
        type: 'trade',
        amount: refundAmount,
        balanceAfter: newBalance,
        timestamp: dbTx ? dbTx.timestamp : Date.now(),
        details: updatedDetails,
        status: 'Failed'
      };

      // Add refund log entry
      const refundTxId = `TX-RFD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const refundTx: Transaction = {
        id: refundTxId,
        type: 'deposit',
        amount: refundAmount,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Refunded ₹${refundAmount} (Bet Cancelled)`,
        status: 'Completed'
      };

      const updates: any = {
        balance: newBalance,
        transactions: [updatedTx, refundTx]
      };

      if (accountType === 'real') {
        updates.realBalance = newBalance;
        updates.realTransactions = [updatedTx, refundTx];
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = [updatedTx, refundTx];
      }

      // Delete the Position row from PostgreSQL
      if (dbPos) {
        await txClient.position.delete({
          where: { id: dbPos.id }
        }).catch(() => {});
      } else {
        await txClient.position.deleteMany({
          where: {
            userId: user.id,
            OR: [
              { id: targetId },
              { marketTitle: { contains: details.substring(0, 20) } }
            ]
          }
        }).catch(() => {});
      }

      await updateUser(email, updates, txClient);

      return {
        success: true,
        newBalance,
        refundTransactionId: refundTxId
      };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      transactionId: transactionId,
      refundTransactionId: result.refundTransactionId
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sportsbook Cancel API Error:", err);
    return NextResponse.json({
      error: 'Failed to cancel sports wager.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
