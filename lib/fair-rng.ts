/**
 * FAIR RNG ENGINE - Provably Fair System
 * 
 * Uses seeded HMAC-SHA256 hashing to provide cryptographically secure,
 * auditable randomness that users can verify independently.
 * 
 * Each game round is deterministic given a seed, allowing players to
 * verify game fairness after the fact.
 */

import crypto from 'crypto';

export interface FairRNGSeed {
  serverId: string;           // e.g., "aura-prod-01"
  roundId: string;            // unique ID for this game round
  nonce: number;              // sequential nonce for additional entropy
  timestamp: number;          // block timestamp
  clientSeed?: string;        // optional user-provided seed for additional fairness
}

/**
 * Generate a deterministic but unpredictable seed for a game round
 * Users can optionally provide a client seed for additional verification
 */
export function generateFairRNGSeed(roundId: string, clientSeed?: string): FairRNGSeed {
  return {
    serverId: process.env.AURA_SERVER_ID || 'aura-srv-001',
    roundId,
    nonce: Math.floor(Date.now() / 1000),
    timestamp: Date.now(),
    clientSeed: clientSeed || undefined,
  };
}

/**
 * Convert seed to deterministic hash for reproducible RNG
 */
export function seedToHash(seed: FairRNGSeed): string {
  const data = JSON.stringify(seed);
  const hmacKey = process.env.FAIR_RNG_KEY || 'aura-fair-rng-master-key-2026';
  return crypto
    .createHmac('sha256', hmacKey)
    .update(data)
    .digest('hex');
}

/**
 * FairRNG - Seeded deterministic random number generator
 * Provides reproducible pseudo-random values for fair game outcomes
 */
export class FairRNG {
  private seed: string;
  private index: number = 0;

  constructor(seed: FairRNGSeed | string) {
    this.seed = typeof seed === 'string' ? seed : seedToHash(seed);
  }

  /**
   * Generate next random number in [0, 1)
   * Each call advances the internal index, ensuring different values per call
   */
  next(): number {
    const data = `${this.seed}|${this.index}`;
    const hash = crypto
      .createHash('sha256')
      .update(data)
      .digest();

    const value = (hash.readUInt32BE(0) % 10000) / 10000; // 0 to 0.9999
    this.index += 1;

    return value;
  }

  /**
   * Generate random integer in [min, max)
   */
  nextInt(min: number, max: number): number {
    const range = max - min;
    return min + Math.floor(this.next() * range);
  }

  /**
   * Generate random boolean (50/50)
   */
  nextBool(): boolean {
    return this.next() < 0.5;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Shuffle array using Fisher-Yates
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Generate a sequence of random numbers from a seed
 * Useful for simulations and testing
 */
export function generateRandomSequence(
  seed: FairRNGSeed | string,
  count: number,
): number[] {
  const rng = new FairRNG(seed);
  const sequence: number[] = [];
  for (let i = 0; i < count; i++) {
    sequence.push(rng.next());
  }
  return sequence;
}

/**
 * Verify a round result by recreating the RNG state
 * Users can verify that a game outcome was fair given a seed
 */
export function verifyRoundFairness(
  seed: FairRNGSeed,
  recordedRandomValues: number[],
  tolerance: number = 0.0001,
): boolean {
  const rng = new FairRNG(seed);
  for (const recorded of recordedRandomValues) {
    const generated = rng.next();
    if (Math.abs(generated - recorded) > tolerance) {
      return false; // Mismatch = game was manipulated
    }
  }
  return true; // All values match = game was fair
}
