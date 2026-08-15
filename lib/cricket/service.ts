import { CanonicalMatch, ValidationResult } from "./types";
import { CricketDataValidator } from "./validator";
import { SportmonksAdapter } from "./providers/sportmonksAdapter";
import { RoanuzAdapter } from "./providers/roanuzAdapter";

/**
 * Unified Cricket Data Service (SSOT)
 * Coordinates data providers, executes normalization, validates state transitions,
 * and maintains the in-memory canonical state register.
 */
export class CricketDataService {
  private static matchRegister = new Map<string, CanonicalMatch>();

  /**
   * Registers and validates an incoming match payload from any provider.
   */
  public static ingestMatch(rawPayload: any, provider: "SPORTMONKS" | "ROANUZ" | "CRICBUZZ"): ValidationResult {
    let canonical: CanonicalMatch;

    if (provider === "SPORTMONKS") {
      canonical = SportmonksAdapter.normalizeFixture(rawPayload);
    } else if (provider === "ROANUZ") {
      canonical = RoanuzAdapter.normalizeMatch(rawPayload);
    } else {
      // Default / Cricbuzz mapping
      canonical = {
        matchId: String(rawPayload.id || rawPayload.matchId),
        competitionId: String(rawPayload.seriesId || "intl"),
        competitionName: rawPayload.seriesName || "International Series",
        matchFormat: (rawPayload.matchFormat || "T20").toUpperCase() as any,
        team1: {
          id: rawPayload.team1Id || "t1",
          name: rawPayload.team1 || "Team 1",
          code: rawPayload.team1Code || "T1",
          logo: rawPayload.team1Logo
        },
        team2: {
          id: rawPayload.team2Id || "t2",
          name: rawPayload.team2 || "Team 2",
          code: rawPayload.team2Code || "T2",
          logo: rawPayload.team2Logo
        },
        venue: {
          stadium: rawPayload.venue || "International Stadium",
          city: "Host City",
          country: "Host Nation"
        },
        startTimeUtc: rawPayload.startTime || new Date().toISOString(),
        status: rawPayload.status === "Live" ? "LIVE" : "UPCOMING",
        statusText: rawPayload.score || "Live In-Play",
        currentInningsNumber: 1,
        innings: [],
        currentScoreSummary: rawPayload.score || "Live Match",
        currentRunRate: 8.5,
        odds: rawPayload.odds ? {
          team1Back: rawPayload.odds.team1,
          team1Lay: Number((rawPayload.odds.team1 + 0.02).toFixed(2)),
          team2Back: rawPayload.odds.team2,
          team2Lay: Number((rawPayload.odds.team2 + 0.02).toFixed(2)),
          drawBack: rawPayload.odds.draw,
          drawLay: rawPayload.odds.draw ? Number((rawPayload.odds.draw + 0.04).toFixed(2)) : undefined
        } : undefined,
        telemetry: {
          provider: "CRICBUZZ",
          providerTimestamp: Date.now(),
          receivedTimestamp: Date.now(),
          freshnessStatus: "LIVE",
          confidenceScore: 95,
          latencyMs: 22
        }
      };
    }

    // Pass through strict validation shield
    const validation = CricketDataValidator.validate(canonical);
    if (validation.isValid) {
      this.matchRegister.set(canonical.matchId, validation.sanitizedMatch);
    }
    return validation;
  }

  public static getMatch(matchId: string): CanonicalMatch | undefined {
    return this.matchRegister.get(matchId) || CricketDataValidator.getLastValidState(matchId);
  }

  public static getAllLiveMatches(): CanonicalMatch[] {
    return Array.from(this.matchRegister.values()).filter(m => m.status === "LIVE");
  }
}
