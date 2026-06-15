import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Generate a secure challenge incorporating a timestamp and random bytes
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const rawChallenge = `${timestamp}:${nonce}`;
    
    return NextResponse.json({
      success: true,
      challenge: rawChallenge
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
