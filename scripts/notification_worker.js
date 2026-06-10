const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, "..", "data", "users.json");

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
  console.log("Starting notification worker daemon (45s intervals)...");

  // Send first notification immediately on start after 5 seconds
  setTimeout(() => {
    triggerNotification();
  }, 5000);

  setInterval(() => {
    triggerNotification();
  }, 45000); // every 45 seconds
}

function triggerNotification() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      console.log("Database file users.json not found yet.");
      return;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const users = JSON.parse(raw);

    if (!Array.isArray(users) || users.length === 0) return;

    // Select a random template
    const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    users.forEach(user => {
      // Skip banned users
      if (user.role === 'BANNED') return;

      if (!user.notifications) user.notifications = [];

      // Insert new notification at the beginning
      user.notifications.unshift({
        id: notifId,
        title: template.title,
        message: template.message,
        timestamp: Date.now(),
        read: false
      });

      // Cap at 20 notifications to prevent users.json bloat
      user.notifications = user.notifications.slice(0, 20);

      // Update legacy pointer balance/transactions if active
      if (user.accountType === 'real') {
        user.balance = user.realBalance;
      }
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
    console.log(`[Worker] Sent notification: "${template.title}" to ${users.length} users.`);
  } catch (err) {
    console.error("[Worker Error]", err);
  }
}

runWorker();
