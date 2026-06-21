import { getUsers } from "@/lib/userDb";
import { parseCasinoDetails } from "@/lib/utils";
import ClientAuditDashboard from "./ClientAuditDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import { getAdminAuditLogs } from "../actions";

export const dynamic = 'force-dynamic';

export interface AuditAnomaly {
  id: string;
  type: "RECONCILIATION_GAP" | "SHARED_PAYMENT" | "EXPLOIT_WINRATE" | "HIGH_ROLLER" | "SHARED_IP" | "SHARED_DEVICE" | "ARBITRAGE_WARNING";
  severity: "CRITICAL" | "WARNING" | "INFO";
  userEmail: string;
  username: string;
  description: string;
  meta: any;
}

export default async function AuditLogsPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/admin/login");
  }

  const users = await getUsers();
  const anomalies: AuditAnomaly[] = [];

  // 1. Group payment profiles for multi-accounting checks
  const upiGroups: Record<string, { email: string; username: string }[]> = {};
  const phoneGroups: Record<string, { email: string; username: string }[]> = {};
  const ipGroups: Record<string, { email: string; username: string }[]> = {};
  const deviceGroups: Record<string, { email: string; username: string }[]> = {};

  users.forEach((u) => {
    // UPI Check
    if (u.upiId && u.upiId.trim() !== "" && u.upiId !== "admin@okaxis" && u.upiId !== "demo@okaxis") {
      const key = u.upiId.toLowerCase().trim();
      if (!upiGroups[key]) upiGroups[key] = [];
      if (!upiGroups[key].some(acc => acc.email === u.email)) {
        upiGroups[key].push({ email: u.email, username: u.username });
      }
    }
    // Phone Check
    if (u.phoneNumber && u.phoneNumber.trim() !== "" && u.phoneNumber !== "9999999999") {
      const key = u.phoneNumber.toLowerCase().trim();
      if (!phoneGroups[key]) phoneGroups[key] = [];
      if (!phoneGroups[key].some(acc => acc.email === u.email)) {
        phoneGroups[key].push({ email: u.email, username: u.username });
      }
    }

    // Scan activity logs for unique IPs and Devices/User-Agents
    const uniqueIps = new Set<string>();
    const uniqueDevices = new Set<string>();

    if (u.activityLogs && Array.isArray(u.activityLogs)) {
      u.activityLogs.forEach(log => {
        // Collect IPs
        if (log.ip && log.ip.trim() !== "" && log.ip !== "127.0.0.1" && log.ip !== "::1" && log.ip.toLowerCase() !== "unknown") {
          uniqueIps.add(log.ip.trim());
        }
        // Collect Devices
        if (log.device && log.device.trim() !== "" && log.device.toLowerCase() !== "unknown" && log.device.toLowerCase() !== "server") {
          uniqueDevices.add(log.device.trim());
        }

        // If log is an arbitrage alert, flag it immediately
        if (log.type === 'ARBITRAGE_ALERT') {
          anomalies.push({
            id: `anomaly_arb_${log.id || Math.random().toString()}`,
            type: "ARBITRAGE_WARNING",
            severity: "CRITICAL",
            userEmail: u.email,
            username: u.username,
            description: `Arbitrage Warning: ${log.action}`,
            meta: { timestamp: log.timestamp, action: log.action }
          });
        }
      });
    }

    uniqueIps.forEach(ip => {
      const key = ip.toLowerCase();
      if (!ipGroups[key]) ipGroups[key] = [];
      if (!ipGroups[key].some(acc => acc.email === u.email)) {
        ipGroups[key].push({ email: u.email, username: u.username });
      }
    });

    uniqueDevices.forEach(dev => {
      const key = dev.toLowerCase();
      if (!deviceGroups[key]) deviceGroups[key] = [];
      if (!deviceGroups[key].some(acc => acc.email === u.email)) {
        deviceGroups[key].push({ email: u.email, username: u.username });
      }
    });
  });

  // Flag duplicate UPIs
  Object.entries(upiGroups).forEach(([upi, accounts]) => {
    if (accounts.length > 1) {
      accounts.forEach((acc) => {
        anomalies.push({
          id: `anomaly_upi_${upi}_${acc.email}`,
          type: "SHARED_PAYMENT",
          severity: "WARNING",
          userEmail: acc.email,
          username: acc.username,
          description: `Suspected Multi-Accounting: UPI ID '${upi}' is shared by ${accounts.length} accounts: ${accounts.map(a => a.username).join(", ")}.`,
          meta: { sharedField: "UPI", value: upi, count: accounts.length }
        });
      });
    }
  });

  // Flag duplicate Phone Numbers
  Object.entries(phoneGroups).forEach(([phone, accounts]) => {
    if (accounts.length > 1) {
      accounts.forEach((acc) => {
        anomalies.push({
          id: `anomaly_phone_${phone}_${acc.email}`,
          type: "SHARED_PAYMENT",
          severity: "WARNING",
          userEmail: acc.email,
          username: acc.username,
          description: `Suspected Multi-Accounting: Phone number '${phone}' is shared by ${accounts.length} accounts: ${accounts.map(a => a.username).join(", ")}.`,
          meta: { sharedField: "Phone", value: phone, count: accounts.length }
        });
      });
    }
  });

  // Flag duplicate IPs (Syndicate IP clustering)
  Object.entries(ipGroups).forEach(([ip, accounts]) => {
    if (accounts.length > 1) {
      accounts.forEach((acc) => {
        anomalies.push({
          id: `anomaly_ip_${ip.replace(/[^a-zA-Z0-9]/g, '_')}_${acc.email}`,
          type: "SHARED_IP",
          severity: "WARNING",
          userEmail: acc.email,
          username: acc.username,
          description: `IP Address Clustering: Shared access IP '${ip}' detected across ${accounts.length} accounts: ${accounts.map(a => a.username).join(", ")}.`,
          meta: { sharedField: "IP Address", value: ip, count: accounts.length }
        });
      });
    }
  });

  // Flag duplicate Devices
  Object.entries(deviceGroups).forEach(([dev, accounts]) => {
    if (accounts.length > 1) {
      accounts.forEach((acc) => {
        anomalies.push({
          id: `anomaly_dev_${dev.replace(/[^a-zA-Z0-9]/g, '_')}_${acc.email}`,
          type: "SHARED_DEVICE",
          severity: "WARNING",
          userEmail: acc.email,
          username: acc.username,
          description: `Device Fingerprint Sharing: Hardware/browser signature '${dev}' detected across ${accounts.length} accounts: ${accounts.map(a => a.username).join(", ")}.`,
          meta: { sharedField: "Device", value: dev, count: accounts.length }
        });
      });
    }
  });

  // 2. Scan ledger reconciliation & win rates
  let platformTotalDeposits = 0;
  let platformTotalWithdrawals = 0;
  let platformTotalBalance = 0;
  
  const userReports = users.map((u) => {
    const deposits = u.realTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = u.realTransactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate net game history
    let casinoWagers = 0;
    let casinoPayouts = 0;
    let casinoRounds = 0;
    let casinoWins = 0;

    u.realTransactions.forEach(t => {
      if (t.type === 'casino') {
        casinoRounds++;
        const { wager, payout } = parseCasinoDetails(t.details || '');
        casinoWagers += wager;
        casinoPayouts += payout;
        if (payout > wager) {
          casinoWins++;
        }
      }
    });

    const netCasinoProfit = casinoPayouts - casinoWagers;
    const expectedBalance = deposits - withdrawals + netCasinoProfit;
    const discrepancy = u.realBalance - expectedBalance;

    platformTotalDeposits += deposits;
    platformTotalWithdrawals += withdrawals;
    platformTotalBalance += u.realBalance;

    // Flag Critical Balance Discrepancy
    if (Math.abs(discrepancy) > 0.05) {
      anomalies.push({
        id: `anomaly_recon_${u.email}`,
        type: "RECONCILIATION_GAP",
        severity: "CRITICAL",
        userEmail: u.email,
        username: u.username,
        description: `Critical Ledger Mismatch: Stored wallet balance is ₹${u.realBalance.toLocaleString()} but transaction logs audit expected balance of ₹${expectedBalance.toLocaleString()} (Variance: ₹${discrepancy.toLocaleString()}).`,
        meta: { expectedBalance, actualBalance: u.realBalance, discrepancy }
      });
    }

    // Flag Exploit Win-rate
    const winRate = casinoRounds > 0 ? (casinoWins / casinoRounds) * 100 : 0;
    if (casinoRounds >= 5 && winRate > 80) {
      anomalies.push({
        id: `anomaly_exploit_${u.email}`,
        type: "EXPLOIT_WINRATE",
        severity: "CRITICAL",
        userEmail: u.email,
        username: u.username,
        description: `Suspicious Exploit Win-Rate: Win rate is abnormally high at ${winRate.toFixed(1)}% over ${casinoRounds} rounds played.`,
        meta: { rounds: casinoRounds, winRate, wins: casinoWins }
      });
    }

    // Flag High Roller
    if (casinoWagers > 100000 || u.realBalance > 50000) {
      anomalies.push({
        id: `anomaly_high_roller_${u.email}`,
        type: "HIGH_ROLLER",
        severity: "INFO",
        userEmail: u.email,
        username: u.username,
        description: `High-Roller Activity Alert: Cumulative casino wagers: ₹${casinoWagers.toLocaleString()} or balance: ₹${u.realBalance.toLocaleString()}`,
        meta: { totalWagered: casinoWagers, balance: u.realBalance }
      });
    }

    return {
      username: u.username,
      email: u.email,
      realBalance: u.realBalance,
      role: u.role,
      gamingState: u.gamingState || "Not Verified",
      upiId: u.upiId || "N/A",
      phoneNumber: u.phoneNumber || "N/A",
      casinoWagers,
      casinoPayouts,
      casinoRounds,
      casinoWinRate: winRate,
      deposits,
      withdrawals,
      expectedBalance,
      discrepancy,
    };
  });

  const reconciliationVaultGap = platformTotalDeposits - platformTotalWithdrawals - platformTotalBalance;
  const auditLogs = await getAdminAuditLogs();

  return (
    <ClientAuditDashboard 
      userReports={userReports}
      anomalies={anomalies}
      vaultStats={{
        platformTotalDeposits,
        platformTotalWithdrawals,
        platformTotalBalance,
        reconciliationVaultGap
      }}
      auditLogs={auditLogs}
    />
  );
}
