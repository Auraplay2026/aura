import { NextResponse } from 'next/server';
import { getPaymentSettings } from '@/lib/paymentConfig';

export async function GET() {
  try {
    const settings = getPaymentSettings();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch payment settings:", err);
    return NextResponse.json({ error: 'Failed to fetch payment settings.' }, { status: 500 });
  }
}
