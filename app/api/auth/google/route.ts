import { NextResponse } from 'next/server';
import { findUserByEmail, addUser, UserProfile, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Sniff IP and User-Agent for Google session auditing
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;
    
    let user = await findUserByEmail(email);
    if (!user) {
      // Auto-provision Google users on the server
      const username = name ? name.replace(/\s+/g, '') : email.split('@')[0];
      user = {
        username,
        email,
        passwordHash: 'google-oauth-user',
        accountType: 'demo', // default to demo, can be customized or selected in onboarding
        balance: 100000,
        positions: [],
        transactions: [],
        demoBalance: 100000,
        demoPositions: [],
        demoTransactions: [],
        realBalance: 0,
        realPositions: [],
        realTransactions: []
      };
      await addUser(user);

      // Audit new Google signup
      await addActivityLog(user.email, {
        action: "Successful Registration (Google)",
        device,
        location: locationString,
        ip,
        type: 'success'
      });

      await addActivityLog(user.email, {
        action: "Onboarding Initialized",
        device,
        location: locationString,
        ip,
        type: 'info'
      });
    }

    // Audit Google login
    await addActivityLog(user.email, {
      action: "Successful Login (Google)",
      device,
      location: locationString,
      ip,
      type: 'success'
    });
    
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process Google authentication.' }, { status: 500 });
  }
}
