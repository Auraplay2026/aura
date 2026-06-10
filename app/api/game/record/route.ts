/**
 * POST /api/game/record — Records a real game round
 * GET  /api/game/record — Returns recent game history
 */

import { NextResponse } from 'next/server';
import { gameHistory } from '@/lib/gameHistory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, userId, wager, payout, multiplier, won } = body;

    // Validation
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json({ error: 'gameId is required' }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (typeof wager !== 'number' || wager <= 0) {
      return NextResponse.json({ error: 'wager must be a positive number' }, { status: 400 });
    }
    if (typeof payout !== 'number' || payout < 0) {
      return NextResponse.json({ error: 'payout must be a non-negative number' }, { status: 400 });
    }

    const round = gameHistory.record({
      gameId,
      userId,
      wager,
      payout: payout || 0,
      multiplier: multiplier || 0,
      won: !!won,
    });

    return NextResponse.json({ success: true, round }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get('hours') || '24');
  const limit = parseInt(searchParams.get('limit') || '100');

  const rounds = gameHistory.getRounds(hours);

  return NextResponse.json({
    total: rounds.length,
    rounds: rounds.slice(-limit).reverse(), // Most recent first
  });
}
