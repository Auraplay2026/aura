import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      return NextResponse.json({ error: 'User with this email or username not found.' }, { status: 404 });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Update user in DB
    await updateUser(user.email, {
      resetCode,
      resetCodeExpires
    });

    // Audit logs
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    await addActivityLog(user.email, {
      action: "Password Reset Code Requested",
      device,
      location: locationString,
      ip,
      type: 'warning'
    });

    console.log(`[PASS_RESET_DEBUG] User ${user.email} reset code is: ${resetCode}`);

    return NextResponse.json({
      success: true,
      message: 'Reset code generated successfully.',
      debugCode: resetCode // Passed in response so demo UI can show it directly
    }, { status: 200 });

  } catch (err) {
    console.error("Forgot password route error:", err);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
