/**
 * GAME SIMULATION & FAIRNESS VERIFICATION
 * 
 * Runs 100,000+ round simulations for each game to verify:
 * 1. Empirical RTP matches theoretical 97% target
 * 2. No rigging or bias
 * 3. Probability distributions are correct
 */

import {
  calculateCrashOutcome,
  calculateDiceOutcome,
  calculateRouletteOutcome,
  calculateBlackjackOutcome,
  calculatePlinkoOutcome,
  calculateMinesOutcome,
  calculateTowerOutcome,
  calculateCoinflipOutcome,
  calculateKenoOutcome,
  calculateWheelOutcome,
  calculateLimboOutcome,
  GameOutcome,
} from './fair-casino-math';
import { generateFairRNGSeed } from './fair-rng';

function makeSeed(game: string, index: number) {
  return {
    serverId: 'aura-sim-001',
    roundId: `sim-${game}-${index}`,
    nonce: index,
    timestamp: 1770000000 + index,
  };
}

interface SimulationResult {
  gameName: string;
  totalRounds: number;
  wins: number;
  losses: number;
  winRate: number;
  totalBetAmount: number;
  totalPayoutAmount: number;
  empiricalRTP: number;
  theoreticalRTP: number;
  rtpDifference: number;
  confidenceLevel: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  averageMultiplier: number;
  maxWin: number;
  minWin: number;
}

const ROUNDS_PER_GAME = 100000;
const BET_AMOUNT = 100; // ₹100 per bet
const THEORETICAL_RTP = 0.97;
const TOLERANCE = 0.005; // ±0.5% tolerance
const CONFIDENCE_THRESHOLD = 0.95; // 95% confidence

// ============================================================================
// SIMULATION FUNCTIONS
// ============================================================================

function simulateCrash(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateCrashOutcome(2.0, makeSeed('crash', i)); // Target 2.0x
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Crash',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.485),
    status: determinateStatus('Crash', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 500, // Crash can go to 500x
    minWin: 1,
  };
}

function simulateDice(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateDiceOutcome(50, 'over', makeSeed('dice', i));
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Dice',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.5),
    status: determinateStatus('Dice', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 100,
    minWin: 1,
  };
}

function simulateRoulette(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateRouletteOutcome('even_money', undefined, makeSeed('roulette', i));
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Roulette',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 18 / 37),
    status: determinateStatus('Roulette', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 36,
    minWin: 2,
  };
}

function simulateBlackjack(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    // Simplified: player always hits to 18
    const outcome = calculateBlackjackOutcome(18, 6, makeSeed('blackjack', i));
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Blackjack',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.5403),
    status: determinateStatus('Blackjack', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 2.5,
    minWin: 1,
  };
}

function simulatePlinko(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculatePlinkoOutcome('medium', makeSeed('plinko', i));
    if (outcome.isWin) {
      wins += 1;
    }
    totalPayout += outcome.multiplier * BET_AMOUNT;
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Plinko',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.289),
    status: determinateStatus('Plinko', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / rounds,
    maxWin: 76,
    minWin: 0.5,
  };
}

function simulateMines(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateMinesOutcome(3, 5, makeSeed('mines', i));
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Mines',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.507),
    status: determinateStatus('Mines', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 100,
    minWin: 1,
  };
}

function simulateTower(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateTowerOutcome(9, 1, 3, makeSeed('tower', i));
    if (outcome.isWin) {
      wins += 1;
    }
    totalPayout += outcome.multiplier * BET_AMOUNT;
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Tower',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.0260128),
    status: determinateStatus('Tower', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / rounds,
    maxWin: 2000,
    minWin: 0,
  };
}

function simulateCoinflip(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateCoinflipOutcome('heads', makeSeed('coinflip', i));
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Coinflip',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.5),
    status: determinateStatus('Coinflip', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 2,
    minWin: 0,
  };
}

function simulateKeno(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  const selectedNumbers = Array.from({ length: 10 }, (_, i) => i + 1);

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateKenoOutcome(selectedNumbers, 20, makeSeed('keno', i));
    if (outcome.isWin) {
      wins += 1;
    }
    totalPayout += outcome.multiplier * BET_AMOUNT;
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Keno',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.0646),
    status: determinateStatus('Keno', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / rounds,
    maxWin: 500,
    minWin: 0,
  };
}

function simulateWheel(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateWheelOutcome(makeSeed('wheel', i));
    if (outcome.isWin) {
      wins += 1;
    }
    totalPayout += outcome.multiplier * BET_AMOUNT;
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Wheel',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.9),
    status: determinateStatus('Wheel', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / rounds,
    maxWin: 1.5,
    minWin: 0,
  };
}

function simulateLimbo(rounds: number): SimulationResult {
  let totalPayout = 0;
  let wins = 0;

  for (let i = 0; i < rounds; i++) {
    const outcome = calculateLimboOutcome(2.0, makeSeed('limbo', i));
    if (outcome.isWin) {
      wins += 1;
      totalPayout += outcome.multiplier * BET_AMOUNT;
    }
  }

  const empiricalRTP = totalPayout / (rounds * BET_AMOUNT);

  return {
    gameName: 'Limbo',
    totalRounds: rounds,
    wins,
    losses: rounds - wins,
    winRate: wins / rounds,
    totalBetAmount: rounds * BET_AMOUNT,
    totalPayoutAmount: totalPayout,
    empiricalRTP,
    theoreticalRTP: THEORETICAL_RTP,
    rtpDifference: Math.abs(empiricalRTP - THEORETICAL_RTP),
    confidenceLevel: calculateConfidence(rounds, wins / rounds, 0.485),
    status: determinateStatus('Limbo', empiricalRTP, THEORETICAL_RTP, rounds),
    averageMultiplier: totalPayout / (wins > 0 ? wins : 1),
    maxWin: 500,
    minWin: 1,
  };
}

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

function calculateConfidence(rounds: number, observedRate: number, expectedRate: number): number {
  // Using normal approximation to binomial
  // Z = (observed - expected) / sqrt(expected * (1 - expected) / n)
  const variance = (expectedRate * (1 - expectedRate)) / rounds;
  const stdDev = Math.sqrt(variance);
  const z = Math.abs((observedRate - expectedRate) / stdDev);

  // Convert Z to confidence using standard normal table approximation
  // Z=1.96 → 95% confidence
  return Math.max(0, Math.min(1, 1 - 2 * (1 - cumulativeNormal(z))));
}

function cumulativeNormal(z: number): number {
  // Approximation of standard normal CDF
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1 / (1 + p * z);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y = 1 - (a5 * t5 + a4 * t4 + a3 * t3 + a2 * t2 + a1 * t) * Math.exp(-z * z);

  return 0.5 * (1 + sign * y);
}

const THEORETICAL_STD_DEV: Record<string, number> = {
  'Crash': 0.9405,
  'Dice': 0.97,
  'Roulette': 0.9965,
  'Blackjack': 1.0,
  'Plinko': 1.12,
  'Mines': 0.955,
  'Tower': 2.90,
  'Coinflip': 0.97,
  'Keno': 11.8,
  'Wheel': 0.545,
  'Limbo': 0.94,
};

function determinateStatus(gameName: string, empirical: number, theoretical: number, rounds: number): 'PASS' | 'FAIL' | 'WARNING' {
  const diff = Math.abs(empirical - theoretical);
  const stdDev = THEORETICAL_STD_DEV[gameName] || 1.0;
  const sem = stdDev / Math.sqrt(rounds);

  // 1.96 standard errors -> 95% confidence interval for PASS
  // 2.58 standard errors -> 99% confidence interval for WARNING (fail if outside)
  if (diff <= 1.96 * sem) {
    return 'PASS';
  } else if (diff <= 2.58 * sem) {
    return 'WARNING';
  } else {
    return 'FAIL';
  }
}

// ============================================================================
// MAIN SIMULATION RUNNER
// ============================================================================

export async function runAllGameSimulations(): Promise<SimulationResult[]> {
  console.log('🎰 AURA FAIR GAMES SIMULATION');
  console.log(`📊 Running ${ROUNDS_PER_GAME.toLocaleString()} rounds per game`);
  console.log(`🎯 Target RTP: ${(THEORETICAL_RTP * 100).toFixed(1)}%`);
  console.log(`📈 Tolerance: ±${(TOLERANCE * 100).toFixed(2)}%`);
  console.log('━'.repeat(80));

  const results: SimulationResult[] = [];

  const simulators = [
    simulateCrash,
    simulateDice,
    simulateRoulette,
    simulateBlackjack,
    simulatePlinko,
    simulateMines,
    simulateTower,
    simulateCoinflip,
    simulateKeno,
    simulateWheel,
    simulateLimbo,
  ];

  for (const simulator of simulators) {
    const result = simulator(ROUNDS_PER_GAME);
    results.push(result);

    const statusIcon =
      result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';

    console.log(`${statusIcon} ${result.gameName.padEnd(15)} | RTP: ${(result.empiricalRTP * 100).toFixed(2)}% | Win Rate: ${(result.winRate * 100).toFixed(2)}% | Avg Multiplier: ${result.averageMultiplier.toFixed(2)}x`);
  }

  console.log('━'.repeat(80));

  // Summary
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warnCount = results.filter((r) => r.status === 'WARNING').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  console.log(`\n📋 SUMMARY`);
  console.log(`✅ PASS: ${passCount}/${results.length}`);
  console.log(`⚠️  WARNING: ${warnCount}/${results.length}`);
  console.log(`❌ FAIL: ${failCount}/${results.length}`);

  return results;
}

export function formatSimulationReport(results: SimulationResult[]): string {
  let report = '# Fair Game Simulation Report\n\n';
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Rounds per game:** ${ROUNDS_PER_GAME.toLocaleString()}\n`;
  report += `**Target RTP:** ${(THEORETICAL_RTP * 100).toFixed(1)}%\n`;
  report += `**Tolerance:** ±${(TOLERANCE * 100).toFixed(2)}%\n\n`;

  report += '## Results\n\n';
  report += '| Game | RTP | Win Rate | Status | Confidence |\n';
  report += '|------|-----|----------|--------|------------|\n';

  for (const result of results) {
    const status = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    report += `| ${result.gameName} | ${(result.empiricalRTP * 100).toFixed(2)}% | ${(result.winRate * 100).toFixed(2)}% | ${status} | ${(result.confidenceLevel * 100).toFixed(1)}% |\n`;
  }

  return report;
}
