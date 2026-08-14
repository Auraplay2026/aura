/**
 * Indian Exchange Bhav & Fancy Session Pricing Engine
 * Models real-world Bookmaker, Exchange (Betfair / Diamond / Laser247),
 * and Indian Subcontinent Sub-Markets (Paise Bhav, Multipliers, Khayi-Lagai).
 */

export type OddsDisplayMode = "decimal" | "bhav" | "multiplier";

/**
 * Converts decimal odds to authentic Indian Paisa Bhav representation.
 * - Under 2.00 (e.g. 1.60 -> "60p", 1.85 -> "85p", 1.95 -> "95p")
 * - 2.00 and above (e.g. 2.40 -> "1.40", 3.50 -> "2.50")
 */
export function convertDecimalToBhav(odds: number): string {
  if (odds <= 1.0) return "0p";
  if (odds < 2.0) {
    const paise = Math.round((odds - 1.0) * 100);
    return `${paise}p`;
  }
  return (odds - 1.0).toFixed(2);
}

/**
 * Converts decimal odds to popular Indian multiplier format ("1 ka X").
 * - 1.80 -> "1 ka 1.8"
 * - 2.00 -> "1 ka 2"
 * - 3.50 -> "1 ka 3.5"
 */
export function convertDecimalToMultiplier(odds: number): string {
  if (odds <= 1.0) return "1 ka 1";
  const mult = odds % 1 === 0 ? odds.toFixed(0) : odds.toFixed(2).replace(/\.?0+$/, "");
  return `1 ka ${mult}`;
}

/**
 * Formats any odds value according to the user's preferred display mode.
 */
export function formatOddsByMode(odds: number, mode: OddsDisplayMode): string {
  switch (mode) {
    case "bhav":
      return convertDecimalToBhav(odds);
    case "multiplier":
      return convertDecimalToMultiplier(odds);
    case "decimal":
    default:
      return odds.toFixed(2);
  }
}

export interface ExposureResult {
  stake: number;
  odds: number;
  type: "lagai" | "khayi" | "back" | "lay";
  netProfit: number;
  totalPayout: number;
  liability: number;
  requiredBalance: number;
}

/**
 * Mathematically precise calculation of Lagai (Back) vs Khayi (Lay) exposure.
 * - Lagai (Back): You are betting FOR the team to win.
 *     Net Profit = Stake * (Odds - 1)
 *     Total Payout = Stake * Odds
 *     Liability = 0 (Only Stake is at risk)
 *     Required Balance = Stake
 * 
 * - Khayi (Lay): You are betting AGAINST the team (acting as bookmaker).
 *     Net Profit = Stake
 *     Liability = Stake * (Odds - 1) (What you owe if the team wins)
 *     Total Payout = Stake
 *     Required Balance = Liability
 */
export function calculateExposure(
  stake: number, 
  odds: number, 
  type: "lagai" | "khayi" | "back" | "lay"
): ExposureResult {
  const isBack = type === "lagai" || type === "back";
  const netProfit = isBack ? stake * (odds - 1) : stake;
  const totalPayout = isBack ? stake * odds : stake;
  const liability = isBack ? 0 : stake * (odds - 1);
  const requiredBalance = isBack ? stake : liability;

  return {
    stake,
    odds,
    type,
    netProfit: parseFloat(netProfit.toFixed(2)),
    totalPayout: parseFloat(totalPayout.toFixed(2)),
    liability: parseFloat(liability.toFixed(2)),
    requiredBalance: parseFloat(requiredBalance.toFixed(2))
  };
}

export interface CricketSessionLine {
  id: string;
  name: string;
  category: "session_6" | "session_10" | "lambi_20" | "wicket" | "player";
  noRuns: number;
  yesRuns: number;
  rateNo: number;
  rateYes: number;
  isActive: boolean;
}

/**
 * Computes authentic cricket fancy session lines with standard 2-run / 3-run bookmaker gaps.
 */
export function calculateCricketSessions(
  currentRuns: number, 
  currentOvers: number, 
  projectedRunRate: number = 8.5
): CricketSessionLine[] {
  const currentRR = currentOvers > 0 ? currentRuns / currentOvers : projectedRunRate;
  const effectiveRR = (currentRR * 0.6) + (projectedRunRate * 0.4);

  // 6 Over Powerplay Session (if match is under 6 overs)
  const is6OverActive = currentOvers < 6;
  const est6Runs = Math.round(is6OverActive ? currentRuns + (6 - currentOvers) * effectiveRR : 52);
  
  // 10 Over Mid Session
  const is10OverActive = currentOvers < 10;
  const est10Runs = Math.round(is10OverActive ? currentRuns + (10 - currentOvers) * effectiveRR : 88);

  // 20 Over Lambi (Full Innings Score)
  const is20OverActive = currentOvers < 20;
  const est20Runs = Math.round(is20OverActive ? currentRuns + (20 - currentOvers) * effectiveRR : 185);

  return [
    {
      id: "session-6-over",
      name: "6 Over Powerplay Runs",
      category: "session_6",
      noRuns: Math.max(30, est6Runs - 1),
      yesRuns: Math.max(32, est6Runs + 1),
      rateNo: 100,
      rateYes: 100,
      isActive: is6OverActive
    },
    {
      id: "session-10-over",
      name: "10 Over Innings Runs",
      category: "session_10",
      noRuns: Math.max(60, est10Runs - 1),
      yesRuns: Math.max(62, est10Runs + 1),
      rateNo: 100,
      rateYes: 100,
      isActive: is10OverActive
    },
    {
      id: "session-20-lambi",
      name: "20 Over Lambi (Total Innings)",
      category: "lambi_20",
      noRuns: Math.max(120, est20Runs - 2),
      yesRuns: Math.max(123, est20Runs + 1),
      rateNo: 100,
      rateYes: 100,
      isActive: is20OverActive
    },
    {
      id: "session-fow",
      name: "Fall of Next Wicket (FOW)",
      category: "wicket",
      noRuns: Math.max(currentRuns + 8, currentRuns + 14),
      yesRuns: Math.max(currentRuns + 10, currentRuns + 16),
      rateNo: 100,
      rateYes: 100,
      isActive: true
    }
  ];
}

/**
 * Equalizer Cashout ("Green All" / "Book Set") calculation.
 * Calculates how much to Lay at current odds to guarantee equal profit on BOTH sides.
 */
export function calculateEqualizerCashout(
  originalStake: number,
  originalBackOdds: number,
  currentLayOdds: number
): {
  hedgeStake: number;
  guaranteedProfit: number;
  canEqualize: boolean;
} {
  if (currentLayOdds <= 1.0 || originalBackOdds <= 1.0) {
    return { hedgeStake: 0, guaranteedProfit: 0, canEqualize: false };
  }

  // Hedge Stake = (Original Stake * Original Back Odds) / Current Lay Odds
  const hedgeStake = (originalStake * originalBackOdds) / currentLayOdds;
  const guaranteedProfit = (originalStake * originalBackOdds) - hedgeStake - originalStake;

  return {
    hedgeStake: parseFloat(hedgeStake.toFixed(2)),
    guaranteedProfit: parseFloat(guaranteedProfit.toFixed(2)),
    canEqualize: guaranteedProfit > 0
  };
}
