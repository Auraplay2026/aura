import { NextResponse } from 'next/server';
import { updateUser, addActivityLog } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';
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

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    // Sniff IP and User-Agent
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    // Read current state to audit changes
    const existingUser = await prisma.user.findUnique({ 
      where: { email }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
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

    if (hasCompletedOnboarding !== undefined && !existingUser.hasCompletedOnboarding && hasCompletedOnboarding) {
      await addActivityLog(email, {
        action: "Onboarding Completed",
        device,
        location: locationString,
        ip,
        type: 'success'
      });
    }

    // Build the sync updates payload. Strictly omit any balance mutations, positions, or transactions.
    const updates: any = {
      accountType: accountType === 'real' ? 'real' : 'demo'
    };
    
    if (username !== undefined) updates.username = username;
    if (hasCompletedOnboarding !== undefined) updates.hasCompletedOnboarding = !!hasCompletedOnboarding;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (gamingState !== undefined) updates.gamingState = gamingState;
    if (upiId !== undefined) updates.upiId = upiId;
    if (fullName !== undefined) updates.fullName = fullName;
    if (dob !== undefined) updates.dob = dob;
    if (address !== undefined) updates.address = address;
    if (notifications !== undefined) updates.notifications = notifications;
    
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
