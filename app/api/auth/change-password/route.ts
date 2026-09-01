import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { syncUserToSupabaseAuth } from '@/lib/supabaseAuthSync';
import { sanitizeUserProfile } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

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

    // Hash new password
    const newPasswordHash = await bcrypt.hash(cleanNewPassword, 10);

    // 1. Update in public.User
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash
      }
    });

    // 2. Update in Supabase auth.users and permanently clear must_change_password
    await syncUserToSupabaseAuth({
      id: user.id,
      email: user.email || `${user.username.toLowerCase()}@aurabet.io`,
      username: user.username,
      passwordHash: newPasswordHash,
      mustChangePassword: false
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now access your account.',
      user: sanitizeUserProfile(updatedUser)
    }, { status: 200 });
  } catch (err: any) {
    console.error("[Change Password Error]:", err);
    return NextResponse.json({ error: err?.message || 'Failed to update password.' }, { status: 500 });
  }
}