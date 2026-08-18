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

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: 'twintubrovquattro@gmail.com', mode: 'insensitive' } },
        { username: { equals: 'admin', mode: 'insensitive' } }
      ]
    }
  });

  if (!existing) {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AuraBetAdmin2026!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
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
    console.log('[create_admin] Created initial admin account');
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin' }
    });
    console.log(`[create_admin] Verified admin role for ${existing.email || existing.username} without changing password`);
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
