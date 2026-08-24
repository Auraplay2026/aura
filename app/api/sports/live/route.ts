import { NextResponse } from "next/server";
import { getSportMatchesWithSWR, ExtendedMatch } from "@/lib/sportsCache";
import "@/lib/sportsPollerDaemon";

export const dynamic = "force-dynamic";

export type { ExtendedMatch };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = (searchParams.get("sport") || "all").toLowerCase();

    const { matches, isCached, cacheAgeMs } = await getSportMatchesWithSWR(sport);

    // Non-blocking auto-settlement reconciliation pass
    import("@/lib/autoSettlementEngine").then(m => m.runAutoSettlementCycle()).catch(() => {});

    return NextResponse.json({
      success: true,
      matches,
      cached: isCached,
      cacheAgeMs
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5",
        "X-Cache-Status": isCached ? "HIT" : "MISS",
        "X-Cache-Age-Ms": String(cacheAgeMs)
      }
    });
  } catch (err: any) {
    console.error("Live Sports API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
