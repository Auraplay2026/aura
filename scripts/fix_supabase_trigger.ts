import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function fixSupabaseTrigger() {
  console.log("Creating PostgreSQL BEFORE INSERT trigger on User table in Supabase...");

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

  const sqlAlterColumnDefault = `
    ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  `;

  try {
    await prisma.$executeRawUnsafe(sqlTriggerFunction);
    console.log("Trigger function set_user_defaults() created.");

    await prisma.$executeRawUnsafe(sqlDropTrigger);
    console.log("Old trigger dropped if existed.");

    await prisma.$executeRawUnsafe(sqlCreateTrigger);
    console.log("Trigger trg_user_defaults created successfully.");

    await prisma.$executeRawUnsafe(sqlAlterColumnDefault);
    console.log("ALTER TABLE User ALTER COLUMN id SET DEFAULT gen_random_uuid()::text executed.");
  } catch (err: any) {
    console.error("Error creating trigger:", err.message);
  }

  // Now test an explicit NULL id insert mimicking Supabase UI Table Editor!
  console.log("\nTesting insert with explicit NULL id (mimicking Supabase Table Editor insert for 'Sahil')...");
  
  const testUsername = "Sahil_Test_" + Math.floor(Math.random() * 1000);
  
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "username", "passwordHash") 
      VALUES (NULL, '${testUsername}', '7003');
    `);

    console.log(`Success! Inserted user '${testUsername}' with NULL id into Supabase table.`);

    const created = await prisma.user.findUnique({
      where: { username: testUsername }
    });

    console.log("Created user in DB:", {
      id: created?.id,
      username: created?.username,
      passwordHash: created?.passwordHash,
      balance: created?.balance,
      accountType: created?.accountType,
      createdAt: created?.createdAt
    });

    // Cleanup test user
    await prisma.user.delete({ where: { username: testUsername } });
    console.log("Cleaned up test user.");

  } catch (err: any) {
    console.error("Test insert with NULL id failed:", err.message);
  }

  await prisma.$disconnect();
}

fixSupabaseTrigger().catch(console.error);
