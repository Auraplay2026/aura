import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession || !adminSession.email) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 401 });
    }

    console.log(`[Admin Clean Slate] Triggered by ${adminSession.email}`);

    // 1. Purge all transactions
    const delTx = await prisma.transaction.deleteMany({});

    // 2. Purge all trading positions
    const delPos = await prisma.position.deleteMany({});

    // 3. Purge all casino/game sessions
    let delGamesCount = 0;
    try {
      const delGames = await prisma.gameSession.deleteMany({});
      delGamesCount = delGames.count;
    } catch {}

    // 4. Purge notifications & activity logs
    const delNotif = await prisma.notification.deleteMany({});
    const delLogs = await prisma.activityLog.deleteMany({});

    // 5. Purge support messages and chats
    try {
      await prisma.supportMessage.deleteMany({});
      await prisma.supportChat.deleteMany({});
    } catch {}

    // 6. Purge streaks
    try {
      await prisma.streakHistory.deleteMany({});
      await prisma.userStreak.deleteMany({});
    } catch {}

    // 7. Delete ALL users except twintubro
    const delUsers = await prisma.user.deleteMany({
      where: {
        AND: [
          { username: { not: 'twintubro' } },
          {
            OR: [
              { email: null },
              { email: { not: 'twintubrovquattro@gmail.com' } }
            ]
          }
        ]
      }
    });

    // 8. Reset twintubro admin user to 0 balance & 0 wagers
    await prisma.user.updateMany({
      where: {
        OR: [
          { username: { equals: 'twintubro', mode: 'insensitive' } },
          { email: { equals: 'twintubrovquattro@gmail.com', mode: 'insensitive' } }
        ]
      },
      data: {
        username: 'twintubro',
        email: 'twintubrovquattro@gmail.com',
        role: 'admin',
        balance: 0,
        realBalance: 0,
        demoBalance: 0,
        totalWagered: 0,
        referralCount: 0,
        affiliateEarnings: 0,
        vipRewardsClaimed: {}
      }
    });

    // 9. Clean local file caches
    const dataDir = path.join(process.cwd(), 'data');
    const filesToReset = {
      'admin_audit_logs.json': '[]',
      'hype_bets.json': '[]',
      'notifications_sent.json': '[]',
      'support_chats.json': '[]'
    };

    for (const [filename, content] of Object.entries(filesToReset)) {
      try {
        fs.writeFileSync(path.join(dataDir, filename), content, 'utf8');
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'All users and transactions have been cleaned successfully.',
      deletedTransactions: delTx.count,
      deletedPositions: delPos.count,
      deletedGameSessions: delGamesCount,
      deletedNotifications: delNotif.count,
      deletedActivityLogs: delLogs.count,
      deletedUsers: delUsers.count
    }, { status: 200 });

  } catch (err: any) {
    console.error('[Admin Clean Slate Error]:', err);
    return NextResponse.json({ error: err.message || 'Clean slate operation failed.' }, { status: 500 });
  }
}