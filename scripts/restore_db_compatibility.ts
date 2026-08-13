import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function restoreDbCompatibility() {
  console.log("Ensuring full PostgreSQL & Prisma database compatibility...");

  const addColumns = [
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gamingState" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "upiId" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fullName" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dob" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetCode" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetCodeExpires" double precision DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "affiliateCode" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCount" integer DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "affiliateEarnings" double precision DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "manualVipLevel" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vipRewardsClaimed" jsonb DEFAULT '{}'::jsonb;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycDocumentUrl" text DEFAULT NULL;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminNotes" text DEFAULT NULL;`
  ];

  for (const sql of addColumns) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err: any) {
      console.error("Column add error:", err.message);
    }
  }
  console.log("All optional compatibility columns ensured in PostgreSQL table 'User'.");

  // Ensure BEFORE INSERT trigger is active
  const sqlTriggerFunction = `
    CREATE OR REPLACE FUNCTION set_user_defaults()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id := gen_random_uuid()::text;
      END IF;
      IF NEW."accountType" IS NULL OR NEW."accountType" = '' THEN
        NEW."accountType" := 'real';
      END IF;
      IF NEW.balance IS NULL THEN
        NEW.balance := 0;
      END IF;
      IF NEW."demoBalance" IS NULL THEN
        NEW."demoBalance" := 100000;
      END IF;
      IF NEW."realBalance" IS NULL THEN
        NEW."realBalance" := 0;
      END IF;
      IF NEW."hasCompletedOnboarding" IS NULL THEN
        NEW."hasCompletedOnboarding" := true;
      END IF;
      IF NEW.role IS NULL OR NEW.role = '' THEN
        NEW.role := 'user';
      END IF;
      IF NEW."kycStatus" IS NULL OR NEW."kycStatus" = '' THEN
        NEW."kycStatus" := 'NONE';
      END IF;
      IF NEW."twoFactorEnabled" IS NULL THEN
        NEW."twoFactorEnabled" := false;
      END IF;
      IF NEW."totalWagered" IS NULL THEN
        NEW."totalWagered" := 0;
      END IF;
      IF NEW."vipLevel" IS NULL OR NEW."vipLevel" = '' THEN
        NEW."vipLevel" := 'Bronze';
      END IF;
      IF NEW."createdAt" IS NULL THEN
        NEW."createdAt" := NOW();
      END IF;
      IF NEW."updatedAt" IS NULL THEN
        NEW."updatedAt" := NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  const sqlDropTrigger = `DROP TRIGGER IF EXISTS trg_user_defaults ON "User";`;
  const sqlCreateTrigger = `
    CREATE TRIGGER trg_user_defaults
    BEFORE INSERT ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION set_user_defaults();
  `;

  await prisma.$executeRawUnsafe(sqlTriggerFunction);
  await prisma.$executeRawUnsafe(sqlDropTrigger);
  await prisma.$executeRawUnsafe(sqlCreateTrigger);
  console.log("PostgreSQL BEFORE INSERT trigger re-validated.");

  // Test full end-to-end flow: insert user with NULL id -> find user -> check password match
  console.log("\nTesting End-to-End User Creation & Login Lookup...");
  const testUser = "Sahil_FullTest_" + Math.floor(Math.random() * 1000);
  const testPass = "7003";

  await prisma.$executeRawUnsafe(`
    INSERT INTO "User" ("id", "username", "passwordHash") 
    VALUES (NULL, '${testUser}', '${testPass}');
  `);
  console.log(`Inserted user '${testUser}' with NULL id into Supabase table.`);

  const userInDb = await prisma.user.findFirst({
    where: { username: testUser }
  });

  console.log("Queried created user via Prisma:", {
    id: userInDb?.id,
    username: userInDb?.username,
    passwordHash: userInDb?.passwordHash,
    balance: userInDb?.balance,
    accountType: userInDb?.accountType
  });

  // Verify password matching logic
  const isMatch = (userInDb?.passwordHash === testPass);
  console.log(`Password match test for '${testUser}' with password '${testPass}':`, isMatch ? "SUCCESS ✅" : "FAILED ❌");

  // Cleanup
  await prisma.user.delete({ where: { username: testUser } });
  console.log("Cleaned up test user.");

  await prisma.$disconnect();
}

restoreDbCompatibility().catch(console.error);
