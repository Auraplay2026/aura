"use client";

import { useState, useEffect } from "react";
import { UserProfile, Transaction } from "@/lib/userDb";
import { useTradingStore } from "@/lib/store";
import { 
  Shield, Users, Coins, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, 
  RefreshCw, Eye, AlertTriangle, CheckCircle, Activity, Bell, CreditCard, ArrowRight, Crown, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { 
  adminSimulateWagerAction, 
  adminTriggerSportsSyncAction, 
  adminClearActivityAction,
  adminBroadcastNotificationAction,
  adminCreateUser
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

  // Quick User Creator States
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBalance, setNewBalance] = useState("0");
  const [newWalletType, setNewWalletType] = useState<'real' | 'demo'>('real');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Live Users Directory State & Background Polling
  const [usersList, setUsersList] = useState<UserProfile[]>(initialUsers || []);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  const fetchUsersDirectory = async () => {
    try {
      const res = await fetch(`/api/admin/users?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUsersDirectory();
    const interval = setInterval(fetchUsersDirectory, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async (userId?: string, username?: string) => {
    if (!username) return;
    if (!confirm(`Are you sure you want to permanently delete player @${username}?`)) return;

    try {
      const res = await fetch(`/api/admin/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Player @${username} deleted successfully`, "success");
        fetchUsersDirectory();
      } else {
        showToast(data.error || "Failed to delete user", "error");
      }
    } catch (e: any) {
      showToast("Network error deleting user", "error");
    }
  };

  // Live Telemetry states
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<string[]>([]);
  const [holdStats, setHoldStats] = useState<{ holdPercent: number; deviationFlag: boolean }>({ holdPercent: 0, deviationFlag: false });
  const [isSuspended, setIsSuspended] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Telemetry Polling Effect
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/admin/telemetry?email=${encodeURIComponent(currentUser.email)}&_t=${Date.now()}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTelemetryHistory(data.telemetry || []);
          setRiskAlerts(data.riskAlerts || []);
          setHoldStats(data.holdStats || { holdPercent: 0, deviationFlag: false });
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
        showToast(`Simulation failed: ${res.error || 'Unknown error'}`, "error");
      }
    } catch (err: any) {
      showToast(`Simulation error: ${err.message}`, "error");
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
        showToast("Live match odds synced successfully!", "success");
      } else {
        showToast(`Sync failed: ${res.error}`, "error");
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
        showToast("All player audit logs and activity logs cleared!", "success");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(`Failed: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!currentUser) return;
    const msg = prompt("Enter announcement message to broadcast to all players:");
    if (!msg || !msg.trim()) return;
    try {
      setLoading(true);
      const res = await adminBroadcastNotificationAction(currentUser.email, msg.trim());
      if (res.success) {
        showToast("Announcement broadcasted to all users successfully!", "success");
      } else {
        showToast(`Broadcast failed: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Broadcast error: ${err.message}`, "error");
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
      const res = await fetch(`/api/admin/deposits?email=${encodeURIComponent(currentUser.email)}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
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

  // Financial calculations from live regular users (excluding admin operational reserve)
  const regularUsers = usersList.filter(
    u => u.role !== 'admin' && 
         u.email?.toLowerCase() !== 'twintubrovquattro@gmail.com' && 
         u.username?.toLowerCase() !== 'admin' &&
         u.username?.toLowerCase() !== 'twintubrovquattro'
  );

  const totalUserBalances = regularUsers.reduce((sum, u) => sum + (u.realBalance || 0), 0);
  
  const totalDeposits = regularUsers.reduce((sum, u) => {
    return sum + (u.realTransactions || [])
      .filter((t) => t.type === "deposit" && t.status === "Completed")
      .reduce((s, t) => s + t.amount, 0);
  }, 0);

  const totalWithdrawals = regularUsers.reduce((sum, u) => {
    return sum + (u.realTransactions || [])
      .filter((t) => t.type === "withdraw" && t.status === "Completed")
      .reduce((s, t) => s + t.amount, 0);
  }, 0);

  const netProfit = totalDeposits - totalWithdrawals;

  // Recharts interactive volume trend chart
  const renderAreaChart = () => {
    const chartData = [
      { time: '00:00', volume: 0 },
      { time: '04:00', volume: 0 },
      { time: '08:00', volume: 0 },
      { time: '12:00', volume: 0 },
      { time: '16:00', volume: 0 },
      { time: '20:00', volume: 0 },
      { time: '23:59', volume: 0 },
    ];

    return (
      <div className="w-full h-[160px] select-none mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
              formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Margin Volume']}
            />
            <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#volumeGrad)" />
          </AreaChart>
        </ResponsiveContainer>
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

      {/* Emergency Bet Pause Banner */}
      {isSuspended && (
        <div className="bg-rose-100 border border-rose-500/35 text-rose-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider">Betting Temporarily Paused</h4>
              <p className="text-xs text-rose-700 mt-1">
                {riskAlerts[0] || "A safety pause was triggered due to an unusually high volume of bets on a single match or game."}
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetBreaker}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 shrink-0"
          >
            Resume All Betting Now
          </button>
        </div>
      )}

      {/* Maintenance Mode Banner */}
      {isMaintenanceMode && (
        <div className="bg-amber-100 border border-amber-500/35 text-amber-900 p-5 rounded-2xl flex items-center gap-4 relative z-10 animate-pulse">
          <Shield className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Temporary Site Maintenance is Active</h4>
            <p className="text-xs text-amber-700 mt-1">
              The website is currently closed to the public while you perform maintenance. You (Admin) can still view and use everything normally.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs tracking-wider uppercase">
            <Shield className="w-4 h-4" /> Admin Control Hub
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">Daily Overview & Management</h1>
          <p className="text-xs text-slate-600 mt-0.5">Check total company profits, approve user deposits, send withdrawals, and monitor live bets.</p>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-[11px] text-slate-600">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" /> <span className="hidden sm:inline">TIME:</span> <span className="text-slate-900 font-bold">{timeString || "00:00:00"}</span>
          </div>
          <button 
            onClick={fetchOperationsSummary}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 shadow-sm"
            aria-label="Refresh Dashboard Numbers"
            title="Refresh All Numbers"
          >
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </button>
        </div>
      </header>

      {/* ═══ EXECUTIVE LIVE PLATFORM RADAR STRIP ═══ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.18),transparent_70%)] pointer-events-none" />
        
        <div className="flex items-center gap-3.5 relative z-10 w-full lg:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Global Platform Inflow Today</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" /> 24/7 LIVE
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              ₹{(totalDeposits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10 w-full lg:w-auto justify-start lg:justify-end text-[11px] font-bold text-slate-300">
          <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md">
            <span className="text-slate-400 uppercase text-[9px] font-black tracking-wider">System:</span>
            <span className="text-emerald-400 font-black flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> 100% Online</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md">
            <span className="text-slate-400 uppercase text-[9px] font-black tracking-wider">Speed:</span>
            <span className="text-indigo-300 font-mono font-black">12ms Latency</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md">
            <span className="text-slate-400 uppercase text-[9px] font-black tracking-wider">Active Players:</span>
            <span className="text-amber-300 font-mono font-black">{regularUsers.length.toLocaleString()} Registered</span>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {[
          { label: "Company Profit", val: netProfit, icon: Coins, color: "text-emerald-600", border: "border-emerald-200 bg-emerald-50/40" },
          { label: "Total Deposits", val: totalDeposits, icon: ArrowUpRight, color: "text-indigo-600", border: "border-indigo-200 bg-indigo-50/30" },
          { label: "Total Withdrawals", val: totalWithdrawals, icon: ArrowDownLeft, color: "text-pink-600", border: "border-pink-200 bg-pink-50/30" },
          { label: "Player Balances", val: totalUserBalances, icon: Users, color: "text-cyan-600", border: "border-cyan-200 bg-cyan-50/30" },
        ].map((card) => (
          <div key={card.label} className={`border ${card.border} p-5 rounded-2xl shadow-sm bg-white`}>
            <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest">
              <span>{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 mt-3 tracking-tight">₹{card.val.toLocaleString('en-IN')}</p>
          </div>
        ))}

        {/* Profit Margin Dial Card */}
        <div className={`border p-5 rounded-2xl shadow-sm transition-all duration-300 ${
          holdStats.deviationFlag 
            ? 'border-rose-300 bg-rose-50' 
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest">
            <span>Profit Margin %</span>
            <Activity className={`w-4 h-4 ${holdStats.deviationFlag ? 'text-rose-600 animate-spin' : 'text-indigo-600'}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <p className={`text-2xl font-black font-mono tracking-tight ${holdStats.deviationFlag ? 'text-rose-600' : 'text-slate-900'}`}>
              {holdStats.holdPercent}%
            </p>
            {holdStats.deviationFlag && (
              <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase leading-none">
                ATTENTION
              </span>
            )}
          </div>
          {holdStats.deviationFlag ? (
            <p className="text-[9px] font-bold text-rose-700 mt-2 uppercase tracking-wider leading-none">
              ⚠️ Unusual high payouts - check game win rates
            </p>
          ) : (
            <p className="text-[9px] text-emerald-700 font-bold mt-2 uppercase tracking-wider leading-none">
              ✅ Healthy profit margin (Standard: 5% - 20%)
            </p>
          )}
        </div>
      </section>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch relative z-10">
        
        {/* Left Side: Pending Tasks & Quick Tools */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Pending Action Tasks */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>📋 Pending Tasks (Needs Your Approval)</span>
              <span className="text-[10px] font-bold text-slate-500 lowercase font-sans">click arrow to open page</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Deposits backlog */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl border border-emerald-200 flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Deposit Requests</h4>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{pendingDepositsCount} Waiting for Approval</p>
                  </div>
                </div>
                <Link 
                  href="/admin/deposits" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition shadow-sm"
                  title="Approve User Deposits"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Withdrawals backlog */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl border border-pink-200 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-pink-700" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Withdrawal Requests</h4>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{pendingWithdrawalsCount} Ready to Pay Out</p>
                  </div>
                </div>
                <Link 
                  href="/admin/withdrawals" 
                  className="bg-pink-600 hover:bg-pink-700 text-white p-2.5 rounded-xl transition shadow-sm"
                  title="Send Money to Users"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>

          {/* Quick Management Tools */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Quick Management Shortcuts
            </h3>
            
            <p className="text-xs text-slate-600">
              Easily refresh match scores, manage game payout settings, send notices to players, or manage WhatsApp numbers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              
              {/* Sync Live Matches */}
              <button 
                onClick={handleSportsSync}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-4 py-3.5 rounded-xl text-sky-800 font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Activity className="w-4 h-4 text-sky-600" />
                <span className="text-xs uppercase tracking-wider">Refresh Match Odds</span>
              </button>

              {/* Game Win Rates & RTP Settings */}
              <Link 
                href="/admin/rtp-monitor"
                className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-3.5 rounded-xl text-amber-800 font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="text-xs uppercase tracking-wider">Game Win Rates</span>
              </Link>

              {/* Payment Gateway Settings */}
              <Link 
                href="/admin/payment-settings"
                className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-3.5 rounded-xl text-emerald-800 font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="text-xs uppercase tracking-wider">Payment Settings</span>
              </Link>

              {/* Broadcast Alert */}
              <button 
                onClick={handleBroadcast}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-3.5 rounded-xl text-indigo-800 font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 sm:col-span-2"
              >
                <Bell className="w-4 h-4 text-indigo-600" />
                <span className="text-xs uppercase tracking-wider">Send Notice to All Users</span>
              </button>

              {/* VIP Manager */}
              <Link 
                href="/admin/vip"
                className="flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-3.5 rounded-xl text-purple-800 font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="text-xs uppercase tracking-wider">VIP Level Rewards</span>
              </Link>

            </div>
          </div>

          {/* Quick Create User Form */}
          <div className="bg-white border border-emerald-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Create New Player Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quickly register a user and give them an initial balance</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newUsername.trim() || !newPassword.trim()) {
                showToast("Please enter both username and password", "error");
                return;
              }
              try {
                setIsCreatingUser(true);
                const res = await adminCreateUser(newUsername.trim(), newPassword.trim(), Number(newBalance) || 0, newWalletType);
                if (res.success) {
                  showToast(`Player '${res.username}' created successfully!`, "success");
                  setNewUsername("");
                  setNewPassword("");
                  setNewBalance("0");
                } else {
                  showToast(res.error || "Failed to create user", "error");
                }
              } catch (err: any) {
                showToast(err.message || "Failed to create user", "error");
              } finally {
                setIsCreatingUser(false);
              }
            }} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul99"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Initial Money (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isCreatingUser ? "Creating..." : "Create Player"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Area Chart Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between flex-grow">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Today's Betting Activity Chart</h3>
                <p className="text-xs text-slate-500 mt-0.5">Total bets placed by players hour by hour</p>
              </div>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 font-black tracking-wider uppercase">
                Hourly Activity
              </span>
            </div>
            {renderAreaChart()}
          </div>

        </div>

        {/* Right Side: Live Activity Feed */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Player Activity</h3>
            </div>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2.5 pr-1 max-h-[360px]">
            {globalTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">No activity recorded yet.</div>
            ) : (
              globalTransactions.slice(0, 15).map(tx => {
                const isGain = tx.type === 'deposit' || (tx.type === 'casino' && !tx.details.toLowerCase().includes('payout') && !tx.details.toLowerCase().includes('win'));
                return (
                  <div key={tx.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">@{tx.username}</span>
                      <span className="text-slate-500 font-mono truncate block max-w-[170px] mt-0.5 text-[11px]">{tx.details}</span>
                    </div>
                    <span className={`font-mono font-black shrink-0 text-right ${isGain ? 'text-emerald-700' : 'text-pink-600'}`}>
                      {isGain ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 👥 Live Registered Players & Supabase Auth Directory Table */}
      <section className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative z-10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs tracking-wider uppercase">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Registered Players & Platform Users</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                {usersList.length} Active Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live real-time directory of all registered players and accounts synchronized across PostgreSQL and Supabase Auth.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search username or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                setIsRefreshingUsers(true);
                await fetchUsersDirectory();
                setIsRefreshingUsers(false);
                showToast("Users directory refreshed!", "info");
              }}
              disabled={isRefreshingUsers}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider bg-slate-50">
                <th className="py-3 px-3">Player / Username</th>
                <th className="py-3 px-3">Email (Supabase Auth)</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Real Balance (₹)</th>
                <th className="py-3 px-3 text-right">Demo Balance (₹)</th>
                <th className="py-3 px-3 text-right">Total Wagered</th>
                <th className="py-3 px-3 text-center">KYC</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {usersList
                .filter(u => {
                  if (!userSearchTerm.trim()) return true;
                  const term = userSearchTerm.toLowerCase();
                  return (
                    u.username?.toLowerCase().includes(term) ||
                    u.email?.toLowerCase().includes(term)
                  );
                })
                .map((u, idx) => {
                  const isPrimaryAdmin = u.username?.toLowerCase() === 'twintubro' || u.email?.toLowerCase() === 'twintubrovquattro@gmail.com';
                  return (
                    <tr key={u.id || u.username || idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {u.username ? u.username[0].toUpperCase() : 'U'}
                        </div>
                        <span>@{u.username}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {u.email || `${u.username.toLowerCase()}@aurabet.io`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                        ₹{(u.realBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                        ₹{(u.demoBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ₹{(u.totalWagered || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          u.kycStatus === 'VERIFIED' || u.kycStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.kycStatus || 'NONE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isPrimaryAdmin ? (
                          <span className="text-[10px] text-slate-400 font-bold italic">Primary Admin</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Live Bets & Wager History Table */}
      <section className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative z-10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs tracking-wider uppercase">
              <Shield className="w-4 h-4 text-indigo-600" /> Live Player Bets & Wager History
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live feed of bets placed by players across cricket, soccer, tennis, and casino games.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-1">Company Profit/Loss</span>
              <span className={`font-mono text-sm font-black ${
                telemetryHistory.reduce((sum, item) => sum + (item.netProfitRupees || 0), 0) >= 0 
                  ? 'text-emerald-700' 
                  : 'text-rose-600'
              }`}>
                {telemetryHistory.reduce((sum, item) => sum + (item.netProfitRupees || 0), 0) >= 0 ? '+' : ''}
                ₹{telemetryHistory.reduce((sum, item) => sum + (item.netProfitRupees || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-1">Total Bet Volume</span>
              <span className="font-mono text-sm font-black text-indigo-700">
                ₹{telemetryHistory.reduce((sum, item) => sum + (item.stake || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider bg-slate-50">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Bet ID</th>
                <th className="py-3 px-3">Player</th>
                <th className="py-3 px-3">Match / Game</th>
                <th className="py-3 px-3">Selection</th>
                <th className="py-3 px-3 text-right">Bet Amount</th>
                <th className="py-3 px-3 text-right">Odds / Rate</th>
                <th className="py-3 px-3 text-right">Result</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-700">
              {telemetryHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    No bets placed today yet. All new player bets will appear here live.
                  </td>
                </tr>
              ) : (
                telemetryHistory.map((item, idx) => (
                  <tr key={`${item.transactionId}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-600">{item.timestampStr || new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-bold">{item.transactionId}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">@{item.userId}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">{item.marketName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.selectionName}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-bold">₹{item.stake.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{item.odds.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={item.outcome.toLowerCase() === 'won' || item.outcome.toLowerCase() === 'success' ? 'text-emerald-700' : 'text-slate-600'}>
                        {item.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${
                        item.status === 'SUCCESS' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
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
