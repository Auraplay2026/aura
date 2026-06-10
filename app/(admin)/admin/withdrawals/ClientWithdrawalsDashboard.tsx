"use client";

import { useState, useEffect } from "react";
import type { UserProfile } from "@/lib/userDb";
import { parseCasinoDetails } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { adminUpdateWithdrawalStatus } from "../actions";
import { 
  Shield, CreditCard, RefreshCw, CheckCircle, AlertCircle, X, Search, Clock, ArrowDownLeft, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExtendedTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  timestamp: number;
  details: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Processing';
  upiId?: string;
  utr?: string;
  screenshotUrl?: string;
  email: string;
  username: string;
}

interface ClientWithdrawalsDashboardProps {
  initialUsers: UserProfile[];
  globalTransactions: ExtendedTransaction[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ClientWithdrawalsDashboard({ initialUsers, globalTransactions }: ClientWithdrawalsDashboardProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  
  const [withdrawalsTab, setWithdrawalsTab] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [processingWithdrawals, setProcessingWithdrawals] = useState<any[]>([]);
  const [completedWithdrawals, setCompletedWithdrawals] = useState<any[]>([]);
  const [failedWithdrawals, setFailedWithdrawals] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Modals state
  const [declineWithdrawalModal, setDeclineWithdrawalModal] = useState<{
    email: string;
    transactionId: string;
    username: string;
    amount: number;
  } | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchWithdrawalsQueue = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/deposits?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const withs = data.pending.concat(data.completed).concat(data.rejected) || [];
        const allWiths = withs.filter((item: any) => item.transaction.type === 'withdraw');
        
        // Scan each withdrawal transaction to calculate user wagers & deposits for turnover audits
        const mapWithTurnover = (arr: any[]) => arr.map(item => {
          const userProfile = initialUsers.find(u => u.email.toLowerCase() === item.user.email.toLowerCase());
          let totalDeposited = 0;
          let totalWagered = 0;
          
          if (userProfile) {
            totalDeposited = userProfile.realTransactions
              .filter((t) => t.type === "deposit" && t.status === "Completed")
              .reduce((sum, t) => sum + t.amount, 0);

            userProfile.realTransactions.forEach((t) => {
              if (t.type === "casino") {
                const { wager } = parseCasinoDetails(t.details || '');
                totalWagered += wager;
              }
            });
          }
          
          const wagerRatio = totalDeposited > 0 ? (totalWagered / totalDeposited) * 100 : 0;
          return {
            ...item,
            user: {
              ...item.user,
              totalDeposited,
              totalWagered,
              wagerRatio,
              isSuspicious: totalDeposited > 0 && wagerRatio < 100
            }
          };
        });

        const allMapped = mapWithTurnover(allWiths);
        
        setPendingWithdrawals(allMapped.filter((item: any) => item.transaction.status === 'Pending'));
        setProcessingWithdrawals(allMapped.filter((item: any) => item.transaction.status === 'Processing'));
        setCompletedWithdrawals(allMapped.filter((item: any) => item.transaction.status === 'Completed'));
        setFailedWithdrawals(allMapped.filter((item: any) => item.transaction.status === 'Failed'));
      }
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
      showToast("Failed to fetch withdrawals queue.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalsQueue();
  }, [currentUser]);

  const handleWithdrawalStatusUpdate = async (
    email: string,
    transactionId: string,
    newStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed',
    reasonText?: string
  ) => {
    if (!currentUser || actionLoadingId) return;
    setActionLoadingId(transactionId);
    
    try {
      const res = await adminUpdateWithdrawalStatus(email, transactionId, newStatus, currentUser.email, reasonText);
      if (res.success) {
        showToast(
          newStatus === 'Processing'
            ? "Withdrawal marked as Processing."
            : newStatus === 'Completed'
            ? "Withdrawal successfully disbursed."
            : "Withdrawal request declined & refunded.",
          newStatus === 'Completed' ? "success" : "info"
        );
        fetchWithdrawalsQueue();
      } else {
        showToast(res.error || "Failed to update withdrawal status.", "error");
      }
    } catch {
      showToast("Network error executing withdrawal action.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitDeclineWithdrawal = async () => {
    if (!declineWithdrawalModal) return;
    const reason = declineReason.trim();
    if (!reason) {
      showToast("Decline reason is required.", "error");
      return;
    }
    const { email, transactionId } = declineWithdrawalModal;
    setDeclineWithdrawalModal(null);
    setDeclineReason("");
    await handleWithdrawalStatusUpdate(email, transactionId, 'Failed', reason);
  };

  // Filter list by search term
  const filterList = (list: any[]) => {
    return list.filter(item => 
      item.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.transaction.upiId && item.transaction.upiId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const currentList = filterList(
    withdrawalsTab === 'pending' ? pendingWithdrawals : 
    withdrawalsTab === 'processing' ? processingWithdrawals :
    withdrawalsTab === 'completed' ? completedWithdrawals : 
    failedWithdrawals
  );

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-[#030307] text-slate-100">
      
      {/* Toast System */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
            t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
            t.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' :
            'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header bar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 opacity-60 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-pink-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Withdrawals Management</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">Process payouts, verify compliance turnover, and log settlements.</p>
          </div>
        </div>

        <button 
          onClick={fetchWithdrawalsQueue}
          className="px-4 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition duration-300 flex items-center gap-2 text-xs uppercase font-bold tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          Refresh Queue
        </button>
      </header>

      {/* Main Table card */}
      <section className="bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl min-h-[500px] flex flex-col gap-6">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex bg-slate-900/40 p-1 border border-white/5 rounded-xl">
            {(['pending', 'processing', 'completed', 'failed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setWithdrawalsTab(tab)}
                className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-300 ${
                  withdrawalsTab === tab
                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                    : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {tab} ({
                  tab === 'pending' ? pendingWithdrawals.length : 
                  tab === 'processing' ? processingWithdrawals.length : 
                  tab === 'completed' ? completedWithdrawals.length : 
                  failedWithdrawals.length
                })
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, UPI ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/50 border border-white/5 rounded-xl pl-9 pr-4 py-2 w-full md:w-[260px] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-pink-500/40 transition duration-300"
            />
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Polling withdrawals database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-extrabold uppercase tracking-widest">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Player Details</th>
                  <th className="py-3 px-4">UPI Destination</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Compliance (Turnover)</th>
                  <th className="py-3 px-4 text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] font-semibold text-slate-300">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500 italic">No withdrawal requests recorded in this category.</td>
                  </tr>
                ) : (
                  currentList.map(item => {
                    const dateStr = new Date(item.transaction.timestamp).toLocaleString('en-IN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <tr key={item.transaction.id} className="hover:bg-white/[0.01] transition duration-200">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{dateStr}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{item.user.username}</span>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{item.user.email}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{item.transaction.upiId || "N/A"}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-pink-400">₹{item.transaction.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center">
                          {item.user.totalDeposited > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`font-mono font-bold text-[10px] ${
                                item.user.isSuspicious ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {item.user.wagerRatio.toFixed(0)}% turnover
                              </span>
                              {item.user.isSuspicious && (
                                <span className="text-[8px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1 py-0.2 rounded font-semibold tracking-wide uppercase animate-pulse">
                                  ⚠️ LOW TURNOVER
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">No Deposits</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {item.transaction.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleWithdrawalStatusUpdate(item.user.email, item.transaction.id, 'Processing')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-600/15"
                              >
                                Process
                              </button>
                              <button
                                onClick={() => setDeclineWithdrawalModal({ email: item.user.email, transactionId: item.transaction.id, username: item.user.username, amount: item.transaction.amount })}
                                className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          ) : item.transaction.status === 'Processing' ? (
                            <>
                              <button
                                onClick={() => handleWithdrawalStatusUpdate(item.user.email, item.transaction.id, 'Completed')}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/15"
                              >
                                Disburse
                              </button>
                              <button
                                onClick={() => setDeclineWithdrawalModal({ email: item.user.email, transactionId: item.transaction.id, username: item.user.username, amount: item.transaction.amount })}
                                className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              item.transaction.status === 'Completed' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {item.transaction.status === 'Completed' ? 'DISBURSED' : 'DECLINED'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </section>

      {/* DECLINE REASON TEXT MODAL */}
      <AnimatePresence>
        {declineWithdrawalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeclineWithdrawalModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Decline Withdrawal</h3>
                </div>
                <button onClick={() => setDeclineWithdrawalModal(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">User Profile</p>
                  <p className="text-xs font-bold text-white mt-1">{declineWithdrawalModal.username}</p>
                  <p className="text-[10px] font-mono text-slate-400">{declineWithdrawalModal.email}</p>
                </div>
                
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Withdrawal Amount</p>
                  <p className="text-xs font-black text-rose-400 font-mono mt-1">₹{declineWithdrawalModal.amount.toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Decline reason (declined amount will be refunded)</label>
                  <textarea
                    placeholder="e.g. AML compliance check failed (insufficient game turnover), invalid UPI handle..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500/80 transition text-slate-200 resize-none h-[90px]"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setDeclineWithdrawalModal(null)}
                    className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase text-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDeclineWithdrawal}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition shadow-lg shadow-red-500/15"
                  >
                    Decline & Refund
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
