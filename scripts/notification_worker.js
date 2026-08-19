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

process.on('uncaughtException', (err) => {
  console.warn('[Notification Worker UncaughtException]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Notification Worker UnhandledRejection]:', reason);
});

let prisma = null;

function getPrisma() {
  if (prisma) return prisma;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  const { PrismaClient } = require('@prisma/client');
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: dbUrl,
    max: 2,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
  pool.on('error', (err) => {
    console.warn('[Notification Worker PG Pool Warning]:', err?.message || err);
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
  return prisma;
}

const NOTIFICATION_TEMPLATES = [
  // VIP / Promos
  {
    title: "VIP Reward Processed 🏆",
    message: "Congratulations! Your weekly cashback bonus of ₹500 has been credited to your real account."
  },
  {
    title: "Bonus Drop Active! ⚡",
    message: "Use code IMPSRTGS to claim ₹250 free roll on all Aura Originals games. Limited claims left!"
  },
  {
    title: "VIP Club Level Up! ⭐",
    message: "Your profile has been upgraded to VIP Platinum. Enjoy higher withdrawal limits and personal concierge."
  },
  // Game RTP / Hits
  {
    title: "RTP Pulse Alert 🔥",
    message: "Aura Original Limbo is running hot! The average return to player (RTP) has reached 99.4% in the last hour."
  },
  {
    title: "Mega Jackpot Win! 💰",
    message: "Player @CryptoWhale just hit a massive 1200x payout of ₹4,80,000 on Sweet Bonanza!"
  },
  {
    title: "Aviator Propeller High ✈️",
    message: "Aviator reached a multiplier of 85.4x! Tap to view recent multiplayer multipliers."
  },
  // Payment methods
  {
    title: "Instant Cashiers Live 🏦",
    message: "IMPS, RTGS, and UPI bank transfers are now live with 0% processing fees. Withdrawals processed in under 2 hours."
  },
  // Sports Scrapers / Odds
  {
    title: "Live Match Synced 📡",
    message: "Live cricket match odds for India vs Australia are synced. Pulled from live crawlers."
  },
  {
    title: "Tennis Scraper Feed 🎾",
    message: "BBC Tennis RSS feeds updated. Active match odds computed for Sinner vs Alcaraz."
  },
  // Security
  {
    title: "KYC Audit Scans Complete 🛡️",
    message: "Platform KYC checks have completed. Thank you for helping keep AuraPlay safe and secure."
  }
];

function runWorker() {
  console.log("Starting DB-backed notification worker daemon (45s intervals)...");

  // Send first notification immediately on start after 10 seconds (wait for DB connections)
  setTimeout(() => {
    triggerNotification();
  }, 10000);

  setInterval(() => {
    triggerNotification();
  }, 45000); // every 45 seconds
}

async function triggerNotification() {
  try {
    const db = getPrisma();
    if (!db) {
      // Database not configured yet, skip quietly
      return;
    }

    // 1. Fetch all active users
    const users = await db.user.findMany({
      where: {
        NOT: {
          role: 'BANNED'
        }
      },
      select: {
        id: true,
        username: true
      }
    });

    if (users.length === 0) {
      return;
    }

    // Select a random template
    const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
    const combinedMsg = `**${template.title}**\n${template.message}`;
    const timestamp = Date.now();

    console.log(`[Worker] Dispatching notification: "${template.title}" to ${users.length} users.`);

    // 2. Insert notifications for all active users
    for (const user of users) {
      try {
        await db.notification.create({
          data: {
            message: combinedMsg,
            timestamp: timestamp,
            userId: user.id,
            read: false
          }
        });

        // 3. Cap notifications at 20 per user to prevent DB bloat
        const count = await db.notification.count({
          where: { userId: user.id }
        });

        if (count > 20) {
          const oldest = await db.notification.findMany({
            where: { userId: user.id },
            orderBy: { timestamp: 'asc' },
            take: count - 20,
            select: { id: true }
          });

          await db.notification.deleteMany({
            where: {
              id: { in: oldest.map(n => n.id) }
            }
          });
        }
      } catch (err) {
        console.error(`[Worker Error] Failed to process user ${user.username || user.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Worker Fatal Error] Database query failed:", err);
  }
}

runWorker();
