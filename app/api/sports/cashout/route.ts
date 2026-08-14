import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, transactionId, positionId, currentOdds } = await request.json();
    const targetId = positionId || transactionId;

    if (!email || !targetId) {
      return NextResponse.json({ error: 'Missing required parameters: email, transactionId or positionId.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const parsedCurrentOdds = Number(currentOdds) > 1 ? Number(currentOdds) : 2.0;

    const result = await prisma.$transaction(async (txClient) => {
      // 1. Lock user row by email OR username to prevent race conditions
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

      // 2. Locate target position or transaction
      const dbPos = user.positions.find((p: any) => p.id === targetId || p.marketId === targetId);
      const dbTx = user.transactions.find((t: any) => t.id === targetId || (dbPos && t.details?.includes(dbPos.marketTitle)));

      let initialStake = dbPos ? dbPos.investment : 100;
      let initialOdds = dbPos ? dbPos.buyPrice : 2.0;
      let details = dbPos ? dbPos.marketTitle : (dbTx ? dbTx.details : "Sports Bet");
      let isLay = dbPos ? (dbPos.side === 'no' || dbPos.side === 'lay') : details.includes("Lay bet");

      if (dbTx && dbTx.details) {
        const stakeMatch = dbTx.details.match(/Placed\s+₹?([\d.]+)/i);
        const oddsMatch = dbTx.details.match(/@\s+([\d.]+)/i);
        if (stakeMatch) initialStake = parseFloat(stakeMatch[1]);
        if (oddsMatch) initialOdds = parseFloat(oddsMatch[1]);
      }

      // 3. Dynamic Cashout Calculation with 5% Anti-Arbitrage Margin Fee
      const marginFee = 0.05; // 5%
      let rawCashoutValue = 0;

      if (!isLay) {
        rawCashoutValue = (initialStake * (initialOdds / parsedCurrentOdds)) * (1 - marginFee);
      } else {
        rawCashoutValue = (initialStake * (parsedCurrentOdds / initialOdds)) * (1 - marginFee);
      }

      // Cap cashout value between 50% and 95% of stake if odds are flat, or up to max potential payout
      const maxPayout = initialStake * initialOdds;
      const finalCashoutValue = Math.max(
        Math.round(initialStake * 0.50 * 100) / 100,
        Math.min(Math.round(maxPayout * 100) / 100, Math.round(rawCashoutValue * 100) / 100 || Math.round(initialStake * 0.95 * 100) / 100)
      );

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;
      const newBalance = Math.round((activeBalance + finalCashoutValue) * 100) / 100;

      // 4. Update Original Wager & Record Cashout Statement
      const updatedDetails = `${details} · Cashed out @ ${parsedCurrentOdds.toFixed(2)} (Payout: ₹${finalCashoutValue})`;
      const cashoutTxId = `TX-CO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const updatedOriginalTx: Transaction = {
        id: dbTx ? dbTx.id : (targetId || `TX-${Date.now()}`),
        type: 'trade',
        amount: dbTx ? dbTx.amount : initialStake,
        balanceAfter: newBalance,
        timestamp: dbTx ? dbTx.timestamp : Date.now(),
        details: updatedDetails,
        status: 'Completed'
      };

      const cashoutCreditTx: Transaction = {
        id: cashoutTxId,
        type: 'cashout',
        amount: finalCashoutValue,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Cashout Credit: ₹${finalCashoutValue} on ${details.split('on ')[1] || details}`,
        status: 'Completed'
      };

      const updates: any = {
        balance: newBalance,
        transactions: [updatedOriginalTx, cashoutCreditTx]
      };

      if (accountType === 'real') {
        updates.realBalance = newBalance;
        updates.realTransactions = updates.transactions;
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = updates.transactions;
      }

      // 5. Delete the Position row from PostgreSQL
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
        cashoutAmount: finalCashoutValue,
        transactionId: cashoutTxId
      };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error, currentStatus: (result as any).currentStatus }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      cashoutAmount: result.cashoutAmount,
      transactionId: result.transactionId
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sports Cashout API Error:", err);
    return NextResponse.json({
      error: 'Failed to process sports cashout.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
