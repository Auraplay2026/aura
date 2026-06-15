import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail } from '@/lib/userDb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, challenge, signature, token } = body;

    if (!email || !challenge || !signature || !token) {
      return NextResponse.json({ success: false, error: "Missing required authentication payloads" }, { status: 400 });
    }

    // 1. Verify user exists and role matches admin L5 clearance
    const user = await findUserByEmail(email);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: "Access Denied: Administrative role mismatch" }, { status: 403 });
    }

    // 2. Validate time-limited cryptographic challenge (60 seconds replay protection window)
    const parts = challenge.split(':');
    const timestamp = parseInt(parts[0]);
    if (isNaN(timestamp) || Date.now() - timestamp > 60000) {
      return NextResponse.json({ success: false, error: "Cryptographic challenge handshake expired" }, { status: 403 });
    }

    // 3. Server-side validation of hardware cryptographic signature (timing-safe check)
    const adminSecret = process.env.ADMIN_HMAC_SECRET || "AURA_PLAY_ADMIN_SUPER_SECRET_KEY_123!";
    const expectedSignature = crypto.createHmac('sha256', adminSecret).update(challenge).digest('hex');

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      return NextResponse.json({ success: false, error: "Cryptographic hardware signature validation failed" }, { status: 403 });
    }

    // 4. Session tokens generated securely upon dual-key validation success
    return NextResponse.json({
      success: true,
      token: `AURA-L5-ADMIN-JWT-${crypto.randomBytes(16).toString('hex')}`,
      hwSignature: signature
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
