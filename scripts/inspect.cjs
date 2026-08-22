require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, role: true, balance: true, realBalance: true }
  });
  console.log('=== USERS ===');
  console.log(users);

  const streaks = await prisma.userStreak.findMany();
  console.log('=== STREAKS ===');
  console.log(streaks);

  const history = await prisma.streakHistory.findMany();
  console.log('=== HISTORY ===');
  console.log(history);

  await prisma.$disconnect();
  await pool.end();
}
main().catch(console.error);
