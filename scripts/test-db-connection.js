const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables manually
const dotenvPath = path.join(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  const envText = fs.readFileSync(dotenvPath, 'utf8');
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

console.log("Database URL from env:", process.env.DATABASE_URL);

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...");
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        twoFactorEnabled: true
      }
    });
    console.log("Success! Total users in database:", users.length);
    console.log("Users list:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Database query failed:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
