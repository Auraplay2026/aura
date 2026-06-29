// Load environment variables manually
const fs = require('fs');
const path = require('path');

const dotenvPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local')
];
for (const envPath of dotenvPaths) {
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf8');
    envText.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          }
          if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
  }
}

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const crypto = require('crypto');
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || process.env.ADMIN_SECRET_KEY || crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  console.log(`Using admin password: ${adminPassword === process.env.ADMIN_SECRET_KEY ? '[ADMIN_SECRET_KEY]' : adminPassword}`);

  // Elevate existing Google Auth account
  await prisma.user.updateMany({
    where: { email: 'twintubrovquattro@gmail.com' },
    data: { role: 'admin' }
  });
  console.log('Elevated twintubrovquattro@gmail.com to admin');

  // Create twintubrovquattro@gmail.com
  const existing = await prisma.user.findUnique({ where: { email: 'twintubrovquattro@gmail.com' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'twintubrovquattro@gmail.com',
        passwordHash: hashedPassword,
        accountType: 'real',
        balance: 100000,
        demoBalance: 100000,
        realBalance: 100000,
        hasCompletedOnboarding: true,
        role: 'admin',
      }
    });
    console.log('Created twintubrovquattro@gmail.com account');
  } else {
    await prisma.user.update({
      where: { email: 'twintubrovquattro@gmail.com' },
      data: { role: 'admin', passwordHash: hashedPassword }
    });
    console.log('Updated twintubrovquattro@gmail.com account');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {}
    try {
      await pool.end();
    } catch (e) {}
  });
