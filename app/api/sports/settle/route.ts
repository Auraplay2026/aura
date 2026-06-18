import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { email, transactionId, status, payout } = await request.json();

    if (!email || !transactionId || !status || payout === undefined) {
      return NextResponse.json({ error: 'Missing settlement parameters: email, transactionId, status, payout.' }, { status: 400 });
    }

    if (status !== 'Won' && status !== 'Lost') {
      return NextResponse.json({ error: 'Invalid settlement status. Must be "Won" or "Lost".' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { transactions: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    // Locate the target transaction
    const dbTx = user.transactions.find((t: any) => t.id === transactionId);
    if (!dbTx) {
      return NextResponse.json({ error: 'Wager transaction not found.' }, { status: 404 });
    }

    if (dbTx.status !== 'Pending') {
      return NextResponse.json({ error: 'Wager is already settled or cancelled.', currentStatus: dbTx.status }, { status: 400 });
    }

    // Parse stake and odds from transaction details to perform math validation
    // E.g.: "Placed ₹100 Lay bet (Liability: ₹50.00) on team @ 1.50 (match)"
    // Or: "Placed ₹100 Back bet on team @ 1.50 (match)"
    const details = dbTx.details || "";
    const isLay = details.includes("Lay bet");
    
    const stakeMatch = details.match(/Placed\s+₹?([\d.]+)/i);
    const oddsMatch = details.match(/@\s+([\d.]+)/i);

    if (!stakeMatch || !oddsMatch) {
      return NextResponse.json({ error: 'Failed to parse wager parameters for validation.' }, { status: 400 });
    }

    const stake = parseFloat(stakeMatch[1]);
    const odds = parseFloat(oddsMatch[1]);
    const liability = isLay ? stake * (odds - 1) : 0;
    const totalRequired = stake + liability;

    let expectedPayout = 0;
    if (status === 'Won') {
      expectedPayout = isLay ? totalRequired : Math.round(stake * odds * 100) / 100;
    }

    // Enforce math validation
    if (Math.abs(payout - expectedPayout) > 0.05) {
      return NextResponse.json({ 
        error: 'LEDGER_INTEGRITY_VIOLATION: Settlement payout does not match calculated wagers and odds.',
        expected: expectedPayout,
        received: payout
      }, { status: 400 });
    }

    const accountType = user.accountType === 'real' ? 'real' : 'demo';
    const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;
    const newBalance = activeBalance + payout;

    // Update transaction status and details in DB
    const updatedDetails = `${details} · Settle: ${status}`;
    
    // Perform update
    const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const tx: Transaction = {
      id: transactionId, // update the pending transaction status
      type: 'trade',
      amount: dbTx.amount, // keep the wager amount reference
      balanceAfter: newBalance,
      timestamp: dbTx.timestamp,
      details: updatedDetails,
      status: status
    };

    const updates: any = {
      balance: newBalance,
      transactions: [tx]
    };

    // If won and payout > 0, we also record a separate deposit transaction for payout trace
    let payoutTx: Transaction | null = null;
    if (status === 'Won' && payout > 0) {
      payoutTx = {
        id: txId,
        type: 'deposit',
        amount: payout,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: `Settle Payout: ${details.split('on')[1] || details}`,
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

    await updateUser(email, updates);

    return NextResponse.json({
      success: true,
      newBalance,
      transactionId: transactionId,
      payoutTransactionId: payoutTx ? txId : undefined
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sportsbook Settlement API Error:", err);
    return NextResponse.json({ error: 'Failed to settle sports wager.', details: err?.message }, { status: 500 });
  }
}
