import { NextResponse } from "next/server";
import { resolveDeepMatch, DeepMatchInfo } from "@/lib/sportsDeepData";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = id || "145357";

    // 1. Try to find match in live feed
    let liveMatch: any = null;
    try {
      const url = new URL(req.url);
      const host = url.origin;
      const res = await fetch(`${host}/api/sports/live?sport=all`, { next: { revalidate: 15 } });
      if (res.ok) {
        const data = await res.json();
        const liveList = Array.isArray(data) ? data : data.matches || [];
        liveMatch = liveList.find((m: any) => String(m.id) === String(matchId) || m.id === parseInt(matchId));
      }
    } catch (e) {
      console.warn("Could not fetch internal live feed for match", matchId);
    }

    // 2. Resolve sanitized, zero-dummy match data
    const deepMatch = resolveDeepMatch(matchId, liveMatch);

    return NextResponse.json({
      success: true,
      match: deepMatch
    });
  } catch (err: any) {
    console.error("Match detail API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to resolve match" },
      { status: 500 }
    );
  }
}
