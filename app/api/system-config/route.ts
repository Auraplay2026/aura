import { NextResponse } from 'next/server';
import { getSystemConfig } from '@/lib/systemConfig';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET() {
  try {
    const config = getSystemConfig();
    
    // Check if the requester is an admin
    let isAdmin = false;
    try {
      await verifyAdminSession();
      isAdmin = true;
    } catch {
      // Not an admin, fail silently to hide parameters
    }

    const responseData: any = {
      success: true,
      houseEdge: config.houseEdge,
      games: config.games
    };

    if (isAdmin) {
      responseData.demoWinRate = config.demoWinRate ?? 80;
      responseData.realWinRate = config.realWinRate ?? 30;
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error("Failed to read system config:", err);
    return NextResponse.json({ error: 'Failed to retrieve configuration.' }, { status: 500 });
  }
}
