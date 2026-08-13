"use client";

import { useTradingStore } from "@/lib/store";
import { FileText, ArrowUpRight, ArrowDownRight, Calendar, Search, ChevronDown, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

const TIMEFRAME_LABELS = {
  '7days': 'Last 7 Days',
  '30days': 'Last 30 Days',
  '6months': 'Last 6 Months',
  'annual': 'Annual Statement',
  'all': 'All Time'
};

export default function AccountStatementPage() {
  const { transactions, syncFromServer, currentUser } = useTradingStore();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'bet'>('all');
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '6months' | 'annual' | 'all'>('30days');
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      syncFromServer().catch(() => {});
    }
  }, [currentUser, syncFromServer]);

  // Calculate timeframe filter cutoff
  const now = Date.now();
  let cutoff = 0;
  if (timeframe === '7days') cutoff = now - 7 * 24 * 60 * 60 * 1000;
  else if (timeframe === '30days') cutoff = now - 30 * 24 * 60 * 60 * 1000;
  else if (timeframe === '6months') cutoff = now - 180 * 24 * 60 * 60 * 1000;
  else if (timeframe === 'annual') cutoff = now - 365 * 24 * 60 * 60 * 1000;

  // Filter transactions based on category, timeframe, and search term
  const filteredTransactions = transactions.filter(tx => {
    // 1. Category Filter
    let matchesType = true;
    if (filter !== 'all') {
      const lowerDetails = tx.details.toLowerCase();
      if (filter === 'deposit') {
        matchesType = lowerDetails.includes('deposit') || lowerDetails.includes('refund');
      } else if (filter === 'withdrawal') {
        matchesType = lowerDetails.includes('withdrawal');
      } else if (filter === 'bet') {
        matchesType = lowerDetails.includes('bet') || lowerDetails.includes('played') || lowerDetails.includes('bought');
      }
    }

    // 2. Timeframe Filter
    let matchesTimeframe = true;
    if (timeframe !== 'all') {
      matchesTimeframe = tx.timestamp >= cutoff;
    }

    // 3. Search Filter
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      matchesSearch = tx.details.toLowerCase().includes(term) || 
                      tx.id.toLowerCase().includes(term) || 
                      tx.amount.toString().includes(term);
    }

    return matchesType && matchesTimeframe && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Account Statement
          </h1>
          <p className="text-slate-500 font-medium mt-2">Comprehensive ledger of all your localized platform interactions.</p>
        </div>
        
        {/* Category Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-stretch sm:self-auto justify-between sm:justify-start">
          {(['all', 'deposit', 'withdrawal', 'bet'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                filter === f 
                  ? 'bg-white text-red-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
        {/* Search & Date Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search statements..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-100 transition-shadow"
            />
          </div>

          {/* Timeframe Dropdown */}
          <div className="relative z-30">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{TIMEFRAME_LABELS[timeframe]}</span>
              <span className="sm:hidden">{timeframe === 'all' ? 'All' : timeframe === '7days' ? '7D' : timeframe === '30days' ? '30D' : timeframe === '6months' ? '6M' : '1Y'}</span>
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

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice().reverse().map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-all duration-200 border-b border-slate-100 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{new Date(tx.timestamp).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-500 font-medium">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.details.toLowerCase().includes('deposit') || tx.details.toLowerCase().includes('payout') || tx.details.toLowerCase().includes('cashed out') 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.details.toLowerCase().includes('deposit') || tx.details.toLowerCase().includes('payout') || tx.details.toLowerCase().includes('cashed out') ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-medium text-slate-700 text-sm">{tx.details}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="font-black text-slate-900 font-mono tracking-tighter text-base">
                        ₹{tx.balanceAfter.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-bold text-slate-600">No transactions found</p>
                      <p className="text-sm font-medium mt-1">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
