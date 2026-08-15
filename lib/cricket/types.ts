/**
 * Canonical Cricket Domain Schemas & Unified Provider Contract
 * Provider-agnostic domain models for Match, Innings, Ball, Player, and Telemetry.
 */

export type MatchStatus = "UPCOMING" | "LIVE" | "INNINGS_BREAK" | "STUMPS" | "FINISHED" | "ABANDONED" | "DELAYED";
export type MatchFormat = "T20" | "ODI" | "TEST" | "T10" | "100_BALL";
export type DataFreshnessStatus = "LIVE" | "UPDATING" | "DELAYED" | "STALE";

export interface TeamEntity {
  id: string | number;
  name: string;
  code: string;
  logo?: string;
}

export interface InningsScore {
  inningsNumber: 1 | 2 | 3 | 4;
  battingTeamId: string | number;
  battingTeamName: string;
  runs: number;
  wickets: number;
  overs: number; // e.g. 19.4
  ballsBowled: number; // total legal balls e.g. 118
  runRate: number;
  declared?: boolean;
  targetRuns?: number;
}

export interface BatsmanStats {
  playerId: string | number;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isStriker?: boolean;
  dismissal?: string;
}

export interface BowlerStats {
  playerId: string | number;
  name: string;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  isCurrentBowler?: boolean;
}

export interface BallByBallEvent {
  inningsNumber: number;
  over: number;
  ball: number; // 1 to 6
  runsScored: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  isWicket: boolean;
  wicketType?: string;
  batsmanName: string;
  bowlerName: string;
  commentaryText?: string;
  timestamp: number;
}

export interface CanonicalMatch {
  matchId: string;
  competitionId: string;
  competitionName: string;
  matchFormat: MatchFormat;
  team1: TeamEntity;
  team2: TeamEntity;
  venue: {
    stadium: string;
    city: string;
    country: string;
  };
  startTimeUtc: string;
  status: MatchStatus;
  statusText: string; // e.g. "India need 34 runs in 18 balls"
  currentInningsNumber: 1 | 2 | 3 | 4;
  innings: InningsScore[];
  currentScoreSummary: string; // e.g. "184/6 (20.0 ov) & 45/1 (5.2 ov)"
  currentRunRate: number;
  requiredRunRate?: number;
  target?: number;
  activeBatters?: BatsmanStats[];
  activeBowler?: BowlerStats;
  recentBalls?: string[]; // e.g. ["1", "4", "0", "W", "6", "1"]
  odds?: {
    team1Back: number;
    team1Lay: number;
    team2Back: number;
    team2Lay: number;
    drawBack?: number;
    drawLay?: number;
  };
  bhavOdds?: {
    team1BackRate: number;
    team1LayRate: number;
    team2BackRate: number;
    team2LayRate: number;
  };
  telemetry: {
    provider: "SPORTMONKS" | "ROANUZ" | "CRICBUZZ" | "THE_ODDS_API" | "INTERNAL_FALLBACK";
    providerTimestamp: number;
    receivedTimestamp: number;
    freshnessStatus: DataFreshnessStatus;
    confidenceScore: number; // 0 to 100
    latencyMs: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedMatch: CanonicalMatch;
}
