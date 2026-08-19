// Automated Sports Settlement & Reconciliation Daemon Worker
const fs = require('fs');
const path = require('path');

// 1. Manual Environment Loader
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
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[key] = val;
        }
      }
    });
  }
}

process.on('uncaughtException', (err) => {
  console.warn('[Sports Settlement Worker UncaughtException]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Sports Settlement Worker UnhandledRejection]:', reason);
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
    console.warn('[Sports Settlement Worker PG Pool Warning]:', err?.message || err);
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
  return prisma;
}

async function runSettlementPass() {
  const now = Date.now();
  const FORCE_MAJEURE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Hours timeout

  try {
    const db = getPrisma();
    if (!db) {
      // Database not configured yet, skip pass
      return;
    }

    const users = await db.user.findMany({
      include: {
        positions: true,
        transactions: true
      }
    });

    for (const user of users) {
      const lockedPositions = user.positions || [];
      const lockedTxs = (user.transactions || []).filter(t => t.status === 'Locked' || t.status === 'Pending' || t.status === 'Accepted');

      if (lockedPositions.length === 0 && lockedTxs.length === 0) continue;

      console.log(`[AutoSettlement Worker] Auditing User [${user.username}] (${lockedPositions.length} positions, ${lockedTxs.length} locked txs)...`);

      // 1. Settle open positions
      for (const pos of lockedPositions) {
        const marketTitle = pos.marketTitle || "";
        const side = (pos.side || "yes").toLowerCase();
        const isLay = side === "no";
        const odds = pos.buyPrice || 2.0;
        const totalInvestment = pos.investment || pos.shares || 100;
        const betAgeMs = now - pos.timestamp;

        let matchTitle = "";
        let selection = "";
        const cleanTitle = marketTitle.replace(/^\[LOCKED\]\s*/i, "").trim();
        const colonIdx = cleanTitle.indexOf(":");
        if (colonIdx !== -1) {
          matchTitle = cleanTitle.substring(0, colonIdx).trim();
          const selPart = cleanTitle.substring(colonIdx + 1).trim();
          selection = selPart.replace(/\s*\([\d.]+\)$/, "").trim();
        } else {
          matchTitle = cleanTitle;
          selection = cleanTitle;
        }

        let resolvedOutcome = null;
        let outcomeReason = "";

        if (betAgeMs >= FORCE_MAJEURE_TIMEOUT_MS) {
          resolvedOutcome = "Void";
          outcomeReason = `Auto-reconciled: Match exceeded 24h settlement window (${Math.round(betAgeMs / 3600000)}h elapsed). Full stake & liability refunded.`;
        }

        if (resolvedOutcome) {
          const settlementStatus = resolvedOutcome;
          const matchingTx = (user.transactions || []).find(t => 
            (t.status === "Locked" || t.status === "Pending" || t.status === "Accepted") &&
            (t.id === pos.id || (t.details && t.details.includes(selection)))
          );

          let payout = 0;
          if (settlementStatus === "Won") {
            payout = isLay ? totalInvestment : Math.round((pos.shares || (totalInvestment * odds)) * 100) / 100;
          } else if (settlementStatus === "Void") {
            payout = totalInvestment;
          }

          await db.$transaction(async (txClient) => {
            const accountType = pos.walletType === "real" ? "real" : "demo";
            const currentBalance = accountType === "real" ? user.realBalance : user.demoBalance;
            const newBalance = Math.round((currentBalance + payout) * 100) / 100;

            const updateData = { balance: newBalance };
            if (accountType === "real") updateData.realBalance = newBalance;
            else updateData.demoBalance = newBalance;

            if (matchingTx) {
              await txClient.transaction.updateMany({
                where: { id: matchingTx.id },
                data: {
                  status: settlementStatus === "Void" ? "Failed" : settlementStatus,
                  balanceAfter: newBalance,
                  details: `${matchingTx.details} · Settled: ${settlementStatus} (${outcomeReason})`
                }
              }).catch(() => {});
            }

            if (payout > 0) {
              const payoutTxId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              await txClient.transaction.create({
                data: {
                  id: payoutTxId,
                  type: 'deposit',
                  amount: payout,
                  balanceAfter: newBalance,
                  timestamp: Date.now(),
                  details: settlementStatus === "Void"
                    ? `Refund: ${outcomeReason}`
                    : `Winnings Payout: ${selection} @ ${odds.toFixed(2)} (${matchTitle})`,
                  status: 'Completed',
                  walletType: accountType,
                  userId: user.id
                }
              }).catch(() => {});
            }

            await txClient.position.delete({
              where: { id: pos.id }
            }).catch(() => {});

            await txClient.notification.create({
              data: {
                userId: user.id,
                message: settlementStatus === "Won"
                  ? `🏆 Sports Bet Settled! Your bet on ${selection} @ ${odds.toFixed(2)} won ₹${payout.toLocaleString()}. Funds credited.`
                  : settlementStatus === "Void"
                    ? `🔄 Match Refunded: Your ₹${totalInvestment.toLocaleString()} wager on ${matchTitle} has been fully refunded.`
                    : `📊 Sports Bet Settled: Your bet on ${selection} (${matchTitle}) concluded as ${settlementStatus}.`,
                timestamp: Date.now(),
                read: false
              }
            }).catch(() => {});

            await txClient.user.update({
              where: { id: user.id },
              data: updateData
            });
          });

          console.log(`[AutoSettlement Worker] ✅ Settled Pos [${pos.id}] for User [${user.username}] as ${settlementStatus}. Payout: ₹${payout}`);
        }
      }

      // 2. Settle orphaned locked transactions
      for (const tx of lockedTxs) {
        const txAgeMs = now - tx.timestamp;
        if (txAgeMs >= FORCE_MAJEURE_TIMEOUT_MS) {
          await db.$transaction(async (txClient) => {
            const isReal = tx.walletType === 'real' || (!tx.walletType && user.accountType === 'real');
            const currentBal = isReal ? user.realBalance : user.demoBalance;
            const refundAmount = tx.amount || 0;
            const newBal = Math.round((currentBal + refundAmount) * 100) / 100;

            await txClient.transaction.updateMany({
              where: { id: tx.id },
              data: {
                status: 'Failed',
                balanceAfter: newBal,
                details: `${tx.details} · Auto-reconciled: Expired locked transaction refunded.`
              }
            });

            if (refundAmount > 0) {
              const refundTxId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              await txClient.transaction.create({
                data: {
                  id: refundTxId,
                  type: 'deposit',
                  amount: refundAmount,
                  balanceAfter: newBal,
                  timestamp: Date.now(),
                  details: `Refund: Auto-reconciliation for expired wager ${tx.id}`,
                  status: 'Completed',
                  walletType: isReal ? 'real' : 'demo',
                  userId: user.id
                }
              }).catch(() => {});
            }

            const updateData = { balance: newBal };
            if (isReal) updateData.realBalance = newBal;
            else updateData.demoBalance = newBal;

            await txClient.user.update({
              where: { id: user.id },
              data: updateData
            });
          });

          console.log(`[AutoSettlement Worker] ✅ Reconciled Orphaned Tx [${tx.id}] for User [${user.username}]. Refunded ₹${tx.amount}`);
        }
      }
    }
  } catch (err) {
    console.error("[AutoSettlement Worker] Error in settlement pass:", err);
  }
}

function startDaemon() {
  console.log("🚀 Starting Automated Sports Match Settlement & Reconciliation Daemon (30s interval)...");
  setTimeout(runSettlementPass, 1000);
  setInterval(runSettlementPass, 30000);
}

startDaemon();