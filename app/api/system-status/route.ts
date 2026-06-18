import { NextResponse } from "next/server";
import { getSystemConfig } from "@/lib/systemConfig";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getSystemConfig();
    return NextResponse.json({
      success: true,
      maintenanceMode: !!config.maintenanceMode
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
