import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { emailOrUsername, password } = await request.json();
    
    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    
    const user = await findUserByEmailOrUsername(emailOrUsername);
    if (!user) {
      if (emailOrUsername === 'admin@aurabet.io' && password === 'AuraAdmin2026!') {
        // Hardcoded admin fallback
        const fallbackAdmin = {
          id: 'admin_fallback_id',
          username: 'admin',
          email: 'admin@aurabet.io',
          role: 'admin',
          balance: 100000,
          realBalance: 100000,
          demoBalance: 100000,
          accountType: 'real',
          positions: [],
          transactions: [],
          demoPositions: [],
          demoTransactions: [],
          realPositions: [],
          realTransactions: []
        };
        return NextResponse.json({ success: true, user: fallbackAdmin }, { status: 200 });
      }

      return NextResponse.json({ error: 'Invalid username or email address.' }, { status: 400 });
    }
    
    if (user.passwordHash !== password) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
    }
    
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process login request.' }, { status: 500 });
  }
}
