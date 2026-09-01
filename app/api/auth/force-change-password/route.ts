import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { addActivityLog, sanitizeUserProfile } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { syncUserToSupabaseAuth } from '@/lib/supabaseAuthSync';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNewPassword = newPassword.trim();

    if (cleanNewPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { username: { equals: cleanEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    // Verify current temporary password if provided
    if (currentPassword) {
      const cleanPassword = currentPassword.trim();
      const storedPasswordHash = (user.passwordHash || '').trim();
      let passwordMatch = false;

      if (storedPasswordHash.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(cleanPassword, storedPasswordHash);
      } else {
        passwordMatch = cleanPassword === storedPasswordHash;
      }

      const isFallbackAdmin = user.username.toLowerCase() === 'admin' || user.role === 'admin';
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
        return NextResponse.json({ error: 'Incorrect temporary password.' }, { status: 400 });
      }
    }

    // Hash new password securely
    const newPasswordHash = await bcrypt.hash(cleanNewPassword, 10);

    // 1. Update in PostgreSQL public.User
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        adminNotes: user.adminNotes === 'FORCE_PASSWORD_CHANGE' ? null : user.adminNotes
      }
    });

    // 2. Synchronize to Supabase auth.users & clear must_change_password flag
    await syncUserToSupabaseAuth({
      id: user.id,
      email: user.email || `${user.username.toLowerCase()}@aurabet.io`,
      username: user.username,
      passwordHash: newPasswordHash,
      mustChangePassword: false
    });

    const userIdentifier = user.email || user.username;
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    
    await addActivityLog(userIdentifier, {
      action: "Password Changed (First Login)",
      device,
      location: `${state}, ${countryCode}`,
      ip,
      type: 'success'
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
      user: sanitizeUserProfile(updatedUser)
    }, { status: 200 });
  } catch (err: any) {
    console.error("[Force Change Password Error]:", err);
    return NextResponse.json({ error: err?.message || 'Failed to process password change.' }, { status: 500 });
  }
}
