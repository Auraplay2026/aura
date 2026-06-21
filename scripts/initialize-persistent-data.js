const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const SOURCE_DIR = path.join(process.cwd(), 'data_template');
const TARGET_DIR = path.join(process.cwd(), 'data');

console.log("Checking persistent volume data initialization...");

if (!fs.existsSync(TARGET_DIR)) {
  console.log(`Target directory ${TARGET_DIR} does not exist. Creating...`);
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

if (fs.existsSync(SOURCE_DIR)) {
  const files = fs.readdirSync(SOURCE_DIR);
  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(TARGET_DIR, file);
    
    // Check if file is missing in target (mounted persistent disk)
    if (!fs.existsSync(targetPath)) {
      console.log(`Copying template seed file: ${file} -> ${targetPath}`);
      fs.copyFileSync(sourcePath, targetPath);
    } else {
      console.log(`File already exists in persistent storage: ${file}`);
    }
  }
  console.log("Persistent volume data initialization complete.");
} else {
  console.log(`Source template directory ${SOURCE_DIR} not found. Skipping initialization.`);
}

// Automatic database admin seeding
async function seedAdmin() {
  console.log("Running automatic admin database seeder...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("[Seeder] DATABASE_URL is not set. Skipping admin database seeding.");
    return;
  }

  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const hashedPassword = await bcrypt.hash('AuraAdmin2026!', 12);

    // Elevate twintubrovquattro@gmail.com
    await prisma.user.updateMany({
      where: { email: 'twintubrovquattro@gmail.com' },
      data: { role: 'admin' }
    });
    console.log('[Seeder] Elevated twintubrovquattro@gmail.com to admin');

    // Create or update twintubrovquattro@gmail.com
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
      console.log('[Seeder] Created default twintubrovquattro@gmail.com account');
    } else {
      await prisma.user.update({
        where: { email: 'twintubrovquattro@gmail.com' },
        data: { role: 'admin', passwordHash: hashedPassword }
      });
      console.log('[Seeder] Restored/Updated twintubrovquattro@gmail.com account configuration');
    }
  } catch (err) {
    console.error('[Seeder ERROR] Failed to seed database admin credentials:', err.message);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {}
    try {
      await pool.end();
    } catch (e) {}
  }
}

seedAdmin();
