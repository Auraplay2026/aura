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

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('[create_admin] DATABASE_URL is not set. Skipping admin user creation.');
    return;
  }
  const dbUrl = process.env.DATABASE_URL;
  const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const adminEmail = process.env.ADMIN_EMAIL || 'auraplay2026@gmail.com';
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: adminEmail, mode: 'insensitive' } },
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
          email: adminEmail,
          passwordHash: hashedPassword,
          accountType: 'real',
          balance: 0,
          demoBalance: 0,
          realBalance: 0,
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
  } catch (err) {
    console.warn('[create_admin] Notice:', err?.message || err);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {}
    try {
      await pool.end();
    } catch (e) {}
  }
}

main().catch(err => {
  console.warn('[create_admin] Non-fatal error:', err?.message || err);
});
