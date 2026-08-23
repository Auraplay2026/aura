import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.adminNotes !== "FORCE_PASSWORD_CHANGE") {
      return NextResponse.json({ error: 'Not eligible for forced password change.' }, { status: 400 });
    }

    // Verify current password
    const isFallbackAdmin = user.username.toLowerCase() === 'admin' || user.role === 'admin';
    let passwordMatch = false;
    const cleanPassword = currentPassword.trim();
    const storedPasswordHash = (user.passwordHash || '').trim();

    if (storedPasswordHash.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(cleanPassword, storedPasswordHash);
    } else {
      passwordMatch = cleanPassword === storedPasswordHash;
    }

    if (!passwordMatch && isFallbackAdmin) {
      const allowedKeys = [
        process.env.ADMIN_FALLBACK_PASSWORD,
        process.env.ADMIN_DEFAULT_PASSWORD,
        process.env.ADMIN_PASSCODE,
        process.env.ADMIN_SECRET_KEY,
      ].filter(Boolean);
      if (allowedKeys.includes(cleanPassword)) {
        passwordMatch = true;
      }
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
    }

    // Update password and clear the adminNotes
    const userIdentifier = user.email || user.username;
    await updateUser(userIdentifier, {
      passwordHash: await bcrypt.hash(newPassword, 12),
      adminNotes: null
    });

    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    
    await addActivityLog(userIdentifier, {
      action: "Forced Password Change Successfully",
      device,
      location: `${state}, ${countryCode}`,
      ip,
      type: 'success'
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Force change password route error:", err);
    return NextResponse.json({ error: 'Failed to process password change request.' }, { status: 500 });
  }
}
