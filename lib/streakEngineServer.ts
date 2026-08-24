import { prisma } from './prisma';

export const APP_TIMEZONE = 'Asia/Kolkata'; // Official timezone (IST, UTC+05:30)

export const DAILY_STREAK_REWARDS: Record<number, number> = {
  1: 10,
  2: 20,
  3: 30,
  4: 50,
  5: 75,
  6: 100,
  7: 200,
};

export const WHEEL_SECTORS = [
  { label: "₹10", prize: 10, weight: 45, color: "#1e1b4b" },
  { label: "₹10,000 MEGA", prize: 10, weight: 0, color: "#b45309" }, // Teaser Illusion (0% real probability)
  { label: "₹25", prize: 25, weight: 30, color: "#312e81" },
  { label: "₹5,000 VIP", prize: 25, weight: 0, color: "#6d28d9" }, // Teaser Illusion (0% real probability)
  { label: "₹50", prize: 50, weight: 18, color: "#3730a3" },
  { label: "₹2,500 VAULT", prize: 50, weight: 0, color: "#047857" }, // Teaser Illusion (0% real probability)
  { label: "₹75", prize: 75, weight: 5, color: "#4f46e5" },
  { label: "₹100", prize: 100, weight: 2, color: "#4338ca" },
];

/**
 * Returns deterministic date string 'YYYY-MM-DD' in official application timezone (Asia/Kolkata)
 */
export function getAppDateString(timestamp?: number): string {
  const d = timestamp !== undefined ? new Date(timestamp) : new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Returns previous calendar day 'YYYY-MM-DD' in official application timezone
 */
export function getYesterdayAppDateString(todayDateStr?: string): string {
  const baseDate = todayDateStr 
    ? new Date(`${todayDateStr}T12:00:00+05:30`)
    : new Date();
  baseDate.setDate(baseDate.getDate() - 1);
  return getAppDateString(baseDate.getTime());
}

/**
 * Calculates exact calendar days between two 'YYYY-MM-DD' date strings
 */
export function getCalendarDaysDifference(dateStrA: string, dateStrB: string): number {
  const da = new Date(`${dateStrA}T12:00:00+05:30`);
  const db = new Date(`${dateStrB}T12:00:00+05:30`);
  const diffTime = db.getTime() - da.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface StreakStatus {
  currentStreak: number; // 1..7 cycle
  streakDay: number; // 1..7 cycle
  longestStreak: number;
  totalActiveDays: number;
  streakStartDate: string;
  todayDate: string;
  lastEligibleActivityDate: string | null;
  eligibleForToday: boolean;
  streakClaimedToday: boolean;
  spinClaimedToday: boolean;
  streakRewardAmount: number;
  history: Array<{
    date: string;
    dayNumber: number;
    activityLogged: boolean;
    streakClaimed: boolean;
    streakReward: number;
    spinClaimed: boolean;
    spinReward: number;
    spinPrizeName?: string | null;
    timestamp: number;
  }>;
}

/**
 * Atomically records user activity for today's calendar date and updates consecutive streak count.
 */
export async function recordUserActivity(
  userId: string,
  ip?: string,
  customTimestamp?: number
): Promise<StreakStatus> {
  const now = customTimestamp || Date.now();
  const todayDate = getAppDateString(now);
  const yesterdayDate = getYesterdayAppDateString(todayDate);

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch or create UserStreak with row lock
    let userStreak = await tx.userStreak.findUnique({
      where: { userId },
      include: {
        history: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!userStreak) {
      userStreak = await tx.userStreak.create({
        data: {
          userId,
          streakStartDate: todayDate,
          currentStreak: 1,
          longestStreak: 1,
          totalActiveDays: 1,
          lastEligibleActivityDate: todayDate,
          lastActivityTimestamp: now,
        },
        include: {
          history: true,
        },
      });

      await tx.streakHistory.create({
        data: {
          userStreakId: userStreak.id,
          userId,
          date: todayDate,
          dayNumber: 1,
          activityLogged: true,
          timestamp: now,
          ip: ip || '127.0.0.1',
        },
      });
    } else {
      const lastActivityDate = userStreak.lastEligibleActivityDate;

      if (lastActivityDate === todayDate) {
        // Already recorded today. Ensure today's history row exists.
        const todayHist = await tx.streakHistory.findUnique({
          where: { userId_date: { userId, date: todayDate } },
        });

        if (!todayHist) {
          await tx.streakHistory.create({
            data: {
              userStreakId: userStreak.id,
              userId,
              date: todayDate,
              dayNumber: userStreak.currentStreak || 1,
              activityLogged: true,
              timestamp: now,
              ip: ip || '127.0.0.1',
            },
          });
        }
      } else if (lastActivityDate === yesterdayDate) {
        // Consecutive Day! Advance streak (1..7 cycle)
        const nextStreak = (userStreak.currentStreak % 7) + 1;
        const newLongest = Math.max(userStreak.longestStreak, nextStreak);
        const newTotalDays = userStreak.totalActiveDays + 1;

        userStreak = await tx.userStreak.update({
          where: { id: userStreak.id },
          data: {
            currentStreak: nextStreak,
            longestStreak: newLongest,
            totalActiveDays: newTotalDays,
            lastEligibleActivityDate: todayDate,
            lastActivityTimestamp: now,
          },
          include: {
            history: {
              orderBy: { date: 'desc' },
              take: 30,
            },
          },
        });

        await tx.streakHistory.upsert({
          where: { userId_date: { userId, date: todayDate } },
          create: {
            userStreakId: userStreak.id,
            userId,
            date: todayDate,
            dayNumber: nextStreak,
            activityLogged: true,
            timestamp: now,
            ip: ip || '127.0.0.1',
          },
          update: {
            activityLogged: true,
            dayNumber: nextStreak,
            timestamp: now,
          },
        });
      } else {
        // Missed one or more days -> Reset to Day 1
        const newTotalDays = userStreak.totalActiveDays + 1;
        const newLongest = Math.max(userStreak.longestStreak, 1);

        userStreak = await tx.userStreak.update({
          where: { id: userStreak.id },
          data: {
            streakStartDate: todayDate,
            currentStreak: 1,
            longestStreak: newLongest,
            totalActiveDays: newTotalDays,
            lastEligibleActivityDate: todayDate,
            lastActivityTimestamp: now,
          },
          include: {
            history: {
              orderBy: { date: 'desc' },
              take: 30,
            },
          },
        });

        await tx.streakHistory.upsert({
          where: { userId_date: { userId, date: todayDate } },
          create: {
            userStreakId: userStreak.id,
            userId,
            date: todayDate,
            dayNumber: 1,
            activityLogged: true,
            timestamp: now,
            ip: ip || '127.0.0.1',
          },
          update: {
            activityLogged: true,
            dayNumber: 1,
            timestamp: now,
          },
        });
      }
    }

    // Refresh history
    const historyRows = await tx.streakHistory.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const todayHistory = historyRows.find((h) => h.date === todayDate);
    const streakClaimedToday = todayHistory ? todayHistory.streakClaimed : false;
    const spinClaimedToday = todayHistory ? todayHistory.spinClaimed : false;
    const currentStreak = Math.max(1, Math.min(7, userStreak.currentStreak || 1));

    return {
      currentStreak,
      streakDay: currentStreak,
      longestStreak: userStreak.longestStreak || 1,
      totalActiveDays: userStreak.totalActiveDays || 1,
      streakStartDate: userStreak.streakStartDate,
      todayDate,
      lastEligibleActivityDate: userStreak.lastEligibleActivityDate,
      eligibleForToday: true,
      streakClaimedToday,
      spinClaimedToday,
      streakRewardAmount: DAILY_STREAK_REWARDS[currentStreak] || 50,
      history: historyRows.map((h) => ({
        date: h.date,
        dayNumber: h.dayNumber,
        activityLogged: h.activityLogged,
        streakClaimed: h.streakClaimed,
        streakReward: h.streakReward,
        spinClaimed: h.spinClaimed,
        spinReward: h.spinReward,
        spinPrizeName: h.spinPrizeName,
        timestamp: h.timestamp,
      })),
    };
  });
}

/**
 * Returns user's authoritative streak status from PostgreSQL.
 */
export async function getUserStreakStatus(userId: string, customTimestamp?: number): Promise<StreakStatus> {
  const now = customTimestamp || Date.now();
  const todayDate = getAppDateString(now);

  const userStreak = await prisma.userStreak.findUnique({
    where: { userId },
    include: {
      history: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  if (!userStreak) {
    // Record initial activity if missing
    return await recordUserActivity(userId, '127.0.0.1', now);
  }

  const lastActivityDate = userStreak.lastEligibleActivityDate;
  const yesterdayDate = getYesterdayAppDateString(todayDate);

  // If last activity is not today and not yesterday, user missed days (streak is broken)
  let currentStreak = userStreak.currentStreak;
  if (!lastActivityDate || (lastActivityDate !== todayDate && lastActivityDate !== yesterdayDate)) {
    currentStreak = 1; // Will reset to 1 on next activity
  }

  currentStreak = Math.max(1, Math.min(7, currentStreak || 1));

  const historyRows = userStreak.history || [];
  const todayHistory = historyRows.find((h) => h.date === todayDate);

  const streakClaimedToday = todayHistory ? todayHistory.streakClaimed : userStreak.lastStreakClaimDate === todayDate;
  const spinClaimedToday = todayHistory ? todayHistory.spinClaimed : userStreak.lastSpinClaimDate === todayDate;

  return {
    currentStreak,
    streakDay: currentStreak,
    longestStreak: userStreak.longestStreak || 1,
    totalActiveDays: userStreak.totalActiveDays || 1,
    streakStartDate: userStreak.streakStartDate,
    todayDate,
    lastEligibleActivityDate: userStreak.lastEligibleActivityDate,
    eligibleForToday: true,
    streakClaimedToday,
    spinClaimedToday,
    streakRewardAmount: DAILY_STREAK_REWARDS[currentStreak] || 50,
    history: historyRows.map((h) => ({
      date: h.date,
      dayNumber: h.dayNumber,
      activityLogged: h.activityLogged,
      streakClaimed: h.streakClaimed,
      streakReward: h.streakReward,
      spinClaimed: h.spinClaimed,
      spinReward: h.spinReward,
      spinPrizeName: h.spinPrizeName,
      timestamp: h.timestamp,
    })),
  };
}

/**
 * Claims today's daily streak cash reward atomically with exclusive database locking.
 */
export async function claimDailyStreakReward(
  userId: string,
  email: string,
  customTimestamp?: number
): Promise<{ success: boolean; reward: number; day: number; newBalance: number }> {
  const now = customTimestamp || Date.now();
  const todayDate = getAppDateString(now);

  return await prisma.$transaction(async (tx) => {
    // 1. Acquire row lock on User
    const lockedRows: any[] = await tx.$queryRaw`
      SELECT id FROM "User"
      WHERE id = ${userId}
      FOR UPDATE
    `;

    if (lockedRows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 2. Fetch or create UserStreak
    let userStreak = await tx.userStreak.findUnique({
      where: { userId },
    });

    if (!userStreak) {
      userStreak = await tx.userStreak.create({
        data: {
          userId,
          streakStartDate: todayDate,
          currentStreak: 1,
          longestStreak: 1,
          totalActiveDays: 1,
          lastEligibleActivityDate: todayDate,
          lastActivityTimestamp: now,
        },
      });
    }

    // Check if already claimed today
    const existingHistory = await tx.streakHistory.findUnique({
      where: { userId_date: { userId, date: todayDate } },
    });

    if (existingHistory && existingHistory.streakClaimed) {
      throw new Error('DAILY_ALREADY_CLAIMED');
    }

    if (userStreak.lastStreakClaimDate === todayDate) {
      throw new Error('DAILY_ALREADY_CLAIMED');
    }

    const currentStreak = Math.max(1, Math.min(7, userStreak.currentStreak || 1));
    const rewardAmount = DAILY_STREAK_REWARDS[currentStreak] || 50;

    // 3. Update User Balance
    const wallet = user.accountType === 'real' ? 'real' : 'demo';
    const currentBal = wallet === 'real' ? user.realBalance : user.demoBalance;
    const newBal = Math.round((currentBal + rewardAmount) * 100) / 100;

    const userUpdateData: any = { balance: newBal };
    if (wallet === 'real') userUpdateData.realBalance = newBal;
    else userUpdateData.demoBalance = newBal;

    await tx.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    // 4. Create Ledger Transaction
    const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await tx.transaction.create({
      data: {
        id: txId,
        type: 'deposit',
        amount: rewardAmount,
        balanceAfter: newBal,
        timestamp: now,
        details: `Claimed Daily Reward (Day ${currentStreak} Streak)`,
        status: 'Completed',
        walletType: wallet,
        userId,
      },
    });

    // 5. Update Streak & History
    await tx.userStreak.update({
      where: { id: userStreak.id },
      data: {
        lastStreakClaimDate: todayDate,
        lastEligibleActivityDate: todayDate,
        lastActivityTimestamp: now,
      },
    });

    await tx.streakHistory.upsert({
      where: { userId_date: { userId, date: todayDate } },
      create: {
        userStreakId: userStreak.id,
        userId,
        date: todayDate,
        dayNumber: currentStreak,
        activityLogged: true,
        streakClaimed: true,
        streakReward: rewardAmount,
        timestamp: now,
      },
      update: {
        streakClaimed: true,
        streakReward: rewardAmount,
        dayNumber: currentStreak,
        activityLogged: true,
        timestamp: now,
      },
    });

    return {
      success: true,
      reward: rewardAmount,
      day: currentStreak,
      newBalance: newBal,
    };
  });
}

/**
 * Claims today's daily spin reward atomically with prize validation and duplicate protection.
 */
export async function claimDailySpinReward(
  userId: string,
  email: string,
  prizeIndex: number,
  customTimestamp?: number
): Promise<{ success: boolean; prize: (typeof WHEEL_SECTORS)[number]; newBalance: number }> {
  const now = customTimestamp || Date.now();
  const todayDate = getAppDateString(now);

  if (typeof prizeIndex !== 'number' || prizeIndex < 0 || prizeIndex >= WHEEL_SECTORS.length) {
    throw new Error('INVALID_PRIZE_INDEX');
  }

  const sector = WHEEL_SECTORS[prizeIndex];

  return await prisma.$transaction(async (tx) => {
    // 1. Acquire row lock on User
    const lockedRows: any[] = await tx.$queryRaw`
      SELECT id FROM "User"
      WHERE id = ${userId}
      FOR UPDATE
    `;

    if (lockedRows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 2. Fetch or create UserStreak
    let userStreak = await tx.userStreak.findUnique({
      where: { userId },
    });

    if (!userStreak) {
      userStreak = await tx.userStreak.create({
        data: {
          userId,
          streakStartDate: todayDate,
          currentStreak: 1,
          longestStreak: 1,
          totalActiveDays: 1,
          lastEligibleActivityDate: todayDate,
          lastActivityTimestamp: now,
        },
      });
    }

    // Check if already spun today
    const existingHistory = await tx.streakHistory.findUnique({
      where: { userId_date: { userId, date: todayDate } },
    });

    if (existingHistory && existingHistory.spinClaimed) {
      throw new Error('SPIN_ALREADY_CLAIMED');
    }

    if (userStreak.lastSpinClaimDate === todayDate) {
      throw new Error('SPIN_ALREADY_CLAIMED');
    }

    const prizeCash = sector.prize || 0;
    const wallet = user.accountType === 'real' ? 'real' : 'demo';
    const currentBal = wallet === 'real' ? user.realBalance : user.demoBalance;
    const newBal = Math.round((currentBal + prizeCash) * 100) / 100;

    if (prizeCash > 0) {
      const userUpdateData: any = { balance: newBal };
      if (wallet === 'real') userUpdateData.realBalance = newBal;
      else userUpdateData.demoBalance = newBal;

      await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });

      const txId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await tx.transaction.create({
        data: {
          id: txId,
          type: 'deposit',
          amount: prizeCash,
          balanceAfter: newBal,
          timestamp: now,
          details: `Spin the Wheel: Won ${sector.label} on Spin Wheel`,
          status: 'Completed',
          walletType: wallet,
          userId,
        },
      });
    }

    // 3. Update Streak & History
    await tx.userStreak.update({
      where: { id: userStreak.id },
      data: {
        lastSpinClaimDate: todayDate,
        lastEligibleActivityDate: todayDate,
        lastActivityTimestamp: now,
      },
    });

    await tx.streakHistory.upsert({
      where: { userId_date: { userId, date: todayDate } },
      create: {
        userStreakId: userStreak.id,
        userId,
        date: todayDate,
        dayNumber: userStreak.currentStreak || 1,
        activityLogged: true,
        spinClaimed: true,
        spinReward: prizeCash,
        spinPrizeName: sector.label,
        timestamp: now,
      },
      update: {
        spinClaimed: true,
        spinReward: prizeCash,
        spinPrizeName: sector.label,
        activityLogged: true,
        timestamp: now,
      },
    });

    return {
      success: true,
      prize: sector,
      newBalance: newBal,
    };
  });
}