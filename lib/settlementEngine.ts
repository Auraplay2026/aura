import fs from "fs";
import path from "path";
import crypto from "crypto";

// Precision math: Paise-precision calculations (integer base).
// All wagers, payouts, stakes converted to Paise (value * 100) to prevent floating-point rounding errors.
// Holds are calculated as (Wagers - Payouts) / Wagers.

export interface SettlementEvent {
  marketId: string;
  marketName: string;
  selectionName: string;
  stake: number;      // in Rupees (can be decimal, e.g. 140.50)
  odds: number;
  outcome: string;    // winning target id / value
  userId: string;     // user email / id
  transactionId: string;
  roundId: string;
  timestamp: number;
}

// Memory tracking for circuit breaker
// Holds active wagers on a single selection in the last 1 minute to detect abnormal clusters
const recentWagers: { timestamp: number; targetId: string; stake: number }[] = [];
let isCircuitBreakerTripped = false;
const CIRCUIT_BREAKER_LIMIT = 500000; // Limit: ₹500,000 on a single selection within 1 minute

// Local daily key encryption details
const SYSTEM_SECRET = process.env.ADMIN_SECRET_KEY || "AuraPlaySecretKey2026!";

export function getAuditDirectory(): string {
  const auditDir = path.join(process.cwd(), "audit", "vault");
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  return auditDir;
}

/**
 * 1. Integer-Based High-Precision Paise Settlement Handler
 */
export function calculatePayoutPaise(stakeRupees: number, odds: number, isWin: boolean): { stakePaise: number; payoutPaise: number } {
  // Convert Rupees to integer Paise (paise precision)
  const stakePaise = Math.round(stakeRupees * 100);
  
  if (!isWin) {
    return { stakePaise, payoutPaise: 0 };
  }
  
  // High-precision multiplication using integer values
  // Odds are represented as a float, so we multiply and round to the nearest paise integer
  const payoutPaise = Math.round(stakePaise * odds);
  
  return { stakePaise, payoutPaise };
}

/**
 * 2. Cryptographic transaction idempotency hash creator (round_id + transaction_id)
 */
export function computeIdempotencyHash(transactionId: string, roundId: string): string {
  return crypto.createHmac("sha256", SYSTEM_SECRET).update(`${transactionId}:${roundId}`).digest("hex");
}

/**
 * Checks if a settlement has been processed (looks up processed hashes in audit vault files)
 */
export function isSettlementProcessed(hash: string): boolean {
  try {
    const auditDir = getAuditDirectory();
    const dateStr = new Date().toISOString().split("T")[0];
    const filePath = path.join(auditDir, `settlements_${dateStr}.log`);
    
    if (!fs.existsSync(filePath)) return false;
    
    const content = fs.readFileSync(filePath, "utf-8");
    return content.includes(hash);
  } catch (err) {
    console.error("Failed to check if settlement processed:", err);
    return false;
  }
}

/**
 * 3. Immutable Auditing: Writes serialized, cryptographically signed, encrypted log
 */
export function writeAuditLogEntry(event: SettlementEvent, hash: string) {
  try {
    const auditDir = getAuditDirectory();
    const dateStr = new Date(event.timestamp).toISOString().split("T")[0];
    const filePath = path.join(auditDir, `settlements_${dateStr}.log`);
    
    // Convert to paise representation in log for audit precision
    const stakePaise = Math.round(event.stake * 100);
    const win = event.outcome.toLowerCase() !== "loss" && event.outcome.toLowerCase() !== "failed";
    const payoutFactor = win ? event.odds : 0;
    const payoutPaise = Math.round(stakePaise * payoutFactor);
    const netProfitPaise = stakePaise - payoutPaise;
    
    const logData = {
      ...event,
      stakePaise,
      payoutPaise,
      netProfitPaise,
      idempotencyHash: hash,
      signature: crypto.createHmac("sha256", SYSTEM_SECRET).update(hash).digest("hex")
    };
    
    const logLine = JSON.stringify(logData);
    
    // Encrypt the log line with AES-256-CBC (simulates GPG audit protection)
    const cipher = crypto.createCipheriv(
      "aes-256-cbc", 
      crypto.scryptSync(SYSTEM_SECRET, "salt", 32), 
      Buffer.alloc(16, 0)
    );
    let encrypted = cipher.update(logLine, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Append to daily log file
    fs.appendFileSync(filePath, `${hash}:${encrypted}\n`, "utf-8");
    
    // Broadcast to admin telemetry feed
    broadcastTelemetry(event, win ? "SUCCESS" : "FAILURE", netProfitPaise);
  } catch (err) {
    console.error("Forensic Auditing Write Failed:", err);
  }
}

/**
 * 4. Circuit Breaker risk engine checks
 */
export function checkCircuitBreaker(targetId: string, stakeRupees: number): { tripped: boolean; alertMessage?: string } {
  const now = Date.now();
  
  // Evict older wagers (older than 1 minute)
  while (recentWagers.length > 0 && recentWagers[0].timestamp < now - 60000) {
    recentWagers.shift();
  }
  
  // Add new wager
  recentWagers.push({ timestamp: now, targetId, stake: stakeRupees });
  
  // Calculate aggregate stake on this selection in the last 1 minute
  const totalStakeOnTarget = recentWagers
    .filter(w => w.targetId === targetId)
    .reduce((sum, w) => sum + w.stake, 0);
    
  if (totalStakeOnTarget >= CIRCUIT_BREAKER_LIMIT) {
    isCircuitBreakerTripped = true;
    const alertMessage = `CRITICAL RISK ALERT: Abnormal wager velocity on outcome selection "${targetId}". Total pool in last 60s reached ₹${totalStakeOnTarget.toLocaleString()}. Market has been automatically frozen.`;
    
    // Broadcast high-priority Risk Alert
    broadcastRiskAlert(alertMessage);
    
    return { tripped: true, alertMessage };
  }
  
  return { tripped: false };
}

export function isMarketSuspended(): boolean {
  return isCircuitBreakerTripped;
}

export function resetCircuitBreaker() {
  isCircuitBreakerTripped = false;
  recentWagers.length = 0;
}

// Telemetry Emitters (Channel A)
const telemetryListeners = new Set<(data: any) => void>();
const riskAlertListeners = new Set<(message: string) => void>();

export function subscribeTelemetry(listener: (data: any) => void) {
  telemetryListeners.add(listener);
  return () => telemetryListeners.delete(listener);
}

export function subscribeRiskAlerts(listener: (message: string) => void) {
  riskAlertListeners.add(listener);
  return () => riskAlertListeners.delete(listener);
}

function broadcastTelemetry(event: SettlementEvent, status: "SUCCESS" | "FAILURE", netProfitPaise: number) {
  const data = {
    ...event,
    status,
    netProfitRupees: netProfitPaise / 100,
    timestampStr: new Date(event.timestamp).toLocaleTimeString()
  };
  telemetryListeners.forEach(listener => listener(data));
  addGlobalTelemetry(data);
}

function broadcastRiskAlert(message: string) {
  riskAlertListeners.forEach(listener => listener(message));
  addGlobalRiskAlert(message);
}

// Global active cache
let telemetryHistory: any[] = [];
let riskAlertsHistory: string[] = [];

// Static initialization from existing daily log if available
function loadStateFromLogs() {
  try {
    const auditDir = getAuditDirectory();
    const dateStr = new Date().toISOString().split("T")[0];
    const filePath = path.join(auditDir, `settlements_${dateStr}.log`);
    
    if (!fs.existsSync(filePath)) return;
    
    const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
    const history: any[] = [];
    
    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length < 2) continue;
      const encrypted = parts.slice(1).join(":");
      
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        crypto.scryptSync(SYSTEM_SECRET, "salt", 32),
        Buffer.alloc(16, 0)
      );
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      
      const parsed = JSON.parse(decrypted);
      const win = parsed.outcome.toLowerCase() !== "loss" && parsed.outcome.toLowerCase() !== "failed";
      history.unshift({
        ...parsed,
        status: win ? "SUCCESS" : "FAILURE",
        netProfitRupees: parsed.netProfitPaise / 100,
        timestampStr: new Date(parsed.timestamp).toLocaleTimeString()
      });
    }
    
    telemetryHistory = history.slice(0, 50);
  } catch (err) {
    console.error("Failed to load audit history from daily log:", err);
  }
}

// Initial load
loadStateFromLogs();

function addGlobalTelemetry(data: any) {
  telemetryHistory.unshift(data);
  if (telemetryHistory.length > 50) telemetryHistory.pop();
}

function addGlobalRiskAlert(msg: string) {
  riskAlertsHistory.unshift(msg);
  if (riskAlertsHistory.length > 20) riskAlertsHistory.pop();
}

export function getTelemetryHistory() {
  return telemetryHistory;
}

export function getRiskAlertsHistory() {
  return riskAlertsHistory;
}

/**
 * Calculates current platform Hold percentage across telemetry history
 * Hold = (Wagers - Payouts) / Wagers
 */
export function calculatePlatformHoldPercentage(): { holdPercent: number; deviationFlag: boolean } {
  let totalWagerPaise = 0;
  let totalPayoutPaise = 0;
  
  telemetryHistory.forEach(event => {
    const w = Math.round(event.stake * 100);
    const win = event.status === "SUCCESS";
    // payout factor is either odds (if won) or 0
    const p = win ? Math.round(w * event.odds) : 0;
    
    totalWagerPaise += w;
    totalPayoutPaise += p;
  });
  
  if (totalWagerPaise === 0) return { holdPercent: 12.5, deviationFlag: false };
  
  const netHouseWin = totalWagerPaise - totalPayoutPaise;
  const holdPercent = (netHouseWin / totalWagerPaise) * 100;
  
  // Standard hold target is e.g. 5% to 25%. Deviation flag if < 3% or > 22%
  const deviationFlag = holdPercent < 3.0 || holdPercent > 22.0;
  
  return { 
    holdPercent: parseFloat(holdPercent.toFixed(2)), 
    deviationFlag 
  };
}
