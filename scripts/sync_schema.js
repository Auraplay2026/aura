const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.ipzqtmbxzoooimbcowcm:Siddiqui%40009@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function syncAllColumns() {
  console.log("Checking and syncing all database columns with Prisma schema...");

  const migrations = [
    // User table columns
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "forcePasswordChange" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT true;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycStatus" TEXT DEFAULT 'NONE';`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gamingState" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "upiId" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetCode" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetCodeExpires" DOUBLE PRECISION;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "affiliateCode" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCount" INTEGER DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "affiliateEarnings" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalWagered" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vipLevel" TEXT DEFAULT 'Bronze';`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "manualVipLevel" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vipRewardsClaimed" JSONB DEFAULT '{}';`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "demoBalance" DOUBLE PRECISION DEFAULT 100000;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "realBalance" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "balance" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountType" TEXT DEFAULT 'real';`,

    // Position table columns
    `ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "currentPrice" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "pnl" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'OPEN';`,
    `ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "resolvedOutcome" TEXT;`,
    `ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "matchDetails" JSONB;`,

    // Transaction table columns
    `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "method" TEXT;`,
    `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "utr" TEXT;`,
    `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';`,
    `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT;`,
    `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "metadata" JSONB;`,

    // Notification table columns
    `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "link" TEXT;`,

    // UserStreak table columns
    `ALTER TABLE "UserStreak" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;`,
    `ALTER TABLE "UserStreak" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;`,
    `ALTER TABLE "UserStreak" ADD COLUMN IF NOT EXISTS "lastCheckIn" TIMESTAMP(3);`,
    `ALTER TABLE "UserStreak" ADD COLUMN IF NOT EXISTS "lastSpinTime" TIMESTAMP(3);`,
    `ALTER TABLE "UserStreak" ADD COLUMN IF NOT EXISTS "spinsAvailable" INTEGER DEFAULT 1;`,
    `ALTER TABLE "UserStreak" ADD COLUMN IF NOT EXISTS "totalRewardsClaimed" DOUBLE PRECISION DEFAULT 0;`
  ];

  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      await client.query(sql);
    }
    console.log("✅ All columns synchronized successfully!");
  } finally {
    client.release();
  }

  // Now test Prisma query!
  console.log("\nTesting Prisma query with synchronized schema...");
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'auraplay2026@gmail.com', mode: 'insensitive' } },
      include: { transactions: true, positions: true, notifications: true, activityLogs: true }
    });
    console.log("✅ SUCCESS! prisma.user.findFirst() returned:", user ? `User (${user.email}, role=${user.role}, forcePasswordChange=${user.forcePasswordChange})` : "User not found");
  } catch (err) {
    console.error("❌ prisma.user.findFirst() still failed:", err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

syncAllColumns().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
