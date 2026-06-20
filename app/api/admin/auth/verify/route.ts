import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/userDb';
import { verifyTOTP, generateSecret } from '@/lib/totp';
import { signJWT } from '@/lib/jwt';
import { getClientIP } from '@/lib/geo';

export const dynamic = 'force-dynamic';

// Server-side in-memory rate limiting map
const rateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();

function checkRateLimit(key: string, maxAttempts = 5, lockDurationMs = 300000) {
  const now = Date.now();
  const data = rateLimitMap.get(key);
  
  if (!data) {
    rateLimitMap.set(key, { attempts: 1, lockUntil: 0 });
    return { allowed: true, remaining: maxAttempts - 1, lockTimeLeft: 0 };
  }
  
  if (data.lockUntil > now) {
    return { allowed: false, remaining: 0, lockTimeLeft: Math.ceil((data.lockUntil - now) / 1000) };
  }
  
  if (data.attempts >= maxAttempts) {
    const lockUntil = now + lockDurationMs;
    rateLimitMap.set(key, { attempts: data.attempts + 1, lockUntil });
    return { allowed: false, remaining: 0, lockTimeLeft: Math.ceil(lockDurationMs / 1000) };
  }
  
  data.attempts += 1;
  rateLimitMap.set(key, data);
  return { allowed: true, remaining: maxAttempts - data.attempts, lockTimeLeft: 0 };
}

function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const body = await req.json();
    const { email, challenge, signature, totpCode } = body;

    if (!email || !challenge || !signature) {
      return NextResponse.json({ success: false, error: "Missing required authentication payloads" }, { status: 400 });
    }

    const rateLimitKey = `${ip}:${email.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: `Rate limit exceeded. Please wait ${rateCheck.lockTimeLeft} seconds before trying again.` 
      }, { status: 429 });
    }

    // 1. Verify user exists and role matches admin L5 clearance
    const user = await findUserByEmail(email);
    if (!user || user.role !== 'admin' || user.email.toLowerCase() !== 'twintubrovquattro@gmail.com') {
      return NextResponse.json({ success: false, error: "Access Denied: Administrative role mismatch" }, { status: 403 });
    }

    // 2. Validate time-limited cryptographic challenge (60 seconds replay protection window)
    const parts = challenge.split(':');
    const timestamp = parseInt(parts[0]);
    if (isNaN(timestamp) || Date.now() - timestamp > 60000) {
      return NextResponse.json({ success: false, error: "Cryptographic challenge handshake expired" }, { status: 403 });
    }

    // 3. Server-side validation of hardware cryptographic signature (timing-safe check)
    const adminSecret = process.env.ADMIN_HMAC_SECRET;
    if (!adminSecret) {
      return NextResponse.json({ success: false, error: "Server configuration error: ADMIN_HMAC_SECRET not set" }, { status: 500 });
    }
    const expectedSignature = crypto.createHmac('sha256', adminSecret).update(challenge).digest('hex');

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      return NextResponse.json({ success: false, error: "Cryptographic hardware signature validation failed" }, { status: 403 });
    }

    // 4. Enforce MFA (TOTP)
    const has2fa = user.twoFactorEnabled && user.twoFactorSecret;
    if (!has2fa) {
      // If TOTP secret does not exist, generate and save it
      let activeSecret = user.twoFactorSecret;
      if (!activeSecret) {
        activeSecret = generateSecret();
        await updateUser(email, { twoFactorSecret: activeSecret });
      }
      
      // If code is not provided, return setup required payload
      if (!totpCode) {
        return NextResponse.json({ 
          success: false, 
          error: "MFA_SETUP_REQUIRED", 
          mfaSecret: activeSecret 
        }, { status: 200 });
      }
      
      // Verify code to complete setup
      const isValid = verifyTOTP(totpCode, activeSecret);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid MFA verification code" }, { status: 400 });
      }
      
      // Enable MFA permanently for this admin
      await updateUser(email, { twoFactorEnabled: true });
    } else {
      // MFA is already enabled, code is strictly required
      if (!totpCode) {
        return NextResponse.json({ success: false, error: "MFA code is required" }, { status: 400 });
      }
      
      const isValid = verifyTOTP(totpCode, user.twoFactorSecret!);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid MFA verification code" }, { status: 400 });
      }
    }

    // Reset rate limiter on success
    resetRateLimit(rateLimitKey);

    // 5. Generate secure JWT token
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      sub: email.toLowerCase(),
      role: 'admin',
      iat: now,
      exp: now + 900 // 15 minutes expiration
    };
    
    const generatedToken = await signJWT(jwtPayload);
    const response = NextResponse.json({
      success: true,
      token: generatedToken,
      hwSignature: signature
    });

    response.cookies.set('user_email', email.toLowerCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900,
      path: '/'
    });

    response.cookies.set('admin_auth_token', generatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900,
      path: '/'
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
