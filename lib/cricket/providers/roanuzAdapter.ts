import { CanonicalMatch, MatchStatus, MatchFormat } from "../types";

/**
 * Roanuz Cricket API Adapter
 * Normalizes Roanuz REST/WebSocket match objects into CanonicalMatch.
 */
export class RoanuzAdapter {
  public static normalizeMatch(matchData: any): CanonicalMatch {
    const rawStatus = matchData.status || matchData.play_status || "";
    let status: MatchStatus = "UPCOMING";
    if (rawStatus === "started" || rawStatus === "in_play" || rawStatus === "live") {
      status = "LIVE";
    } else if (rawStatus === "completed" || rawStatus === "finished") {
      status = "FINISHED";
    }

    const t1 = matchData.teams?.a || matchData.team_a || {};
    const t2 = matchData.teams?.b || matchData.team_b || {};

    const team1 = {
      id: String(t1.key || t1.id || "a"),
      name: t1.name || "Team A",
      code: t1.code || (t1.name ? t1.name.substring(0, 3).toUpperCase() : "T1"),
      logo: t1.logo
    };

    const team2 = {
      id: String(t2.key || t2.id || "b"),
      name: t2.name || "Team B",
      code: t2.code || (t2.name ? t2.name.substring(0, 3).toUpperCase() : "T2"),
      logo: t2.logo
    };

    const inningsScores: any[] = [];
    if (matchData.score && typeof matchData.score === "object") {
      const s = matchData.score;
      if (s.a_1) {
        inningsScores.push({
          inningsNumber: 1,
          battingTeamId: team1.id,
          battingTeamName: team1.name,
          runs: s.a_1.runs || 0,
          wickets: s.a_1.wickets || 0,
          overs: s.a_1.overs || 0,
          ballsBowled: s.a_1.balls || 0,
          runRate: s.a_1.run_rate || 0
        });
      }
      if (s.b_1) {
        inningsScores.push({
          inningsNumber: 2,
          battingTeamId: team2.id,
          battingTeamName: team2.name,
          runs: s.b_1.runs || 0,
          wickets: s.b_1.wickets || 0,
          overs: s.b_1.overs || 0,
          ballsBowled: s.b_1.balls || 0,
          runRate: s.b_1.run_rate || 0
        });
      }
    }

    return {
      matchId: String(matchData.key || matchData.id || "roanuz_match"),
      competitionId: String(matchData.tournament?.key || "league"),
      competitionName: matchData.tournament?.name || "Official Tournament",
      matchFormat: (matchData.format || "T20").toUpperCase() as MatchFormat,
      team1,
      team2,
      venue: {
        stadium: matchData.venue?.name || "Official Stadium",
        city: matchData.venue?.city || "City",
        country: matchData.venue?.country || "Country"
      },
      startTimeUtc: matchData.start_at || new Date().toISOString(),
      status,
      statusText: matchData.status_overview || (status === "LIVE" ? "Live Match" : "Scheduled"),
      currentInningsNumber: (inningsScores.length >= 2 ? 2 : 1) as 1 | 2,
      innings: inningsScores,
      currentScoreSummary: inningsScores.map(i => `${i.runs}/${i.wickets} (${i.overs} ov)`).join(" vs ") || "Upcoming",
      currentRunRate: inningsScores[inningsScores.length - 1]?.runRate || 0,
      telemetry: {
        provider: "ROANUZ",
        providerTimestamp: Date.now(),
        receivedTimestamp: Date.now(),
        freshnessStatus: "LIVE",
        confidenceScore: 98,
        latencyMs: 18
      }
    };
  }
}
