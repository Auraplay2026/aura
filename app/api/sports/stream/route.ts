import { NextRequest } from "next/server";
import { generateMatches, Match } from "@/lib/sportsData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Extended Match type (mirrors live/route.ts)
type ExtendedMatch = Match & {
  team1Logo?: string;
  team2Logo?: string;
  sport?: string;
};

// ── ESPN Scoreboard Parser ─────────────────────────────────────────
function parseESPNEvent(event: any, sportKey: string): ExtendedMatch | null {
  try {
    const competition = event.competitions?.[0];
    if (!competition) return null;
    const competitors = competition.competitors || [];
    if (competitors.length < 2) return null;

    const homeTeamObj = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
    const awayTeamObj = competitors.find((c: any) => c.homeAway === "away") || competitors[1];

    const team1 = homeTeamObj.team?.displayName || "Home Team";
    const team2 = awayTeamObj.team?.displayName || "Away Team";
    const team1Logo = homeTeamObj.team?.logo;
    const team2Logo = awayTeamObj.team?.logo;

    const state = event.status?.type?.state;
    const status: "Live" | "Upcoming" = state === "in" ? "Live" : "Upcoming";

    let score = "";
    if (state === "in") {
      const s1 = homeTeamObj.score || "0";
      const s2 = awayTeamObj.score || "0";
      const clock = event.status?.displayClock || "";
      const period = event.status?.period ? `P${event.status.period}` : "";
      if (sportKey === "soccer") score = `${s1} - ${s2} (${clock || period})`;
      else if (sportKey === "basketball") score = `${period || "Live"} ${s1}-${s2}`;
      else if (sportKey === "tennis") score = `Sets: ${s1}-${s2}`;
      else score = `${s1} - ${s2}`;
    } else if (state === "post") {
      score = `FT ${homeTeamObj.score || "0"}-${awayTeamObj.score || "0"}`;
    } else {
      const d = new Date(event.date);
      score = `${d.toLocaleDateString("en-US", { weekday: "short" })}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    // Odds derivation from score differential
    const diff = (parseFloat(homeTeamObj.score || "0") || 0) - (parseFloat(awayTeamObj.score || "0") || 0);
    let o1 = 2.0, o2 = 2.0;
    let oDraw: number | null = sportKey === "soccer" ? 3.2 : null;

    if (state === "in") {
      if (diff > 0) {
        o1 = Math.max(1.05, 1.8 - diff * 0.4);
        o2 = Math.min(20, 2.5 + diff * 2);
        if (oDraw) oDraw = Math.min(15, 3.0 + diff * 1.5);
      } else if (diff < 0) {
        const a = Math.abs(diff);
        o1 = Math.min(20, 2.5 + a * 2);
        o2 = Math.max(1.05, 1.8 - a * 0.4);
        if (oDraw) oDraw = Math.min(15, 3.0 + a * 1.5);
      } else {
        o1 = 2.2; o2 = 2.2;
        if (oDraw) oDraw = 2.5;
      }
    } else {
      let seed = 0;
      for (let i = 0; i < String(event.id).length; i++) seed += String(event.id).charCodeAt(i);
      o1 = parseFloat((1.2 + ((Math.sin(seed) + 1) / 2) * 3).toFixed(2));
      o2 = parseFloat((1.2 + ((Math.cos(seed) + 1) / 2) * 3).toFixed(2));
      if (oDraw) oDraw = parseFloat((2.0 + ((o1 + o2 - 2.4) / 2)).toFixed(2));
    }

    return {
      id: parseInt(event.id) || Math.floor(Math.random() * 1000000),
      team1, team2, team1Logo, team2Logo,
      status, score,
      odds: { team1: parseFloat(o1.toFixed(2)), draw: oDraw ? parseFloat(oDraw.toFixed(2)) : null, team2: parseFloat(o2.toFixed(2)) },
      trend: { team1: "none", draw: oDraw ? "none" : null, team2: "none" },
      sport: sportKey,
    };
  } catch { return null; }
}

async function fetchESPN(url: string, sportKey: string): Promise<ExtendedMatch[]> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
      cache: "no-store",
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.events || []).map((e: any) => parseESPNEvent(e, sportKey)).filter(Boolean) as ExtendedMatch[];
  } catch { return []; }
}

async function fetchCricket(): Promise<ExtendedMatch[]> {
  try {
    const r = await fetch("https://www.cricbuzz.com/cricket-match/live-scores", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0", Accept: "text/html" },
      cache: "no-store",
    });
    if (!r.ok) return [];
    const html = await r.text();
    const regex = /<a title="([^"]+)" href="(\/live-cricket-scores\/\d+\/[a-z0-9-]+)"/g;
    let m; const matches: ExtendedMatch[] = [];
    while ((m = regex.exec(html)) !== null) {
      const parts = m[1].split(" vs ");
      if (parts.length < 2) continue;
      const team1 = parts[0].trim();
      const rest = parts[1];
      const cp = rest.split(",");
      const team2 = cp[0].trim();
      const statusText = cp.slice(1).join(",").split(" - ").pop()?.trim() || "Live";
      const isEnded = /won|tied|draw|abandon|no result/i.test(statusText);
      const isUpcoming = /preview|upcoming|starts/i.test(statusText);
      matches.push({
        id: Math.abs(parseInt(m[2].split("/")[2])) || Math.floor(Math.random() * 1000000),
        team1, team2,
        status: isEnded || isUpcoming ? "Upcoming" : "Live",
        score: isUpcoming ? "Upcoming match" : statusText,
        odds: { team1: parseFloat((1.2 + Math.random() * 3.5).toFixed(2)), draw: parseFloat((2.5 + Math.random() * 3.5).toFixed(2)), team2: parseFloat((1.2 + Math.random() * 3.5).toFixed(2)) },
        trend: { team1: "none", draw: "none", team2: "none" },
        sport: "cricket",
      });
    }
    // Deduplicate
    const seen = new Set<number>();
    return matches.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
  } catch { return []; }
}

async function fetchAllMatches(): Promise<ExtendedMatch[]> {
  const [soccer, basketball, tennis, cricket] = await Promise.all([
    Promise.all([
      fetchESPN("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard", "soccer"),
      fetchESPN("https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard", "soccer"),
      fetchESPN("https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard", "soccer"),
    ]).then(r => r.flat()),
    fetchESPN("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", "basketball"),
    Promise.all([
      fetchESPN("https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard", "tennis"),
      fetchESPN("https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard", "tennis"),
    ]).then(r => r.flat()),
    fetchCricket(),
  ]);

  const all = [
    ...soccer.map(m => ({ ...m, sport: "soccer" })),
    ...basketball.map(m => ({ ...m, sport: "basketball" })),
    ...tennis.map(m => ({ ...m, sport: "tennis" })),
    ...cricket.map(m => ({ ...m, sport: "cricket" })),
  ];

  // Fallback to generated data if all feeds are empty
  if (all.length === 0) {
    return [
      ...generateMatches("soccer", 5).map(m => ({ ...m, sport: "soccer" })),
      ...generateMatches("basketball", 5).map(m => ({ ...m, sport: "basketball" })),
      ...generateMatches("tennis", 5).map(m => ({ ...m, sport: "tennis" })),
      ...generateMatches("cricket", 5).map(m => ({ ...m, sport: "cricket" })),
    ];
  }

  return all;
}

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

// ── SSE Endpoint ───────────────────────────────────────────────────
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
          const matches = await fetchAllMatches();
          const withTrends = computeTrends(previousMatches, matches);
          previousMatches = matches;
          tickCount++;

          const payload = JSON.stringify({
            type: "SCORE_UPDATE",
            matches: withTrends,
            timestamp: Date.now(),
            tick: tickCount,
          });

          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          console.error("[SSE Stream] Error fetching live data:", err);
          // Send error event so client knows something went wrong
          controller.enqueue(encoder.encode(`event: error\ndata: {"message":"Feed temporarily unavailable"}\n\n`));
        }
      };

      // Initial push
      await pushData();

      // Push updates every 15 seconds (respect ESPN rate limits + Cricbuzz scraping interval)
      const interval = setInterval(pushData, 15000);

      // Heartbeat every 30s to keep connection alive through proxies/CDNs
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
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
