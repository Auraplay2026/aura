import { CanonicalMatch, ValidationResult, DataFreshnessStatus } from "./types";

/**
 * Strict Data Validation & State Consistency Shield
 * Enforces cricket invariants, detects impossible score jumps, and maintains state integrity.
 */
export class CricketDataValidator {
  private static lastValidStates = new Map<string, CanonicalMatch>();

  /**
   * Validates incoming match payload against historical state and cricket rules.
   */
  public static validate(incoming: CanonicalMatch): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const previous = this.lastValidStates.get(incoming.matchId);

    // 1. Basic Field Presence
    if (!incoming.matchId) errors.push("Missing matchId");
    if (!incoming.team1?.name || !incoming.team2?.name) errors.push("Missing team entities");

    // 2. Invariant: Wickets must be between 0 and 10
    incoming.innings?.forEach(inn => {
      if (inn.wickets < 0 || inn.wickets > 10) {
        errors.push(`Invalid wickets count: ${inn.wickets} in Innings ${inn.inningsNumber}`);
      }
      if (inn.runs < 0) {
        errors.push(`Invalid negative runs: ${inn.runs} in Innings ${inn.inningsNumber}`);
      }
      if (inn.overs < 0) {
        errors.push(`Invalid negative overs: ${inn.overs} in Innings ${inn.inningsNumber}`);
      }
    });

    // 3. Historical Invariant Checks (against previous state)
    if (previous && incoming.status === "LIVE" && previous.status === "LIVE") {
      const prevInn = previous.innings?.find(i => i.inningsNumber === incoming.currentInningsNumber);
      const currInn = incoming.innings?.find(i => i.inningsNumber === incoming.currentInningsNumber);

      if (prevInn && currInn) {
        // Invariant: Wickets cannot decrease within the same innings
        if (currInn.wickets < prevInn.wickets) {
          errors.push(`Wickets decreased from ${prevInn.wickets} to ${currInn.wickets} in innings ${currInn.inningsNumber}`);
        }

        // Invariant: Overs cannot decrease within the same innings
        if (currInn.overs < prevInn.overs) {
          errors.push(`Overs decreased from ${prevInn.overs} to ${currInn.overs} in innings ${currInn.inningsNumber}`);
        }

        // Jump Detection: Sudden jump of > 36 runs without multiple balls elapsed
        const runsDiff = currInn.runs - prevInn.runs;
        const ballsDiff = (currInn.ballsBowled || 0) - (prevInn.ballsBowled || 0);
        if (runsDiff > 36 && ballsDiff <= 6) {
          warnings.push(`Sudden score leap detected: +${runsDiff} runs in ${ballsDiff} balls`);
        }
      }
    }

    // 4. Determine Data Freshness Status
    const now = Date.now();
    const providerTime = incoming.telemetry?.providerTimestamp || now;
    const timeDeltaMs = now - providerTime;

    let freshnessStatus: DataFreshnessStatus = "LIVE";
    if (timeDeltaMs > 120_000) {
      freshnessStatus = "STALE";
    } else if (timeDeltaMs > 45_000) {
      freshnessStatus = "DELAYED";
    } else if (timeDeltaMs > 15_000) {
      freshnessStatus = "UPDATING";
    }

    // Calculate Confidence Score (0 to 100)
    let confidenceScore = 100;
    if (errors.length > 0) confidenceScore -= 50;
    if (warnings.length > 0) confidenceScore -= (warnings.length * 15);
    if (freshnessStatus === "DELAYED") confidenceScore -= 10;
    if (freshnessStatus === "STALE") confidenceScore -= 30;
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));

    const sanitizedMatch: CanonicalMatch = {
      ...incoming,
      telemetry: {
        ...incoming.telemetry,
        freshnessStatus,
        confidenceScore,
        receivedTimestamp: now,
        latencyMs: Math.max(5, timeDeltaMs)
      }
    };

    if (errors.length === 0) {
      this.lastValidStates.set(incoming.matchId, sanitizedMatch);
      return {
        isValid: true,
        errors,
        warnings,
        sanitizedMatch
      };
    } else {
      // Retain last known valid state on validation error
      const fallbackState = previous || sanitizedMatch;
      return {
        isValid: false,
        errors,
        warnings,
        sanitizedMatch: fallbackState
      };
    }
  }

  public static getLastValidState(matchId: string): CanonicalMatch | undefined {
    return this.lastValidStates.get(matchId);
  }
}
