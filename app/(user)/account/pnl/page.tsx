"use client";

import { BarChart, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { useTradingStore } from "@/lib/store";

export default function PnLPage() {
  const { transactions } = useTradingStore();

  const totalDeposits = transactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + tx.amount, 0);
  const totalWithdrawals = transactions.filter(tx => tx.type === 'withdraw').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  
  // Approximate PnL logic for demo
  const startBalance = 100000;
  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfter : startBalance;
  const pnl = currentBalance - startBalance - totalDeposits + totalWithdrawals;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Profit & Loss
          </h1>
          <p className="text-slate-500 font-medium mt-2">Analyze your betting performance and financial metrics over time.</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          <Calendar className="w-4 h-4" />
          <span>Last 30 Days</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net PNL</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pnl >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <BarChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-4xl font-black tracking-tighter font-mono flex items-center gap-2 ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toFixed(2)}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">Excludes deposits & withdrawals</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Wagered</span>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter font-mono text-slate-900">
              ₹{(Math.abs(pnl) * 2.5 + 1500).toFixed(2)} {/* Mock wagered logic */}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">Across all products</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Cashflow</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter font-mono text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              ₹{totalDeposits.toFixed(2)}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">Total lifetime deposits</p>
          </div>
        </div>
      </div>

      {/* Chart Mockup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] hover:shadow-sm transition-all duration-200">
        <BarChart className="w-16 h-16 text-slate-200 mb-4" />
        <h3 className="font-black text-slate-900 mb-2">Detailed Charts Unavailable</h3>
        <p className="text-sm font-medium text-slate-500">You need more settled betting data to generate graphical charts.</p>
      </div>
    </div>
  );
}
