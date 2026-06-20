"use client";

import { useState, useEffect } from "react";
import { UserProfile, Transaction } from "@/lib/userDb";
import { useTradingStore } from "@/lib/store";
import { 
  Shield, Users, Coins, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, 
  RefreshCw, Eye, AlertTriangle, CheckCircle, Activity, Bell, CreditCard, ArrowRight, Crown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  adminSimulateWagerAction, 
  adminTriggerSportsSyncAction, 
  adminClearActivityAction,
  adminBroadcastNotificationAction
} from "./actions";

interface ExtendedTransaction extends Transaction {
  email: string;
  username: string;
}

interface ClientAdminDashboardProps {
  initialUsers: UserProfile[];
  globalTransactions: ExtendedTransaction[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ClientAdminDashboard({ initialUsers, globalTransactions }: ClientAdminDashboardProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  
  const [timeString, setTimeString] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [pendingDepositsCount, setPendingDepositsCount] = useState(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);

  // Live Telemetry states
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<string[]>([]);
  const [holdStats, setHoldStats] = useState<{ holdPercent: number; deviationFlag: boolean }>({ holdPercent: 12.5, deviationFlag: false });
  const [isSuspended, setIsSuspended] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Telemetry Polling Effect
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/admin/telemetry?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setTelemetryHistory(data.telemetry || []);
          setRiskAlerts(data.riskAlerts || []);
          setHoldStats(data.holdStats || { holdPercent: 12.5, deviationFlag: false });
          setIsSuspended(!!data.isSuspended);
          setIsMaintenanceMode(!!data.maintenanceMode);
        }
      } catch (err) {
        console.error("Telemetry fetch failed:", err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Reset circuit breaker handler
  const handleResetBreaker = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email, action: 'reset_breaker' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Circuit breaker reset successfully. Settlements resumed.", "success");
        setIsSuspended(false);
      } else {
        showToast(`Reset failed: ${data.error || 'Unknown error'}`, "error");
      }
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWager = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await adminSimulateWagerAction(currentUser.email);
      if (res.success) {
        showToast(`Success: Simulated ${res.details} for @${res.user}!`, "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(`Error: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Simulation failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSportsSync = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await adminTriggerSportsSyncAction(currentUser.email);
      if (res.success) {
        showToast(`Sync Done! Crawled ${res.cricketCount} Cricket & ${res.tennisCount} Tennis live fixtures.`, "success");
      } else {
        showToast(`Sync Error: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivity = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await adminClearActivityAction(currentUser.email);
      if (res.success) {
        showToast(`Success: Purged ${res.clearedCount} simulated transactions from ledger.`, "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(`Error: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Purge failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!currentUser) return;
    const msg = prompt("Enter the notification message to broadcast to ALL users:");
    if (!msg) return;
    try {
      setLoading(true);
      const res = await adminBroadcastNotificationAction(currentUser.email, msg);
      if (res.success) {
        showToast(`Success: Broadcasted message to ${res.sentCount} users.`, "success");
      } else {
        showToast(`Error: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Broadcast failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };


  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Live clock
  useEffect(() => {
    setTimeString(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch queues summary details
  const fetchOperationsSummary = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/deposits?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        // Filter Deposits & Withdrawals count
        const pendingDeps = (data.pending || []).filter((item: any) => item.transaction.type === 'deposit');
        const pendingWiths = (data.pending || []).filter((item: any) => item.transaction.type === 'withdraw');
        
        setPendingDepositsCount(pendingDeps.length);
        setPendingWithdrawalsCount(pendingWiths.length);
      }
    } catch (err) {
      console.error("Failed to fetch operations summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsSummary();
  }, [currentUser]);

  // Financial calculations
  const totalUserBalances = initialUsers.reduce((sum, u) => sum + u.realBalance, 0);
  
  const totalDeposits = initialUsers.reduce((sum, u) => {
    return sum + u.realTransactions
      .filter((t) => t.type === "deposit" && t.status === "Completed")
      .reduce((s, t) => s + t.amount, 0);
  }, 0);

  const totalWithdrawals = initialUsers.reduce((sum, u) => {
    return sum + u.realTransactions
      .filter((t) => t.type === "withdraw" && t.status === "Completed")
      .reduce((s, t) => s + t.amount, 0);
  }, 0);

  const netProfit = totalDeposits - totalWithdrawals - totalUserBalances;

  // Render Premium SVG Margin Area Chart
  const renderAreaChart = () => {
    const hourlyData = [0.05, 0.12, 0.08, 0.22, 0.18, 0.35, 0.42, 0.38, 0.55, 0.48, 0.72, 0.85];
    const width = 500;
    const height = 150;
    const paddingX = 20;
    const paddingY = 15;

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const points = hourlyData.map((val, idx) => {
      const x = paddingX + (idx / (hourlyData.length - 1)) * chartWidth;
      const y = paddingY + chartHeight - val * chartHeight;
      return { x, y };
    });

    let linePath = "";
    let areaPath = "";

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      areaPath = `M ${points[0].x} ${height - paddingY} L ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        linePath += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
        areaPath += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
      }
      areaPath += ` L ${points[points.length - 1].x} ${height - paddingY} Z`;
    }

    return (
      <div className="relative w-full h-[150px] select-none mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.02)" strokeDasharray="3,3" />
          <line x1={paddingX} y1={paddingY + chartHeight} x2={width - paddingX} y2={paddingY + chartHeight} stroke="rgba(255,255,255,0.05)" />
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
          {linePath && <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" filter="url(#glow)" className="stroke-indigo-500" />}
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          {points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="2.5" className="fill-indigo-950 stroke-indigo-400 stroke-2 hover:r-4 transition-all" />
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col gap-6 relative overflow-hidden">
      
      {/* Glow elements */}
      <div className="absolute top-[5%] left-[10%] w-[320px] h-[320px] rounded-full bg-violet-600/5 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[420px] h-[420px] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none" />

      {/* Floating Toast System */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
            t.type === 'success' ? 'bg-emerald-100 border-emerald-500/30 text-emerald-700' :
            t.type === 'error' ? 'bg-rose-100 border-rose-500/30 text-rose-700' :
            'bg-slate-50/80 border-slate-200 text-slate-700'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-600" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Risk Suspension Banner */}
      {isSuspended && (
        <div className="bg-rose-100 border border-rose-500/35 text-rose-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-650 shrink-0" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider">Settlement Engine Suspended</h4>
              <p className="text-xs text-rose-700 mt-1">
                {riskAlerts[0] || "System circuit breaker tripped due to abnormal wager velocity on an outcome selection."}
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetBreaker}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-slate-900 font-bold text-xs uppercase px-5 py-3 rounded-xl transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 shrink-0"
          >
            Reset Circuit Breaker & Resume
          </button>
        </div>
      )}
      {/* Maintenance Mode Banner */}
      {isMaintenanceMode && (
        <div className="bg-amber-100 border border-amber-500/35 text-amber-900 p-5 rounded-2xl flex items-center gap-4 relative z-10 animate-pulse">
          <Shield className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Maintenance Mode (Global Kill Switch) is Active</h4>
            <p className="text-xs text-amber-700 mt-1">
              Public traffic is blocked. Standard users attempting to load casino games or sportsbooks are redirected. Admins retain full bypass access.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Top bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 border border-slate-200/80 rounded-2xl p-6 backdrop-blur-md relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs tracking-wider uppercase">
            <Shield className="w-4 h-4" /> Command Center
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">System Operations Hub</h1>
          <p className="text-xs text-slate-600 mt-0.5">High-level financial summaries, platform ledger audits, and live user gameplay feeds.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/60 border border-slate-200 px-4 py-2.5 rounded-xl font-mono text-[10px] text-slate-600">
            <Clock className="w-4 h-4 text-indigo-600" /> CLOCK: <span className="text-slate-900 font-bold">{timeString || "00:00:00"}</span>
          </div>
          <button 
            onClick={fetchOperationsSummary}
            className="p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-700 text-slate-700 hover:text-slate-900 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </button>
        </div>
      </header>

      {/* Financial Overviews Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {[
          { label: "Net House Margin", val: netProfit, icon: Coins, color: "text-emerald-600", border: "border-emerald-500/20" },
          { label: "Cumulative Deposits", val: totalDeposits, icon: ArrowUpRight, color: "text-indigo-600", border: "border-indigo-500/15" },
          { label: "Cumulative Withdrawals", val: totalWithdrawals, icon: ArrowDownLeft, color: "text-pink-600", border: "border-pink-500/15" },
          { label: "Platform Liabilities", val: totalUserBalances, icon: Users, color: "text-cyan-600", border: "border-cyan-500/15" },
        ].map((card) => (
          <div key={card.label} className={`bg-white/60 border ${card.border} p-5 rounded-2xl backdrop-blur-md`}>
            <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest">
              <span>{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 mt-3 tracking-tight">₹{card.val.toLocaleString('en-IN')}</p>
          </div>
        ))}

        {/* Live Hold % Dial Card */}
        <div className={`bg-white/60 border p-5 rounded-2xl backdrop-blur-md transition-all duration-300 ${
          holdStats.deviationFlag 
            ? 'border-rose-500 bg-rose-50/50 shadow-[0_0_15px_rgba(244,63,94,0.1)] animate-pulse' 
            : 'border-indigo-500/15 bg-white/60'
        }`}>
          <div className="flex items-center justify-between text-slate-650 text-[10px] font-black uppercase tracking-widest">
            <span>Platform Hold %</span>
            <Activity className={`w-4 h-4 ${holdStats.deviationFlag ? 'text-rose-605 animate-spin' : 'text-indigo-600'}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <p className={`text-2xl font-black font-mono tracking-tight ${holdStats.deviationFlag ? 'text-rose-600' : 'text-slate-900'}`}>
              {holdStats.holdPercent}%
            </p>
            {holdStats.deviationFlag && (
              <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase leading-none">
                RISK ALERT
              </span>
            )}
          </div>
          {holdStats.deviationFlag ? (
            <p className="text-[9px] font-bold text-rose-700 mt-2 uppercase tracking-wider leading-none">
              ⚠️ OUT OF BOUNDS! HUMAN REVIEW REQ
            </p>
          ) : (
            <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-wider leading-none">
              ✅ Optimal hold (Limit: 3% - 22%)
            </p>
          )}
        </div>
      </section>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch relative z-10">
        
        {/* Left Side: Pending Task Summaries & Net Trend */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Action Tasks Summary Widget */}
          <div className="bg-white/45 border border-slate-200 p-6 rounded-2xl backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3">
              📋 Operational Verification Backlog
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Deposits backlog */}
              <div className="bg-white/[0.01] border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Manual Deposits</h4>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{pendingDepositsCount} Awaiting Review</p>
                  </div>
                </div>
                <Link 
                  href="/admin/deposits" 
                  className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-slate-950 p-2 rounded-lg transition"
                  title="Open Deposits Queue"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Withdrawals backlog */}
              <div className="bg-white/[0.01] border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500/10 rounded-xl border border-pink-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Withdrawals Portal</h4>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{pendingWithdrawalsCount} Awaiting Disbursement</p>
                  </div>
                </div>
                <Link 
                  href="/admin/withdrawals" 
                  className="bg-pink-500/10 hover:bg-pink-500 text-pink-600 hover:text-slate-900 p-2 rounded-lg transition"
                  title="Open Withdrawals Queue"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>

          {/* Platform System Controllers */}
          <div className="bg-white/45 border border-indigo-500/10 p-6 rounded-2xl backdrop-blur-md flex flex-col gap-4 shadow-[0_0_20px_rgba(99,102,241,0.02)]">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Platform System Controllers & Tools
            </h3>
            
            <p className="text-[11px] text-slate-600">
              Trigger live backend scrapers, inject simulated wagers to test analytics calculations, or sanitize demo activity from wagers databases.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              
              {/* Sync Live Matches */}
              <button 
                onClick={handleSportsSync}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600/20 to-transparent hover:from-cyan-600/30 border border-cyan-500/20 hover:border-cyan-500/40 px-5 py-4 rounded-xl text-slate-700 hover:text-slate-900 font-bold transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Activity className="w-4 h-4 text-cyan-600" />
                <span className="text-xs uppercase tracking-wider">Sync Live Sports</span>
              </button>

              {/* Inject Random Bet */}
              <button 
                onClick={handleSimulateWager}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/20 to-transparent hover:from-violet-600/30 border border-violet-500/20 hover:border-violet-500/40 px-5 py-4 rounded-xl text-slate-700 hover:text-slate-900 font-bold transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Bell className="w-4 h-4 text-violet-600" />
                <span className="text-xs uppercase tracking-wider">Inject Test Bet</span>
              </button>

              {/* Purge Simulated Wagers */}
              <button 
                onClick={handleClearActivity}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600/20 to-transparent hover:from-rose-600/30 border border-rose-500/20 hover:border-rose-500/40 px-5 py-4 rounded-xl text-slate-700 hover:text-slate-900 font-bold transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 text-rose-600" />
                <span className="text-xs uppercase tracking-wider">Purge Demo Bets</span>
              </button>

              {/* Broadcast Alert */}
              <button 
                onClick={handleBroadcast}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600/20 to-transparent hover:from-emerald-600/30 border border-emerald-500/20 hover:border-emerald-500/40 px-5 py-4 rounded-xl text-slate-700 hover:text-slate-900 font-bold transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50 sm:col-span-3"
              >
                <Bell className="w-4 h-4 text-emerald-600" />
                <span className="text-xs uppercase tracking-wider">Broadcast Global Alert</span>
              </button>

              {/* VIP Manager */}
              <Link 
                href="/admin/vip"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600/20 to-transparent hover:from-amber-600/30 border border-amber-500/20 hover:border-amber-500/40 px-5 py-4 rounded-xl text-slate-700 hover:text-slate-900 font-bold transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 sm:col-span-3"
              >
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-xs uppercase tracking-wider">VIP System Manager</span>
              </Link>

            </div>
          </div>

          {/* Area Chart Card */}
          <div className="bg-white/45 border border-slate-200 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between flex-grow">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Platform Net Volume Trend</h3>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Calculated margin throughput over hours</p>
              </div>
              <span className="text-[9px] text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-black tracking-widest uppercase">
                Hourly Scanning
              </span>
            </div>
            {renderAreaChart()}
          </div>

        </div>

        {/* Right Side: Live Activity Feed */}
        <div className="bg-white/45 border border-slate-200 p-6 rounded-2xl backdrop-blur-md flex flex-col h-full min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600 animate-pulse" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Live Activity Feed</h3>
            </div>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2.5 pr-1 max-h-[360px]">
            {globalTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic text-xs">No logs recorded yet.</div>
            ) : (
              globalTransactions.slice(0, 15).map(tx => {
                const isGain = tx.type === 'deposit' || (tx.type === 'casino' && !tx.details.toLowerCase().includes('payout') && !tx.details.toLowerCase().includes('win'));
                return (
                  <div key={tx.id} className="bg-white/[0.01] hover:bg-white/[0.02] border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 text-[10px] transition">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">{tx.username}</span>
                      <span className="text-slate-600 font-mono truncate block max-w-[170px] mt-0.5">{tx.details}</span>
                    </div>
                    <span className={`font-mono font-black shrink-0 text-right ${isGain ? 'text-emerald-600' : 'text-pink-600'}`}>
                      {isGain ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Forensic Audit Telemetry Feed Table */}
      <section className="bg-white/60 border border-slate-200 p-6 rounded-2xl backdrop-blur-md relative z-10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-650 font-bold text-xs tracking-wider uppercase">
              <Shield className="w-4 h-4 text-indigo-600" /> Channel A: Real-Time Forensic Settlement Telemetry
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Forensic audit logs streamed directly from secure daily GPG-encrypted log files.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-650 uppercase tracking-widest block leading-none mb-1">Liability Variance</span>
              <span className={`font-mono text-sm font-black ${
                telemetryHistory.reduce((sum, item) => sum + (item.netProfitRupees || 0), 0) >= 0 
                  ? 'text-emerald-600' 
                  : 'text-rose-600'
              }`}>
                {telemetryHistory.reduce((sum, item) => sum + (item.netProfitRupees || 0), 0) >= 0 ? '+' : ''}
                ₹{telemetryHistory.reduce((sum, item) => sum + (item.netProfitRupees || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-650 uppercase tracking-widest block leading-none mb-1">Telemetry Volume</span>
              <span className="font-mono text-sm font-black text-indigo-600">
                ₹{telemetryHistory.reduce((sum, item) => sum + (item.stake || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Selection</th>
                <th className="py-2.5 px-3 text-right">Stake</th>
                <th className="py-2.5 px-3 text-right">Odds</th>
                <th className="py-2.5 px-3 text-right">Outcome</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
              {telemetryHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-600 italic">
                    No active settlements recorded in the daily audit vault ledger.
                  </td>
                </tr>
              ) : (
                telemetryHistory.map((item, idx) => (
                  <tr key={`${item.transactionId}-${idx}`} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3 text-slate-600">{item.timestampStr || new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-bold">{item.transactionId}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-bold">{item.userId}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-bold">{item.marketName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.selectionName}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-bold">₹{item.stake.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{item.odds.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={item.outcome.toLowerCase() === 'won' || item.outcome.toLowerCase() === 'success' ? 'text-emerald-600' : 'text-slate-600'}>
                        {item.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${
                        item.status === 'SUCCESS' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
