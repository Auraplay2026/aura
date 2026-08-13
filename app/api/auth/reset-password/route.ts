import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { updateUser, addActivityLog } from '@/lib/userDb';
import { getClientIP, getIPLocation, parseUserAgent } from '@/lib/geo';

// ── Brute-Force Guard: max 5 code attempts per email per 15 minutes ────────
const codeAttempts = new Map<string, { count: number; windowStart: number }>();
const CODE_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes (matches code expiry)
const CODE_ATTEMPT_MAX = 5;

function checkCodeAttemptLimit(email: string): { blocked: boolean; count: number } {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = codeAttempts.get(key);
  if (!entry || now - entry.windowStart > CODE_ATTEMPT_WINDOW_MS) {
    codeAttempts.set(key, { count: 1, windowStart: now });
    return { blocked: false, count: 1 };
  }
  entry.count++;
  return { blocked: entry.count > CODE_ATTEMPT_MAX, count: entry.count };
}

function resetCodeAttemptCounter(email: string) {
  codeAttempts.delete(email.toLowerCase().trim());
}
// ────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Brute-force protection
    const attemptCheck = checkCodeAttemptLimit(email);
    if (attemptCheck.blocked) {
      // Invalidate the reset code entirely after too many attempts
      await updateUser(email, { resetCode: "", resetCodeExpires: 0 }).catch(() => {});
      return NextResponse.json({
        error: 'Too many failed attempts. Your reset code has been invalidated. Please request a new one.'
      }, { status: 429 });
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

    if (!user.resetCode || user.resetCode !== code) {
      return NextResponse.json({ error: 'Invalid reset code. Please try again.' }, { status: 400 });
    }

    if (!user.resetCodeExpires || user.resetCodeExpires < Date.now()) {
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 });
    }

    // Code verified — clear the attempt counter
    resetCodeAttemptCounter(email);

    const userIdentifier = user.email || user.username;
    // Reset password and clear code columns
    await updateUser(userIdentifier, {
      passwordHash: await bcrypt.hash(newPassword, 12),
      resetCode: "",
      resetCodeExpires: 0
    });

    // Audit logs
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent');
    const device = parseUserAgent(ua);
    const { state, countryCode } = await getIPLocation(ip);
    const locationString = `${state}, ${countryCode}`;

    await addActivityLog(userIdentifier, {
      action: "Password Reset Successfully",
      device,
      location: locationString,
      ip,
      type: 'success'
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully.'
    }, { status: 200 });

  } catch (err) {
    console.error("Reset password route error:", err);
    return NextResponse.json({ error: 'Failed to process password reset.' }, { status: 500 });
  }
}
