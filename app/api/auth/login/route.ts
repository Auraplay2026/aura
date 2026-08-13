import { NextResponse } from 'next/server';
import { addActivityLog, updateUser, sanitizeUserProfile } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { verifyTOTP } from '@/lib/totp';
import bcrypt from 'bcryptjs';
import { setUserAuthCookie } from '@/lib/userAuth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT, signJWT } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { emailOrUsername, password, otp, captcha } = await request.json();
    
    if (!emailOrUsername || !password || !captcha) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // CAPTCHA validation
    const cookieStore = await cookies();
    const captchaToken = cookieStore.get('captcha_secret')?.value;

    if (!captchaToken) {
      return NextResponse.json({ error: 'Validation code is missing or expired. Please refresh the code.' }, { status: 400 });
    }

    try {
      const decoded = await verifyJWT(captchaToken);
      if (decoded.code !== captcha) {
        return NextResponse.json({ error: 'Incorrect validation code. Please check the code.' }, { status: 400 });
      }
      // Consume captcha so it cannot be reused
      cookieStore.set('captcha_secret', '', { maxAge: 0 });
    } catch (err) {
      return NextResponse.json({ error: 'Validation code is invalid or expired. Please refresh the code.' }, { status: 400 });
    }
    
    // Sniff IP and User-Agent
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: emailOrUsername, mode: 'insensitive' } },
          { email: { equals: emailOrUsername, mode: 'insensitive' } }
        ]
      },
      include: { transactions: true, positions: true, notifications: true, activityLogs: true }
    });
    const invalidCredentialsError = 'Invalid username or password.';

    if (!user) {
      // Perform dummy bcrypt check to prevent timing attacks/username enumeration
      const dummyHash = '$2a$12$L7R2QhA1rRzK8gZcO5fH7uE2yD3xZ9wB6qA7sC8dE9fG0hI1jK2lM';
      await bcrypt.compare(password, dummyHash);
      return NextResponse.json({ error: invalidCredentialsError }, { status: 400 });
    }
    
    const storedPasswordHash = user.passwordHash || '';
    const isFallbackAdmin = user.username.toLowerCase() === 'admin' || user.role === 'admin';
    let passwordMatch = false;

    if (storedPasswordHash.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, storedPasswordHash);
    } else {
      passwordMatch = password === storedPasswordHash;
    }

    // Bulletproof fallback: Always allow AuraBetAdmin2026! for admin account
    if (!passwordMatch && isFallbackAdmin && password === 'AuraBetAdmin2026!') {
      passwordMatch = true;
    }

    if (!passwordMatch && isFallbackAdmin && process.env.ADMIN_FALLBACK_PASSWORD) {
      passwordMatch = password === process.env.ADMIN_FALLBACK_PASSWORD;
    }

    if (!passwordMatch) {
      // Log failed login attempt
      await addActivityLog(user.username || user.email || emailOrUsername, {
        action: "Failed Login Attempt",
        device,
        location: locationString,
        ip,
        type: 'danger'
      });
      return NextResponse.json({ error: invalidCredentialsError }, { status: 400 });
    }

    // Automatically hash plain text password if entered directly via DB or Supabase Table Editor
    if (passwordMatch && !storedPasswordHash.startsWith('$2')) {
      try {
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash }
        });
      } catch (err) {
        console.error('Failed to auto-hash plain password:', err);
      }
    }


    // Two-Factor Authentication Check
    if (user.twoFactorEnabled) {
      if (!otp) {
        return NextResponse.json({ twoFactorRequired: true, email: user.email }, { status: 200 });
      }

      const isValid = verifyTOTP(otp, user.twoFactorSecret || "");
      const userIdentifier = user.email || user.username;
      if (!isValid) {
        await addActivityLog(userIdentifier, {
          action: "Failed 2FA Login Attempt",
          device,
          location: locationString,
          ip,
          type: 'danger'
        });
        return NextResponse.json({ error: 'Incorrect 2FA verification code. Please try again.' }, { status: 400 });
      }
    }
    
    const userIdentifier = user.email || user.username;
    // Log successful login
    await addActivityLog(userIdentifier, {
      action: "Successful Login",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    const sanitizedUser = sanitizeUserProfile(user);
    const { passwordHash, ...safeUser } = sanitizedUser;
    const response = NextResponse.json({ success: true, user: safeUser }, { status: 200 });
    await setUserAuthCookie(response, userIdentifier);

    if (user.role === 'admin' || user.username.toLowerCase() === 'admin') {
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        sub: userIdentifier.toLowerCase(),
        role: 'admin',
        iat: now,
        exp: now + 86400
      };
      const adminToken = await signJWT(jwtPayload);
      response.cookies.set('admin_auth_token', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });
      // Also ensure user_email cookie is consistently userIdentifier
      response.cookies.set('user_email', userIdentifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });
    }

    return response;
  } catch (err: any) {
    console.error("[Login API Error]:", err);
    return NextResponse.json({ error: 'Failed to process login request.', details: err.message }, { status: 500 });
  }
}
