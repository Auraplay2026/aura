/**
 * Centralized Casino Math Engine
 * 
 * Enforces the strict 80% loss / 20% win ratio mandate across all games,
 * while implementing "Near-Miss" psychology to encourage replay.
 */

function getSecureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
  return Math.random();
}

export interface GameOutcome {
  isWin: boolean;
  multiplier: number;
  isNearMiss: boolean;
}

export function calculateGameOutcome(
  gameType: "SLOTS" | "CRASH" | "TABLE" | "ORIGINAL", 
  userTargetMultiplier?: number
): GameOutcome {
  // Global mandate: 20% win rate (2 out of 10)
  const WIN_RATE = 0.20;
  
  const roll = getSecureRandom();
  const isWin = roll < WIN_RATE;
  
  // "Near Miss" psychology: 40% of losses should look like a near miss
  const isNearMiss = !isWin && getSecureRandom() < 0.40;
  
  let multiplier = 0;

  // ==== SLOTS & ORIGINALS (Non-user-defined target) ====
  if (gameType === "SLOTS" || (!userTargetMultiplier && gameType !== "CRASH" && gameType !== "TABLE")) {
    if (isWin) {
      // Average payout of ~3x ensures House Edge of 40% (RTP 60%)
      const mRoll = getSecureRandom();
      if (mRoll < 0.50) {
        multiplier = 1.2 + getSecureRandom() * 1.8; // 1.2x - 3.0x (Frequent small wins)
      } else if (mRoll < 0.85) {
        multiplier = 3.0 + getSecureRandom() * 2.0; // 3.0x - 5.0x
      } else if (mRoll < 0.98) {
        multiplier = 5.0 + getSecureRandom() * 5.0; // 5.0x - 10.0x
      } else {
        multiplier = 10.0 + getSecureRandom() * 40.0; // 10.0x - 50.0x (Jackpot)
      }
    } else {
      multiplier = 0;
    }
  }

  // ==== CRASH GAMES ====
  if (gameType === "CRASH") {
    if (isWin) {
      // If win, the crash multiplier goes high enough to make players feel good
      multiplier = 2.0 + (getSecureRandom() * 8.0); // Crashes between 2.0x and 10.0x
    } else {
      // If loss, crash happens VERY early
      if (isNearMiss) {
        // "Near Miss" in crash means it crashes right before a psychological threshold (e.g. 1.95x instead of 2.0x)
        multiplier = 1.5 + (getSecureRandom() * 0.45); // 1.50x - 1.95x
      } else {
        // Brutal instant crash
        multiplier = 1.00 + (getSecureRandom() * 0.15); // 1.00x - 1.15x
      }
    }
  }

  // ==== GAMES WITH USER-DEFINED TARGETS (Limbo, Dice) ====
  if (userTargetMultiplier && gameType !== "CRASH") {
    if (isWin) {
      // To win, the generated multiplier MUST be higher than the target
      multiplier = userTargetMultiplier + (getSecureRandom() * (userTargetMultiplier * 0.5));
    } else {
      // To lose, the generated multiplier MUST be lower than the target
      if (isNearMiss) {
        // Just barely miss the target
        multiplier = userTargetMultiplier * (0.85 + getSecureRandom() * 0.14);
      } else {
        // Completely miss
        multiplier = userTargetMultiplier * (0.1 + getSecureRandom() * 0.5);
      }
    }
  }

  // ==== TABLE GAMES (Blackjack, Baccarat, Roulette) ====
  if (gameType === "TABLE") {
    if (isWin) {
      multiplier = 2.0; // Standard 1:1 payout
    } else {
      multiplier = 0.0;
    }
  }

  return { isWin, multiplier, isNearMiss };
}
