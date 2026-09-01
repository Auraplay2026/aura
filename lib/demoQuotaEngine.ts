"use client";

interface DemoQuotaRecord {
  date: string;
  playedGames: string[]; // List of game IDs played today
  totalCount: number;
}

const STORAGE_KEY = "aura_demo_quota_v1";
const MAX_DAILY_DEMO_GAMES = 3;
const MAX_ROUNDS_PER_GAME = 1;

function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function getDemoQuotaStatus(gameId?: string): {
  playedCount: number;
  maxDaily: number;
  remainingCount: number;
  canPlay: boolean;
  gameAlreadyPlayed: boolean;
  playedGames: string[];
} {
  if (typeof window === "undefined") {
    return {
      playedCount: 0,
      maxDaily: MAX_DAILY_DEMO_GAMES,
      remainingCount: MAX_DAILY_DEMO_GAMES,
      canPlay: true,
      gameAlreadyPlayed: false,
      playedGames: []
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();
    let record: DemoQuotaRecord = { date: today, playedGames: [], totalCount: 0 };

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        record = parsed;
      }
    }

    const playedGames = record.playedGames || [];
    const totalCount = playedGames.length;
    const gameAlreadyPlayed = gameId ? playedGames.includes(gameId) : false;
    const canPlay = totalCount < MAX_DAILY_DEMO_GAMES && (!gameId || !gameAlreadyPlayed);
    const remainingCount = Math.max(0, MAX_DAILY_DEMO_GAMES - totalCount);

    return {
      playedCount: totalCount,
      maxDaily: MAX_DAILY_DEMO_GAMES,
      remainingCount,
      canPlay,
      gameAlreadyPlayed,
      playedGames
    };
  } catch (e) {
    return {
      playedCount: 0,
      maxDaily: MAX_DAILY_DEMO_GAMES,
      remainingCount: MAX_DAILY_DEMO_GAMES,
      canPlay: true,
      gameAlreadyPlayed: false,
      playedGames: []
    };
  }
}

export function recordDemoGamePlay(gameId: string): { success: boolean; reason?: string } {
  if (typeof window === "undefined") return { success: true };

  try {
    const today = getTodayString();
    const raw = localStorage.getItem(STORAGE_KEY);
    let record: DemoQuotaRecord = { date: today, playedGames: [], totalCount: 0 };

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        record = parsed;
      }
    }

    if (record.playedGames.includes(gameId)) {
      return { success: false, reason: `You have already played your 1 free demo round for this game today.` };
    }

    if (record.playedGames.length >= MAX_DAILY_DEMO_GAMES) {
      return { success: false, reason: `Daily limit reached: 3/3 demo games completed today. Please switch to Real Money to continue.` };
    }

    record.playedGames.push(gameId);
    record.totalCount = record.playedGames.length;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));

    // Dispatch global event for HUD updates
    window.dispatchEvent(new CustomEvent("demo-quota-updated", { detail: record }));

    return { success: true };
  } catch (e) {
    return { success: true };
  }
}