require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const res = await prisma.user.deleteMany({
    where: { email: { startsWith: 'streak_test_' } },
  });
  console.log(`Cleaned up ${res.count} test users.`);
}
main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});