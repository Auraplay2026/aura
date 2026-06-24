import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }
    
    const logs = await getActivityLogs(email);
    
    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch activity logs:", err);
    return NextResponse.json({ error: 'Failed to fetch activity logs.' }, { status: 500 });
  }
}
