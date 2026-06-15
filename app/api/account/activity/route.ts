import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/userDb';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    
    const logs = await getActivityLogs(email);
    
    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch activity logs:", err);
    return NextResponse.json({ error: 'Failed to fetch activity logs.' }, { status: 500 });
  }
}
