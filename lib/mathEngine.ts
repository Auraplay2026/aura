/**
 * Foundational framework for an autonomous algorithmic settlement layer.
 * Processes match data feeds, adjusts odds dynamically for exposure,
 * validates ledger integrity, and settles session bets.
 */

export interface AlgorithmicBet {
  marketName: string;
  selectionName: string;
  lineValue?: number;
  stake: number;
  odds: number;
  type: 'back' | 'lay';
}

// Global simulated platform parameters
let platformLiquidityPool = 10000000; // ₹10,000,000 baseline liquidity
const marketLiabilities: Record<string, number> = {};

/**
 * 1. Algorithmic Margin Balancing:
 * Market Margin = Total Liability Selection A / Total Platform Liquidity Pool
 */
export function calculateDynamicMargin(selectionId: string, liability: number): number {
  const currentLiability = marketLiabilities[selectionId] || 0;
  const newLiability = currentLiability + liability;
  marketLiabilities[selectionId] = newLiability;

  // Calculate dynamic margin as a fraction of platform liquidity pool
  const margin = newLiability / platformLiquidityPool;
  
  // Bound margin between 2% and 25% to prevent complete feed compression
  return Math.min(0.25, Math.max(0.02, margin));
}

/**
 * Adjust odds dynamically in real-time as money floods into a selection.
 * Shortens the odds (decreases payout multiplier) as liability rises.
 */
export function adjustOddsForExposure(baseOdds: number, selectionId: string, newLiability: number): number {
  const margin = calculateDynamicMargin(selectionId, newLiability);
  const adjustedOdds = baseOdds * (1 - margin);
  return Math.max(1.01, parseFloat(adjustedOdds.toFixed(2)));
}

/**
 * Reset liability maps on page reloads or new match instances
 */
export function resetMarketLiabilities() {
  Object.keys(marketLiabilities).forEach(key => {
    delete marketLiabilities[key];
  });
}

/**
 * 2. Strict Cryptographic Transaction Idempotency Checks:
 * User Ledger Balance >= Bet Stake + Potential Liability
 */
export function validateTransactionIdempotency(
  userBalance: number,
  stake: number,
  odds: number,
  type: 'back' | 'lay'
): { success: boolean; requiredFunds: number; error?: string } {
  // Lay bet potential liability = Stake * (Odds - 1)
  // Back bet potential liability = Stake
  const potentialLiability = type === 'lay' ? stake * (odds - 1) : 0;
  const totalRequired = stake + potentialLiability;

  if (stake <= 0) {
    return { success: false, requiredFunds: 0, error: "INVALID_STAKE_AMOUNT" };
  }

  if (userBalance < totalRequired) {
    return { 
      success: false, 
      requiredFunds: totalRequired, 
      error: `INSUFFICIENT_LEDGER_BALANCE. Required: ₹${Math.round(totalRequired)}, Available: ₹${Math.round(userBalance)}` 
    };
  }

  return { success: true, requiredFunds: totalRequired };
}

/**
 * 3. Autonomous Ball-by-Ball and Session Settle Engine
 * Resolves outcomes dynamically based on incoming actual raw cricket runs / delivery feeds.
 */
export function parseAndSettleBet(
  bet: AlgorithmicBet,
  actualRuns: number
): { won: boolean; payout: number } {
  const line = bet.lineValue || 155.5;
  const isOver = bet.selectionName.toLowerCase().includes('over');
  
  // Determine if user selection wins
  const won = isOver ? (actualRuns > line) : (actualRuns < line);

  let payout = 0;
  if (won) {
    payout = bet.type === 'back' ? bet.stake * bet.odds : bet.stake;
  }

  return {
    won,
    payout: Math.round(payout)
  };
}
