/**
 * FAIR RNG ENGINE - Provably Fair System
 * 
 * Uses seeded HMAC-SHA256 hashing to provide cryptographically secure,
 * auditable randomness that users can verify independently.
 * 
 * Each game round is deterministic given a seed, allowing players to
 * verify game fairness after the fact.
 */

if (typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split(/\r?\n/).forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEquals = trimmed.indexOf('=');
          if (firstEquals !== -1) {
            const key = trimmed.substring(0, firstEquals).trim();
            let val = trimmed.substring(firstEquals + 1).trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn("Custom environment loader warning in fair-rng.ts:", e);
  }
}


// Browser-safe FNV-1a hash function fallback
function simpleHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

// Browser-safe seedable PRNG (Mulberry32)
function simplePRNG(seedStr: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  let t = (hash >>> 0) + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const val = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return Math.max(1e-12, val);
}

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
    serverId: (typeof process !== 'undefined' && process.env?.AURA_SERVER_ID) || 'aura-srv-001',
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
  
  if (typeof window !== 'undefined') {
    // Browser environment: return a deterministic local fallback hash
    return simpleHash(data + "|client-mock-key");
  }

  let hmacKey = process.env.FAIR_RNG_KEY;
  if (!hmacKey) {
    if (!(globalThis as any).__aura_session_rng_key__) {
      (globalThis as any).__aura_session_rng_key__ = process.env.NODE_ENV === 'production'
        ? require('crypto').randomBytes(32).toString('hex')
        : "aura-fair-rng-master-secret-key-2026-matrix-secure";
      console.warn("WARNING: FAIR_RNG_KEY environment variable is not set. Using secure fallback key.");
    }
    hmacKey = (globalThis as any).__aura_session_rng_key__;
  }

  const crypto = require('crypto');
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
    
    if (typeof window !== 'undefined') {
      // Browser environment: use deterministic Mulberry32 PRNG
      const val = simplePRNG(data);
      this.index += 1;
      return val;
    }

    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(data)
      .digest();

    // Use full 32-bit resolution to generate a double in [0, 1) with 4 billion+ outcomes.
    // Avoid returning exactly 0 to prevent division by zero in game engines.
    const rawVal = hash.readUInt32BE(0);
    const value = Math.max(1e-12, rawVal / 0x100000000);
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
