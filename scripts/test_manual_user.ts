import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function testManualUserCreation() {
  console.log("Testing manual user insertion with only username & password...");

  const testUsername = "manualtest_" + Math.floor(Math.random() * 10000);
  const testPassword = "plainpassword123";

  // Raw insert simulating Supabase Table Editor row insert with ONLY username and passwordHash
  await prisma.$executeRawUnsafe(
    `INSERT INTO "User" ("username", "passwordHash") VALUES ('${testUsername}', '${testPassword}');`
  );

  console.log(`Successfully inserted '${testUsername}' into Supabase User table with only username and passwordHash!`);

  // Verify created record in DB
  const createdUser = await prisma.user.findUnique({
    where: { username: testUsername }
  });

  console.log("Fetched created user from DB:", {
    id: createdUser?.id,
    username: createdUser?.username,
    email: createdUser?.email,
    passwordHash: createdUser?.passwordHash,
    balance: createdUser?.balance,
    accountType: createdUser?.accountType,
    hasCompletedOnboarding: createdUser?.hasCompletedOnboarding,
    createdAt: createdUser?.createdAt
  });

  // Test authentication check matching app/api/auth/login/route.ts logic
  const storedHash = createdUser?.passwordHash || '';
  let isMatch = false;
  if (storedHash.startsWith('$2')) {
    isMatch = await bcrypt.compare(testPassword, storedHash);
  } else {
    isMatch = (testPassword === storedHash);
  }

  console.log(`Authentication test result for '${testUsername}':`, isMatch ? "SUCCESS ✅" : "FAILED ❌");

  // Cleanup test user
  await prisma.user.delete({ where: { username: testUsername } });
  console.log("Cleaned up test user.");

  await prisma.$disconnect();
}

testManualUserCreation().catch(console.error);
