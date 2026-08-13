import { prisma } from '@/lib/prisma';

interface RateLimitRecord {
  timestamps: number[];
  lastOppositeSideCheck?: {
    matchTitle: string;
    selection: string;
    side: 'yes' | 'no';
    timestamp: number;
  };
}

// In-memory sliding window cache for high-throughput velocity checks
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < 60000);
    if (record.timestamps.length === 0 && (!record.lastOppositeSideCheck || now - record.lastOppositeSideCheck.timestamp > 300000)) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export interface FraudCheckParams {
  userIdOrEmail: string;
  ip?: string | null;
  matchTitle: string;
  selection: string;
  side: 'yes' | 'no';
  stake: number;
  odds: number;
}

export interface FraudCheckResult {
  allowed: boolean;
  reason?: string;
  flagType?: 'VELOCITY_LIMIT' | 'ARBITRAGE_HEDGING' | 'BOT_BURST' | 'HIGH_STAKE_UNVERIFIED';
}

/**
 * Enterprise Anti-Fraud & Arbitrage Guard
 * Enforces velocity limits, bot burst prevention, and opposite-side hedging detection.
 */
export async function validateBetSecurity(params: FraudCheckParams): Promise<FraudCheckResult> {
  const now = Date.now();
  const identifier = (params.userIdOrEmail || 'anon').toLowerCase();
  const ipKey = params.ip ? `ip:${params.ip}` : null;

  // 1. User Velocity Rate Limiting (Max 10 bets per 10 seconds per user)
  let userRecord = rateLimitStore.get(identifier);
  if (!userRecord) {
    userRecord = { timestamps: [] };
    rateLimitStore.set(identifier, userRecord);
  }

  // Filter timestamps within last 10 seconds
  userRecord.timestamps = userRecord.timestamps.filter(ts => now - ts < 10000);

  if (userRecord.timestamps.length >= 10) {
    return {
      allowed: false,
      reason: 'VELOCITY_LIMIT_EXCEEDED: Maximum 10 wagers allowed per 10-second window.',
      flagType: 'VELOCITY_LIMIT'
    };
  }

  // 2. IP Velocity & Bot Burst Protection (Max 25 bets per 10 seconds per IP)
  if (ipKey) {
    let ipRecord = rateLimitStore.get(ipKey);
    if (!ipRecord) {
      ipRecord = { timestamps: [] };
      rateLimitStore.set(ipKey, ipRecord);
    }
    ipRecord.timestamps = ipRecord.timestamps.filter(ts => now - ts < 10000);
    if (ipRecord.timestamps.length >= 25) {
      return {
        allowed: false,
        reason: 'IP_BURST_LIMIT_EXCEEDED: High-frequency betting pattern detected from this network.',
        flagType: 'BOT_BURST'
      };
    }
    ipRecord.timestamps.push(now);
  }

  // 3. Opposite-Side Hedging / Multi-Account Arbitrage Detection
  // Check if user recently placed the opposite side on the identical selection in the last 60 seconds
  if (userRecord.lastOppositeSideCheck) {
    const prev = userRecord.lastOppositeSideCheck;
    const isSameMatch = prev.matchTitle.toLowerCase() === params.matchTitle.toLowerCase();
    const isSameSelection = prev.selection.toLowerCase() === params.selection.toLowerCase();
    const isOppositeSide = prev.side !== params.side;
    const isRecent = now - prev.timestamp < 60000; // within 60s

    if (isSameMatch && isSameSelection && isOppositeSide && isRecent) {
      return {
        allowed: false,
        reason: 'ARBITRAGE_HEDGE_PROHIBITED: Rapid opposing Back/Lay wagers on the same market are prohibited.',
        flagType: 'ARBITRAGE_HEDGING'
      };
    }
  }

  // Record this wager attempt
  userRecord.timestamps.push(now);
  userRecord.lastOppositeSideCheck = {
    matchTitle: params.matchTitle,
    selection: params.selection,
    side: params.side,
    timestamp: now
  };

  return { allowed: true };
}
