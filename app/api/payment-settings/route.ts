import { NextResponse } from 'next/server';
import { getPaymentSettings } from '@/lib/paymentConfig';
import { verifyUserSession } from '@/lib/userAuth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const emailCookie = cookieStore.get("user_email")?.value;
    if (!emailCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await verifyUserSession(emailCookie);

    const settings = getPaymentSettings();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch payment settings:", err);
    return NextResponse.json({ error: 'Failed to fetch payment settings.' }, { status: 500 });
  }
}
