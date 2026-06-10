/**
 * ═══════════════════════════════════════════════════════════════════════
 * AuraBet — Dynamic Risk & Exposure Management System
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Protects the platform from catastrophic losses by enforcing dynamic
 * maximum bet limits based on house liquidity and requested multipliers.
 *
 * Core Rule:
 *   MaxPotentialPayout ≤ ExposureLimit% × HouseLiquidity
 *
 * Therefore:
 *   MaxBet = (ExposureLimit × HouseLiquidity) / RequestedMultiplier
 *
 * Default exposure limit: 1% of hot wallet per single bet.
 *
 * Additional protections:
 *   - Per-user exposure caps (no single user can drain the house)
 *   - Concurrent exposure tracking (aggregate open risk)
 *   - Velocity checks (rate-limiting large bets)
 */

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export interface ExposureConfig {
  /** Max % of house liquidity exposed to a single bet (default 0.01 = 1%) */
  singleBetExposureLimit: number;
  /** Max % of house liquidity exposed to a single user across all open bets (default 0.02 = 2%) */
  perUserExposureLimit: number;
  /** Max % of house liquidity exposed across ALL concurrent bets (default 0.10 = 10%) */
  totalExposureCap: number;
  /** Max number of bets a user can place per minute (default 30) */
  maxBetsPerMinute: number;
  /** Minimum bet amount in ₹ (default 10) */
  minimumBet: number;
  /** Absolute hard cap on any single bet in ₹ regardless of liquidity (default 10,000,000) */
  absoluteMaxBet: number;
}

export interface BetValidationRequest {
  /** Unique user identifier */
  userId: string;
  /** Game identifier (e.g., "dice", "mines", "keno") */
  gameId: string;
  /** Requested wager amount in ₹ */
  requestedWager: number;
  /** The payout multiplier for this bet */
  requestedMultiplier: number;
  /** Current house liquidity (hot wallet balance in ₹) */
  currentHouseLiquidity: number;
}

export interface BetValidationResult {
  /** Whether the bet is approved */
  approved: boolean;
  /** The maximum allowed wager for this multiplier */
  maxAllowedWager: number;
  /** The maximum potential payout the house will accept */
  maxPotentialPayout: number;
  /** If rejected, the reason code */
  rejectionReason: RejectionReason | null;
  /** Human-readable message for the frontend */
  message: string;
  /** Risk metadata for admin logging */
  riskMetadata: RiskMetadata;
}

export interface MaxBetResult {
  /** Maximum bet amount in ₹ */
  maxBet: number;
  /** Maximum potential payout at this multiplier */
  maxPayout: number;
  /** The multiplier used for calculation */
  multiplier: number;
  /** The house liquidity used for calculation */
  houseLiquidity: number;
  /** The exposure limit applied */
  exposureLimitPercent: number;
}

export interface RiskMetadata {
  /** Exposure as % of house liquidity */
  exposurePercent: number;
  /** Current total open exposure across all bets */
  currentTotalExposure: number;
  /** Current user's total open exposure */
  currentUserExposure: number;
  /** User's bet velocity (bets in last minute) */
  userBetVelocity: number;
  /** Risk tier classification */
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type RejectionReason =
  | 'EXCEEDS_SINGLE_BET_LIMIT'
  | 'EXCEEDS_USER_EXPOSURE_LIMIT'
  | 'EXCEEDS_TOTAL_EXPOSURE_CAP'
  | 'EXCEEDS_ABSOLUTE_MAX'
  | 'BELOW_MINIMUM_BET'
  | 'VELOCITY_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_LIQUIDITY'
  | 'INVALID_MULTIPLIER';

// ─────────────────────────────────────────────────────────────────────
// In-Memory Tracking (production would use Redis)
// ─────────────────────────────────────────────────────────────────────

interface OpenBet {
  userId: string;
  gameId: string;
  wager: number;
  potentialPayout: number;
  timestamp: number;
}

interface UserVelocity {
  timestamps: number[];
}

// ─────────────────────────────────────────────────────────────────────
// ExposureManager Class
// ─────────────────────────────────────────────────────────────────────

export class ExposureManager {
  private readonly config: ExposureConfig;
  private openBets: Map<string, OpenBet> = new Map();
  private userVelocity: Map<string, UserVelocity> = new Map();

  constructor(config?: Partial<ExposureConfig>) {
    this.config = {
      singleBetExposureLimit: 0.01,     // 1% of house liquidity
      perUserExposureLimit: 0.02,        // 2% per user
      totalExposureCap: 0.10,            // 10% total
      maxBetsPerMinute: 30,
      minimumBet: 10,                    // ₹10
      absoluteMaxBet: 10_000_000,        // ₹1 Crore
      ...config,
    };
  }

  // ─── Core: Calculate Maximum Bet ──────────────────────────────────

  /**
   * Calculates the maximum allowed bet for a given multiplier and liquidity.
   *
   * Formula:
   *   maxPayout = exposureLimit × houseLiquidity
   *   maxBet    = maxPayout / requestedMultiplier
   *
   * Example:
   *   Liquidity = ₹10,00,00,000 (₹10 Cr)
   *   Multiplier = 50.00x
   *   Exposure limit = 1%
   *
   *   maxPayout = 0.01 × 10,00,00,000 = ₹10,00,000
   *   maxBet = 10,00,000 / 50 = ₹20,000
   *
   *   → User can bet up to ₹20,000 at 50x, risking a max ₹10L payout.
   */
  calculateMaxBet(
    currentHouseLiquidity: number,
    requestedMultiplier: number
  ): MaxBetResult {
    if (requestedMultiplier < 1.01) {
      throw new Error(`Multiplier must be >= 1.01x, received ${requestedMultiplier}x`);
    }
    if (currentHouseLiquidity <= 0) {
      throw new Error(`House liquidity must be positive, received ₹${currentHouseLiquidity}`);
    }

    const maxPayout = this.config.singleBetExposureLimit * currentHouseLiquidity;
    let maxBet = maxPayout / requestedMultiplier;

    // Apply absolute hard cap
    maxBet = Math.min(maxBet, this.config.absoluteMaxBet);

    // Apply minimum floor
    maxBet = Math.max(maxBet, 0);

    // Truncate to 2 decimals (always favor house)
    maxBet = Math.floor(maxBet * 100) / 100;

    return {
      maxBet,
      maxPayout: Math.floor(maxBet * requestedMultiplier * 100) / 100,
      multiplier: requestedMultiplier,
      houseLiquidity: currentHouseLiquidity,
      exposureLimitPercent: this.config.singleBetExposureLimit * 100,
    };
  }

  // ─── Full Validation Pipeline ─────────────────────────────────────

  /**
   * Full bet validation: checks all risk constraints before allowing a bet.
   *
   * Pipeline:
   *   1. Validate multiplier range
   *   2. Check minimum bet
   *   3. Check absolute max
   *   4. Check single-bet exposure limit
   *   5. Check per-user aggregate exposure
   *   6. Check total platform exposure
   *   7. Check velocity (rate limiting)
   *   8. Compute risk tier
   */
  validateBet(request: BetValidationRequest): BetValidationResult {
    const {
      userId,
      requestedWager,
      requestedMultiplier,
      currentHouseLiquidity,
    } = request;

    const potentialPayout = requestedWager * requestedMultiplier;
    const currentUserExposure = this.getUserExposure(userId);
    const currentTotalExposure = this.getTotalExposure();
    const userBetVelocity = this.getUserVelocity(userId);

    // Helper to build the result
    const buildResult = (
      approved: boolean,
      rejectionReason: RejectionReason | null,
      message: string,
      maxAllowed?: number
    ): BetValidationResult => {
      const maxBetCalc = this.calculateMaxBet(currentHouseLiquidity, requestedMultiplier);
      const exposurePercent = (potentialPayout / currentHouseLiquidity) * 100;

      return {
        approved,
        maxAllowedWager: maxAllowed ?? maxBetCalc.maxBet,
        maxPotentialPayout: maxBetCalc.maxPayout,
        rejectionReason,
        message,
        riskMetadata: {
          exposurePercent: Math.round(exposurePercent * 1000) / 1000,
          currentTotalExposure,
          currentUserExposure,
          userBetVelocity,
          riskTier: this.classifyRiskTier(exposurePercent),
        },
      };
    };

    // ── Gate 1: Multiplier validation ──
    if (requestedMultiplier < 1.01 || requestedMultiplier > 1_000_000) {
      return buildResult(false, 'INVALID_MULTIPLIER', `Invalid multiplier: ${requestedMultiplier}x. Must be between 1.01x and 1,000,000x.`);
    }

    // ── Gate 2: Minimum bet ──
    if (requestedWager < this.config.minimumBet) {
      return buildResult(false, 'BELOW_MINIMUM_BET', `Minimum bet is ₹${this.config.minimumBet}. You entered ₹${requestedWager}.`);
    }

    // ── Gate 3: Absolute max ──
    if (requestedWager > this.config.absoluteMaxBet) {
      return buildResult(false, 'EXCEEDS_ABSOLUTE_MAX', `Maximum bet is ₹${this.config.absoluteMaxBet.toLocaleString()}.`, this.config.absoluteMaxBet);
    }

    // ── Gate 4: Insufficient liquidity ──
    if (currentHouseLiquidity < potentialPayout) {
      const maxBet = this.calculateMaxBet(currentHouseLiquidity, requestedMultiplier);
      return buildResult(false, 'INSUFFICIENT_LIQUIDITY', `House cannot cover this payout. Max bet: ₹${maxBet.maxBet.toLocaleString()}.`, maxBet.maxBet);
    }

    // ── Gate 5: Single-bet exposure ──
    const maxSinglePayout = this.config.singleBetExposureLimit * currentHouseLiquidity;
    if (potentialPayout > maxSinglePayout) {
      const maxBet = this.calculateMaxBet(currentHouseLiquidity, requestedMultiplier);
      return buildResult(
        false,
        'EXCEEDS_SINGLE_BET_LIMIT',
        `Bet exceeds single-bet exposure limit. Max bet at ${requestedMultiplier}x is ₹${maxBet.maxBet.toLocaleString()}.`,
        maxBet.maxBet
      );
    }

    // ── Gate 6: Per-user aggregate exposure ──
    const maxUserExposure = this.config.perUserExposureLimit * currentHouseLiquidity;
    if (currentUserExposure + potentialPayout > maxUserExposure) {
      const remainingUserBudget = maxUserExposure - currentUserExposure;
      const maxWager = Math.floor((remainingUserBudget / requestedMultiplier) * 100) / 100;
      return buildResult(
        false,
        'EXCEEDS_USER_EXPOSURE_LIMIT',
        `Your open bets already expose ₹${currentUserExposure.toLocaleString()}. Max additional bet: ₹${Math.max(0, maxWager).toLocaleString()}.`,
        Math.max(0, maxWager)
      );
    }

    // ── Gate 7: Total platform exposure ──
    const maxTotalExposure = this.config.totalExposureCap * currentHouseLiquidity;
    if (currentTotalExposure + potentialPayout > maxTotalExposure) {
      const remainingPlatformBudget = maxTotalExposure - currentTotalExposure;
      const maxWager = Math.floor((remainingPlatformBudget / requestedMultiplier) * 100) / 100;
      return buildResult(
        false,
        'EXCEEDS_TOTAL_EXPOSURE_CAP',
        `Platform exposure limit reached. Try a smaller bet or wait for open bets to resolve.`,
        Math.max(0, maxWager)
      );
    }

    // ── Gate 8: Velocity check ──
    if (userBetVelocity >= this.config.maxBetsPerMinute) {
      return buildResult(
        false,
        'VELOCITY_LIMIT_EXCEEDED',
        `Rate limit: max ${this.config.maxBetsPerMinute} bets per minute. Please wait.`
      );
    }

    // ── All gates passed ──
    return buildResult(true, null, 'Bet approved.');
  }

  // ─── Bet Lifecycle ────────────────────────────────────────────────

  /**
   * Register an open bet (called when a game round starts).
   * Returns a betId for later settlement.
   */
  registerBet(
    userId: string,
    gameId: string,
    wager: number,
    potentialPayout: number
  ): string {
    const betId = `bet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.openBets.set(betId, {
      userId,
      gameId,
      wager,
      potentialPayout,
      timestamp: Date.now(),
    });

    // Track velocity
    const velocity = this.userVelocity.get(userId) || { timestamps: [] };
    velocity.timestamps.push(Date.now());
    this.userVelocity.set(userId, velocity);

    return betId;
  }

  /**
   * Settle a bet (called when a game round ends).
   * Removes it from open exposure tracking.
   */
  settleBet(betId: string): OpenBet | null {
    const bet = this.openBets.get(betId);
    if (bet) {
      this.openBets.delete(betId);
    }
    return bet || null;
  }

  // ─── Exposure Queries ─────────────────────────────────────────────

  /** Total potential payout across all open bets */
  getTotalExposure(): number {
    let total = 0;
    for (const bet of this.openBets.values()) {
      total += bet.potentialPayout;
    }
    return total;
  }

  /** Total potential payout for a specific user */
  getUserExposure(userId: string): number {
    let total = 0;
    for (const bet of this.openBets.values()) {
      if (bet.userId === userId) {
        total += bet.potentialPayout;
      }
    }
    return total;
  }

  /** Number of bets placed by user in the last 60 seconds */
  getUserVelocity(userId: string): number {
    const velocity = this.userVelocity.get(userId);
    if (!velocity) return 0;

    const oneMinuteAgo = Date.now() - 60_000;
    velocity.timestamps = velocity.timestamps.filter(t => t > oneMinuteAgo);
    return velocity.timestamps.length;
  }

  /** Get all open bets (admin view) */
  getOpenBets(): { betId: string; bet: OpenBet }[] {
    const result: { betId: string; bet: OpenBet }[] = [];
    for (const [betId, bet] of this.openBets.entries()) {
      result.push({ betId, bet });
    }
    return result;
  }

  // ─── Risk Classification ──────────────────────────────────────────

  private classifyRiskTier(exposurePercent: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (exposurePercent < 0.1) return 'LOW';        // < 0.1% of liquidity
    if (exposurePercent < 0.5) return 'MEDIUM';      // < 0.5%
    if (exposurePercent < 1.0) return 'HIGH';         // < 1.0%
    return 'CRITICAL';                                // >= 1.0%
  }

  // ─── Dashboard Summary ────────────────────────────────────────────

  /** Returns a snapshot for the admin risk dashboard */
  getDashboardSnapshot(currentHouseLiquidity: number) {
    const totalExposure = this.getTotalExposure();
    const openBetCount = this.openBets.size;

    // Group by game
    const byGame: Record<string, { count: number; totalExposure: number }> = {};
    for (const bet of this.openBets.values()) {
      if (!byGame[bet.gameId]) {
        byGame[bet.gameId] = { count: 0, totalExposure: 0 };
      }
      byGame[bet.gameId].count++;
      byGame[bet.gameId].totalExposure += bet.potentialPayout;
    }

    // Group by user (top 10 by exposure)
    const byUser: Record<string, number> = {};
    for (const bet of this.openBets.values()) {
      byUser[bet.userId] = (byUser[bet.userId] || 0) + bet.potentialPayout;
    }
    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, exposure]) => ({
        userId,
        exposure,
        exposurePercent: Math.round((exposure / currentHouseLiquidity) * 10000) / 100,
      }));

    return {
      currentHouseLiquidity,
      totalExposure,
      totalExposurePercent: Math.round((totalExposure / currentHouseLiquidity) * 10000) / 100,
      openBetCount,
      riskTier: this.classifyRiskTier((totalExposure / currentHouseLiquidity) * 100),
      byGame,
      topUsers,
      limits: {
        singleBetMax: Math.floor(this.config.singleBetExposureLimit * currentHouseLiquidity * 100) / 100,
        perUserMax: Math.floor(this.config.perUserExposureLimit * currentHouseLiquidity * 100) / 100,
        totalCap: Math.floor(this.config.totalExposureCap * currentHouseLiquidity * 100) / 100,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────

export const exposureManager = new ExposureManager();
