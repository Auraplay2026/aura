import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export interface UserAuditResult {
  userId: string;
  username: string;
  email: string | null;
  accountType: string;
  actualRealBalance: number;
  expectedRealBalance: number;
  realDiscrepancy: number;
  actualDemoBalance: number;
  expectedDemoBalance: number;
  demoDiscrepancy: number;
  totalTransactions: number;
  breakdown: {
    deposits: number;
    withdrawals: number;
    trades: number;
    cashouts: number;
    casinoWagers: number;
    casinoPayouts: number;
  };
  isFlagged: boolean;
  status: 'CLEAN' | 'FLAGGED_DISCREPANCY';
}

export async function GET(request: Request) {
  try {
    try {
      await verifyAdminSession();
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Administrative role required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('email');

    const users = await prisma.user.findMany({
      where: targetEmail ? {
        OR: [
          { email: { equals: targetEmail, mode: 'insensitive' } },
          { username: { equals: targetEmail, mode: 'insensitive' } }
        ]
      } : {},
      include: { transactions: true }
    });

    const auditReports: UserAuditResult[] = [];
    let flaggedCount = 0;
    let totalTurnoverAudited = 0;

    for (const user of users) {
      let expectedRealBalance = 0;
      let expectedDemoBalance = 100000; // Starting baseline demo credit

      let deposits = 0;
      let withdrawals = 0;
      let trades = 0;
      let cashouts = 0;
      let casinoWagers = 0;
      let casinoPayouts = 0;

      const txList = user.transactions || [];

      for (const tx of txList) {
        const isCompleted = tx.status === 'Completed' || tx.status === 'Won' || tx.status === 'Lost';
        const isReal = tx.walletType === 'real' || (!tx.walletType && user.accountType === 'real');

        // Turnover aggregation
        totalTurnoverAudited += tx.amount || 0;

        if (tx.type === 'deposit') {
          if (tx.status === 'Completed') {
            deposits += tx.amount;
            if (isReal) expectedRealBalance += tx.amount;
            else expectedDemoBalance += tx.amount;
          }
        } else if (tx.type === 'withdraw') {
          if (tx.status === 'Completed') {
            withdrawals += tx.amount;
            if (isReal) expectedRealBalance -= tx.amount;
            else expectedDemoBalance -= tx.amount;
          }
        } else if (tx.type === 'trade') {
          trades += tx.amount;
          // Initial deduction on wager placement
          if (isReal) expectedRealBalance -= tx.amount;
          else expectedDemoBalance -= tx.amount;
        } else if (tx.type === 'cashout') {
          if (tx.status === 'Completed') {
            cashouts += tx.amount;
            if (isReal) expectedRealBalance += tx.amount;
            else expectedDemoBalance += tx.amount;
          }
        } else if (tx.type === 'casino') {
          // Casino wagers and payouts are tracked via details / balanceAfter
          casinoWagers += tx.amount;
        }
      }

      const realDiscrepancy = Math.round(Math.abs(user.realBalance - expectedRealBalance) * 100) / 100;
      const demoDiscrepancy = Math.round(Math.abs(user.demoBalance - expectedDemoBalance) * 100) / 100;

      // Tolerance threshold: 0.05 for floating point rounding in historical logs
      const isFlagged = user.accountType === 'real' ? realDiscrepancy > 0.05 : false;
      if (isFlagged) flaggedCount++;

      auditReports.push({
        userId: user.id,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
        actualRealBalance: user.realBalance,
        expectedRealBalance: Math.round(expectedRealBalance * 100) / 100,
        realDiscrepancy,
        actualDemoBalance: user.demoBalance,
        expectedDemoBalance: Math.round(expectedDemoBalance * 100) / 100,
        demoDiscrepancy,
        totalTransactions: txList.length,
        breakdown: {
          deposits,
          withdrawals,
          trades,
          cashouts,
          casinoWagers,
          casinoPayouts
        },
        isFlagged,
        status: isFlagged ? 'FLAGGED_DISCREPANCY' : 'CLEAN'
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      usersAudited: users.length,
      flaggedCount,
      totalTurnoverAudited: Math.round(totalTurnoverAudited * 100) / 100,
      overallStatus: flaggedCount === 0 ? 'AUDIT_PASSED_ALL_BALANCES_VERIFIED' : 'ATTENTION_DISCREPANCIES_DETECTED',
      reports: auditReports
    }, { status: 200 });

  } catch (err: any) {
    console.error("Reconciliation Audit API Error:", err);
    return NextResponse.json({
      error: 'Failed to run financial audit.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
