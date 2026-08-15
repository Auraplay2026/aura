import { NextRequest } from "next/server";
import { getSportMatchesWithSWR, ExtendedMatch } from "@/lib/sportsCache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Track odds changes for trend arrows
function computeTrends(prev: ExtendedMatch[], curr: ExtendedMatch[]): ExtendedMatch[] {
  const prevMap = new Map(prev.map(m => [m.id, m]));
  return curr.map(m => {
    const p = prevMap.get(m.id);
    if (!p) return m;
    const t1 = m.odds.team1 > p.odds.team1 ? "up" : m.odds.team1 < p.odds.team1 ? "down" : "none";
    const t2 = m.odds.team2 > p.odds.team2 ? "up" : m.odds.team2 < p.odds.team2 ? "down" : "none";
    const tD = m.odds.draw != null && p.odds.draw != null
      ? (m.odds.draw > p.odds.draw ? "up" : m.odds.draw < p.odds.draw ? "down" : "none")
      : null;
    return { ...m, trend: { team1: t1, draw: tD, team2: t2 } };
  });
}

// ── Shared High-Scale SSE Endpoint ──────────────────────────────────
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`: heartbeat\n\n`));

      let previousMatches: ExtendedMatch[] = [];
      let tickCount = 0;

      const pushData = async () => {
        if (cancelled) return;
        try {
          // Reads from high-scale SWR cache (0ms latency, zero external API hammering)
          const { matches } = await getSportMatchesWithSWR("all");
          const withTrends = computeTrends(previousMatches, matches);
          previousMatches = matches;
          tickCount++;

          const payload = JSON.stringify({
            type: "SCORE_UPDATE",
            matches: withTrends,
            timestamp: Date.now(),
            tick: tickCount,
          });

          if (!cancelled) {
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch (err: any) {
          if (!cancelled && err?.code !== 'ERR_INVALID_STATE') {
            console.error("[SSE Stream] Error serving live cache:", err);
            try {
              controller.enqueue(encoder.encode(`event: error\ndata: {"message":"Feed temporarily unavailable"}\n\n`));
            } catch {}
          }
        }
      };

      // Initial push
      await pushData();

      // Broadcast update ticks every 15s from memory
      const interval = setInterval(pushData, 15000);

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Connection closed
        }
      }, 30000);

      // Cleanup when client disconnects
      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
