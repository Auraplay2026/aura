const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found');
    return;
  }
  
  console.log('[Clean Slate] Connecting to PostgreSQL Database...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('[Clean Slate] 1. Purging all transactions...');
  const delTx = await prisma.transaction.deleteMany({});
  console.log(` -> Deleted ${delTx.count} transactions.`);

  console.log('[Clean Slate] 2. Purging all trading positions...');
  const delPos = await prisma.position.deleteMany({});
  console.log(` -> Deleted ${delPos.count} positions.`);

  console.log('[Clean Slate] 3. Purging all casino/game sessions...');
  try {
    const delGames = await prisma.gameSession.deleteMany({});
    console.log(` -> Deleted ${delGames.count} game sessions.`);
  } catch (e) {
    console.log(' -> No game sessions table or already empty.');
  }

  console.log('[Clean Slate] 4. Purging all notifications & activity logs...');
  const delNotif = await prisma.notification.deleteMany({});
  const delLogs = await prisma.activityLog.deleteMany({});
  console.log(` -> Deleted ${delNotif.count} notifications, ${delLogs.count} activity logs.`);

  console.log('[Clean Slate] 5. Purging all support chats & messages...');
  try {
    const delMsgs = await prisma.supportMessage.deleteMany({});
    const delChats = await prisma.supportChat.deleteMany({});
    console.log(` -> Deleted ${delMsgs.count} support messages, ${delChats.count} support chats.`);
  } catch (e) {}

  console.log('[Clean Slate] 6. Purging streak histories...');
  try {
    const delStreakHist = await prisma.streakHistory.deleteMany({});
    const delStreaks = await prisma.userStreak.deleteMany({});
    console.log(` -> Deleted ${delStreakHist.count} streak history items, ${delStreaks.count} streaks.`);
  } catch (e) {}

  console.log('[Clean Slate] 7. Deleting ALL non-admin users (keeping only admin)...');
  const delUsers = await prisma.user.deleteMany({
    where: {
      AND: [
        { username: { notIn: ['admin', 'auraplay2026'] } },
        {
          OR: [
            { email: null },
            { email: { notIn: ['auraplay2026@gmail.com', 'twintubrovquattro@gmail.com'] } }
          ]
        }
      ]
    }
  });
  console.log(` -> Deleted ${delUsers.count} regular user accounts.`);

  console.log('[Clean Slate] 8. Setting Admin accounts to ZERO balances, 0 turnover, 0 wagers...');
  const resetAdmin = await prisma.user.updateMany({
    data: {
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
  console.log(` -> Reset ${resetAdmin.count} admin user(s) to exact ₹0.`);

  // 9. Reset local data json files if present
  console.log('[Clean Slate] 9. Cleaning local json cache files...');
  const dataDir = path.join(__dirname, '../data');
  const filesToReset = {
    'admin_audit_logs.json': '[]',
    'hype_bets.json': '[]',
    'notifications_sent.json': '[]',
    'support_chats.json': '[]'
  };

  for (const [filename, content] of Object.entries(filesToReset)) {
    const fullPath = path.join(dataDir, filename);
    try {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(` -> Cleaned data/${filename}`);
    } catch (e) {}
  }

  console.log('\n✨ [CLEAN SLATE COMPLETE] All data, transactions, bets, and logs have been wiped to 0. A fresh new leaf has started!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error('[Clean Slate Error]:', err);
  process.exit(1);
});
