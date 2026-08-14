import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, wager, payout, gameTitle, commission, uuid } = await request.json();

    if (!email || wager === undefined || payout === undefined) {
      return NextResponse.json({ error: 'Missing parameters: email, wager, payout are required.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const parsedWager = Math.max(0, Number(wager));
    const parsedPayout = Math.max(0, Number(payout));
    const parsedCommission = Math.max(0, Number(commission || 0));
    const totalDeduction = parsedWager + parsedCommission;

    const result = await prisma.$transaction(async (tx) => {
      const lockedRows: any[] = await tx.$queryRaw`
        SELECT id FROM "User"
        WHERE LOWER(email) = LOWER(${email}) OR LOWER(username) = LOWER(${email})
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      const user = await tx.user.findFirst({
        where: { id: lockedRows[0].id },
        include: { transactions: true }
      });

      if (!user) throw new Error('USER_NOT_FOUND');

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;

      if (totalDeduction > activeBalance && parsedWager > 0) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      const netChange = parsedPayout - totalDeduction;
      const newBalance = Math.max(0, Math.round((activeBalance + netChange) * 100) / 100);

      const txId = uuid || `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const txDetails = parsedCommission > 0
        ? `Played ${gameTitle || 'Casino'} (Wager: ₹${parsedWager} + ₹${parsedCommission.toFixed(2)} Live Fee, Payout: ₹${parsedPayout})`
        : `Played ${gameTitle || 'Casino'} (Wager: ₹${parsedWager}, Payout: ₹${parsedPayout})`;

      const txItem: Transaction = {
        id: txId,
        type: 'casino',
        amount: Math.abs(netChange),
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: txDetails,
        status: 'Completed'
      };

      const updates: any = {
        balance: newBalance,
        transactions: [txItem]
      };

      if (accountType === 'real') {
        updates.realBalance = newBalance;
        updates.realTransactions = [txItem];
        const newTotalWagered = (user.totalWagered || 0) + parsedWager;
        updates.totalWagered = newTotalWagered;
        
        let resolvedVip = user.vipLevel || 'Bronze';
        if (!user.manualVipLevel || user.manualVipLevel === 'Auto') {
          if (newTotalWagered >= 5000000) resolvedVip = 'Diamond';
          else if (newTotalWagered >= 1000000) resolvedVip = 'Platinum';
          else if (newTotalWagered >= 250000) resolvedVip = 'Gold';
          else if (newTotalWagered >= 50000) resolvedVip = 'Silver';
          else resolvedVip = 'Bronze';
        } else {
          resolvedVip = user.manualVipLevel;
        }
        updates.vipLevel = resolvedVip;
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = [txItem];
      }

      await updateUser(email, updates, tx);

      return { newBalance, txItem };
    });

    return NextResponse.json({ 
      success: true, 
      balance: result.newBalance, 
      transaction: result.txItem 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Failed to record casino wager in PostgreSQL:", err);
    return NextResponse.json({ error: err.message || 'Failed to record casino wager.' }, { status: 400 });
  }
}
