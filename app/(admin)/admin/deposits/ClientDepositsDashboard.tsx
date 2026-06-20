"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/lib/userDb";
import { useTradingStore } from "@/lib/store";
import { 
  Shield, CreditCard, RefreshCw, Eye, CheckCircle, AlertCircle, X, Search, Clock, ArrowDownLeft, AlertTriangle
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

interface ClientDepositsDashboardProps {
  initialUsers: UserProfile[];
  globalTransactions: ExtendedTransaction[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ClientDepositsDashboard({ initialUsers, globalTransactions }: ClientDepositsDashboardProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  
  const [depositsTab, setDepositsTab] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [completedDeposits, setCompletedDeposits] = useState<any[]>([]);
  const [rejectedDeposits, setRejectedDeposits] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Modals state
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);
  const [declineDepositModal, setDeclineDepositModal] = useState<{
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

  const fetchDepositsQueue = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/deposits?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const deps = data.pending.concat(data.completed).concat(data.rejected) || [];
        const allDeps = deps.filter((item: any) => item.transaction.type === 'deposit');
        
        setPendingDeposits(allDeps.filter((item: any) => item.transaction.status === 'Pending'));
        setCompletedDeposits(allDeps.filter((item: any) => item.transaction.status === 'Completed'));
        setRejectedDeposits(allDeps.filter((item: any) => item.transaction.status === 'Failed'));
      }
    } catch (err) {
      console.error("Failed to fetch deposits:", err);
      showToast("Failed to fetch deposits queue.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositsQueue();
  }, [currentUser]);

  const handleDepositAction = async (email: string, transactionId: string, action: 'approve' | 'reject', reasonText?: string) => {
    if (!currentUser || actionLoadingId) return;
    setActionLoadingId(transactionId);
    
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminEmail: currentUser.email,
          email, 
          transactionId, 
          action,
          reason: reasonText 
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        showToast(
          action === 'approve' 
            ? "Deposit verified and credited successfully." 
            : "Deposit request declined.", 
          action === 'approve' ? "success" : "info"
        );
        fetchDepositsQueue();
      } else {
        showToast(data.error || "Action failed", "error");
      }
    } catch {
      showToast("Network error submitting action.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitDeclineDeposit = async () => {
    if (!declineDepositModal) return;
    const reason = declineReason.trim();
    if (!reason) {
      showToast("Decline reason is required.", "error");
      return;
    }
    const { email, transactionId } = declineDepositModal;
    setDeclineDepositModal(null);
    setDeclineReason("");
    await handleDepositAction(email, transactionId, 'reject', reason);
  };

  // Filter list by search term
  const filterList = (list: any[]) => {
    return list.filter(item => 
      item.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.transaction.utr && item.transaction.utr.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const currentList = filterList(
    depositsTab === 'pending' ? pendingDeposits : depositsTab === 'completed' ? completedDeposits : rejectedDeposits
  );

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-slate-50 text-slate-900">
      
      {/* Toast System */}
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

      {/* Header bar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <ArrowDownLeft className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase">Manual Deposit Verification</h1>
            <p className="text-xs text-slate-600 font-medium tracking-wide uppercase mt-1">Review uploaded transaction proofs and credit balances.</p>
          </div>
        </div>

        <button 
          onClick={fetchDepositsQueue}
          className="px-4 py-2 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-700 text-slate-700 hover:text-slate-900 transition duration-300 flex items-center gap-2 text-xs uppercase font-bold tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          Refresh Queue
        </button>
      </header>

      {/* Main Table card */}
      <section className="bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl min-h-[500px] flex flex-col gap-6">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex bg-slate-50/40 p-1 border border-slate-200 rounded-xl">
            {(['pending', 'completed', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDepositsTab(tab)}
                className={`text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-300 ${
                  depositsTab === tab
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-700'
                }`}
              >
                {tab} ({tab === 'pending' ? pendingDeposits.length : tab === 'completed' ? completedDeposits.length : rejectedDeposits.length})
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 w-full md:w-[260px] text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 transition duration-300"
            />
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Polling deposits database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-widest">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Player Details</th>
                  <th className="py-3 px-4">UTR Reference</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Receipt Proof</th>
                  <th className="py-3 px-4 text-right">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] font-semibold text-slate-700">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-600 italic">No deposit requests recorded in this category.</td>
                  </tr>
                ) : (
                  currentList.map(item => {
                    const dateStr = new Date(item.transaction.timestamp).toLocaleString('en-IN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <tr key={item.transaction.id} className="hover:bg-white/[0.01] transition duration-200">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{dateStr}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{item.user.username}</span>
                          <span className="text-[9px] text-slate-600 font-mono block mt-0.5">{item.user.email}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.transaction.utr || "N/A"}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">₹{item.transaction.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center">
                          {item.transaction.screenshotUrl ? (
                            <button
                              onClick={() => setZoomedScreenshot(item.transaction.screenshotUrl)}
                              className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-600 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Proof
                            </button>
                          ) : (
                            <span className="text-slate-600 italic">No proof image</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {item.transaction.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleDepositAction(item.user.email, item.transaction.id, 'approve')}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setDeclineDepositModal({ email: item.user.email, transactionId: item.transaction.id, username: item.user.username, amount: item.transaction.amount })}
                                className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-600 hover:text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              item.transaction.status === 'Completed' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {item.transaction.status === 'Completed' ? 'VERIFIED' : 'REJECTED'}
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
          </div>
        )}

      </section>

      {/* SCREENSHOT LIGHTBOX MODAL */}
      <AnimatePresence>
        {zoomedScreenshot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setZoomedScreenshot(null)}
          >
            <button className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-900 transition">
              <X className="w-5 h-5" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={zoomedScreenshot} 
              alt="Payment receipt proof screenshot" 
              className="max-w-full max-h-[85vh] rounded-xl border border-slate-200 shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* DECLINE REASON TEXT MODAL */}
      <AnimatePresence>
        {declineDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeclineDepositModal(null)}
              className="absolute inset-0 bg-white/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Decline Request</h3>
                </div>
                <button onClick={() => setDeclineDepositModal(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">User Profile</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{declineDepositModal.username}</p>
                  <p className="text-[10px] font-mono text-slate-600">{declineDepositModal.email}</p>
                </div>
                
                <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Deposit Amount</p>
                  <p className="text-xs font-black text-emerald-600 font-mono mt-1">₹{declineDepositModal.amount.toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Reason for declining deposit</label>
                  <textarea
                    placeholder="e.g. UTR is invalid, Screenshot blurry, Transaction matches a previously approved record..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500/80 transition text-slate-800 resize-none h-[90px]"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setDeclineDepositModal(null)}
                    className="flex-1 bg-transparent hover:bg-white/5 border border-slate-200 py-3 rounded-xl text-[10px] font-black uppercase text-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDeclineDeposit}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-slate-900 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition shadow-lg shadow-red-500/15"
                  >
                    Decline Request
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
