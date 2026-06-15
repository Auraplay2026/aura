import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/userDb';

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
      vipRewardsClaimed
    } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required for sync.' }, { status: 400 });
    }
    
    const updates: any = {
      accountType: accountType === 'real' ? 'real' : 'demo',
      balance,
      positions,
      transactions
    };
    
    if (username !== undefined) updates.username = username;
    if (hasCompletedOnboarding !== undefined) {
      updates.hasCompletedOnboarding = !!hasCompletedOnboarding;
    }
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (gamingState !== undefined) updates.gamingState = gamingState;
    if (upiId !== undefined) updates.upiId = upiId;
    if (notifications !== undefined) updates.notifications = notifications;
    if (totalWagered !== undefined) updates.totalWagered = totalWagered;
    if (vipLevel !== undefined) updates.vipLevel = vipLevel;
    if (manualVipLevel !== undefined) updates.manualVipLevel = manualVipLevel;
    if (vipRewardsClaimed !== undefined) updates.vipRewardsClaimed = vipRewardsClaimed;
    
    // Write changes into the specific wallet to keep them isolated
    if (accountType === 'real') {
      updates.realBalance = balance;
      updates.realPositions = positions;
      updates.realTransactions = transactions;
    } else {
      updates.demoBalance = balance;
      updates.demoPositions = positions;
      updates.demoTransactions = transactions;
    }
    
    const updated = await updateUser(email, updates);
    
    if (!updated) {
      return NextResponse.json({ error: 'User not found on server database.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to sync user state.' }, { status: 500 });
  }
}
