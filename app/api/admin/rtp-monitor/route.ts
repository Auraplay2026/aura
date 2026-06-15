/**
 * ═══════════════════════════════════════════════════════════════════════
 * AuraBet — Live RTP Monitoring Dashboard API (REAL MODE)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * GET /api/admin/rtp-monitor
 *
 * Aggregates REAL game rounds from the gameHistory store.
 * No simulations — all data comes from actual user activity.
 */

import { NextResponse } from 'next/server';
import { gameHistory, GameRound } from '@/lib/gameHistory';
import { findUserByEmail } from '@/lib/userDb';

// ─────────────────────────────────────────────────────────────────────
// Game Registry (expected RTP per game based on house edge config)
// ─────────────────────────────────────────────────────────────────────


const GAME_REGISTRY: Record<string, { name: string; expectedRTP: number }> = {
  'dice':           { name: 'Dice',              expectedRTP: 98.0 },
  'mines':          { name: 'Mines',             expectedRTP: 98.0 },
  'plinko':         { name: 'Plinko',            expectedRTP: 98.0 },
  'limbo':          { name: 'Limbo',             expectedRTP: 98.0 },
  'crash':          { name: 'Crash',             expectedRTP: 97.0 },
  'keno':           { name: 'Keno',              expectedRTP: 98.0 },
  'coinflip':       { name: 'Coin Flip',         expectedRTP: 98.0 },
  'flappy-chicken': { name: 'Flappy Chicken',    expectedRTP: 95.0 },
  'roulette':       { name: 'Roulette',          expectedRTP: 97.3 },
  'blackjack':      { name: 'Blackjack',         expectedRTP: 99.5 },
  'baccarat':       { name: 'Baccarat',          expectedRTP: 98.76 },
  'slots':          { name: 'Slots (3rd Party)',  expectedRTP: 96.0 },
  'predictions':    { name: 'Predictions',       expectedRTP: 95.0 },
  'sportsbook':     { name: 'Sportsbook',        expectedRTP: 93.0 },
};

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface GameRTPReport {
  gameId: string;
  gameName: string;
  totalWagered: number;
  totalPayouts: number;
  roundsPlayed: number;
  actualRTP: number;
  expectedRTP: number;
  rtpDeviation: number;
  houseProfit: number;
  houseMarginPercent: number;
  isVolatile: boolean;
  riskLevel: 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  playerWinRate: number;
  avgBetSize: number;
  largestPayout: number;
}

// ─────────────────────────────────────────────────────────────────────
// Aggregation Engine (REAL DATA)
// ─────────────────────────────────────────────────────────────────────

function aggregateRTPData(rounds: GameRound[], volatilityThreshold: number = 110) {
  // Group by gameId
  const grouped: Record<string, GameRound[]> = {};
  for (const round of rounds) {
    if (!grouped[round.gameId]) grouped[round.gameId] = [];
    grouped[round.gameId].push(round);
  }

  const games: GameRTPReport[] = [];
  let platformWagered = 0;
  let platformPayouts = 0;
  let platformRounds = 0;

  for (const [gameId, gameRounds] of Object.entries(grouped)) {
    const gameInfo = GAME_REGISTRY[gameId] || { name: gameId, expectedRTP: 98.0 };

    const totalWagered = gameRounds.reduce((sum, r) => sum + r.wager, 0);
    const totalPayouts = gameRounds.reduce((sum, r) => sum + r.payout, 0);
    const roundsPlayed = gameRounds.length;
    const roundsWon = gameRounds.filter(r => r.won).length;
    const largestPayout = gameRounds.length > 0 ? Math.max(...gameRounds.map(r => r.payout)) : 0;

    const actualRTP = totalWagered > 0 ? (totalPayouts / totalWagered) * 100 : 0;
    const houseProfit = totalWagered - totalPayouts;
    const houseMarginPercent = totalWagered > 0 ? (houseProfit / totalWagered) * 100 : 0;
    const rtpDeviation = actualRTP - gameInfo.expectedRTP;
    const isVolatile = actualRTP > volatilityThreshold;

    let riskLevel: GameRTPReport['riskLevel'] = 'HEALTHY';
    if (rtpDeviation > 15) riskLevel = 'CRITICAL';
    else if (rtpDeviation > 10) riskLevel = 'WARNING';
    else if (rtpDeviation > 5) riskLevel = 'WATCH';

    games.push({
      gameId,
      gameName: gameInfo.name,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalPayouts: Math.round(totalPayouts * 100) / 100,
      roundsPlayed,
      actualRTP: Math.round(actualRTP * 100) / 100,
      expectedRTP: gameInfo.expectedRTP,
      rtpDeviation: Math.round(rtpDeviation * 100) / 100,
      houseProfit: Math.round(houseProfit * 100) / 100,
      houseMarginPercent: Math.round(houseMarginPercent * 100) / 100,
      isVolatile,
      riskLevel,
      playerWinRate: roundsPlayed > 0 ? Math.round((roundsWon / roundsPlayed) * 10000) / 100 : 0,
      avgBetSize: roundsPlayed > 0 ? Math.round((totalWagered / roundsPlayed) * 100) / 100 : 0,
      largestPayout: Math.round(largestPayout * 100) / 100,
    });

    platformWagered += totalWagered;
    platformPayouts += totalPayouts;
    platformRounds += roundsPlayed;
  }

  // Sort: volatile/critical first
  games.sort((a, b) => {
    const riskOrder = { CRITICAL: 0, WARNING: 1, WATCH: 2, HEALTHY: 3 };
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return b.rtpDeviation - a.rtpDeviation;
  });

  const volatileGames = games.filter(g => g.isVolatile);
  const platformRTP = platformWagered > 0 ? (platformPayouts / platformWagered) * 100 : 0;
  const platformProfit = platformWagered - platformPayouts;
  const platformMarginPercent = platformWagered > 0 ? (platformProfit / platformWagered) * 100 : 0;

  let platformRiskLevel: 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (volatileGames.length >= 3 || platformRTP > 105) platformRiskLevel = 'CRITICAL';
  else if (volatileGames.length >= 2 || platformRTP > 102) platformRiskLevel = 'WARNING';
  else if (volatileGames.length >= 1 || platformRTP > 100) platformRiskLevel = 'WATCH';

  return {
    generatedAt: new Date().toISOString(),
    windowHours: 24,
    dataSource: 'LIVE' as const,
    platformSummary: {
      totalWagered: Math.round(platformWagered * 100) / 100,
      totalPayouts: Math.round(platformPayouts * 100) / 100,
      platformRTP: Math.round(platformRTP * 100) / 100,
      platformProfit: Math.round(platformProfit * 100) / 100,
      platformMarginPercent: Math.round(platformMarginPercent * 100) / 100,
      totalRounds: platformRounds,
      isHealthy: platformWagered === 0 || platformRTP <= 100,
    },
    games,
    volatileGames,
    platformRiskLevel,
  };
}

// ─────────────────────────────────────────────────────────────────────
// API Route Handler
// ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('email');

    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized. Admin email query parameter is required.' }, { status: 401 });
    }

    const adminUser = await findUserByEmail(adminEmail);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Administrator privileges required.' }, { status: 403 });
    }

    const volatilityThreshold = parseFloat(searchParams.get('threshold') || '110');
    const hours = parseInt(searchParams.get('hours') || '24');
    const gameFilter = searchParams.get('game');

    // Read REAL data from the game history store
    let rounds = gameHistory.getRounds(hours);

    // Optional game filter
    if (gameFilter) {
      rounds = rounds.filter(r => r.gameId === gameFilter);
    }

    const report = aggregateRTPData(rounds, volatilityThreshold);

    return NextResponse.json(report, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Data-Source': 'LIVE',
        'X-Platform-Risk': report.platformRiskLevel,
        'X-Total-Rounds': String(report.platformSummary.totalRounds),
      },
    });
  } catch (error) {
    console.error('[RTP Monitor] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RTP report', details: String(error) },
      { status: 500 }
    );
  }
}
