import { CanonicalMatch, MatchStatus, MatchFormat } from "../types";

/**
 * Sportmonks Cricket API v3.0 Adapter
 * Maps Sportmonks fixtures, scoreboards, balls, and lineups into CanonicalMatch.
 */
export class SportmonksAdapter {
  private static apiToken = process.env.SPORTMONKS_CRICKET_TOKEN || process.env.SPORTMONKS_API_KEY || "";

  public static normalizeFixture(fixture: any): CanonicalMatch {
    const rawStatus = fixture.status || "";
    let status: MatchStatus = "UPCOMING";
    if (rawStatus === "1st Innings" || rawStatus === "2nd Innings" || rawStatus === "In Progress" || rawStatus === "Live") {
      status = "LIVE";
    } else if (rawStatus === "Finished" || rawStatus === "Completed" || rawStatus === "FT") {
      status = "FINISHED";
    } else if (rawStatus === "Innings Break") {
      status = "INNINGS_BREAK";
    }

    const t1 = fixture.localteam || {};
    const t2 = fixture.visitorteam || {};

    const team1 = {
      id: String(t1.id || "t1"),
      name: t1.name || "Home Team",
      code: t1.code || (t1.name ? t1.name.substring(0, 3).toUpperCase() : "HOM"),
      logo: t1.image_path
    };

    const team2 = {
      id: String(t2.id || "t2"),
      name: t2.name || "Away Team",
      code: t2.code || (t2.name ? t2.name.substring(0, 3).toUpperCase() : "AWY"),
      logo: t2.image_path
    };

    const rawFormat = (fixture.type || "").toUpperCase();
    let matchFormat: MatchFormat = "T20";
    if (rawFormat.includes("ODI") || rawFormat.includes("ONE DAY")) matchFormat = "ODI";
    else if (rawFormat.includes("TEST")) matchFormat = "TEST";
    else if (rawFormat.includes("T10")) matchFormat = "T10";
    else if (rawFormat.includes("100")) matchFormat = "100_BALL";

    const inningsScores: any[] = [];
    if (Array.isArray(fixture.runs)) {
      fixture.runs.forEach((r: any) => {
        inningsScores.push({
          inningsNumber: r.inning === 1 ? 1 : 2,
          battingTeamId: String(r.team_id),
          battingTeamName: r.team_id === t1.id ? team1.name : team2.name,
          runs: Number(r.score || 0),
          wickets: Number(r.wickets || 0),
          overs: Number(r.overs || 0),
          ballsBowled: Math.floor(Number(r.overs || 0)) * 6 + Math.round((Number(r.overs || 0) % 1) * 10),
          runRate: Number(r.run_rate || 0)
        });
      });
    }

    const scoreSummary = inningsScores.length > 0
      ? inningsScores.map(i => `${i.runs}/${i.wickets} (${i.overs} ov)`).join(" & ")
      : (fixture.note || "Upcoming Fixture");

    return {
      matchId: String(fixture.id),
      competitionId: String(fixture.league_id || "intl"),
      competitionName: fixture.league?.name || "Official League",
      matchFormat,
      team1,
      team2,
      venue: {
        stadium: fixture.venue?.name || "Official Stadium",
        city: fixture.venue?.city || "City",
        country: fixture.venue?.country_name || "Country"
      },
      startTimeUtc: fixture.starting_at || new Date().toISOString(),
      status,
      statusText: fixture.note || (status === "LIVE" ? "Match in-play" : "Starts soon"),
      currentInningsNumber: (inningsScores.length >= 2 ? 2 : 1) as 1 | 2,
      innings: inningsScores,
      currentScoreSummary: scoreSummary,
      currentRunRate: inningsScores[inningsScores.length - 1]?.runRate || 0,
      telemetry: {
        provider: "SPORTMONKS",
        providerTimestamp: fixture.updated_at ? new Date(fixture.updated_at).getTime() : Date.now(),
        receivedTimestamp: Date.now(),
        freshnessStatus: "LIVE",
        confidenceScore: 99,
        latencyMs: 15
      }
    };
  }
}
