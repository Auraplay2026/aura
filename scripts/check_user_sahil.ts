import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function ensureSahilUser() {
  console.log("Checking if user 'Sahil' exists in database...");

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: 'Sahil', mode: 'insensitive' } },
        { email: { equals: 'Sahil', mode: 'insensitive' } }
      ]
    }
  });

  if (existing) {
    console.log("User 'Sahil' exists:", {
      id: existing.id,
      username: existing.username,
      passwordHash: existing.passwordHash,
      balance: existing.balance,
      role: existing.role
    });
  } else {
    console.log("Creating user 'Sahil' with password '7003'...");
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "username", "passwordHash") 
      VALUES (gen_random_uuid()::text, 'Sahil', '7003');
    `);
    console.log("Successfully created user 'Sahil' with password '7003'.");
  }

  await prisma.$disconnect();
}

ensureSahilUser().catch(console.error);
