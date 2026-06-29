import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, findUserByUsername, addUser, updateUser, UserProfile, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { setUserAuthCookie } from '@/lib/userAuth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, email, password, accountType = 'demo', referralCode = '' } = await request.json();
    
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    
    if (await findUserByUsername(username)) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
    }
    
    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: 'Email address is already registered.' }, { status: 400 });
    }

    // Sniff IP and User-Agent
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser: UserProfile = {
      username,
      email,
      passwordHash: hashedPassword,
      accountType: accountType === 'real' ? 'real' : 'demo',
      balance: accountType === 'real' ? 0 : 100000,
      positions: [],
      transactions: [],
      demoBalance: 100000,
      demoPositions: [],
      demoTransactions: [],
      realBalance: 0,
      realPositions: [],
      realTransactions: [],
      affiliateCode: username.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
      referredBy: referralCode,
      referralCount: 0,
      affiliateEarnings: 0
    };
    
    await addUser(newUser);

    // Record dynamic login activities for audit trail
    await addActivityLog(newUser.email, {
      action: "Successful Registration",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    await addActivityLog(newUser.email, {
      action: "Onboarding Initialized",
      device,
      location: locationString,
      ip,
      type: 'info'
    });

    // If they were referred by someone, increment the referrer's count
    if (referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { affiliateCode: referralCode }
      });
      if (referrer) {
        await updateUser(referrer.email, { referralCount: (referrer.referralCount || 0) + 1 });
      }
    }
    
    const { passwordHash, ...safeUser } = newUser;
    const response = NextResponse.json({ success: true, user: safeUser }, { status: 201 });
    await setUserAuthCookie(response, newUser.email);
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process signup request.' }, { status: 500 });
  }
}
