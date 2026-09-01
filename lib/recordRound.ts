import { recordDemoGamePlay, getDemoQuotaStatus } from './demoQuotaEngine';

/**
 * Records a game round to the server-side history via API.
 * Called from client-side store after every bet/trade/game completion.
 */
export function recordGameRound(data: {
  gameId: string;
  userId: string;
  wager: number;
  payout: number;
  multiplier: number;
  won: boolean;
  isDemo?: boolean;
}) {
  // If demo round, record to local demo quota engine
  if (data.isDemo || data.userId === 'demo' || data.userId === 'guest') {
    recordDemoGamePlay(data.gameId);
  }

  // Fire-and-forget — don't block the UI
  fetch('/api/game/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // Silently ignore recording failures — don't break the game
  });
}

