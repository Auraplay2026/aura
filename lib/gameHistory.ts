/**
 * ═══════════════════════════════════════════════════════════════════════
 * AuraBet — Real Game History Store (Server-Side Singleton)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Records every game round played on the platform. Used by the RTP
 * monitor to calculate real-time return-to-player metrics.
 *
 * In production: replace with PostgreSQL/TimescaleDB.
 * For now: Node.js global singleton persists across hot reloads.
 */import fs from 'fs';
import { getUsers } from '@/lib/userDb';
import { parseCasinoDetails } from '@/lib/utils';
import path from 'path';

export interface GameRound {
  id: string;
  gameId: string;
  userId: string;
  wager: number;
  payout: number;
  multiplier: number;
  won: boolean;
  timestamp: number;
}

// Use globalThis to survive Next.js hot reloads in dev
const GLOBAL_KEY = '__aurabet_game_history__' as const;

function getStore(): GameRound[] {
  if (!(globalThis as any)[GLOBAL_KEY]) {
    const store: GameRound[] = [];
    (globalThis as any)[GLOBAL_KEY] = store;
    
    // Load existing transactions and build game rounds to persist in history
    try {
      const dbFile = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(dbFile)) {
        const data = fs.readFileSync(dbFile, 'utf-8');
        const users = JSON.parse(data);
        if (Array.isArray(users)) {
          const uniqueTxIds = new Set<string>();
          for (const user of users) {
            const allTx = [
              ...(user.realTransactions || [])
            ];
            
            for (const tx of allTx) {
              if (uniqueTxIds.has(tx.id)) continue;
              uniqueTxIds.add(tx.id);
              
              if (tx.type === 'casino') {
                const details = tx.details || '';
                const gameMatch = details.match(/Played ([^(]+)/);
                if (gameMatch) {
                  const gameId = gameMatch[1].trim().toLowerCase();
                  const { wager, payout } = parseCasinoDetails(details);
                  store.push({
                    id: `round_${tx.id}`,
                    gameId,
                    userId: user.email,
                    wager,
                    payout,
                    multiplier: wager > 0 ? parseFloat((payout / wager).toFixed(2)) : 0,
                    won: payout > wager,
                    timestamp: tx.timestamp || Date.now()
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load and sync game history from users database", e);
    }
  }
  return (globalThis as any)[GLOBAL_KEY];
}

export const gameHistory = {
  /** Record a completed game round */
  record(round: Omit<GameRound, 'id' | 'timestamp'>): GameRound {
    const store = getStore();
    const entry: GameRound = {
      ...round,
      id: `round_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    store.push(entry);

    // Cap at 50,000 rounds to prevent memory bloat
    if (store.length > 50000) {
      store.splice(0, store.length - 50000);
    }

    return entry;
  },

  /** Get all rounds within the last N hours */
  getRounds(windowHours: number = 24): GameRound[] {
    const store = getStore();
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    return store.filter(r => r.timestamp >= cutoff);
  },

  /** Get all rounds (no time filter) */
  getAllRounds(): GameRound[] {
    return getStore();
  },

  /** Get total round count */
  getCount(): number {
    return getStore().length;
  },

  /** Clear all history */
  clear(): void {
    (globalThis as any)[GLOBAL_KEY] = [];
  },
};
