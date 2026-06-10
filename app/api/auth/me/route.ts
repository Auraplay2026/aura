import { NextResponse } from 'next/server';
import { findUserByEmail, sanitizeUserProfile } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    
    const user = findUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    
    const sanitizedUser = sanitizeUserProfile(user);
    
    return NextResponse.json({ success: true, user: sanitizedUser }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch user state:", err);
    return NextResponse.json({ error: 'Failed to fetch user state.' }, { status: 500 });
  }
}
