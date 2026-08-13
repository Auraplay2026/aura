import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, Transaction } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';
import { validateBetSecurity } from '@/lib/security/fraudGuard';
import { validateResponsibleGaming } from '@/lib/compliance/limits';

export async function POST(request: Request) {
  try {
    const { email, matchTitle, selection, odds, stake, side, uuid, currentMarketOdds, marketStatus } = await request.json();

    if (!email || !matchTitle || !selection || !odds || !stake) {
      return NextResponse.json({ error: 'Missing required sportsbook bet parameters.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    // Anti-Fraud & Velocity Protection
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const fraudCheck = await validateBetSecurity({
      userIdOrEmail: email,
      ip: clientIp,
      matchTitle,
      selection,
      side: side || 'yes',
      stake: Number(stake),
      odds: Number(odds)
    });

    if (!fraudCheck.allowed) {
      return NextResponse.json({ error: fraudCheck.reason, flagType: fraudCheck.flagType }, { status: 429 });
    }

    // Anti-Courtsiding & Market Status Guard
    if (marketStatus && (marketStatus === 'SUSPENDED' || marketStatus === 'suspended' || marketStatus === 'Closed')) {
      return NextResponse.json({ error: 'MARKET_SUSPENDED: Wagers are temporarily suspended on this market.' }, { status: 400 });
    }

    const parsedStake = Number(stake);
    const parsedOdds = Number(odds);

    if (
      typeof stake !== 'number' || isNaN(parsedStake) || !isFinite(parsedStake) || parsedStake <= 0 ||
      typeof odds !== 'number' || isNaN(parsedOdds) || !isFinite(parsedOdds) || parsedOdds <= 1
    ) {
      return NextResponse.json({ error: 'Stake must be positive and odds must be greater than 1.' }, { status: 400 });
    }

    // Anti-Courtsiding Odds Slippage Guard (> 5% drift)
    if (currentMarketOdds && typeof currentMarketOdds === 'number' && currentMarketOdds > 0) {
      const oddsDrift = Math.abs(parsedOdds - currentMarketOdds) / currentMarketOdds;
      if (oddsDrift > 0.05) {
        return NextResponse.json({ 
          error: 'ODDS_DRIFT_EXCEEDED: Market odds shifted by more than 5% during execution buffer. Please reconfirm.',
          requestedOdds: parsedOdds,
          currentOdds: currentMarketOdds,
          driftPercentage: (oddsDrift * 100).toFixed(1) + '%'
        }, { status: 400 });
      }
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
        include: { transactions: true }
      });

      if (!user) {
        return { error: 'User profile not found.', status: 404 };
      }

      // Responsible Gaming & Compliance Limits Check
      const compliance = validateResponsibleGaming({
        user,
        stakeOrAmount: parsedStake,
        actionType: 'bet'
      });

      if (!compliance.allowed) {
        return { error: compliance.reason, status: 403 };
      }

      const accountType = user.accountType === 'real' ? 'real' : 'demo';
      const activeBalance = accountType === 'real' ? user.realBalance : user.demoBalance;

      // Calculate total required amount (Lay bet liability: Stake * (Odds - 1))
      const potentialLiability = side === 'no' ? stake * (odds - 1) : 0;
      const totalRequired = stake + potentialLiability;

      if (activeBalance < totalRequired) {
        return { error: 'INSUFFICIENT_FUNDS', required: totalRequired, available: activeBalance, status: 400 };
      }

      const newBalance = Math.round((activeBalance - totalRequired) * 100) / 100;

      // Format transaction details string
      const detailsStr = side === 'no'
        ? `Placed ₹${stake} Lay bet (Liability: ₹${potentialLiability.toFixed(2)}) on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`
        : `Placed ₹${stake} Back bet on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`;

      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const tx: Transaction = {
        id: txId,
        type: 'trade',
        amount: totalRequired,
        balanceAfter: newBalance,
        timestamp: Date.now(),
        details: detailsStr,
        status: 'Pending'
      };

      const updates: any = {
        balance: newBalance,
        transactions: [tx]
      };

      if (accountType === 'real') {
        updates.realBalance = newBalance;
        updates.realTransactions = [tx];
        const newTotalWagered = (user.totalWagered || 0) + totalRequired;
        updates.totalWagered = newTotalWagered;
        
        // VIP Level Calculations
        let resolvedVipLevel = user.vipLevel || 'Bronze';
        if (!user.manualVipLevel || user.manualVipLevel === 'Auto') {
          if (newTotalWagered >= 5000000) resolvedVipLevel = 'Diamond';
          else if (newTotalWagered >= 1000000) resolvedVipLevel = 'Platinum';
          else if (newTotalWagered >= 250000) resolvedVipLevel = 'Gold';
          else if (newTotalWagered >= 50000) resolvedVipLevel = 'Silver';
          else resolvedVipLevel = 'Bronze';
        } else {
          resolvedVipLevel = user.manualVipLevel;
        }
        updates.vipLevel = resolvedVipLevel;
      } else {
        updates.demoBalance = newBalance;
        updates.demoTransactions = [tx];
      }

      const marketIdGenerated = `SPORT-${(matchTitle || 'MATCH').replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`;
      const positionTitle = `${matchTitle}: ${selection} (${odds.toFixed(2)})`;
      const sharesCount = side === 'no' ? stake : Math.round(stake * odds * 100) / 100;

      const createdPosition = await txClient.position.create({
        data: {
          userId: user.id,
          marketId: marketIdGenerated,
          marketTitle: positionTitle,
          side: side || 'yes',
          shares: sharesCount,
          buyPrice: odds,
          investment: totalRequired,
          timestamp: Date.now(),
          walletType: accountType
        }
      });

      await updateUser(email, updates, txClient);

      return {
        success: true,
        transactionId: txId,
        newBalance,
        position: createdPosition,
        tx
      };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error, required: (result as any).required, available: (result as any).available }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      position: result.position,
      tx: result.tx
    }, { status: 200 });

  } catch (err: any) {
    console.error("Sportsbook Bet API Error:", err);
    return NextResponse.json({
      error: 'Failed to place sports wager.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
