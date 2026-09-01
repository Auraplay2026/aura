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

  console.log('[Clean Slate] 0. Direct raw PostgreSQL cascade purge...');
  const tablesToTruncate = ['Transaction', 'Position', 'Notification', 'ActivityLog', 'UserStreak', 'StreakHistory', 'SupportMessage', 'SupportChat', 'GameSession'];
  for (const tbl of tablesToTruncate) {
    try {
      await pool.query(`TRUNCATE TABLE "${tbl}" CASCADE;`);
      console.log(` -> Truncated table "${tbl}".`);
    } catch (tblErr) {
      console.log(` -> Note for table "${tbl}":`, tblErr.message);
    }
  }

  try {
    const delRes = await pool.query('DELETE FROM "User" WHERE LOWER(username) != \'twintubro\' AND (email IS NULL OR LOWER(email) != \'twintubrovquattro@gmail.com\');');
    console.log(` -> Deleted ${delRes.rowCount || 0} non-twintubro user accounts via SQL.`);
  } catch (delErr) {
    console.log(' -> Delete users SQL note:', delErr.message);
  }

  try {
    await pool.query('UPDATE "User" SET balance = 0, "realBalance" = 0, "demoBalance" = 0, "totalWagered" = 0, "referralCount" = 0, "affiliateEarnings" = 0 WHERE LOWER(username) = \'twintubro\' OR LOWER(email) = \'twintubrovquattro@gmail.com\';');
    console.log(' -> twintubro balances reset to 0 via SQL.');
  } catch (updateErr) {
    console.log(' -> Update twintubro SQL note:', updateErr.message);
  }

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

  console.log('[Clean Slate] 7. Deleting ALL users except twintubro...');
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
  console.log(` -> Deleted ${delUsers.count} non-twintubro user accounts.`);

  console.log('[Clean Slate] 8. Setting twintubro Admin account to ZERO balances, 0 turnover, 0 wagers...');
  const existingTwintubro = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: 'twintubro', mode: 'insensitive' } },
        { email: { equals: 'twintubrovquattro@gmail.com', mode: 'insensitive' } }
      ]
    }
  });

  const bcrypt = require('bcryptjs');
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AuraBetAdmin2026!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  if (existingTwintubro) {
    await prisma.user.update({
      where: { id: existingTwintubro.id },
      data: {
        username: 'twintubro',
        email: 'twintubrovquattro@gmail.com',
        passwordHash: hashedPassword,
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
  } else {
    await prisma.user.create({
      data: {
        username: 'twintubro',
        email: 'twintubrovquattro@gmail.com',
        passwordHash: hashedPassword,
        role: 'admin',
        balance: 0,
        realBalance: 0,
        demoBalance: 0,
        totalWagered: 0,
        hasCompletedOnboarding: true
      }
    });
  }
  console.log(` -> twintubro admin active with exact ₹0.`);

  // 8b. Ensure twintubro is synchronized to Supabase auth.users & auth.identities
  try {
    const adminEmail = 'twintubrovquattro@gmail.com';
    const metadata = JSON.stringify({ username: 'twintubro', role: 'admin', must_change_password: false });
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000'::uuid, $1, $2, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, 'authenticated', 'authenticated', NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = NOW();
    `, [adminEmail, hashedPassword, metadata]);
    console.log(' -> twintubro synchronized to Supabase auth.users dashboard.');
  } catch (authErr) {
    console.log(' -> Supabase auth.users sync note:', authErr.message);
  }

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
