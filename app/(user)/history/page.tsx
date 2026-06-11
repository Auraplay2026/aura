"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Clock, Activity, ArrowDownLeft, ArrowUpRight, Coins, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";

const TABS = ["All Transactions", "Financial", "Trades"];

export default function BetHistoryPage() {
  const [activeTab, setActiveTab] = useState("All Transactions");
  const { transactions } = useTradingStore();
  
  // Hydration fix for localStorage
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === "Financial") return tx.type === 'deposit' || tx.type === 'withdraw';
    if (activeTab === "Trades") return tx.type === 'trade' || tx.type === 'cashout' || tx.type === 'casino';
    return true; // All
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <span className="w-1.5 h-6 bg-neon-green rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
            Transaction Ledger
          </h1>
          <p className="text-sm text-slate-600 mt-1 pl-4 flex items-center gap-2">
            <Activity className="w-3 h-3 text-neon-green" /> Real-time synchronized history.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" /> All Time
          </button>
          <button className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200/80 rounded-2xl w-max overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-6 py-2.5 text-sm font-bold rounded-xl transition-colors whitespace-nowrap",
              activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="history-tab"
                className="absolute inset-0 bg-slate-100 rounded-xl shadow-inner border border-slate-700"
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200/80 bg-slate-900/50">
                <th className="py-4 font-bold px-6">Transaction ID</th>
                <th className="py-4 font-bold px-4">Date</th>
                <th className="py-4 font-bold px-4">Type</th>
                <th className="py-4 font-bold px-4">Details</th>
                <th className="py-4 font-bold px-4 text-right">Amount</th>
                <th className="py-4 font-bold px-4 text-right">Balance After</th>
                <th className="py-4 font-bold px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-slate-200/30 hover:bg-slate-100/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-slate-500 group-hover:text-slate-600 transition-colors">{row.id}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> {new Date(row.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {row.type === 'deposit' && <ArrowDownLeft className="w-4 h-4 text-green-500" />}
                          {row.type === 'withdraw' && <ArrowUpRight className="w-4 h-4 text-red-500" />}
                          {row.type === 'trade' && <TrendingDown className="w-4 h-4 text-slate-600" />}
                          {row.type === 'cashout' && <TrendingUp className="w-4 h-4 text-neon-green" />}
                          {row.type === 'casino' && <Coins className="w-4 h-4 text-purple-500" />}
                          <span className="text-xs text-slate-700 font-bold uppercase tracking-widest">{row.type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-700 max-w-[300px] truncate" title={row.details}>
                        {row.details}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={cn(
                          "font-black tracking-tight",
                          (row.type === 'deposit' || row.type === 'cashout' || (row.type === 'casino' && row.amount > 0)) ? "text-neon-green drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]" : "text-slate-900"
                        )}>
                          {(row.type === 'deposit' || row.type === 'cashout' || (row.type === 'casino' && row.amount > 0)) ? '+' : '-'}₹{Math.abs(row.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-600 text-sm">
                        ₹{row.balanceAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {row.status === "Completed" && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neon-green bg-neon-green/10 px-2.5 py-1 rounded-full border border-neon-green/20">
                            <TrendingUp className="w-3 h-3" /> Completed
                          </span>
                        )}
                        {row.status === "Pending" && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neon-yellow bg-neon-yellow/10 px-2.5 py-1 rounded-full border border-neon-yellow/20">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
