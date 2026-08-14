export interface MarketBase {
  id: string;
  yes: number;
}

const MARKET_BASES: Record<string, { yes: number, options?: Record<string, number> }> = {
  "pol-1": { yes: 100, options: { opt1: 100, opt2: 100 } },
  "pol-2": { yes: 83, options: { opt1: 83, opt2: 18 } },
  "pol-3": { yes: 69, options: { opt1: 69, opt2: 58 } },
  "pol-4": { yes: 20, options: { opt1: 20, opt2: 10 } },
  "pol-5": { yes: 10, options: { opt1: 10, opt2: 10 } },
  "pol-6": { yes: 94, options: { opt1: 94, opt2: 6 } },
  "cry-1": { yes: 75, options: { opt1: 75, opt2: 25 } },
  "cry-2": { yes: 40, options: { opt1: 40, opt2: 60 } },
  "tru-1": { yes: 15, options: { opt1: 15, opt2: 85 } },
  "geo-2": { yes: 82, options: { opt1: 82, opt2: 18 } },
  "tec-2": { yes: 60, options: { opt1: 60, opt2: 40 } },
  "ear-2": { yes: 48, options: { opt1: 48, opt2: 52 } },
  "tru-2": { yes: 30, options: { opt1: 30, opt2: 70 } },
  "fin-2": { yes: 85, options: { opt1: 85, opt2: 15 } },
  "spo-cri-1": { yes: 48 },
  "spo-cri-2": { yes: 55 },
  "spo-cri-3": { yes: 65 },
  "spo-kab-1": { yes: 60 },
  "spo-kab-2": { yes: 45 },
  "spo-isl-1": { yes: 52 },
  "spo-isl-2": { yes: 58 },
  "spo-bgmi-1": { yes: 55 },
  "spo-bad-1": { yes: 65 },
  "spo-bad-2": { yes: 48 },
  "spo-che-1": { yes: 42 },
  "spo-hoc-1": { yes: 75 },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 1. CPMM (Constant Product Market Maker) ENGINE - Manifold / Polymarket Standard
 * ═══════════════════════════════════════════════════════════════════════════════
 * Invariant: k = y * n
 * Implied probability of YES = n / (y + n)
 * Implied probability of NO = y / (y + n)
 */

export interface CpmmPoolState {
  yesPool: number;
  noPool: number;
  pYes: number;
  pNo: number;
}

export function calculateCpmmProbability(yesPool: number, noPool: number): { pYes: number; pNo: number } {
  if (yesPool <= 0 || noPool <= 0) return { pYes: 0.5, pNo: 0.5 };
  const pYes = noPool / (yesPool + noPool);
  const pNo = yesPool / (yesPool + noPool);
  return {
    pYes: parseFloat(pYes.toFixed(4)),
    pNo: parseFloat(pNo.toFixed(4))
  };
}

export interface CpmmTradeResult {
  shares: number;
  avgPrice: number;
  newYesPool: number;
  newNoPool: number;
  newPYes: number;
  slippagePercent: number;
}

export function calculateCpmmBuy(
  yesPool: number,
  noPool: number,
  investmentAmount: number,
  outcome: "YES" | "NO"
): CpmmTradeResult {
  const initialProb = calculateCpmmProbability(yesPool, noPool);
  const startP = outcome === "YES" ? initialProb.pYes : initialProb.pNo;
  const k = yesPool * noPool;

  let newYes = yesPool;
  let newNo = noPool;
  let shares = 0;

  if (outcome === "YES") {
    // Adding to NO pool, taking from YES pool
    newNo = noPool + investmentAmount;
    newYes = k / newNo;
    shares = (yesPool + investmentAmount) - newYes;
  } else {
    // Adding to YES pool, taking from NO pool
    newYes = yesPool + investmentAmount;
    newNo = k / newYes;
    shares = (noPool + investmentAmount) - newNo;
  }

  const avgPrice = investmentAmount / Math.max(0.001, shares);
  const newProbs = calculateCpmmProbability(newYes, newNo);
  const endP = outcome === "YES" ? newProbs.pYes : newProbs.pNo;
  const slippagePercent = Math.abs((avgPrice - startP) / startP) * 100;

  return {
    shares: parseFloat(shares.toFixed(2)),
    avgPrice: parseFloat(Math.min(0.99, Math.max(0.01, avgPrice)).toFixed(4)),
    newYesPool: parseFloat(newYes.toFixed(2)),
    newNoPool: parseFloat(newNo.toFixed(2)),
    newPYes: newProbs.pYes,
    slippagePercent: parseFloat(slippagePercent.toFixed(2))
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 2. LMSR (Logarithmic Market Scoring Rule) ENGINE - Robin Hanson Standard
 * ═══════════════════════════════════════════════════════════════════════════════
 * Cost Function: C(q) = b * ln(e^(qYes/b) + e^(qNo/b))
 * Price(YES) = e^(qYes/b) / (e^(qYes/b) + e^(qNo/b))
 */

export function calculateLmsrCost(qYes: number, qNo: number, b: number = 100): number {
  const maxQ = Math.max(qYes, qNo) / b;
  // Numerical stability offset
  const sumExp = Math.exp((qYes / b) - maxQ) + Math.exp((qNo / b) - maxQ);
  return b * (maxQ + Math.log(sumExp));
}

export function calculateLmsrPrices(qYes: number, qNo: number, b: number = 100): { pYes: number; pNo: number } {
  const diff = (qYes - qNo) / b;
  const pYes = 1 / (1 + Math.exp(-diff));
  const pNo = 1 - pYes;
  return {
    pYes: parseFloat(pYes.toFixed(4)),
    pNo: parseFloat(pNo.toFixed(4))
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 3. LIMIT ORDER BOOK MATCHING ENGINE - fasenderos / Price-Time Priority
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface LimitOrder {
  id: string;
  userId: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
  price: number; // 0.01 to 0.99
  amount: number;
  filled: number;
  timestamp: number;
}

export interface MatchTrade {
  makerOrderId: string;
  takerOrderId: string;
  price: number;
  matchedAmount: number;
  timestamp: number;
}

export function matchLimitOrder(
  existingOrders: LimitOrder[],
  newOrder: LimitOrder
): { updatedBook: LimitOrder[]; executedTrades: MatchTrade[]; remainingOrder: LimitOrder | null } {
  const book = [...existingOrders];
  const executedTrades: MatchTrade[] = [];
  let remainingAmount = newOrder.amount - newOrder.filled;

  // Matching criteria: opposite side, matching outcome, compatible price
  // For BUY: maker SELL price <= taker BUY price (sorted lowest price first)
  // For SELL: maker BUY price >= taker SELL price (sorted highest price first)
  const isBuy = newOrder.side === "BUY";
  const eligibleMakers = book
    .filter(o => o.outcome === newOrder.outcome && o.side !== newOrder.side && o.userId !== newOrder.userId)
    .sort((a, b) => isBuy ? a.price - b.price : b.price - a.price || a.timestamp - b.timestamp);

  for (const maker of eligibleMakers) {
    if (remainingAmount <= 0) break;
    const isPriceCompatible = isBuy ? maker.price <= newOrder.price : maker.price >= newOrder.price;
    if (!isPriceCompatible) break;

    const makerAvailable = maker.amount - maker.filled;
    const tradeAmount = Math.min(remainingAmount, makerAvailable);

    maker.filled += tradeAmount;
    remainingAmount -= tradeAmount;

    executedTrades.push({
      makerOrderId: maker.id,
      takerOrderId: newOrder.id,
      price: maker.price, // Maker price determines execution
      matchedAmount: parseFloat(tradeAmount.toFixed(2)),
      timestamp: Date.now()
    });
  }

  // Remove completely filled maker orders
  const updatedBook = book.filter(o => o.amount > o.filled);
  const remainingOrder: LimitOrder | null = remainingAmount > 0 
    ? { ...newOrder, filled: newOrder.amount - remainingAmount } 
    : null;

  if (remainingOrder) {
    updatedBook.push(remainingOrder);
  }

  return { updatedBook, executedTrades, remainingOrder };
}

/**
 * Deterministic Price Drift Engine for Public Demo & Simulated Markets
 */
export function getDeterministicPrice(marketId: string, optionId?: string | null, timestamp = Date.now()): number {
  const cleanId = marketId.replace(/^scraped-cri-|^scraped-ten-/, 'spo-cri-').split('-').slice(0, 3).join('-');
  const base = MARKET_BASES[cleanId] || MARKET_BASES[marketId] || { yes: 50 };
  
  let basePrice = base.yes;
  if (optionId && base.options && base.options[optionId] !== undefined) {
    basePrice = base.options[optionId];
  }
  
  if (basePrice === 100 || basePrice === 0) return basePrice;

  // Compute a deterministic offset based on time
  const angle = ((timestamp % 600000) / 600000) * 2 * Math.PI;
  
  let hash = 0;
  const key = `${marketId}-${optionId || ''}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const phase = ((Math.abs(hash) % 100) / 100) * 2 * Math.PI;
  const amplitude = 5 + (Math.abs(hash) % 11);
  
  const drift = Math.sin(angle + phase) * amplitude;
  let finalPrice = Math.round(basePrice + drift);
  
  if (finalPrice >= 99) finalPrice = 99;
  if (finalPrice <= 1) finalPrice = 1;
  
  return finalPrice;
}

export function getOptionIdFromBuyPrice(marketId: string, buyPrice: number): string | null {
  const cleanId = marketId.replace(/^scraped-cri-|^scraped-ten-/, 'spo-cri-').split('-').slice(0, 3).join('-');
  const base = MARKET_BASES[cleanId] || MARKET_BASES[marketId];
  if (!base || !base.options) return null;
  
  let closestOptId: string | null = null;
  let minDiff = Infinity;
  for (const [optId, optPrice] of Object.entries(base.options)) {
    const diff = Math.abs(buyPrice - optPrice);
    if (diff < minDiff) {
      minDiff = diff;
      closestOptId = optId;
    }
  }
  return closestOptId;
}
