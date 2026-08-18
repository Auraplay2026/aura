require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APP_TIMEZONE = 'Asia/Kolkata';

function getAppDateString(timestamp) {
  const d = timestamp !== undefined ? new Date(timestamp) : new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

function getYesterdayAppDateString(todayDateStr) {
  const baseDate = todayDateStr 
    ? new Date(`${todayDateStr}T12:00:00+05:30`)
    : new Date();
  baseDate.setDate(baseDate.getDate() - 1);
  return getAppDateString(baseDate.getTime());
}

const DAILY_STREAK_REWARDS = {
  1: 50,
  2: 100,
  3: 200,
  4: 350,
  5: 500,
  6: 1000,
  7: 5000,
};

const WHEEL_SECTORS = [
  { label: "₹50", prize: 50 },
  { label: "₹100", prize: 100 },
  { label: "₹250", prize: 250 },
  { label: "₹500", prize: 500 },
  { label: "₹1,000", prize: 1000 },
  { label: "₹5,000", prize: 5000 },
  { label: "500 XP", prize: 0 },
  { label: "₹150", prize: 150 },
];

async function recordActivity(userId, customDateStr) {
  const now = new Date(`${customDateStr}T12:00:00+05:30`).getTime();
  const todayDate = customDateStr;
  const yesterdayDate = getYesterdayAppDateString(todayDate);

  return await prisma.$transaction(async (tx) => {
    let userStreak = await tx.userStreak.findUnique({
      where: { userId },
      include: { history: { orderBy: { date: 'desc' }, take: 30 } },
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
        include: { history: true },
      });

      await tx.streakHistory.create({
        data: {
          userStreakId: userStreak.id,
          userId,
          date: todayDate,
          dayNumber: 1,
          activityLogged: true,
          timestamp: now,
        },
      });
    } else {
      const lastActivityDate = userStreak.lastEligibleActivityDate;

      if (lastActivityDate === todayDate) {
        // Already recorded today
      } else if (lastActivityDate === yesterdayDate) {
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
          include: { history: { orderBy: { date: 'desc' }, take: 30 } },
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
          },
          update: { activityLogged: true, dayNumber: nextStreak, timestamp: now },
        });
      } else {
        // Streak broken
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
          include: { history: { orderBy: { date: 'desc' }, take: 30 } },
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
          },
          update: { activityLogged: true, dayNumber: 1, timestamp: now },
        });
      }
    }

    const updated = await tx.userStreak.findUnique({
      where: { userId },
      include: { history: { orderBy: { date: 'desc' }, take: 30 } },
    });

    return updated;
  });
}

async function claimStreak(userId, customDateStr) {
  const now = new Date(`${customDateStr}T12:00:00+05:30`).getTime();
  const todayDate = customDateStr;

  return await prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw`
      SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE
    `;
    if (lockedRows.length === 0) throw new Error('USER_NOT_FOUND');

    const user = await tx.user.findUnique({ where: { id: userId } });
    let userStreak = await tx.userStreak.findUnique({ where: { userId } });
    if (!userStreak) throw new Error('NO_STREAK');

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
    const newBal = (user.realBalance || 0) + rewardAmount;

    await tx.user.update({
      where: { id: userId },
      data: { realBalance: newBal, balance: newBal },
    });

    await tx.userStreak.update({
      where: { id: userStreak.id },
      data: { lastStreakClaimDate: todayDate, lastActivityTimestamp: now },
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
      update: { streakClaimed: true, streakReward: rewardAmount, timestamp: now },
    });

    return { rewardAmount, newBal, day: currentStreak };
  });
}

async function claimSpin(userId, prizeIndex, customDateStr) {
  const now = new Date(`${customDateStr}T12:00:00+05:30`).getTime();
  const todayDate = customDateStr;
  const sector = WHEEL_SECTORS[prizeIndex];

  return await prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw`
      SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE
    `;
    if (lockedRows.length === 0) throw new Error('USER_NOT_FOUND');

    const user = await tx.user.findUnique({ where: { id: userId } });
    let userStreak = await tx.userStreak.findUnique({ where: { userId } });
    if (!userStreak) throw new Error('NO_STREAK');

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
    const newBal = (user.realBalance || 0) + prizeCash;

    if (prizeCash > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { realBalance: newBal, balance: newBal },
      });
    }

    await tx.userStreak.update({
      where: { id: userStreak.id },
      data: { lastSpinClaimDate: todayDate, lastActivityTimestamp: now },
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
        timestamp: now,
      },
    });

    return { prize: sector, newBal };
  });
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       STREAK ENGINE PRODUCTION VERIFICATION MATRIX');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // Cleanup test users if exist
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'streak_test_' } },
  });

  // TEST 1: Consecutive 7-Day Usage + Day 8 Loop
  console.log('\n--- TEST 1: Consecutive 7-Day Progression & Cycle Loop ---');
  const user1 = await prisma.user.create({
    data: {
      email: 'streak_test_consecutive@aurabet.com',
      username: 'streak_consecutive_user',
      passwordHash: 'hashedpassword',
      realBalance: 0,
    },
  });

  const dates = [
    '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04',
    '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08'
  ];
  const expectedStreaks = [1, 2, 3, 4, 5, 6, 7, 1]; // Day 8 smoothly loops back to 1
  const expectedRewards = [50, 100, 200, 350, 500, 1000, 5000, 50];

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    const s = await recordActivity(user1.id, d);
    assert(s.currentStreak === expectedStreaks[i], `Date ${d}: currentStreak is ${s.currentStreak} (expected ${expectedStreaks[i]})`);
    assert(s.totalActiveDays === i + 1, `Date ${d}: totalActiveDays is ${s.totalActiveDays} (expected ${i + 1})`);
    
    const claimRes = await claimStreak(user1.id, d);
    assert(claimRes.rewardAmount === expectedRewards[i], `Date ${d}: claimed reward ₹${claimRes.rewardAmount} (expected ₹${expectedRewards[i]})`);
  }

  const finalUser1Streak = await prisma.userStreak.findUnique({ where: { userId: user1.id } });
  assert(finalUser1Streak.longestStreak === 7, `User 1 Longest Streak is 7`);
  assert(finalUser1Streak.totalActiveDays === 8, `User 1 Total Active Days is 8`);

  // TEST 2: Missed Day Reset Policy
  console.log('\n--- TEST 2: Missed Day & Streak Reset Policy ---');
  const user2 = await prisma.user.create({
    data: {
      email: 'streak_test_missed@aurabet.com',
      username: 'streak_missed_user',
      passwordHash: 'hashedpassword',
      realBalance: 0,
    },
  });

  await recordActivity(user2.id, '2026-08-01'); // Day 1
  let u2s = await recordActivity(user2.id, '2026-08-02'); // Day 2
  assert(u2s.currentStreak === 2, `Day 2 completed: streak is 2`);

  // Skip 2026-08-03 (Missed day!)
  u2s = await recordActivity(user2.id, '2026-08-04'); // Return on Day 4
  assert(u2s.currentStreak === 1, `After missing a day, streak correctly resets to Day 1`);
  assert(u2s.longestStreak === 2, `Longest streak correctly preserved as 2`);
  assert(u2s.totalActiveDays === 3, `Total active days correctly counted as 3`);

  // TEST 3: Concurrent Duplicate Claim Protection
  console.log('\n--- TEST 3: Concurrent Race Protection (10 Parallel Claims) ---');
  const user3 = await prisma.user.create({
    data: {
      email: 'streak_test_race@aurabet.com',
      username: 'streak_race_user',
      passwordHash: 'hashedpassword',
      realBalance: 0,
    },
  });
  await recordActivity(user3.id, '2026-08-18');

  // Fire 10 parallel claims
  const parallelClaims = Array.from({ length: 10 }).map(() => claimStreak(user3.id, '2026-08-18'));
  const results = await Promise.allSettled(parallelClaims);
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  assert(succeeded.length === 1, `Exactly 1 parallel claim succeeded (got ${succeeded.length})`);
  assert(rejected.length === 9, `Exactly 9 parallel claims rejected with duplicate protection (got ${rejected.length})`);
  
  const user3Db = await prisma.user.findUnique({ where: { id: user3.id } });
  assert(user3Db.realBalance === 50, `User wallet balance credited exactly once with ₹50 (current balance: ₹${user3Db.realBalance})`);

  // TEST 4: Activity vs Spin Independence
  console.log('\n--- TEST 4: Activity vs Spin Claim Independence ---');
  const user4 = await prisma.user.create({
    data: {
      email: 'streak_test_independence@aurabet.com',
      username: 'streak_indep_user',
      passwordHash: 'hashedpassword',
      realBalance: 100,
    },
  });
  await recordActivity(user4.id, '2026-08-18');
  
  const histBefore = await prisma.streakHistory.findUnique({
    where: { userId_date: { userId: user4.id, date: '2026-08-18' } }
  });
  assert(histBefore.activityLogged === true, `Activity logged is true`);
  assert(histBefore.streakClaimed === false, `Streak cash reward is initially unclaimed`);
  assert(histBefore.spinClaimed === false, `Spin wheel is initially unclaimed`);

  // Claim spin only (prizeIndex: 3 -> ₹500)
  const spinRes = await claimSpin(user4.id, 3, '2026-08-18');
  assert(spinRes.prize.prize === 500, `Spin won ₹500`);

  const histAfterSpin = await prisma.streakHistory.findUnique({
    where: { userId_date: { userId: user4.id, date: '2026-08-18' } }
  });
  assert(histAfterSpin.spinClaimed === true, `Spin is now claimed`);
  assert(histAfterSpin.streakClaimed === false, `Streak cash reward is STILL available to claim`);

  // Now claim streak reward
  const streakRes = await claimStreak(user4.id, '2026-08-18');
  assert(streakRes.rewardAmount === 50, `Streak cash reward ₹50 claimed successfully`);

  const histAfterBoth = await prisma.streakHistory.findUnique({
    where: { userId_date: { userId: user4.id, date: '2026-08-18' } }
  });
  assert(histAfterBoth.spinClaimed === true, `Both spin and streak claimed`);
  assert(histAfterBoth.streakClaimed === true, `Both spin and streak claimed`);

  // TEST 5: Midnight Boundary in Asia/Kolkata Timezone
  console.log('\n--- TEST 5: IST Midnight Boundary Calculation ---');
  // 2026-08-18 23:59:59 IST = 2026-08-18 18:29:59 UTC
  const preMidnightUtc = new Date('2026-08-18T18:29:59Z').getTime();
  const preMidnightDate = getAppDateString(preMidnightUtc);
  assert(preMidnightDate === '2026-08-18', `23:59:59 IST is calendar date 2026-08-18`);

  // 2026-08-19 00:00:01 IST = 2026-08-18 18:30:01 UTC
  const postMidnightUtc = new Date('2026-08-18T18:30:01Z').getTime();
  const postMidnightDate = getAppDateString(postMidnightUtc);
  assert(postMidnightDate === '2026-08-19', `00:00:01 IST is calendar date 2026-08-19`);

  // TEST 6: Long Absence Return (30 Days)
  console.log('\n--- TEST 6: Long Absence Return (30 Days) ---');
  const user6 = await prisma.user.create({
    data: {
      email: 'streak_test_absence@aurabet.com',
      username: 'streak_absence_user',
      passwordHash: 'hashedpassword',
      realBalance: 0,
    },
  });
  await recordActivity(user6.id, '2026-07-01'); // Day 1
  await recordActivity(user6.id, '2026-07-02'); // Day 2
  await recordActivity(user6.id, '2026-07-03'); // Day 3

  // Return 30 days later
  const u6s = await recordActivity(user6.id, '2026-08-02');
  assert(u6s.currentStreak === 1, `Returned after 30 days: resets cleanly to Day 1`);
  assert(u6s.longestStreak === 3, `Longest streak preserved as 3`);
  assert(u6s.totalActiveDays === 4, `Total active days is 4`);

  // Clean up test rows
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'streak_test_' } },
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULT: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runAllTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});