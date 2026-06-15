import { NextResponse } from 'next/server';
import { findUserByEmail, addUser, UserProfile } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    
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
    }
    
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process Google authentication.' }, { status: 500 });
  }
}
