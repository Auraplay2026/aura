import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, transactionId } = await request.json();

    if (!email || !transactionId) {
      return NextResponse.json({ error: 'Missing cancel parameters: email, transactionId.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const result = await prisma.$transaction(async (txClient) => {
      // Acquire exclusive row lock in PostgreSQL
      await txClient.$queryRaw`SELECT id FROM "User" WHERE email = ${email} FOR UPDATE`;

      const user = await txClient.user.findUnique({
        where: { email },
        include: { transactions: true }
      });

      if (!user) {
        return { error: 'User profile not found.', status: 404 };
      }

      // Locate target transaction
      const dbTx = user.transactions.find((t: any) => t.id === transactionId);
      if (!dbTx) {
        return { error: 'Wager transaction not found.', status: 404 };
      }

      if (dbTx.status !== 'Pending') {
        return { error: 'Only pending wagers can be cancelled.', currentStatus: dbTx.status, status: 400 };
      }

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;

      // Refund the staked + liability amount back to user's balance
      const refundAmount = dbTx.amount;
      const newBalance = Math.round((activeBalance + refundAmount) * 100) / 100;

      // Update original transaction status to Failed / Cancelled
      const updatedDetails = dbTx.details.replace('Placed', 'Cancelled');
      const updatedTx: Transaction = {
        id: transactionId,
        type: 'trade',
        amount: refundAmount,
        balanceAfter: newBalance,
        timestamp: dbTx.timestamp,
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

      await updateUser(email, updates, txClient);

      return {
        success: true,
        newBalance,
        refundTransactionId: refundTxId
      };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error, currentStatus: (result as any).currentStatus }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      transactionId: transactionId,
      refundTransactionId: result.refundTransactionId
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sportsbook Cancel API Error:", err);
    return NextResponse.json({ error: 'Failed to cancel sports wager.', details: err?.message }, { status: 500 });
  }
}
