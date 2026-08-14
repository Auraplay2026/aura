import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    try { await verifyAdminSession(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    const { email, transactionId, status, payout } = await request.json();

    if (!email || !transactionId || !status || payout === undefined) {
      return NextResponse.json({ error: 'Missing settlement parameters: email, transactionId, status, payout.' }, { status: 400 });
    }

    const validStatuses = ['Won', 'Lost', 'Void', 'VOID'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid settlement status. Must be "Won", "Lost", or "Void".' }, { status: 400 });
    }

    const normalizedStatus = (status === 'VOID' || status === 'Void') ? 'Void' : status;

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
        include: { transactions: true }
      });

      if (!user) {
        return { error: 'User profile not found.', status: 404 };
      }

      // Locate the target transaction
      const dbTx = user.transactions.find((t: any) => t.id === transactionId);
      if (!dbTx) {
        return { error: 'Wager transaction not found.', status: 404 };
      }

      if (dbTx.status !== 'Pending') {
        return { error: 'Wager is already settled or cancelled.', currentStatus: dbTx.status, status: 400 };
      }

      // Parse stake and odds from transaction details to perform math validation
      const details = dbTx.details || "";
      const isLay = details.includes("Lay bet");
      
      const stakeMatch = details.match(/Placed\s+₹?([\d.]+)/i);
      const oddsMatch = details.match(/@\s+([\d.]+)/i);

      if (!stakeMatch || !oddsMatch) {
        return { error: 'Failed to parse wager parameters for validation.', status: 400 };
      }

      const stake = parseFloat(stakeMatch[1]);
      const odds = parseFloat(oddsMatch[1]);
      const liability = isLay ? stake * (odds - 1) : 0;
      const totalRequired = stake + liability;

      let expectedPayout = 0;
      if (normalizedStatus === 'Won') {
        expectedPayout = isLay ? totalRequired : Math.round(stake * odds * 100) / 100;
      } else if (normalizedStatus === 'Void') {
        expectedPayout = totalRequired; // Full stake + liability refund for Rain/Interruption
      }

      // Enforce math validation
      if (Math.abs(payout - expectedPayout) > 0.05) {
        return { 
          error: 'LEDGER_INTEGRITY_VIOLATION: Settlement payout does not match calculated wagers and odds.',
          expected: expectedPayout,
          received: payout,
          status: 400
        };
      }

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;
      const newBalance = Math.round((activeBalance + payout) * 100) / 100;

      // Update transaction status and details in DB
      const updatedDetails = `${details} · Settle: ${normalizedStatus}`;
      
      // Perform update
      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const txItem: Transaction = {
        id: transactionId,
        type: 'trade',
        amount: dbTx.amount,
        balanceAfter: newBalance,
        timestamp: dbTx.timestamp,
        details: updatedDetails,
        status: normalizedStatus === 'Void' ? 'Failed' : normalizedStatus
      };

      const updates: any = {
        balance: newBalance,
        transactions: [txItem]
      };

      // If won or void with payout > 0, record a separate deposit/refund transaction for payout trace
      let payoutTx: Transaction | null = null;
      if ((normalizedStatus === 'Won' || normalizedStatus === 'Void') && payout > 0) {
        payoutTx = {
          id: txId,
          type: normalizedStatus === 'Void' ? 'deposit' : 'deposit',
          amount: payout,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: normalizedStatus === 'Void' 
            ? `Refund: Market Voided (Rain/Interruption) for ${details.split('on')[1] || details}`
            : `Settle Payout: ${details.split('on')[1] || details}`,
          status: 'Completed'
        };
        updates.transactions.push(payoutTx);
      }

      if (accountType === 'real') {
        updates.realBalance = newBalance;
        updates.realTransactions = updates.transactions;
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = updates.transactions;
      }

      // Delete the Position row from PostgreSQL
      await txClient.position.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { id: transactionId },
            { marketTitle: { contains: (details.split('on ')[1] || details).substring(0, 20) } }
          ]
        }
      }).catch(() => {});

      await updateUser(email, updates, txClient);

      return {
        success: true,
        newBalance,
        payoutTransactionId: payoutTx ? txId : undefined
      };
    });

    if ('error' in result) {
      return NextResponse.json({ 
        error: result.error, 
        expected: (result as any).expected, 
        received: (result as any).received,
        currentStatus: (result as any).currentStatus 
      }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      transactionId: transactionId,
      payoutTransactionId: result.payoutTransactionId
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sportsbook Settlement API Error:", err);
    return NextResponse.json({
      error: 'Failed to settle sports wager.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
