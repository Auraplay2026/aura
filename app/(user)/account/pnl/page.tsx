"use client";

import { BarChart, TrendingUp, Calendar, ArrowUpRight, Wallet, ChevronDown } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { useState } from "react";

const TIMEFRAME_LABELS = {
  '7days': 'Last 7 Days',
  '30days': 'Last 30 Days',
  '6months': 'Last 6 Months',
  'annual': 'Annual Statement',
  'all': 'All Time'
};

export default function PnLPage() {
  const { transactions } = useTradingStore();
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '6months' | 'annual' | 'all'>('30days');
  const [isOpen, setIsOpen] = useState(false);

  // Calculate timeframe filter cutoff
  const now = Date.now();
  let cutoff = 0;
  if (timeframe === '7days') cutoff = now - 7 * 24 * 60 * 60 * 1000;
  else if (timeframe === '30days') cutoff = now - 30 * 24 * 60 * 60 * 1000;
  else if (timeframe === '6months') cutoff = now - 180 * 24 * 60 * 60 * 1000;
  else if (timeframe === 'annual') cutoff = now - 365 * 24 * 60 * 60 * 1000;

  // Filter transactions based on date range
  const filteredTxByTime = transactions.filter(tx => timeframe === 'all' || tx.timestamp >= cutoff);

  // Filter helper for real deposits (UPI, bank inject, etc.)
  const isRealDeposit = (tx: any) => {
    if (tx.type !== 'deposit') return false;
    const details = tx.details.toLowerCase();
    return !details.includes('settle') && 
           !details.includes('refund') && 
           !details.includes('claimed') && 
           !details.includes('spin') && 
           !details.includes('weekly') && 
           !details.includes('monthly') && 
           !details.includes('rakeback') && 
           !details.includes('reward');
  };

  const totalDeposits = filteredTxByTime.filter(isRealDeposit).reduce((acc, tx) => acc + tx.amount, 0);
  const totalWithdrawals = filteredTxByTime.filter(tx => tx.type === 'withdraw').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  
  // Dynamic balance start/end calculations
  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfter : 100000;
  let balanceStart = 100000;
  let balanceEnd = currentBalance;
  
  if (filteredTxByTime.length > 0) {
    balanceEnd = filteredTxByTime[0].balanceAfter;
    const lastTx = filteredTxByTime[filteredTxByTime.length - 1];
    const lastTxIdx = transactions.findIndex(t => t.id === lastTx.id);
    if (lastTxIdx !== -1 && lastTxIdx + 1 < transactions.length) {
      balanceStart = transactions[lastTxIdx + 1].balanceAfter;
    }
  } else {
    balanceStart = currentBalance;
  }

  // Calculate Net PNL
  const pnl = balanceEnd - balanceStart - totalDeposits + totalWithdrawals;

  // Calculate total wagers placed within selected timeframe
  const wagered = filteredTxByTime.reduce((acc, tx) => {
    const match = tx.details.match(/Wager:\s*₹?\s*([\d.]+)/i);
    if (match && match[1]) {
      return acc + parseFloat(match[1]);
    }
    if (tx.type === 'trade' && (tx.details.toLowerCase().includes('placed') || tx.details.toLowerCase().includes('bet'))) {
      return acc + tx.amount;
    }
    return acc;
  }, 0);

  const netCashflow = totalDeposits - totalWithdrawals;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Profit & Loss
          </h1>
          <p className="text-slate-500 font-medium mt-2">Analyze your betting performance and financial metrics over time.</p>
        </div>
        
        {/* Timeframe Dropdown */}
        <div className="relative z-30 shrink-0">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{TIMEFRAME_LABELS[timeframe]}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>
          
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {(Object.keys(TIMEFRAME_LABELS) as Array<keyof typeof TIMEFRAME_LABELS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeframe(key);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      timeframe === key 
                        ? 'text-red-600 bg-red-50/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {TIMEFRAME_LABELS[key]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net PNL Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net PNL</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pnl >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <BarChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-4xl font-black tracking-tighter font-mono flex items-center gap-2 ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">Excludes deposits & withdrawals</p>
          </div>
        </div>

        {/* Total Wagered Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Wagered</span>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter font-mono text-slate-900">
              ₹{wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">Across all products</p>
          </div>
        </div>

        {/* Net Cashflow Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Cashflow</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter font-mono text-slate-900">
              ₹{netCashflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {netCashflow >= 0 ? "Net funds injected" : "Net funds withdrawn"} ({TIMEFRAME_LABELS[timeframe]})
            </p>
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
