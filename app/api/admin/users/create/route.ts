import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { syncUserToSupabaseAuth } from '@/lib/supabaseAuthSync';
import { sanitizeUserProfile } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    try {
      await verifyAdminSession();
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, tempPassword, role = 'user', initialBalance = 0, mustChangePassword = true } = body;

    if (!username || !tempPassword) {
      return NextResponse.json({ error: 'Username and temporary password are required.' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanEmail = (email || `${cleanUsername.toLowerCase()}@aurabet.io`).trim().toLowerCase();
    const cleanTempPassword = tempPassword.trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long.' }, { status: 400 });
    }

    if (cleanTempPassword.length < 6) {
      return NextResponse.json({ error: 'Temporary password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: 'insensitive' } },
          { email: { equals: cleanEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'A user with this username or email already exists.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(cleanTempPassword, 10);
    const affiliateCode = cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 1. Create in PostgreSQL public.User
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role,
        balance: Number(initialBalance) || 0,
        realBalance: Number(initialBalance) || 0,
        demoBalance: 100000,
        hasCompletedOnboarding: true,
        kycStatus: 'NONE',
        affiliateCode
      }
    });

    // 2. Synchronize immediately with Supabase auth.users & auth.identities
    const syncResult = await syncUserToSupabaseAuth({
      id: newUser.id,
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      mustChangePassword
    });

    return NextResponse.json({
      success: true,
      message: `User ${cleanUsername} provisioned successfully in Database and Supabase Auth dashboard.`,
      user: sanitizeUserProfile(newUser),
      supabaseSynced: syncResult.success,
      mustChangePassword
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Admin Create User Error]:", err);
    return NextResponse.json({ error: err?.message || 'Failed to create user.' }, { status: 500 });
  }
}