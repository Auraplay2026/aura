import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, addActivityLog, updateUser } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import { verifyTOTP } from '@/lib/totp';
import bcrypt from 'bcryptjs';
import { setUserAuthCookie } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { emailOrUsername, password, otp } = await request.json();
    
    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    
    // Sniff IP and User-Agent
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    const user = await findUserByEmailOrUsername(emailOrUsername);
    const invalidCredentialsError = 'Invalid username/email or password.';

    if (!user) {
      // Perform dummy bcrypt check to prevent timing attacks/username enumeration
      const dummyHash = '$2a$12$L7R2QhA1rRzK8gZcO5fH7uE2yD3xZ9wB6qA7sC8dE9fG0hI1jK2lM';
      await bcrypt.compare(password, dummyHash);
      return NextResponse.json({ error: invalidCredentialsError }, { status: 400 });
    }
    
    const storedPasswordHash = user.passwordHash || '';
    const isFallbackAdmin = user.email.toLowerCase() === 'twintubrovquattro@gmail.com';
    let passwordMatch = false;

    if (storedPasswordHash.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, storedPasswordHash);
    }

    if (!passwordMatch && isFallbackAdmin && process.env.ADMIN_FALLBACK_PASSWORD) {
      passwordMatch = password === process.env.ADMIN_FALLBACK_PASSWORD;
    }

    if (!passwordMatch) {
      // Log failed login attempt
      await addActivityLog(user.email, {
        action: "Failed Login Attempt",
        device,
        location: locationString,
        ip,
        type: 'danger'
      });
      return NextResponse.json({ error: invalidCredentialsError }, { status: 400 });
    }


    // Two-Factor Authentication Check
    if (user.twoFactorEnabled) {
      if (!otp) {
        return NextResponse.json({ twoFactorRequired: true, email: user.email }, { status: 200 });
      }

      const isValid = verifyTOTP(otp, user.twoFactorSecret || "");
      if (!isValid) {
        await addActivityLog(user.email, {
          action: "Failed 2FA Login Attempt",
          device,
          location: locationString,
          ip,
          type: 'danger'
        });
        return NextResponse.json({ error: 'Incorrect 2FA verification code. Please try again.' }, { status: 400 });
      }
    }
    
    // Log successful login
    await addActivityLog(user.email, {
      action: "Successful Login",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    const { passwordHash, ...safeUser } = user;
    const response = NextResponse.json({ success: true, user: safeUser }, { status: 200 });
    await setUserAuthCookie(response, user.email);
    return response;
  } catch (err: any) {
    console.error("[Login API Error]:", err);
    return NextResponse.json({ error: 'Failed to process login request.', details: err.message }, { status: 500 });
  }
}
