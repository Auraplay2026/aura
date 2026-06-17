import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!user.resetCode || user.resetCode !== code) {
      return NextResponse.json({ error: 'Invalid reset code. Please try again.' }, { status: 400 });
    }

    if (!user.resetCodeExpires || user.resetCodeExpires < Date.now()) {
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 });
    }

    // Reset password and clear code columns
    await updateUser(user.email, {
      passwordHash: newPassword,
      resetCode: "",
      resetCodeExpires: 0
    });

    // Audit logs
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    await addActivityLog(user.email, {
      action: "Password Reset Successfully",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully.'
    }, { status: 200 });

  } catch (err) {
    console.error("Reset password route error:", err);
    return NextResponse.json({ error: 'Failed to process password reset.' }, { status: 500 });
  }
}
