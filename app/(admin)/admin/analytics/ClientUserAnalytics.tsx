"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, User, TrendingUp, Coins, CheckCircle, XCircle, AlertCircle, 
  Calendar, Activity, FileText, Save, Bell, Phone, MapPin, 
  CreditCard, ArrowRight, ShieldAlert, RefreshCw, BarChart3, Database,
  Lock, Unlock, ShieldCheck, Check, X, Eye
} from "lucide-react";
import { 
  adminSaveUserNotes, adminCreditUser, adminDebitUser, adminOverrideBalance,
  adminBanUser, adminUpdateKYCStatus 
} from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { parseCasinoDetails } from "@/lib/utils";

interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number;
  buyPrice: number;
  investment: number;
  timestamp: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'cashout' | 'casino';
  amount: number;
  balanceAfter: number;
  timestamp: number;
  details: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing';
  upiId?: string;
  utr?: string;
  screenshotUrl?: string;
}

import { UserProfile } from "@/lib/userDb";

interface NotificationLog {
  id: string;
  timestamp: number;
  userEmail: string;
  amount: number;
  utr: string;
  emailDispatch: {
    status: 'SUCCESS' | 'FAILED' | 'UNCONFIGURED';
    error?: string;
  };
  smsDispatch: {
    status: 'SUCCESS' | 'FAILED' | 'UNCONFIGURED';
    error?: string;
  };
}

interface Props {
  users: UserProfile[];
  allRounds: any[];
  notificationLogs: NotificationLog[];
  initialSelectedEmail?: string;
}

export default function ClientUserAnalytics({ 
  users, 
  allRounds, 
  notificationLogs, 
  initialSelectedEmail = "" 
}: Props) {
  const router = useRouter();
  const currentUser = useTradingStore((state) => state.currentUser);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(initialSelectedEmail || (users[0]?.email || ""));
  const [notesInput, setNotesInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Quick Action Modal states
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [kycDeclineModalOpen, setKycDeclineModalOpen] = useState(false);
  
  // Inputs
  const [amountInput, setAmountInput] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [banConfirmCheck, setBanConfirmCheck] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync input value when user changes
  const [walletSelection, setWalletSelection] = useState<'real' | 'demo'>('real');
  const activeUser = users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());
  const [lastSelectedEmail, setLastSelectedEmail] = useState("");
  if (activeUser && activeUser.email !== lastSelectedEmail) {
    setNotesInput(activeUser.adminNotes || "");
    setWalletSelection(activeUser.accountType);
    setLastSelectedEmail(activeUser.email);
  }

  // Filtered users list
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics calculation for the active user
  let depositsTotal = 0;
  let withdrawalsTotal = 0;
  let wagersTotal = 0;
  let payoutsTotal = 0;
  let roundsCount = 0;
  let winsCount = 0;

  const userTxHistory = activeUser ? (activeUser.realTransactions || []) : [];
  const sortedTxHistory = userTxHistory.sort((a, b) => b.timestamp - a.timestamp);

  userTxHistory.forEach(tx => {
    if (tx.status === 'Completed') {
      if (tx.type === 'deposit') {
        depositsTotal += tx.amount;
      } else if (tx.type === 'withdraw') {
        withdrawalsTotal += tx.amount;
      }
    }
    
    if (tx.type === 'casino') {
      roundsCount++;
      const { wager, payout } = parseCasinoDetails(tx.details || '');
      wagersTotal += wager;
      payoutsTotal += payout;
      if (payout > wager) {
        winsCount++;
      }
    }
  });

  // Calculate favorite games
  const gameCounts: Record<string, number> = {};
  userTxHistory.forEach(tx => {
    if (tx.type === 'casino') {
      const details = tx.details || '';
      const gameMatch = details.match(/Played ([^(]+)/);
      if (gameMatch) {
        const game = gameMatch[1].trim();
        gameCounts[game] = (gameCounts[game] || 0) + 1;
      }
    }
  });

  const sortedGames = Object.entries(gameCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalGameRoundsForUser = sortedGames.reduce((sum, g) => sum + g.count, 0);
  const turnoverRatio = depositsTotal > 0 ? (wagersTotal / depositsTotal) * 100 : 0;
  const isTurnoverWarning = depositsTotal > 0 && turnoverRatio < 100;
  const winRate = roundsCount > 0 ? (winsCount / roundsCount) * 100 : 0;
  const netHouseProfit = wagersTotal - payoutsTotal;

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Save auditor notes
  const handleSaveNotes = () => {
    if (!activeUser) return;
    const adminEmail = currentUser?.username || currentUser?.email || "admin";
    
    startTransition(async () => {
      const res = await adminSaveUserNotes(activeUser.email, notesInput, adminEmail);
      if (res.success) {
        showToast("Auditor notes updated in database.", "success");
      } else {
        showToast(res.error || "Failed to update notes.", "error");
      }
    });
  };

  // Balance Credit Action
  const handleCredit = async () => {
    if (!activeUser || actionLoading) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid credit amount", "error");
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminCreditUser(activeUser.email, amount, currentUser?.username || currentUser?.email || "admin", walletSelection);
      if (res.success) {
        showToast(`Successfully credited ₹${amount.toLocaleString()} to ${activeUser.username}'s ${walletSelection} wallet`, "success");
        setCreditModalOpen(false);
        setAmountInput("");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(res.error || "Failed to credit user", "error");
      }
    } catch {
      showToast("Network error executing credit action", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Balance Debit Action
  const handleDebit = async () => {
    if (!activeUser || actionLoading) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid debit amount", "error");
      return;
    }
    const currentBalance = walletSelection === 'real' ? activeUser.realBalance : activeUser.demoBalance;
    if (amount > currentBalance) {
      showToast(`Cannot debit more than user's ${walletSelection} balance`, "error");
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminDebitUser(activeUser.email, amount, currentUser?.username || currentUser?.email || "admin", walletSelection);
      if (res.success) {
        showToast(`Successfully debited ₹${amount.toLocaleString()} from ${activeUser.username}'s ${walletSelection} wallet`, "success");
        setDebitModalOpen(false);
        setAmountInput("");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(res.error || "Failed to debit user", "error");
      }
    } catch {
      showToast("Network error executing debit action", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // God-Mode Balance Override Action
  const handleOverride = async () => {
    if (!activeUser || actionLoading) return;
    const target = parseFloat(amountInput);
    if (isNaN(target) || target < 0) {
      showToast("Please enter a valid target balance", "error");
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminOverrideBalance(activeUser.email, target, currentUser?.username || currentUser?.email || "admin", walletSelection);
      if (res.success) {
        showToast(`Successfully overrode ${walletSelection} balance to ₹${target.toLocaleString()} for ${activeUser.username}`, "success");
        setOverrideModalOpen(false);
        setAmountInput("");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(res.error || "Override failed", "error");
      }
    } catch {
      showToast("Network error executing override", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Ban/Unban Action
  const handleBanToggle = async () => {
    if (!activeUser || actionLoading) return;
    if (!banConfirmCheck) {
      showToast("Please check the override checkbox to confirm", "error");
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminBanUser(activeUser.email, currentUser?.username || currentUser?.email || "admin");
      if (res.success) {
        const word = activeUser.role === 'BANNED' ? 'Unbanned' : 'Suspended';
        showToast(`User ${activeUser.username} is now ${word}`, "success");
        setBanModalOpen(false);
        setBanConfirmCheck(false);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(res.error || "Action failed", "error");
      }
    } catch {
      showToast("Network error executing ban", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // KYC Verify approvals
  const handleKYCDecision = async (status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (!activeUser || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await adminUpdateKYCStatus(activeUser.email, status, currentUser?.username || currentUser?.email || "admin", reason);
      if (res.success) {
        showToast(`User KYC status set to ${status}`, "success");
        setKycDeclineModalOpen(false);
        setDeclineReason("");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(res.error || "KYC action failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const submitKycDecline = async () => {
    const reason = declineReason.trim();
    if (!reason) {
      showToast("Please enter a reason for rejecting the document", "error");
      return;
    }
    await handleKYCDecision('REJECTED', reason);
  };

  const handleSelectUser = (email: string) => {
    setSelectedEmail(email);
    router.push(`?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col gap-6 relative">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
          toast.type === "success" ? "bg-emerald-100 border-emerald-500/30 text-emerald-700" :
          toast.type === "error" ? "bg-rose-100 border-rose-500/30 text-rose-700" :
          "bg-slate-50/80 border-slate-200 text-slate-700"
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 border border-slate-200/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-semibold text-xs tracking-wider uppercase">
            <BarChart3 className="w-4 h-4" /> Player Intelligence
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">Player Profile Controls & Analytics</h1>
          <p className="text-xs text-slate-600 mt-0.5">Audit wagers turnover, approve KYC documents, make balance overrides, and save reviewer logs.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/60 border border-slate-200 px-4 py-2.5 rounded-xl">
          <Database className="w-5 h-5 text-indigo-600" />
          <span className="text-[10px] font-mono text-slate-600">
            Database Snapshot: <span className="text-emerald-600">users.json</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Directory Selector */}
        <div className="lg:col-span-4 bg-slate-50/20 border border-slate-200/60 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
          <h2 className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2 px-1">
            <User className="w-5 h-5 text-violet-600" /> Player Directory
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search username, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition text-slate-800"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600">No players found</div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = user.email.toLowerCase() === selectedEmail.toLowerCase();
                const totalWagers = user.realTransactions.filter(t => t.type === 'casino').reduce((sum, t) => {
                  const { wager } = parseCasinoDetails(t.details || '');
                  return sum + wager;
                }, 0);

                return (
                  <button
                    key={user.email}
                    onClick={() => handleSelectUser(user.email)}
                    className={`w-full text-left p-3.5 rounded-xl border transition duration-200 flex flex-col gap-1.5 cursor-pointer relative overflow-hidden group ${
                      isSelected 
                        ? "bg-violet-100 border-violet-500/50 shadow-lg shadow-violet-500/5" 
                        : "bg-white/40 border-slate-200/60 hover:bg-slate-50/60 hover:border-slate-200"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs group-hover:text-violet-700 transition-colors">
                        {user.username}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-semibold border ${
                        user.role === 'BANNED' ? "bg-rose-100 text-rose-700 border-rose-300" :
                        user.role === 'admin' ? "bg-amber-100 text-amber-700 border-amber-300" :
                        "bg-slate-50/50 text-slate-600 border-slate-200"
                      }`}>
                        {user.role?.toUpperCase() || 'USER'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono truncate">{user.email}</div>
                    
                    <div className="flex items-center justify-between text-[10px] mt-1 pt-1.5 border-t border-slate-200/40">
                      <span className="text-slate-600">
                        Turnover: <span className="text-slate-700 font-mono font-bold">₹{totalWagers.toLocaleString('en-IN')}</span>
                      </span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-emerald-600 font-mono font-bold">
                          R: ₹{user.realBalance.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 font-mono font-semibold text-[8px]">
                          D: ₹{user.demoBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Deep-dive Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!activeUser ? (
            <div className="bg-slate-50/20 border border-slate-200/50 rounded-2xl p-16 text-center backdrop-blur-md">
              <User className="w-16 h-16 text-slate-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-slate-700">No User Selected</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Select a user from the directory to inspect financial reconciliations, wagers, state velocity, and audit documents.
              </p>
            </div>
          ) : (
            <>
              {/* Profile Card Summary Header */}
              <div className="bg-slate-50/30 border border-slate-200/80 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{activeUser.username}</h2>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        activeUser.role === 'BANNED' 
                          ? "bg-rose-100 text-rose-700 border-rose-300" 
                          : "bg-emerald-100 text-emerald-700 border-emerald-300"
                      }`}>
                        {activeUser.role === 'BANNED' ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                      {activeUser.kycStatus === 'APPROVED' ? (
                        <span className="text-[9px] bg-cyan-100 text-cyan-700 border border-cyan-300 px-2.5 py-0.5 rounded-full font-semibold tracking-wide uppercase">
                          KYC Verified
                        </span>
                      ) : activeUser.kycStatus === 'PENDING' ? (
                        <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-0.5 rounded-full font-semibold tracking-wide uppercase animate-pulse">
                          KYC Pending Review
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-50/60 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-semibold tracking-wide uppercase">
                          No KYC File
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{activeUser.email}</p>
                  </div>
                </div>

                <div className="flex gap-4 shrink-0">
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Real Wallet Balance</div>
                    <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                      ₹{activeUser.realBalance.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 border-l border-slate-200/60 pl-4">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Demo Wallet Balance</div>
                    <div className="text-2xl font-black text-slate-600 font-mono tracking-tight">
                      ₹{activeUser.demoBalance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Turnover compliance warning */}
              {isTurnoverWarning && (
                <div className="bg-amber-100 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-700">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs">Suspicious Activity Flag: Low Deposit Turnover</h4>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      This user has wagered only <span className="font-bold text-amber-200">{turnoverRatio.toFixed(1)}%</span> of their total deposits (₹{wagersTotal.toLocaleString()} wagered vs ₹{depositsTotal.toLocaleString()} deposited). 
                      Anti-Money Laundering compliance typically requires 100% turnover before withdrawal. Review this profile before approving withdrawals.
                    </p>
                  </div>
                </div>
              )}

              {/* Core Financial Reconciliation Widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Deposits", val: depositsTotal, color: "text-slate-700" },
                  { label: "Total Withdrawals", val: withdrawalsTotal, color: "text-slate-700" },
                  { label: "Total Wagered", val: wagersTotal, color: "text-violet-600" },
                  { label: "Wager Turnover", val: `${turnoverRatio.toFixed(1)}%`, color: isTurnoverWarning ? 'text-amber-600' : 'text-emerald-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-50/30 border border-slate-200/60 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">{stat.label}</div>
                    <div className={`text-lg font-bold font-mono mt-1 ${stat.color}`}>
                      {typeof stat.val === 'number' ? `₹${stat.val.toLocaleString('en-IN')}` : stat.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Gaming Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Gaming Profile Widget */}
                <div className="bg-slate-50/30 border border-slate-200/60 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
                  <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200/40">
                    <Activity className="w-4 h-4 text-violet-600" /> Gaming Metrics
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[9px] text-slate-600 font-semibold uppercase">Win Rate</div>
                      <div className="text-base font-bold font-mono text-slate-800 mt-1">
                        {winRate.toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        {winsCount} wins / {roundsCount} wagers
                      </div>
                    </div>
                    <div className="bg-white/50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[9px] text-slate-600 font-semibold uppercase">Total Payouts</div>
                      <div className="text-base font-bold font-mono text-emerald-600 mt-1">
                        ₹{payoutsTotal.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        Returned to player
                      </div>
                    </div>
                    <div className="bg-white/50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[9px] text-slate-600 font-semibold uppercase">Avg Bet Size</div>
                      <div className="text-base font-bold font-mono text-slate-800 mt-1">
                        ₹{roundsCount > 0 ? Math.floor(wagersTotal / roundsCount).toLocaleString('en-IN') : 0}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        Per game round
                      </div>
                    </div>
                    <div className="bg-white/50 border border-slate-200 p-3 rounded-lg">
                      <div className="text-[9px] text-slate-600 font-semibold uppercase">Net House Profit</div>
                      <div className={`text-base font-bold font-mono mt-1 ${netHouseProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        ₹{netHouseProfit.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        House margin
                      </div>
                    </div>
                  </div>

                  {/* Favorite Games Chart */}
                  <div className="flex flex-col gap-2.5 mt-2 flex-grow justify-end">
                    <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Favorite Games Distribution</div>
                    {sortedGames.length === 0 ? (
                      <div className="text-xs text-slate-600 italic py-2">No gameplay records found</div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {sortedGames.slice(0, 3).map((game) => {
                          const percent = totalGameRoundsForUser > 0 ? (game.count / totalGameRoundsForUser) * 100 : 0;
                          return (
                            <div key={game.name} className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] font-medium">
                                <span className="capitalize text-slate-700">{game.name}</span>
                                <span className="text-slate-600 font-mono">{game.count} rounds ({percent.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-white/80 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                <div 
                                  className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations & Auditor Workspace (Including overrides controls!) */}
                <div className="bg-slate-50/30 border border-slate-200/60 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
                  <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200/40">
                    <FileText className="w-4 h-4 text-violet-600" /> Auditor & Override Control Panel
                  </h3>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/40 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-mono">{activeUser.phoneNumber || 'No Phone'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-mono">{activeUser.upiId || 'No UPI'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>{activeUser.gamingState || 'No Region'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>Wallet: <span className="font-bold capitalize text-slate-700">{activeUser.accountType}</span></span>
                    </div>
                  </div>

                  {/* Quick Controls Grid */}
                  <div className="flex flex-col gap-2 border-t border-slate-200/40 pt-3 mt-1">
                    <div className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest">Financial Overrides</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setAmountInput(""); setCreditModalOpen(true); }}
                        disabled={activeUser.role === 'BANNED'}
                        className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-600 hover:text-slate-950 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer text-center disabled:opacity-30"
                      >
                        Credit
                      </button>
                      <button
                        onClick={() => { setAmountInput(""); setDebitModalOpen(true); }}
                        disabled={activeUser.role === 'BANNED' || activeUser.realBalance <= 0}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer text-center disabled:opacity-30"
                      >
                        Debit
                      </button>
                      <button
                        onClick={() => { setAmountInput(activeUser.realBalance.toString()); setOverrideModalOpen(true); }}
                        className="bg-indigo-500/15 hover:bg-indigo-500 border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-600 hover:text-slate-900 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer text-center"
                      >
                        Override
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => { setBanConfirmCheck(false); setBanModalOpen(true); }}
                        className={`font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer text-center border ${
                          activeUser.role === 'BANNED'
                            ? "bg-emerald-500/5 hover:bg-emerald-500 border-emerald-500/15 text-emerald-600 hover:text-slate-950"
                            : "bg-rose-500/5 hover:bg-rose-500 border-rose-500/15 text-rose-600 hover:text-slate-900"
                        }`}
                      >
                        {activeUser.role === 'BANNED' ? 'Pardon Player' : 'Suspend Player'}
                      </button>
                      
                      {activeUser.kycStatus === 'PENDING' ? (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleKYCDecision('APPROVED')}
                            className="bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold py-2 px-2.5 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer flex-1"
                          >
                            Verify KYC
                          </button>
                          <button
                            onClick={() => { setDeclineReason(""); setKycDeclineModalOpen(true); }}
                            className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-600 hover:text-slate-900 font-bold py-2 px-2.5 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer flex-1"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white/40 border border-slate-200 rounded-lg py-2 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          KYC: {activeUser.kycStatus || 'NONE'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KYC audit attachment */}
                  {activeUser.kycDocumentUrl && (
                    <div className="flex items-center justify-between text-[10px] bg-indigo-500/5 border border-indigo-500/10 p-2 rounded-lg">
                      <span className="font-semibold text-indigo-600 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> KYC document uploaded
                      </span>
                      <a 
                        href={activeUser.kycDocumentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-slate-900 bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded font-bold underline"
                      >
                        Open Attachment
                      </a>
                    </div>
                  )}

                  {/* Auditor notes input */}
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-200/40 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Auditor Notes</label>
                      <button
                        onClick={handleSaveNotes}
                        disabled={isPending}
                        className="text-[9px] font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer disabled:opacity-35"
                      >
                        {isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Note
                      </button>
                    </div>
                    <textarea
                      placeholder="Add compliance notes, audit remarks, user verification updates..."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full bg-white/70 border border-slate-200 rounded-xl p-3 text-[10px] focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition text-slate-800 resize-none h-[80px]"
                    />
                  </div>

                </div>

              </div>

              {/* Transactions & Gaming Feed */}
              <div className="bg-slate-50/20 border border-slate-200/60 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200/40">
                  <Activity className="w-4 h-4 text-violet-600" /> Recent Round & Transaction Activity
                </h3>

                <div className="overflow-x-auto">
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Tx ID</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3 text-right">Net Amount</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTxHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-600 italic">No transactions found</td>
                        </tr>
                      ) : (
                        sortedTxHistory.slice(0, 10).map((tx) => {
                          const date = new Date(tx.timestamp).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          let amountColor = "text-slate-700";
                          let prefix = "";
                          
                          if (tx.type === 'deposit') {
                            amountColor = "text-emerald-600";
                            prefix = "+";
                          } else if (tx.type === 'withdraw') {
                            amountColor = "text-rose-600";
                            prefix = "-";
                          } else if (tx.type === 'casino') {
                            const { wager, payout } = parseCasinoDetails(tx.details || '');
                            if (payout > wager) {
                              amountColor = "text-emerald-600";
                              prefix = "+";
                            } else {
                              amountColor = "text-rose-600";
                              prefix = "-";
                            }
                          }

                          return (
                            <tr key={tx.id} className="border-b border-slate-200/60 hover:bg-slate-50/20 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-slate-600">{date}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">{tx.id}</td>
                              <td className="py-2.5 px-3 capitalize">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  tx.type === 'deposit' 
                                    ? "bg-emerald-100 text-emerald-600 border border-emerald-300" 
                                    : tx.type === 'withdraw' 
                                      ? "bg-rose-100 text-rose-600 border border-rose-300"
                                      : "bg-violet-100 text-violet-600 border border-violet-300"
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">{tx.details}</td>
                              <td className={`py-2.5 px-3 text-right font-mono font-bold ${amountColor}`}>
                                {prefix}₹{tx.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                                  tx.status === 'Completed' 
                                    ? "text-emerald-600" 
                                    : tx.status === 'Pending' 
                                      ? "text-amber-600"
                                      : "text-rose-600"
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Collapsible: Operational SMS/Email Dispatch Logs */}
      <div className="bg-slate-50/30 border border-slate-200/60 rounded-2xl overflow-hidden backdrop-blur-md transition-all">
        <button
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/20 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-violet-600" />
            <div className="text-left">
              <h3 className="font-bold text-sm text-slate-800">Backend Notifications Dispatch Feed</h3>
              <p className="text-[11px] text-slate-600">SMTP and Twilio SMS manual deposit triggers audit ({notificationLogs.length} logged dispatches)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>{logsExpanded ? 'Collapse Feed' : 'Expand Logs'}</span>
            <ArrowRight className={`w-4 h-4 transition duration-200 ${logsExpanded ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {logsExpanded && (
          <div className="border-t border-slate-200/80 p-5 bg-white/20 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="overflow-x-auto">
            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Notif ID</th>
                    <th className="py-2.5 px-3">User Email</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 font-mono">UTR Ref</th>
                    <th className="py-2.5 px-3 text-center">Email SMTP Dispatch</th>
                    <th className="py-2.5 px-3 text-center">SMS Twilio Dispatch</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-600 italic">
                        No notifications logged yet. Submit a deposit request to trigger.
                      </td>
                    </tr>
                  ) : (
                    [...notificationLogs].reverse().map((log) => {
                      const date = new Date(log.timestamp).toLocaleString('en-IN');
                      const emailStatusColor = log.emailDispatch.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600 border-emerald-300' :
                        log.emailDispatch.status === 'FAILED' ? 'bg-rose-100 text-rose-600 border-rose-300' : 'bg-slate-50 text-slate-600 border-slate-200';
                      const smsStatusColor = log.smsDispatch.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600 border-emerald-300' :
                        log.smsDispatch.status === 'FAILED' ? 'bg-rose-100 text-rose-600 border-rose-300' : 'bg-slate-50 text-slate-600 border-slate-200';

                      return (
                        <tr key={log.id} className="border-b border-slate-200/60 hover:bg-slate-50/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-600">{date}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{log.id}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">{log.userEmail}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">₹{log.amount.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{log.utr}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${emailStatusColor}`}>{log.emailDispatch.status}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${smsStatusColor}`}>{log.smsDispatch.status}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* OPERATIONS OVERLAY MODALS */}

      {/* CREDIT MODAL */}
      <AnimatePresence>
        {creditModalOpen && activeUser && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Inject Wallet Credit</h3>
                <button onClick={() => setCreditModalOpen(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inject funds into <span className="text-slate-900 font-bold">{activeUser.username}</span>'s wallet.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="block text-[9px] font-bold text-slate-600 uppercase">Target Wallet</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWalletSelection('real')}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer ${walletSelection === 'real' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Real (₹{activeUser.realBalance.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletSelection('demo')}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer ${walletSelection === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Demo (₹{activeUser.demoBalance.toLocaleString()})
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition-colors font-mono"
                />
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1000, 5000, 10000, 50000].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmountInput(val.toString())}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 rounded-lg font-mono text-[10px] text-slate-600 cursor-pointer"
                  >
                    +₹{val >= 1000 ? `${val/1000}K` : val}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCredit}
                disabled={actionLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Approve Credit Injection"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DEBIT MODAL */}
      <AnimatePresence>
        {debitModalOpen && activeUser && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase text-slate-800">System Balance Debit</h3>
                <button onClick={() => setDebitModalOpen(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deduct funds from <span className="text-slate-900 font-bold">{activeUser.username}</span>'s wallet.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="block text-[9px] font-bold text-slate-600 uppercase">Target Wallet</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWalletSelection('real')}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer ${walletSelection === 'real' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Real (₹{activeUser.realBalance.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletSelection('demo')}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer ${walletSelection === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Demo (₹{activeUser.demoBalance.toLocaleString()})
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 focus:outline-none focus:border-rose-500 transition-colors font-mono"
                />
              </div>

              {/* Preset fractions */}
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.5, 0.75, 1.0].map(frac => (
                  <button
                    key={frac}
                    onClick={() => setAmountInput((Math.floor((walletSelection === 'real' ? activeUser.realBalance : activeUser.demoBalance) * frac)).toString())}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 rounded-lg font-mono text-[10px] text-slate-600 cursor-pointer"
                  >
                    {frac * 100}%
                  </button>
                ))}
              </div>

              <button
                onClick={handleDebit}
                disabled={actionLoading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-slate-900 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Approve Balance Debit"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* GOD MODE OVERRIDE MODAL */}
      <AnimatePresence>
        {overrideModalOpen && activeUser && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase text-slate-800">God-Mode Balance Override</h3>
                <button onClick={() => setOverrideModalOpen(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Forcefully set <span className="text-slate-900 font-bold">{activeUser.username}</span>'s balance. This directly overwrites current values, writing a correction transaction log.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="block text-[9px] font-bold text-slate-600 uppercase">Target Wallet</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletSelection('real');
                      setAmountInput(activeUser.realBalance.toString());
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer ${walletSelection === 'real' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Real (₹{activeUser.realBalance.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletSelection('demo');
                      setAmountInput(activeUser.demoBalance.toString());
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-center transition cursor-pointer ${walletSelection === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Demo (₹{activeUser.demoBalance.toLocaleString()})
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1.5">New Balance Target (₹)</label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>

              <button
                onClick={handleOverride}
                disabled={actionLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Execute Override"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* SUSPEND BAN CONFIRMATION MODAL */}
      <AnimatePresence>
        {banModalOpen && activeUser && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-rose-500/20 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase text-rose-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-4.5 h-4.5" /> Security Clearance Required
                </h3>
                <button onClick={() => setBanModalOpen(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to {activeUser.role === 'BANNED' ? 'pardon and unban' : 'suspend and ban'} user <span className="text-slate-900 font-bold">{activeUser.username}</span>?
                {activeUser.role !== 'BANNED' && " Banned users cannot trade or log in."}
              </p>

              <div className="flex items-start gap-2 bg-slate-50/40 p-3 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="banConfirm"
                  checked={banConfirmCheck}
                  onChange={(e) => setBanConfirmCheck(e.target.checked)}
                  className="mt-0.5 cursor-pointer accent-rose-500"
                />
                <label htmlFor="banConfirm" className="text-[10px] text-slate-600 leading-normal select-none cursor-pointer">
                  Acknowledge role modification and authorize security audit overwrite log entry.
                </label>
              </div>

              <button
                onClick={handleBanToggle}
                disabled={actionLoading || !banConfirmCheck}
                className={`w-full font-black py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-30 mt-2 ${
                  activeUser.role === 'BANNED'
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                    : "bg-rose-600 hover:bg-rose-500 text-slate-900"
                }`}
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : activeUser.role === 'BANNED' ? "Authorize Pardon" : "Authorize Suspension"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* KYC DECLINE REASON MODAL */}
      <AnimatePresence>
        {kycDeclineModalOpen && activeUser && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase text-slate-800">Decline Identity Documents</h3>
                <button onClick={() => setKycDeclineModalOpen(false)} className="text-slate-600 hover:text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide a reason for rejecting {activeUser.username}'s KYC documents.
              </p>
              
              <textarea
                placeholder="Blurry passport scan, details do not match profile UPI/phone, or document expired..."
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                className="w-full h-[100px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500/80 transition resize-none text-slate-800"
              />

              <button
                onClick={submitKycDecline}
                disabled={actionLoading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-slate-900 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 mt-1"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Decline Verification Documents"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
