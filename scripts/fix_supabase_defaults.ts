import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  console.log("Applying column defaults to User table in Supabase PostgreSQL...");

  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    console.log("Extension pgcrypto ensured.");
  } catch (err: any) {
    console.warn("pgcrypto extension warning:", err.message);
  }

  const sqls = [
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
    `ALTER TABLE "User" ALTER COLUMN "twoFactorEnabled" SET DEFAULT false;`,
    `ALTER TABLE "User" ALTER COLUMN "referralCount" SET DEFAULT 0;`,
    `ALTER TABLE "User" ALTER COLUMN "affiliateEarnings" SET DEFAULT 0;`,
    `ALTER TABLE "User" ALTER COLUMN "totalWagered" SET DEFAULT 0;`,
    `ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;`
  ];

  for (const statement of sqls) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log(`Successfully executed: ${statement}`);
    } catch (err: any) {
      console.error(`Error executing '${statement}':`, err.message);
    }
  }

  console.log("\nInspecting updated columns on User table...");
  const columns: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'User';
  `);

  console.table(columns);
  await prisma.$disconnect();
}

main().catch(console.error);
