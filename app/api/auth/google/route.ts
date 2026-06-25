import { NextResponse } from 'next/server';
import { findUserByEmail, addUser, UserProfile, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { setUserAuthCookie } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email, name, idToken } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (idToken) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!verifyRes.ok) {
          return NextResponse.json({ error: 'Invalid Google ID Token.' }, { status: 401 });
        }
        const verifyPayload = await verifyRes.json();
        
        // Verify audience matches the Google Client ID
        const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "61951094794-rj86fgkpigssgt7j1j5psuptgloul2e9.apps.googleusercontent.com";
        if (verifyPayload.aud !== expectedClientId) {
          return NextResponse.json({ error: 'Audience mismatch. Invalid Client ID.' }, { status: 401 });
        }

        // Verify email matches
        if (verifyPayload.email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({ error: 'Email claim mismatch.' }, { status: 401 });
        }
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to verify Google ID Token.', details: err.message }, { status: 401 });
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Google ID Token is required in production.' }, { status: 400 });
      }
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
    const response = NextResponse.json({ success: true, user: safeUser }, { status: 200 });
    await setUserAuthCookie(response, user.email);
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process Google authentication.' }, { status: 500 });
  }
}
