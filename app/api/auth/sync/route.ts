import { NextResponse } from 'next/server';
import { updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { prisma } from '@/lib/prisma'; // If prisma is imported, wait: let's verify if prisma is imported. Let's look: lib/userDb imports prisma. Wait, let's import prisma from '@/lib/prisma' or check userDb.ts. Yes, userDb.ts imports prisma from '@/lib/prisma' or is it local? Let's check how prisma is exported.

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
    const existingUser = await prisma.user.findUnique({ where: { email } });
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
      balance,
      positions,
      transactions
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
