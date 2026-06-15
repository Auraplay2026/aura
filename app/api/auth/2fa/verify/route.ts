import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUser, addActivityLog } from '@/lib/userDb';
import { verifyTOTP } from '@/lib/totp';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const { email, token, secret, enable } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and verification code (token) are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Sniff IP and User-Agent for audit log
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    if (enable) {
      if (!secret) {
        return NextResponse.json({ error: 'Secret is required to enable 2FA.' }, { status: 400 });
      }

      // Verify the code against the new secret
      const isValid = verifyTOTP(token, secret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
      }

      // Update user db state
      await updateUser(email, {
        twoFactorEnabled: true,
        twoFactorSecret: secret
      });

      // Log successful activation
      await addActivityLog(email, {
        action: "Two-Factor Authentication Enabled",
        device,
        location: locationString,
        ip,
        type: 'success'
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      // Disabling 2FA
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json({ error: '2FA is not enabled for this account.' }, { status: 400 });
      }

      // Verify token against stored secret
      const isValid = verifyTOTP(token, user.twoFactorSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
      }

      // Update user db state
      await updateUser(email, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined // clears DB field in prisma
      });

      // Log disablement
      await addActivityLog(email, {
        action: "Two-Factor Authentication Disabled",
        device,
        location: locationString,
        ip,
        type: 'info'
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (err) {
    console.error("2FA verify error:", err);
    return NextResponse.json({ error: 'Failed to verify 2FA code.' }, { status: 500 });
  }
}
