import { NextResponse } from 'next/server';
import { updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { prisma } from '@/lib/prisma';
import { 
  checkCircuitBreaker, 
  isMarketSuspended, 
  computeIdempotencyHash, 
  isSettlementProcessed, 
  writeAuditLogEntry,
  SettlementEvent 
} from '@/lib/settlementEngine';

export async function POST(request: Request) {
  try {
    const { 
      email, 
      username,
      accountType, 
      balance, 
      positions, 
      transactions, 
      hasCompletedOnboarding,
      phoneNumber,
      gamingState,
      upiId,
      notifications,
      totalWagered,
      vipLevel,
      manualVipLevel,
      vipRewardsClaimed,
      kycStatus,
      fullName,
      dob,
      address,
      twoFactorEnabled
    } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required for sync.' }, { status: 400 });
    }

    // Sniff IP and User-Agent
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    // Read current state to audit changes
    // Fetch directly from DB using helper or select
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      include: { transactions: true }
    });

    // Validate transaction ledger integrity and block client-side injection/tampering
    if (existingUser && accountType === 'real') {
      const dbTxMap = new Map<string, any>();
      existingUser.transactions.forEach((t: any) => dbTxMap.set(t.id, t));

      for (const tx of transactions || []) {
        if (tx.type === 'deposit' || tx.type === 'withdraw') {
          const dbTx = dbTxMap.get(tx.id);
          if (dbTx && dbTx.amount !== tx.amount) {
            return NextResponse.json({ error: `Unauthorized transaction amount change detected for transaction ${tx.id}.` }, { status: 400 });
          }
          if (tx.status === 'Completed' || tx.status === 'Failed') {
            if (!dbTx) {
              return NextResponse.json({ error: 'Unauthorized completed transaction injection detected.' }, { status: 400 });
            }
            if (dbTx.status !== tx.status) {
              return NextResponse.json({ error: `Unauthorized transaction status change detected for transaction ${tx.id}.` }, { status: 400 });
            }
          }
        }
      }
    }

    // Extract and process any new wagers/settlements through the Settlement Engine
    const existingIds = new Set<string>();
    if (existingUser) {
      existingUser.transactions.forEach((t: any) => existingIds.add(t.id));
    }

    const txs = transactions || [];
    const newTxs = txs.filter((t: any) => !existingIds.has(t.id));

    for (const tx of newTxs) {
      const isCasino = tx.type === 'casino';
      const isSportsBet = tx.type === 'trade' && (tx.details.includes('Back bet') || tx.details.includes('Lay bet') || tx.details.includes('Placed'));
      const isPredictionBet = tx.type === 'trade' && tx.details.includes('Bought') && tx.details.includes('shares');
      const isSettlementPayout = tx.type === 'deposit' && tx.details.toLowerCase().includes('settle:');

      if (accountType === 'real' && (isCasino || isSportsBet || isPredictionBet || isSettlementPayout)) {
        let marketName = '';
        let selectionName = '';
        let stake = tx.amount;
        let odds = 1.0;
        let outcome = 'Pending';
        let targetId = '';

        if (isCasino) {
          const match = tx.details.match(/Played\s+(.*?)\s+\(Wager:\s*₹?([\d.]+)(?:\s*\+\s*₹?[\d.]+\s+Live\s+Fee)?,\s*Payout:\s*₹?([\d.]+)\)/i);
          if (match) {
            marketName = 'Casino';
            selectionName = match[1];
            stake = parseFloat(match[2]);
            const payout = parseFloat(match[3]);
            odds = stake > 0 ? parseFloat((payout / stake).toFixed(2)) : 1.0;
            outcome = payout > 0 ? 'Won' : 'Lost';
            targetId = `casino-${selectionName.replace(/\s+/g, '-').toLowerCase()}`;
          } else {
            marketName = 'Casino';
            selectionName = 'Casino Game';
            targetId = 'casino-generic';
          }
        } else if (isSportsBet) {
          const match = tx.details.match(/Placed\s+₹?([\d.]+)\s+(?:Back|Lay)\s+bet\s+(?:\(Liability:\s*₹?[\d.]+\)\s+)?on\s+(.*?)\s+@\s+([\d.]+)\s+\((.*?)\)/i);
          if (match) {
            stake = parseFloat(match[1]);
            selectionName = match[2];
            odds = parseFloat(match[3]);
            marketName = match[4];
            targetId = `sports-${marketName.replace(/\s+/g, '-').toLowerCase()}-${selectionName.replace(/\s+/g, '-').toLowerCase()}`;
          } else {
            marketName = 'Sportsbook';
            selectionName = 'Sports Bet';
            targetId = 'sports-generic';
          }
          outcome = tx.status === 'Completed' ? 'Won' : (tx.status === 'Failed' ? 'Lost' : 'Pending');
        } else if (isPredictionBet) {
          const match = tx.details.match(/Bought\s+([\d.]+)\s+shares\s+of\s+(.*?)\s+\((.*?)\)/i);
          if (match) {
            selectionName = match[3];
            marketName = match[2];
            targetId = `prediction-${marketName.replace(/\s+/g, '-').toLowerCase()}-${selectionName.replace(/\s+/g, '-').toLowerCase()}`;
          } else {
            marketName = 'Prediction';
            selectionName = 'Prediction Bet';
            targetId = 'prediction-generic';
          }
          outcome = tx.status === 'Completed' ? 'Won' : (tx.status === 'Failed' ? 'Lost' : 'Pending');
        } else if (isSettlementPayout) {
          const cleanMarket = tx.details.replace(/SETTLE:\s*/i, '').replace(/\s*Deposit/i, '');
          marketName = 'Sportsbook Settlement';
          selectionName = cleanMarket;
          stake = 0;
          odds = 0;
          outcome = 'Won';
          targetId = `settle-${cleanMarket.replace(/\s+/g, '-').toLowerCase()}`;
        }

        // Circuit breaker check (for wagers)
        if (stake > 0) {
          if (isMarketSuspended()) {
            return NextResponse.json({ 
              error: 'MARKET_SUSPENDED: The market is currently suspended due to active risk controls.' 
            }, { status: 400 });
          }
          const cbResult = checkCircuitBreaker(targetId, stake);
          if (cbResult.tripped) {
            return NextResponse.json({ 
              error: `CIRCUIT_BREAKER_TRIPPED: ${cbResult.alertMessage}` 
            }, { status: 400 });
          }
        }

        // Idempotency check
        const roundId = isSettlementPayout ? `payout-${tx.id}` : `round-${tx.id}`;
        const hash = computeIdempotencyHash(tx.id, roundId);
        if (isSettlementProcessed(hash)) {
          return NextResponse.json({ 
            error: `DUPLICATE_TRANSACTION: Settlement already processed for transaction ID ${tx.id}.` 
          }, { status: 400 });
        }

        // Write audit log entry (which also broadcasts telemetry)
        const event: SettlementEvent = {
          marketId: targetId,
          marketName,
          selectionName,
          stake,
          odds,
          outcome,
          userId: email,
          transactionId: tx.id,
          roundId,
          timestamp: tx.timestamp || Date.now()
        };
        writeAuditLogEntry(event, hash);
      }
    }

    if (existingUser) {
      // Security Check: Block unauthorized client-side KYC verified jumps
      if (kycStatus !== undefined && 
          (kycStatus === 'VERIFIED' || kycStatus === 'APPROVED') && 
          existingUser.kycStatus !== 'PROCESSING' && 
          existingUser.kycStatus !== 'PENDING' && 
          existingUser.kycStatus !== 'VERIFIED' && 
          existingUser.kycStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'Unauthorized KYC state transition detected.' }, { status: 400 });
      }

      // Security Check: Block arbitrary balance injections without matching transactions
      if (balance !== undefined && accountType === 'real') {
        const balanceDiff = balance - existingUser.realBalance;
        if (balanceDiff > 0.01) {
          const txs = transactions || [];
          const explanatoryAmount = txs.filter((t: any) => 
            t.status === 'Completed' && 
            (t.type === 'deposit' || t.type === 'cashout' || t.type === 'casino' || t.type === 'refund')
          ).reduce((sum: number, t: any) => sum + t.amount, 0);
          
          if (balanceDiff > explanatoryAmount + 5000) {
            return NextResponse.json({ error: 'Client balance verification mismatch detected.' }, { status: 400 });
          }
        }
      }

      if (accountType !== undefined && existingUser.accountType !== accountType) {
        await addActivityLog(email, {
          action: "Account Context Switched",
          device,
          location: locationString,
          ip,
          type: 'info'
        });
      }
      
      if (kycStatus !== undefined && existingUser.kycStatus !== kycStatus) {
        let action = "KYC Status Updated";
        let type = 'info';
        if (kycStatus === 'VERIFIED' || kycStatus === 'APPROVED') {
          action = "Identity Verification Approved";
          type = 'success';
        } else if (kycStatus === 'PROCESSING' || kycStatus === 'PENDING') {
          action = "KYC Review Initiated";
          type = 'info';
        } else if (kycStatus === 'REJECTED') {
          action = "Identity Verification Rejected";
          type = 'danger';
        }
        await addActivityLog(email, {
          action,
          device,
          location: locationString,
          ip,
          type
        });
      }
    }
    
    const updates: any = {
      accountType: accountType === 'real' ? 'real' : 'demo',
      positions
    };
    
    if (username !== undefined) updates.username = username;
    if (kycStatus !== undefined) updates.kycStatus = kycStatus;
    if (hasCompletedOnboarding !== undefined) {
      updates.hasCompletedOnboarding = !!hasCompletedOnboarding;
      if (existingUser && !existingUser.hasCompletedOnboarding && hasCompletedOnboarding) {
        await addActivityLog(email, {
          action: "Onboarding Completed",
          device,
          location: locationString,
          ip,
          type: 'success'
        });
      }
    }
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (gamingState !== undefined) updates.gamingState = gamingState;
    if (upiId !== undefined) updates.upiId = upiId;
    if (fullName !== undefined) updates.fullName = fullName;
    if (dob !== undefined) updates.dob = dob;
    if (address !== undefined) updates.address = address;
    if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = twoFactorEnabled;
    if (notifications !== undefined) updates.notifications = notifications;
    if (totalWagered !== undefined) updates.totalWagered = totalWagered;
    if (vipLevel !== undefined) updates.vipLevel = vipLevel;
    if (manualVipLevel !== undefined) updates.manualVipLevel = manualVipLevel;
    if (vipRewardsClaimed !== undefined) updates.vipRewardsClaimed = vipRewardsClaimed;
    
    // Write changes into the specific wallet to keep them isolated
    if (accountType === 'real') {
      updates.realPositions = positions;
    } else {
      updates.demoPositions = positions;
    }
    
    const updated = await updateUser(email, updates);
    
    if (!updated) {
      return NextResponse.json({ error: 'User not found on server database.' }, { status: 404 });
    }
    
    const freshUser = await prisma.user.findUnique({
      where: { email },
      include: { transactions: true }
    });
    
    const serverBalance = accountType === 'real' ? freshUser!.realBalance : freshUser!.demoBalance;
    const serverTransactions = freshUser!.transactions
      .filter((t: any) => t.walletType === accountType)
      .map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        timestamp: t.timestamp,
        details: t.details,
        status: t.status,
        upiId: t.upiId,
        utr: t.utr,
        screenshotUrl: t.screenshotUrl
      }));

    return NextResponse.json({ 
      success: true, 
      balance: serverBalance,
      transactions: serverTransactions
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to sync user state.' }, { status: 500 });
  }
}
