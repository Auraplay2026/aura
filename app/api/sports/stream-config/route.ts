import { NextRequest, NextResponse } from "next/server";
import { getSystemConfig, saveSystemConfig } from "@/lib/systemConfig";
import { verifyAdminSession } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId") || "default";

  const config = getSystemConfig();
  const streams = config.matchStreams || {};
  const streamUrl = streams[matchId] || streams["default"] || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  return NextResponse.json({
    success: true,
    matchId,
    streamUrl
  }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSession();
    const { matchId, streamUrl } = await req.json();

    if (!matchId || !streamUrl) {
      return NextResponse.json({ error: "matchId and streamUrl are required" }, { status: 400 });
    }

    const config = getSystemConfig();
    if (!config.matchStreams) config.matchStreams = {};
    config.matchStreams[matchId] = streamUrl;
    saveSystemConfig(config);

    return NextResponse.json({
      success: true,
      message: `Stream URL for match ${matchId} updated successfully.`,
      matchId,
      streamUrl
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}