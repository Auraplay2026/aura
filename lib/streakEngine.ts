export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

export interface StreakCheckResult {
  status: 'already_claimed' | 'claim_available' | 'streak_broken';
  newStreak: number;
  todayStr: string;
}

export function checkStreak(lastLoginDateStr: string | null, currentStreak: number): StreakCheckResult {
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  if (!lastLoginDateStr) {
    return {
      status: 'claim_available',
      newStreak: 1,
      todayStr,
    };
  }

  if (lastLoginDateStr === todayStr) {
    return {
      status: 'already_claimed',
      newStreak: currentStreak || 1,
      todayStr,
    };
  }

  if (lastLoginDateStr === yesterdayStr) {
    // Continued streak. Cycle day 1 to 7.
    const streak = currentStreak >= 7 ? 1 : currentStreak + 1;
    return {
      status: 'claim_available',
      newStreak: streak,
      todayStr,
    };
  }

  // Older than yesterday, so streak is broken
  return {
    status: 'streak_broken',
    newStreak: 1,
    todayStr,
  };
}
