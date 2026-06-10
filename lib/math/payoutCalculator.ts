/**
 * ═══════════════════════════════════════════════════════════════════════
 * AuraBet — House Edge Mathematics & Payout Calculator
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Core mathematical engine that ensures long-term platform profitability.
 *
 * Fundamental Principle:
 *   Fair_Multiplier = 1 / Win_Probability
 *   House_Multiplier = Fair_Multiplier × (1 - House_Edge)
 *
 * Example (Coin Flip, 2% edge):
 *   Fair = 1 / 0.50 = 2.00x
 *   House = 2.00 × (1 - 0.02) = 1.96x
 *
 * The delta (0.04x per unit) is the platform's statistical profit margin.
 * Over N bets, the house's expected revenue converges to:
 *   E[Revenue] = TotalWagered × HouseEdge
 */

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export interface PayoutResult {
  /** The payout multiplier shown to the user (house edge applied) */
  multiplier: number;
  /** The mathematically fair multiplier (no edge) */
  fairMultiplier: number;
  /** Win probability as a decimal (0-1) */
  winProbability: number;
  /** The house edge applied, as a decimal (e.g. 0.02) */
  houseEdge: number;
  /** Expected return-to-player percentage (e.g. 98.0) */
  rtp: number;
  /** Actual payout in ₹ for a given wager */
  payout: number;
  /** The house's expected profit per wager in ₹ */
  expectedHouseProfit: number;
}

export interface DiceConfig {
  /** The player's chosen win chance (1.00 – 98.00%) */
  winChance: number;
  /** Wager amount in ₹ */
  wager: number;
}

export interface KenoConfig {
  /** Total numbers on the board (usually 40 or 80) */
  totalNumbers: number;
  /** Numbers drawn by the house (usually 10 or 20) */
  drawCount: number;
  /** Numbers selected by the player (1-10 typically) */
  playerPicks: number;
  /** How many of the player's picks hit */
  hits: number;
  /** Wager amount in ₹ */
  wager: number;
}

export interface LimboConfig {
  /** Target multiplier the player is betting on (e.g., 2.00x) */
  targetMultiplier: number;
  /** Wager amount in ₹ */
  wager: number;
}

export interface MinesConfig {
  /** Total cells in the grid (usually 25) */
  totalCells: number;
  /** Number of mines placed */
  mineCount: number;
  /** Number of safe cells revealed so far */
  cellsRevealed: number;
  /** Wager amount in ₹ */
  wager: number;
}

export interface PlinkoConfig {
  /** Number of rows (8-16) */
  rows: number;
  /** The specific bucket index the ball landed in (0 to rows) */
  bucketIndex: number;
  /** Risk level affects multiplier distribution */
  risk: 'low' | 'medium' | 'high';
  /** Wager amount in ₹ */
  wager: number;
}

// ─────────────────────────────────────────────────────────────────────
// Combinatorics Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Computes binomial coefficient C(n, k) = n! / (k! × (n-k)!)
 * Uses multiplicative formula to avoid factorial overflow.
 */
function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k; // Optimization: C(n,k) = C(n, n-k)

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result); // Round to avoid floating-point drift
}

/**
 * Hypergeometric probability: P(X = k) for drawing exactly k successes
 * from a finite population without replacement.
 *
 * P(X=k) = C(K, k) × C(N-K, n-k) / C(N, n)
 *
 * Where:
 *   N = population size (totalNumbers)
 *   K = successes in population (drawCount)
 *   n = sample size (playerPicks)
 *   k = observed successes (hits)
 */
function hypergeometricProbability(
  totalNumbers: number,
  drawCount: number,
  playerPicks: number,
  hits: number
): number {
  const numerator = binomial(drawCount, hits) * binomial(totalNumbers - drawCount, playerPicks - hits);
  const denominator = binomial(totalNumbers, playerPicks);
  return numerator / denominator;
}

// ─────────────────────────────────────────────────────────────────────
// PayoutCalculator Class
// ─────────────────────────────────────────────────────────────────────

export class PayoutCalculator {
  /**
   * House edge as a decimal. Default 2% (0.02).
   * Valid range: 0.005 (0.5%) to 0.15 (15%).
   */
  private readonly houseEdge: number;

  constructor(houseEdgePercent: number = 2.0) {
    if (houseEdgePercent < 0.5 || houseEdgePercent > 15.0) {
      throw new Error(
        `House edge must be between 0.5% and 15.0%, received ${houseEdgePercent}%`
      );
    }
    this.houseEdge = houseEdgePercent / 100;
  }

  // ─── Core Formula ─────────────────────────────────────────────────

  /**
   * The fundamental payout formula used by every game.
   *
   *   fairMultiplier    = 1 / winProbability
   *   houseMultiplier   = fairMultiplier × (1 - houseEdge)
   *   RTP               = (1 - houseEdge) × 100
   *   expectedProfit    = wager × houseEdge
   */
  private calculateCorePayout(winProbability: number, wager: number): PayoutResult {
    if (winProbability <= 0 || winProbability >= 1) {
      throw new Error(
        `Win probability must be in (0, 1) exclusive, received ${winProbability}`
      );
    }
    if (wager <= 0) {
      throw new Error(`Wager must be positive, received ${wager}`);
    }

    const fairMultiplier = 1 / winProbability;
    const multiplier = fairMultiplier * (1 - this.houseEdge);
    const rtp = (1 - this.houseEdge) * 100;
    const payout = wager * multiplier;
    const expectedHouseProfit = wager * this.houseEdge;

    return {
      multiplier: Math.floor(multiplier * 10000) / 10000, // Truncate to 4 decimals (always favor house)
      fairMultiplier: Math.round(fairMultiplier * 10000) / 10000,
      winProbability,
      houseEdge: this.houseEdge,
      rtp: Math.round(rtp * 100) / 100,
      payout: Math.floor(payout * 100) / 100, // Truncate to 2 decimals (always favor house)
      expectedHouseProfit: Math.round(expectedHouseProfit * 100) / 100,
    };
  }

  // ─── Game: Dice ───────────────────────────────────────────────────

  /**
   * Dice (Roll Over / Roll Under)
   *
   * The player selects a win chance between 1% and 98%.
   * The system rolls a number 0.00–99.99.
   *
   * Win probability = winChance / 100
   * Fair multiplier = 100 / winChance
   * House multiplier = (100 / winChance) × (1 - houseEdge)
   *
   * Example: winChance = 50%
   *   Fair = 100/50 = 2.00x
   *   House (2% edge) = 2.00 × 0.98 = 1.96x
   *
   * Example: winChance = 25%
   *   Fair = 100/25 = 4.00x
   *   House (2% edge) = 4.00 × 0.98 = 3.92x
   */
  calculateDice(config: DiceConfig): PayoutResult {
    const { winChance, wager } = config;

    if (winChance < 1.0 || winChance > 98.0) {
      throw new Error(
        `Win chance must be between 1.00% and 98.00%, received ${winChance}%`
      );
    }

    const winProbability = winChance / 100;
    return this.calculateCorePayout(winProbability, wager);
  }

  // ─── Game: Keno ───────────────────────────────────────────────────

  /**
   * Keno
   *
   * Uses hypergeometric distribution to calculate exact hit probability.
   *
   * P(hits) = C(drawCount, hits) × C(totalNumbers - drawCount, playerPicks - hits)
   *           ────────────────────────────────────────────────────────────────────
   *                              C(totalNumbers, playerPicks)
   *
   * Fair multiplier = 1 / P(hits)
   * House multiplier = fairMultiplier × (1 - houseEdge)
   *
   * Example: 40 numbers, 10 drawn, player picks 5, hits 4
   *   P(4) = C(10,4) × C(30,1) / C(40,5)
   *        = 210 × 30 / 658,008
   *        ≈ 0.009574
   *   Fair = 1 / 0.009574 ≈ 104.45x
   *   House (2% edge) = 104.45 × 0.98 ≈ 102.36x
   */
  calculateKeno(config: KenoConfig): PayoutResult {
    const { totalNumbers, drawCount, playerPicks, hits, wager } = config;

    // Validation
    if (totalNumbers < 10 || totalNumbers > 80) {
      throw new Error(`totalNumbers must be 10-80, received ${totalNumbers}`);
    }
    if (drawCount < 1 || drawCount > totalNumbers) {
      throw new Error(`drawCount must be 1-${totalNumbers}, received ${drawCount}`);
    }
    if (playerPicks < 1 || playerPicks > 10) {
      throw new Error(`playerPicks must be 1-10, received ${playerPicks}`);
    }
    if (hits < 0 || hits > Math.min(playerPicks, drawCount)) {
      throw new Error(`hits must be 0-${Math.min(playerPicks, drawCount)}, received ${hits}`);
    }

    const winProbability = hypergeometricProbability(totalNumbers, drawCount, playerPicks, hits);

    if (winProbability <= 0) {
      throw new Error(`Impossible hit combination: ${hits} hits with ${playerPicks} picks from ${drawCount} drawn out of ${totalNumbers}`);
    }

    return this.calculateCorePayout(winProbability, wager);
  }

  // ─── Game: Limbo ──────────────────────────────────────────────────

  /**
   * Limbo (Crash-style target multiplier)
   *
   * Player picks a target multiplier. The system generates a crash point.
   * If the crash point >= target, the player wins.
   *
   * Win probability = (1 - houseEdge) / targetMultiplier
   *   (The house edge is baked into the crash point generation, so
   *    the displayed multiplier IS the payout multiplier)
   *
   * This is the inverse formula: given a desired multiplier,
   * what's the probability the house allows a win?
   *
   * Example: target = 2.00x, 2% edge
   *   P(win) = 0.98 / 2.00 = 0.49 (49%)
   *   RTP = 98%
   */
  calculateLimbo(config: LimboConfig): PayoutResult {
    const { targetMultiplier, wager } = config;

    if (targetMultiplier < 1.01) {
      throw new Error(`Target multiplier must be >= 1.01x, received ${targetMultiplier}x`);
    }

    const winProbability = (1 - this.houseEdge) / targetMultiplier;

    if (winProbability >= 1 || winProbability <= 0) {
      throw new Error(`Invalid win probability derived: ${winProbability}`);
    }

    // For Limbo, the multiplier IS the target (edge is in the probability)
    return {
      multiplier: targetMultiplier,
      fairMultiplier: Math.round((1 / winProbability) * 10000) / 10000,
      winProbability: Math.round(winProbability * 10000) / 10000,
      houseEdge: this.houseEdge,
      rtp: Math.round((1 - this.houseEdge) * 10000) / 100,
      payout: Math.floor(wager * targetMultiplier * 100) / 100,
      expectedHouseProfit: Math.round(wager * this.houseEdge * 100) / 100,
    };
  }

  // ─── Game: Mines ──────────────────────────────────────────────────

  /**
   * Mines
   *
   * Sequential probability: each safe cell revealed changes the odds.
   *
   * P(survive step i) = (safeCells - i) / (totalCells - i)
   *
   * Cumulative win probability after revealing `n` safe cells:
   *   P(win) = ∏(i=0 to n-1) [(safeCells - i) / (totalCells - i)]
   *
   * Example: 25 cells, 3 mines, reveal 5 safe cells
   *   P = (22/25) × (21/24) × (20/23) × (19/22) × (18/21)
   *     ≈ 0.4693
   *   Fair = 1/0.4693 ≈ 2.131x
   *   House (2%) = 2.131 × 0.98 ≈ 2.088x
   */
  calculateMines(config: MinesConfig): PayoutResult {
    const { totalCells, mineCount, cellsRevealed, wager } = config;

    if (totalCells < 4 || totalCells > 49) {
      throw new Error(`totalCells must be 4-49, received ${totalCells}`);
    }
    if (mineCount < 1 || mineCount >= totalCells) {
      throw new Error(`mineCount must be 1-${totalCells - 1}, received ${mineCount}`);
    }
    if (cellsRevealed < 1 || cellsRevealed > totalCells - mineCount) {
      throw new Error(`cellsRevealed must be 1-${totalCells - mineCount}, received ${cellsRevealed}`);
    }

    const safeCells = totalCells - mineCount;
    let cumulativeProbability = 1;

    for (let i = 0; i < cellsRevealed; i++) {
      cumulativeProbability *= (safeCells - i) / (totalCells - i);
    }

    return this.calculateCorePayout(cumulativeProbability, wager);
  }

  // ─── Game: Plinko ─────────────────────────────────────────────────

  /**
   * Plinko
   *
   * Ball falls through `rows` pegs. At each peg it goes left (p=0.5)
   * or right (p=0.5). The bucket index follows a binomial distribution.
   *
   * P(bucket = k) = C(rows, k) / 2^rows
   *
   * Multipliers are pre-defined per risk level but must still satisfy:
   *   ∑ P(bucket_i) × multiplier_i ≤ (1 - houseEdge)
   *
   * This function calculates the probability for a specific bucket
   * and returns the fair + house-adjusted payout.
   */
  calculatePlinko(config: PlinkoConfig): PayoutResult {
    const { rows, bucketIndex, wager } = config;

    if (rows < 8 || rows > 16) {
      throw new Error(`rows must be 8-16, received ${rows}`);
    }
    if (bucketIndex < 0 || bucketIndex > rows) {
      throw new Error(`bucketIndex must be 0-${rows}, received ${bucketIndex}`);
    }

    // Binomial probability for landing in this bucket
    const totalOutcomes = Math.pow(2, rows);
    const bucketProbability = binomial(rows, bucketIndex) / totalOutcomes;

    return this.calculateCorePayout(bucketProbability, wager);
  }

  // ─── Utility: Full Keno Paytable ──────────────────────────────────

  /**
   * Generates the complete paytable for a Keno configuration.
   * Returns multipliers for every possible hit count (0 to playerPicks).
   */
  generateKenoPaytable(
    totalNumbers: number,
    drawCount: number,
    playerPicks: number,
    wager: number = 100
  ): { hits: number; probability: number; multiplier: number; payout: number }[] {
    const table: { hits: number; probability: number; multiplier: number; payout: number }[] = [];

    for (let h = 0; h <= Math.min(playerPicks, drawCount); h++) {
      const prob = hypergeometricProbability(totalNumbers, drawCount, playerPicks, h);
      
      if (prob > 0) {
        const result = this.calculateCorePayout(prob, wager);
        table.push({
          hits: h,
          probability: Math.round(prob * 1000000) / 1000000,
          multiplier: result.multiplier,
          payout: result.payout,
        });
      }
    }

    return table;
  }

  // ─── Utility: Dice Slider Table ───────────────────────────────────

  /**
   * Generates a lookup table for the dice slider UI.
   * Maps every integer win chance (1-98) to its house-adjusted multiplier.
   */
  generateDiceTable(): { winChance: number; multiplier: number; rtp: number }[] {
    const table: { winChance: number; multiplier: number; rtp: number }[] = [];

    for (let chance = 1; chance <= 98; chance++) {
      const result = this.calculateDice({ winChance: chance, wager: 100 });
      table.push({
        winChance: chance,
        multiplier: result.multiplier,
        rtp: result.rtp,
      });
    }

    return table;
  }

  // ─── Getters ──────────────────────────────────────────────────────

  getHouseEdge(): number {
    return this.houseEdge;
  }

  getHouseEdgePercent(): number {
    return this.houseEdge * 100;
  }

  getRTP(): number {
    return (1 - this.houseEdge) * 100;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Singleton Export (platform-wide default 2% edge)
// ─────────────────────────────────────────────────────────────────────

export const payoutCalculator = new PayoutCalculator(2.0);
