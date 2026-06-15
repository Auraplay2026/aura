import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addActivityLog, updateUser } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify current password (plain text equality check matching app/api/auth/login/route.ts)
    if (user.passwordHash !== currentPassword) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
    }

    // Sniff IP and User-Agent for audit log
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    // Update password
    await updateUser(email, { passwordHash: newPassword });

    // Log security activity
    await addActivityLog(email, {
      action: "Password Updated Successfully",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Change password route error:", err);
    return NextResponse.json({ error: 'Failed to process change password request.' }, { status: 500 });
  }
}
