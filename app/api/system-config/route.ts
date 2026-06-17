import { NextResponse } from 'next/server';
import { getSystemConfig } from '@/lib/systemConfig';

export async function GET() {
  try {
    const config = getSystemConfig();
    return NextResponse.json({
      success: true,
      houseEdge: config.houseEdge,
      games: config.games,
      demoWinRate: config.demoWinRate ?? 80,
      realWinRate: config.realWinRate ?? 30
    }, { status: 200 });
  } catch (err) {
    console.error("Failed to read system config:", err);
    return NextResponse.json({ error: 'Failed to retrieve configuration.' }, { status: 500 });
  }
}
