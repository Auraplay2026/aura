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
}) {
  // Fire-and-forget — don't block the UI
  fetch('/api/game/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // Silently ignore recording failures — don't break the game
  });
}
