import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { findUserByEmailOrUsername, updateUser, sanitizeUserProfile } from '../lib/userDb';

async function testAffiliateGeneration() {
  console.log("Testing affiliate code generation for user 'Sahil'...");

  let user = await findUserByEmailOrUsername("Sahil");
  if (!user) {
    console.error("User 'Sahil' not found in DB!");
    await prisma.$disconnect();
    return;
  }

  console.log("Found user 'Sahil':", { username: user.username, affiliateCode: user.affiliateCode });

  if (!user.affiliateCode) {
    const generatedCode = user.username.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    console.log(`Generating code: ${generatedCode}...`);
    const updated = await updateUser("Sahil", { affiliateCode: generatedCode });
    console.log("Updated user from DB:", { username: updated?.username, affiliateCode: updated?.affiliateCode });
  } else {
    console.log(`User 'Sahil' already has affiliate code: ${user.affiliateCode}`);
  }

  await prisma.$disconnect();
}

testAffiliateGeneration().catch(console.error);
