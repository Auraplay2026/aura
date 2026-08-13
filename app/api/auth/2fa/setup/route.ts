import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecret } from '@/lib/totp';
import { verifyUserSession } from '@/lib/userAuth';
import { findUserByEmailOrUsername } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const secret = generateSecret();
    const issuer = "BetMatrix";
    const label = encodeURIComponent(email);
    // Standard TOTP Key URI for Google Authenticator / standard 2FA apps
    const keyUri = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;

    return NextResponse.json({
      success: true,
      secret,
      keyUri
    }, { status: 200 });
  } catch (err) {
    console.error("2FA setup error:", err);
    return NextResponse.json({ error: 'Failed to initiate 2FA setup.' }, { status: 500 });
  }
}
