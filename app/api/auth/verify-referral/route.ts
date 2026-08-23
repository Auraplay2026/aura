import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { affiliateCode: code.toUpperCase() },
      select: { username: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid referral code.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, referrer: user.username }, { status: 200 });
  } catch (err) {
    console.error("Verify referral route error:", err);
    return NextResponse.json({ error: 'Failed to verify referral code.' }, { status: 500 });
  }
}
