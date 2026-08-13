import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function cleanupUserTable() {
  console.log("Cleaning up User table columns in Supabase PostgreSQL...");

  // List of unneeded / messy clutter columns to drop
  const columnsToDrop = [
    "phoneNumber",
    "gamingState",
    "upiId",
    "kycDocumentUrl",
    "adminNotes",
    "fullName",
    "dob",
    "address",
    "twoFactorSecret",
    "resetCode",
    "resetCodeExpires",
    "affiliateCode",
    "referredBy",
    "referralCount",
    "affiliateEarnings",
    "manualVipLevel",
    "vipRewardsClaimed"
  ];

  for (const col of columnsToDrop) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" DROP COLUMN IF EXISTS "${col}";`);
      console.log(`Dropped column: ${col}`);
    } catch (err: any) {
      console.warn(`Could not drop column ${col}:`, err.message);
    }
  }

  // Ensure clean defaults for remaining essential columns
  const defaults = [
    `ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`,
    `ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;`,
    `ALTER TABLE "User" ALTER COLUMN "email" SET DEFAULT NULL;`,
    `ALTER TABLE "User" ALTER COLUMN "accountType" SET DEFAULT 'real';`,
    `ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 0;`,
    `ALTER TABLE "User" ALTER COLUMN "demoBalance" SET DEFAULT 100000;`,
    `ALTER TABLE "User" ALTER COLUMN "realBalance" SET DEFAULT 0;`,
    `ALTER TABLE "User" ALTER COLUMN "hasCompletedOnboarding" SET DEFAULT true;`,
    `ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';`,
    `ALTER TABLE "User" ALTER COLUMN "kycStatus" SET DEFAULT 'NONE';`,
    `ALTER TABLE "User" ALTER COLUMN "totalWagered" SET DEFAULT 0;`,
    `ALTER TABLE "User" ALTER COLUMN "vipLevel" SET DEFAULT 'Bronze';`,
    `ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;`
  ];

  for (const statement of defaults) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err: any) {
      console.error(`Error setting default: ${statement}`, err.message);
    }
  }

  console.log("\nInspecting cleaned up User table columns:");
  const remainingColumns: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'User'
    ORDER BY ordinal_position;
  `);

  console.table(remainingColumns);
  await prisma.$disconnect();
}

cleanupUserTable().catch(console.error);
