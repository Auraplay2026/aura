import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { findUserByEmailOrUsername, sanitizeUserProfile } from '../lib/userDb';

async function testLoginBackend() {
  console.log("Auditing login & /api/auth/me logic...");

  const testUser = "Sahil_Audit_" + Math.floor(Math.random() * 1000);
  const testPass = "7003";

  try {
    // Insert test user into DB
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "username", "passwordHash") 
      VALUES (gen_random_uuid()::text, '${testUser}', '${testPass}');
    `);
    console.log(`Created user '${testUser}' in Supabase.`);

    // 1. Test findUserByEmailOrUsername
    const foundUser = await findUserByEmailOrUsername(testUser);
    console.log("findUserByEmailOrUsername result:", foundUser ? "FOUND" : "NOT FOUND");

    // 2. Test sanitizeUserProfile
    if (foundUser) {
      const sanitized = sanitizeUserProfile(foundUser);
      console.log("Sanitized user username:", sanitized.username, "email:", sanitized.email);
    }

    // 3. Cleanup test user
    await prisma.user.delete({ where: { username: testUser } });
    console.log("Cleaned up test user.");

  } catch (err: any) {
    console.error("Audit test error:", err.message);
  }

  await prisma.$disconnect();
}

testLoginBackend().catch(console.error);
