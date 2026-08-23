import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setUserAuthCookie } from '@/lib/userAuth';
import { sanitizeUserProfile, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, referralCode } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanEmail = (email || `${cleanUsername.toLowerCase()}@aurabet.io`).trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long.' }, { status: 400 });
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: 'insensitive' } },
          { email: { equals: cleanEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this username or email already exists.' }, { status: 400 });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode?.trim()) {
      referrer = await prisma.user.findUnique({
        where: { affiliateCode: referralCode.trim().toUpperCase() }
      });
      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code.' }, { status: 400 });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    // Generate own affiliate code
    const ownAffiliateCode = cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create user in Supabase
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: 'user',
        balance: 0,
        demoBalance: 100000,
        realBalance: 0,
        hasCompletedOnboarding: true,
        kycStatus: 'NONE',
        referredBy: referrer ? referrer.username : null,
        affiliateCode: ownAffiliateCode
      }
    });

    if (referrer) {
      await prisma.user.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } }
      });
    }

    // Sniff IP and device for audit log
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    await addActivityLog(newUser.email || newUser.username, {
      action: "Account Created (Sign Up)",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    const sanitized = sanitizeUserProfile(newUser);
    const { passwordHash: _unused, ...safeUser } = sanitized;
    const response = NextResponse.json({ success: true, user: safeUser }, { status: 201 });
    await setUserAuthCookie(response, newUser.email || newUser.username);

    return response;
  } catch (err: any) {
    console.error("[Sign Up API Error]:", err);
    return NextResponse.json({
      error: 'Failed to create account.',
      ...(process.env.NODE_ENV !== 'production' && { details: err?.message })
    }, { status: 500 });
  }
}
