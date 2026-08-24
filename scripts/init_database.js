const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.ipzqtmbxzoooimbcowcm:Siddiqui%40009@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

const schemaSql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'real',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demoBalance" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "realBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'user',
    "kycStatus" TEXT NOT NULL DEFAULT 'NONE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "phoneNumber" TEXT,
    "gamingState" TEXT,
    "upiId" TEXT,
    "resetCode" TEXT,
    "resetCodeExpires" DOUBLE PRECISION,
    "affiliateCode" TEXT,
    "referredBy" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "affiliateEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWagered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vipLevel" TEXT DEFAULT 'Bronze',
    "manualVipLevel" TEXT,
    "adminNotes" TEXT,
    "vipRewardsClaimed" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_affiliateCode_key" ON "User"("affiliateCode");

CREATE TABLE IF NOT EXISTS "Position" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketTitle" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "investment" DOUBLE PRECISION NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "walletType" TEXT NOT NULL DEFAULT 'real',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Position_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Position_userId_idx" ON "Position"("userId");
CREATE INDEX IF NOT EXISTS "Position_marketId_idx" ON "Position"("marketId");

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "upiId" TEXT,
    "utr" TEXT,
    "screenshotUrl" TEXT,
    "walletType" TEXT NOT NULL DEFAULT 'real',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_walletType_idx" ON "Transaction"("walletType");

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "userId" TEXT NOT NULL,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");

CREATE TABLE IF NOT EXISTS "SupportConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "openRouterApiKey" TEXT NOT NULL DEFAULT '',
    "aiModel" TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "SupportConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportChat" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'bot',
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "SupportChat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupportChat_email_key" ON "SupportChat"("email");

CREATE TABLE IF NOT EXISTS "SupportMessage" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "chatId" TEXT NOT NULL,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SupportMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "SupportChat"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupportMessage_chatId_idx" ON "SupportMessage"("chatId");

CREATE TABLE IF NOT EXISTS "GameSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameTitle" TEXT NOT NULL,
    "betAmount" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "gameState" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GameSession_email_idx" ON "GameSession"("email");

CREATE TABLE IF NOT EXISTS "UserStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streakStartDate" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalActiveDays" INTEGER NOT NULL DEFAULT 0,
    "lastEligibleActivityDate" TEXT,
    "lastStreakClaimDate" TEXT,
    "lastSpinClaimDate" TEXT,
    "lastActivityTimestamp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserStreak_userId_key" ON "UserStreak"("userId");
CREATE INDEX IF NOT EXISTS "UserStreak_userId_idx" ON "UserStreak"("userId");

CREATE TABLE IF NOT EXISTS "StreakHistory" (
    "id" TEXT NOT NULL,
    "userStreakId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "activityLogged" BOOLEAN NOT NULL DEFAULT true,
    "streakClaimed" BOOLEAN NOT NULL DEFAULT false,
    "streakReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spinClaimed" BOOLEAN NOT NULL DEFAULT false,
    "spinReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spinPrizeName" TEXT,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "ip" TEXT,
    CONSTRAINT "StreakHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StreakHistory_userStreakId_fkey" FOREIGN KEY ("userStreakId") REFERENCES "UserStreak"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StreakHistory_userId_date_key" ON "StreakHistory"("userId", "date");
CREATE INDEX IF NOT EXISTS "StreakHistory_userId_idx" ON "StreakHistory"("userId");
CREATE INDEX IF NOT EXISTS "StreakHistory_date_idx" ON "StreakHistory"("date");
`;

async function main() {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();
  try {
    console.log("Applying database schema tables...");
    await client.query(schemaSql);
    console.log("✅ All tables and indexes successfully created in database!");

    // Create default admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'auraplay2026@gmail.com';
    const checkUser = await client.query('SELECT id FROM "User" WHERE username = $1 OR email = $2 LIMIT 1', ['admin', adminEmail]);
    if (checkUser.rows.length === 0) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AuraBetAdmin2026!';
      const hash = await bcrypt.hash(defaultPassword, 10);
      const uuidRes = await client.query('SELECT gen_random_uuid()::text as id');
      const newId = uuidRes.rows[0].id;
      await client.query(
        `INSERT INTO "User" ("id", "username", "email", "passwordHash", "accountType", "balance", "demoBalance", "realBalance", "role", "hasCompletedOnboarding")
         VALUES ($1, 'admin', $2, $3, 'real', 100000, 100000, 100000, 'admin', true)`,
        [newId, adminEmail, hash]
      );
      console.log(`✅ Default admin account created: admin / ${adminEmail}`);
    } else {
      console.log("✅ Admin account already exists.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
