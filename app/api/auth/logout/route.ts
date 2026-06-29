import { NextResponse } from 'next/server';
import { clearUserAuthCookie } from '@/lib/userAuth';

/**
 * POST /api/auth/logout
 * 
 * Clears the httpOnly auth cookies so the session is fully destroyed.
 * The client must also clear its local Zustand state.
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });
    clearUserAuthCookie(response);
    return response;
  } catch (err) {
    console.error('[Logout API Error]:', err);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
