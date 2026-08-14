import { NextResponse } from "next/server";
import { ApexDataEngine } from "@/lib/apexDataEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = id || "145357";

    // 1. Try to find match in live feed for team name hints
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

    // 2. Execute ApexData-Engine 5-Source Ingestion & 5-Point Gatekeeper Audit
    const apexPayload = await ApexDataEngine.getVerifiedMatch(
      matchId,
      liveMatch ? {
        team1: liveMatch.team1,
        team2: liveMatch.team2,
        sport: liveMatch.sport,
        score: liveMatch.score
      } : undefined
    );

    return NextResponse.json({
      success: true,
      match: apexPayload.match,
      sport: apexPayload.sport,
      ingest_ts_ms: apexPayload.ingest_ts_ms,
      cricketTelemetry: apexPayload.cricketTelemetry,
      footballTelemetry: apexPayload.footballTelemetry,
      tennisTelemetry: apexPayload.tennisTelemetry,
      gateCheck: {
        passed: apexPayload.auditReport.overallPassed,
        confidenceScore: `${apexPayload.auditReport.accuracyScore}%`,
        sourcesQueried: 5,
        sourcesAgreed: apexPayload.auditReport.layers.layer3_scoreQuorum.sourcesParticipated,
        sportVerified: apexPayload.sport,
        verifiedAt: new Date(apexPayload.ingest_ts_ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " IST",
        latency_ms: apexPayload.auditReport.latency_ms,
        layers: apexPayload.auditReport.layers
      }
    });
  } catch (err: any) {
    console.error("ApexData Match API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to resolve match via ApexData-Engine" },
      { status: 500 }
    );
  }
}
