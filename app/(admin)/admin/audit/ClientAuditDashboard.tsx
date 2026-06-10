"use client";

import { useState } from "react";
import { 
  Shield, Activity, AlertTriangle, Users, CheckCircle2, AlertCircle, 
  X, Coins, Search, FileText, Globe, RefreshCw, ShieldAlert, TrendingUp
} from "lucide-react";
import { adminResolveDiscrepancy, adminBanUser } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { AuditAnomaly } from "./page";

interface UserReport {
  username: string;
  email: string;
  realBalance: number;
  role: string | undefined;
  gamingState: string;
  upiId: string;
  phoneNumber: string;
  casinoWagers: number;
  casinoPayouts: number;
  casinoRounds: number;
  casinoWinRate: number;
  deposits: number;
  withdrawals: number;
  expectedBalance: number;
  discrepancy: number;
}

interface VaultStats {
  platformTotalDeposits: number;
  platformTotalWithdrawals: number;
  platformTotalBalance: number;
  reconciliationVaultGap: number;
}

interface ClientAuditDashboardProps {
  userReports: UserReport[];
  anomalies: AuditAnomaly[];
  vaultStats: VaultStats;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ClientAuditDashboard({ userReports, anomalies, vaultStats }: ClientAuditDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "INFO">("ALL");
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "DISCREPANCIES" | "HIGH_ROLLERS">("ALL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Action Modals State
  const [activeReconcileUser, setActiveReconcileUser] = useState<{ email: string; username: string; gap: number } | null>(null);
  const [activeFreezeUser, setActiveFreezeUser] = useState<{ email: string; username: string; isBanned: boolean } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Resolve Discrepancy handler
  const handleResolveReconciliation = async () => {
    if (!activeReconcileUser || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminResolveDiscrepancy(activeReconcileUser.email);
      if (res.success) {
        showToast(`Successfully reconciled balance ledger for ${activeReconcileUser.username}`, "success");
        setActiveReconcileUser(null);
      } else {
        showToast(res.error || "Failed to reconcile ledger", "error");
      }
    } catch {
      showToast("Network error executing reconciliation action", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Suspend / Pardon handler
  const handleFreezeToggle = async () => {
    if (!activeFreezeUser || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminBanUser(activeFreezeUser.email);
      if (res.success) {
        const actionWord = activeFreezeUser.isBanned ? "Pardoned" : "Suspended";
        showToast(`Account for ${activeFreezeUser.username} is now ${actionWord}`, "success");
        setActiveFreezeUser(null);
      } else {
        showToast(res.error || "Failed to modify account status", "error");
      }
    } catch {
      showToast("Network error executing freeze toggle", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter anomalies
  const filteredAnomalies = anomalies.filter((a) => {
    if (anomalySeverityFilter === "ALL") return true;
    return a.severity === anomalySeverityFilter;
  });

  // Filter User Ledger reports
  const filteredLedger = userReports.filter((rep) => {
    const matchesSearch = 
      rep.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      rep.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (ledgerFilter === "DISCREPANCIES") return Math.abs(rep.discrepancy) > 0.05;
    if (ledgerFilter === "HIGH_ROLLERS") return rep.casinoWagers > 100000 || rep.realBalance > 50000;
    return true;
  });

  // Calculate state-wise geographic cluster statistics
  const stateCounts: Record<string, number> = {};
  userReports.forEach(r => {
    const st = r.gamingState || "Not Verified";
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  });
  const totalUsers = userReports.length;

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-[#030307] text-slate-100">
      
      {/* Visual cyber gradients */}
      <div className="absolute top-[5%] right-[10%] w-[380px] h-[380px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[130px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-60 blur-md animate-pulse" />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center shadow-2xl">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-widest uppercase bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Security & Audit Hub
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                AUDITING ENGINE
              </span>
            </div>
            <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase mt-1.5 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-red-500/80" />
              INTEGRITY STATUS: <span className="font-mono text-emerald-400 font-bold">ACTIVE SCANNING</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="mt-6 md:mt-0 px-4 py-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Re-Scan Database
        </button>
      </header>

      {/* PLATFORM RECONCILIATION & STATS PANELS */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        
        {/* Vault Integrity Status */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-10 group-hover:opacity-20 blur-md transition duration-500" />
          <div className="relative bg-slate-950/60 border border-white/5 p-6 rounded-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Platform Vault Reconciliation</span>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  Math.abs(vaultStats.reconciliationVaultGap) < 1 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse"
                }`}>
                  {Math.abs(vaultStats.reconciliationVaultGap) < 1 ? "Reconciled" : "Variance Detected"}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Platform Deposits</p>
                  <p className="text-lg font-black font-mono text-white mt-1">₹{vaultStats.platformTotalDeposits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Platform Payouts</p>
                  <p className="text-lg font-black font-mono text-white mt-1">₹{vaultStats.platformTotalWithdrawals.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">User Liabilities</p>
                  <p className="text-lg font-black font-mono text-white mt-1">₹{vaultStats.platformTotalBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">System Injected Variance</p>
                <p className={`text-md font-black font-mono mt-0.5 ${
                  Math.abs(vaultStats.reconciliationVaultGap) < 1 ? "text-slate-400" : "text-red-400"
                }`}>
                  ₹{vaultStats.reconciliationVaultGap.toLocaleString()}
                </p>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal max-w-[200px] text-right font-medium">
                Variance represents discrepancy between deposits, payouts, and player liabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Security Alerts Counter */}
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-10 group-hover:opacity-20 blur-md transition duration-500" />
          <div className="relative bg-slate-950/60 border border-red-500/20 p-6 rounded-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Critical Anomalies</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-4xl font-black font-mono text-white mt-4 tracking-tight">
              {anomalies.filter(a => a.severity === 'CRITICAL').length}
            </p>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-2.5">
              Requires immediate supervisor review
            </span>
          </div>
        </div>

        {/* Multi Accounting profile alerts count */}
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-10 group-hover:opacity-20 blur-md transition duration-500" />
          <div className="relative bg-slate-950/60 border border-purple-500/15 p-6 rounded-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">Shared Profiles</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-4xl font-black font-mono text-white mt-4 tracking-tight">
              {anomalies.filter(a => a.type === 'SHARED_PAYMENT').length}
            </p>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-2.5">
              Potential multi-accounting fraud alerts
            </span>
          </div>
        </div>

      </section>

      {/* DUAL COMPONENT: SECURITY LOGS & GEOGRAPHIC METRICS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 relative z-10">
        
        {/* SECURITY INTEGRITY ALERTS LOGS (Col-span 2) */}
        <div className="lg:col-span-2 relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-red-500/10 to-transparent opacity-30" />
          <div className="relative bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl h-[420px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-4 gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Security Alerts Feed</h2>
              </div>
              
              {/* Severity filter */}
              <div className="flex gap-1 bg-slate-900/50 p-1 border border-white/5 rounded-xl">
                {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setAnomalySeverityFilter(sev)}
                    className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-lg transition-all duration-200 ${
                      anomalySeverityFilter === sev
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-transparent text-slate-500 border-transparent hover:text-slate-300"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {filteredAnomalies.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-60" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1">No security warnings logged</p>
                </div>
              ) : (
                filteredAnomalies.map((anom) => {
                  const rep = userReports.find(r => r.email === anom.userEmail);
                  const isSuspended = rep?.role === 'BANNED';
                  
                  // Helper function for type-specific icons
                  const getAnomalyIcon = (type: AuditAnomaly["type"]) => {
                    switch (type) {
                      case "RECONCILIATION_GAP":
                        return <Coins className="w-4 h-4 text-red-400" />;
                      case "SHARED_PAYMENT":
                        return <Users className="w-4 h-4 text-purple-400" />;
                      case "EXPLOIT_WINRATE":
                        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
                      case "HIGH_ROLLER":
                        return <TrendingUp className="w-4 h-4 text-indigo-400" />;
                      default:
                        return <AlertCircle className="w-4 h-4 text-slate-400" />;
                    }
                  };

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={anom.id}
                      className={`bg-slate-900/20 border p-3 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        anom.severity === "CRITICAL"
                          ? "border-red-500/20"
                          : anom.severity === "WARNING"
                          ? "border-amber-500/20"
                          : "border-indigo-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-3 text-left min-w-0">
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                          {getAnomalyIcon(anom.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                              anom.severity === "CRITICAL"
                                ? "bg-red-500/15 text-red-400"
                                : anom.severity === "WARNING"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-indigo-500/15 text-indigo-400"
                            }`}>
                              {anom.severity}
                            </span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{anom.username}</span>
                            <span className="text-[8px] text-slate-500 font-mono truncate">{anom.userEmail}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1.5">{anom.description}</p>
                        </div>
                      </div>

                      {/* Action triggers */}
                      <div className="flex items-center gap-2 shrink-0 sm:self-center">
                        {anom.type === "RECONCILIATION_GAP" && (
                          <button
                            onClick={() => setActiveReconcileUser({ email: anom.userEmail, username: anom.username, gap: anom.meta?.discrepancy || 0 })}
                            className="text-[9px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-300"
                          >
                            Correct Ledger
                          </button>
                        )}
                        <button
                          onClick={() => setActiveFreezeUser({ email: anom.userEmail, username: anom.username, isBanned: !!isSuspended })}
                          className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-300 border ${
                            isSuspended
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                              : "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
                          }`}
                        >
                          {isSuspended ? "Pardon" : "Freeze"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* GEOGRAPHIC ACTIVE USER CLUSTERS */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent opacity-30" />
          <div className="relative bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl h-[420px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-4">
                <Globe className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Geographic Clusters</h2>
              </div>

              {/* State-wise active clusters breakdown */}
              <div className="space-y-4 overflow-y-auto max-h-[260px] custom-scrollbar pr-1">
                {Object.entries(stateCounts).map(([state, count]) => {
                  const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
                  return (
                    <div key={state} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-white">{state}</span>
                        <span className="text-slate-400">{count} Active ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/[0.02]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold text-left leading-normal">
              State activity metrics are aggregated from player compliance onboarding profiles.
            </div>
          </div>
        </div>

      </section>

      {/* DETAILED USER INTEGRITY LEDGER */}
      <section className="relative z-10">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/5 to-transparent opacity-30" />
        <div className="relative bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          
          {/* Header toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">User Integrity Registry</h2>
                <p className="text-[9px] text-slate-500 tracking-widest uppercase">Granular audit breakdown of individual wallet wagers vs deposits</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search user */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search profile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 w-full sm:w-[200px] text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center bg-slate-900/50 border border-white/5 p-1 rounded-xl">
                {(["ALL", "DISCREPANCIES", "HIGH_ROLLERS"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLedgerFilter(tab)}
                    className={`text-[8px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      ledgerFilter === tab
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-transparent text-slate-500 border-transparent hover:text-slate-300"
                    }`}
                  >
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/20">
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Username</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Deposits</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Payouts</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Casino Wagers</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Casino Winnings</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Expected balance</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Actual balance</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] text-xs font-mono">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-600">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <AlertCircle className="w-6 h-6 opacity-35" />
                        <p className="text-[10px] font-bold uppercase tracking-widest font-sans">No matching records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((rep) => {
                    const hasDiscrepancy = Math.abs(rep.discrepancy) > 0.05;
                    return (
                      <tr key={rep.email} className="group hover:bg-white/[0.01] transition-all duration-300">
                        <td className="p-4 font-sans font-bold text-white flex flex-col">
                          <span className="text-xs">{rep.username}</span>
                          <span className="text-[8px] text-slate-500 font-mono mt-0.5">{rep.email}</span>
                        </td>
                        <td className="p-4 text-right text-slate-400">₹{rep.deposits.toLocaleString()}</td>
                        <td className="p-4 text-right text-slate-400">₹{rep.withdrawals.toLocaleString()}</td>
                        <td className="p-4 text-right text-slate-400">₹{rep.casinoWagers.toLocaleString()}</td>
                        <td className="p-4 text-right text-slate-400">₹{rep.casinoPayouts.toLocaleString()}</td>
                        <td className="p-4 text-right text-slate-400">₹{rep.expectedBalance.toLocaleString()}</td>
                        <td className="p-4 text-right text-white font-bold">₹{rep.realBalance.toLocaleString()}</td>
                        <td className={`p-4 text-right font-black ${
                          hasDiscrepancy 
                            ? "text-red-400 bg-red-500/5 animate-pulse" 
                            : "text-slate-500"
                        }`}>
                          {rep.discrepancy > 0 ? "+" : ""}₹{rep.discrepancy.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* FLOATING TOAST ALERTS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              key={toast.id}
              className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 pointer-events-auto ${
                toast.type === "success"
                  ? "bg-slate-950/90 border-emerald-500/30 text-emerald-300"
                  : toast.type === "error"
                  ? "bg-slate-950/90 border-red-500/30 text-red-300"
                  : "bg-slate-950/90 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : toast.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 text-xs font-extrabold tracking-wide uppercase leading-normal">
                {toast.message}
              </div>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-500 hover:text-white shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* INTERACTIVE ACTION CONFIRMATION MODALS */}
      <AnimatePresence>
        
        {/* RECONCILE CONFIRM MODAL */}
        {activeReconcileUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReconcileUser(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Execute Wallet Correction</h3>
                </div>
                <button onClick={() => setActiveReconcileUser(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-start gap-3 text-left">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wide leading-normal">
                    This action will automatically inject a ledger correction transaction of **₹{Math.abs(activeReconcileUser.gap).toLocaleString()}** into the user's audit logs. This brings the transaction logs into perfect reconciliation with their current wallet balance.
                  </div>
                </div>

                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target Account Profile</p>
                  <p className="text-xs font-extrabold text-white mt-1 uppercase tracking-wider">{activeReconcileUser.username}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeReconcileUser.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reconciliation Gap</p>
                    <p className="text-xs font-black text-red-400 mt-1 font-mono">₹{activeReconcileUser.gap.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Correction Type</p>
                    <p className="text-xs font-black text-emerald-400 mt-1 uppercase tracking-wider">
                      {activeReconcileUser.gap > 0 ? "Deposit Log" : "Withdraw Log"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setActiveReconcileUser(null)}
                    className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveReconciliation}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? "Executing..." : "Inject Correction"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* FREEZE CONFIRM MODAL */}
        {activeFreezeUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveFreezeUser(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    {activeFreezeUser.isBanned ? "Pardon Suspended Account" : "Lock Suspicious Account"}
                  </h3>
                </div>
                <button onClick={() => setActiveFreezeUser(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex items-start gap-3 text-left">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-red-300 font-bold uppercase tracking-wide leading-normal">
                    {activeFreezeUser.isBanned 
                      ? "Restores full player permissions. The user will immediately be allowed to wager, buy/sell predictions, and make balance withdrawals."
                      : "Suspends the account instantly. This restricts bets, wagers, and deposits, locking current wallet balances from outgoing requests."}
                  </div>
                </div>

                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target User</p>
                  <p className="text-xs font-extrabold text-white mt-1 uppercase tracking-wider">{activeFreezeUser.username}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeFreezeUser.email}</p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setActiveFreezeUser(null)}
                    className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFreezeToggle}
                    disabled={isProcessing}
                    className={`flex-1 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                      activeFreezeUser.isBanned
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20"
                        : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-500/20"
                    }`}
                  >
                    {isProcessing ? "Executing..." : activeFreezeUser.isBanned ? "Pardon Account" : "Confirm Freeze"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
