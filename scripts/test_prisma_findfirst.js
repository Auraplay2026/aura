const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.ipzqtmbxzoooimbcowcm:Siddiqui%40009@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function test() {
  console.log("Testing Prisma queries with synchronized database...");
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Find Admin
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: 'auraplay2026@gmail.com', mode: 'insensitive' } },
          { username: { equals: 'auraplay2026', mode: 'insensitive' } }
        ]
      },
      include: { transactions: true, positions: true, notifications: true, activityLogs: true }
    });
    console.log("✅ 1. Admin Query:", admin ? `Found (${admin.username} / ${admin.email}, role=${admin.role}, balance=₹${admin.balance})` : "Not found");

    // 2. Find Regular User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: 'rohan@aurabet.io', mode: 'insensitive' } },
          { username: { equals: 'rohan', mode: 'insensitive' } }
        ]
      },
      include: { transactions: true, positions: true, notifications: true }
    });
    console.log("✅ 2. Regular User Query:", user ? `Found (${user.username} / ${user.email}, role=${user.role}, balance=₹${user.balance})` : "Not found");

    // 3. User Count
    const totalUsers = await prisma.user.count();
    console.log("✅ 3. Total Users Count:", totalUsers);

  } catch (err) {
    console.error("❌ Query Failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
