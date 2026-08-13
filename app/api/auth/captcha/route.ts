import { NextResponse } from 'next/server';
import { signJWT } from '@/lib/jwt';
import crypto from 'crypto';

export async function GET() {
  try {
    const code = crypto.randomInt(1000, 10000).toString();
    const exp = Math.floor(Date.now() / 1000) + 120; // 2 minutes expiry
    const token = await signJWT({ code, exp });

    const response = NextResponse.json({ success: true, code }, { status: 200 });
    
    response.cookies.set('captcha_secret', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 120,
      path: '/'
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({
      error: 'Failed to generate captcha.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
