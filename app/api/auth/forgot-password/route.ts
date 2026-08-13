import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';
import crypto from 'crypto';

// ── Rate Limiter: max 3 reset requests per email per hour ──────────────────
const resetAttempts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = resetAttempts.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    resetAttempts.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}
// ────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Rate limit by normalized email/username AND by IP
    const ip = getClientIP(request);
    const normalizedKey = email.toLowerCase().trim();
    if (isRateLimited(`email:${normalizedKey}`) || isRateLimited(`ip:${ip}`)) {
      return NextResponse.json({
        error: 'Too many reset requests. Please try again later.'
      }, { status: 429 });
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      // Return success response anyway to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: 'If the email or username is registered, a reset code has been generated.'
      }, { status: 200 });
    }

    // Generate 6-digit verification code using CSPRNG
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Update user in DB
    await updateUser(user.email, {
      resetCode,
      resetCodeExpires
    });

    // Audit logs
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

    if (process.env.NODE_ENV !== 'production') console.log(`[PASS_RESET_DEBUG] User ${user.email} reset code is: ${resetCode}`);

    return NextResponse.json({
      success: true,
      message: 'Reset code generated successfully.'
    }, { status: 200 });

  } catch (err) {
    console.error("Forgot password route error:", err);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
