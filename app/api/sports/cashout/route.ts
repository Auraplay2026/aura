import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, transactionId, currentOdds } = await request.json();

    if (!email || !transactionId || currentOdds === undefined) {
      return NextResponse.json({ error: 'Missing required parameters: email, transactionId, currentOdds.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const parsedCurrentOdds = Number(currentOdds);
    if (isNaN(parsedCurrentOdds) || !isFinite(parsedCurrentOdds) || parsedCurrentOdds <= 1) {
      return NextResponse.json({ error: 'Current market odds must be a valid number > 1.' }, { status: 400 });
    }

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
        include: { transactions: true }
      });

      if (!user) {
        return { error: 'User profile not found.', status: 404 };
      }

      // 2. Locate the target pending wager
      const dbTx = user.transactions.find((t: any) => t.id === transactionId);
      if (!dbTx) {
        return { error: 'Wager transaction not found.', status: 404 };
      }

      if (dbTx.status !== 'Pending') {
        return { error: 'Only pending wagers can be cashed out.', currentStatus: dbTx.status, status: 400 };
      }

      // 3. Parse stake and initial odds from transaction details
      const details = dbTx.details || "";
      const isLay = details.includes("Lay bet");
      
      const stakeMatch = details.match(/Placed\s+₹?([\d.]+)/i);
      const oddsMatch = details.match(/@\s+([\d.]+)/i);

      if (!stakeMatch || !oddsMatch) {
        return { error: 'Failed to parse wager parameters for cashout.', status: 400 };
      }

      const initialStake = parseFloat(stakeMatch[1]);
      const initialOdds = parseFloat(oddsMatch[1]);

      // 4. Dynamic Cashout Calculation with 5% Anti-Arbitrage Margin Fee
      // Formula: CashoutValue = (Stake * (InitialOdds / CurrentOdds)) * (1 - MarginFee)
      const marginFee = 0.05; // 5%
      let rawCashoutValue = 0;

      if (!isLay) {
        // Back Bet Cashout
        rawCashoutValue = (initialStake * (initialOdds / parsedCurrentOdds)) * (1 - marginFee);
      } else {
        // Lay Bet Cashout: Payout is higher when current odds drift higher than initial lay odds
        rawCashoutValue = (initialStake * (parsedCurrentOdds / initialOdds)) * (1 - marginFee);
      }

      // Cap cashout value between 1% of stake and maximum potential payout
      const maxPayout = initialStake * initialOdds;
      const finalCashoutValue = Math.max(
        Math.round(initialStake * 0.01 * 100) / 100,
        Math.min(Math.round(maxPayout * 100) / 100, Math.round(rawCashoutValue * 100) / 100)
      );

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;
      const newBalance = Math.round((activeBalance + finalCashoutValue) * 100) / 100;

      // 5. Update Original Wager & Record Cashout Statement
      const updatedDetails = `${details} · Cashed out @ ${parsedCurrentOdds.toFixed(2)} (Payout: ₹${finalCashoutValue})`;
      const cashoutTxId = `TX-CO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const updatedOriginalTx: Transaction = {
        id: transactionId,
        type: 'trade',
        amount: dbTx.amount,
        balanceAfter: newBalance,
        timestamp: dbTx.timestamp,
        details: updatedDetails,
        status: 'Completed'
      };

      const cashoutCreditTx: Transaction = {
        id: cashoutTxId,
        type: 'cashout',
        amount: finalCashoutValue,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Cashout Credit: ₹${finalCashoutValue} on ${details.split('on')[1] || details}`,
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
    return NextResponse.json({ error: 'Failed to process sports cashout.', details: err?.message }, { status: 500 });
  }
}
