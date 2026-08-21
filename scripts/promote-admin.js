const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    return;
  }
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const emailsToPromote = [
    'rg6364823@gmail.com',
    'twintubrovquattro@gmail.com',
    'admin@auraplay.com'
  ];
  
  const usernamesToPromote = [
    'zone',
    'admin'
  ];

  const updated = await prisma.user.updateMany({
    where: {
      OR: [
        { email: { in: emailsToPromote, mode: 'insensitive' } },
        { username: { in: usernamesToPromote, mode: 'insensitive' } }
      ]
    },
    data: {
      role: 'admin',
      balance: 1000000
    }
  });

  console.log(`[Admin Promotion] Successfully updated ${updated.count} users to role='admin' with ₹1,000,000 balance!`);
  
  const allAdmins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, username: true, email: true, role: true, balance: true }
  });
  console.log('[Admin List]:', allAdmins);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
