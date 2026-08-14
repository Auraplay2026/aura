"use client";

import { useTradingStore } from "@/lib/store";
import { Activity, Clock, Trophy, Ban, RefreshCw, Ticket, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function MyBetsPage() {
  const { positions, transactions, syncFromServer, currentUser, cancelSportsBet } = useTradingStore();
  const [activeTab, setActiveTab] = useState<'open' | 'settled'>('open');

  useEffect(() => {
    if (currentUser) {
      syncFromServer().catch(() => {});
    }
  }, [currentUser, syncFromServer]);

  const openPositions = positions.filter(p => p.shares > 0);
  const settledBets = transactions.filter(t => 
    t.type === 'trade' || 
    t.details?.toLowerCase().includes('placed') || 
    t.details?.toLowerCase().includes('bet') || 
    t.details?.toLowerCase().includes('settle')
  );

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            My Bets & Positions
          </h1>
          <p className="text-slate-500 font-medium mt-2">Track your active exchange wagers, open market positions, and verified settlement history.</p>
        </div>
        <button 
          onClick={() => syncFromServer()}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('open')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative cursor-pointer ${
            activeTab === 'open' ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Open Positions ({openPositions.length})
          {activeTab === 'open' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('settled')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative cursor-pointer ${
            activeTab === 'settled' ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Settled Bets ({settledBets.length})
          {activeTab === 'settled' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openPositions.length > 0 ? (
            openPositions.map((pos, i) => (
              <div key={pos.id || i} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exchange Position</span>
                      <h3 className="font-black text-slate-900">{pos.marketTitle}</h3>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Active
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selection</span>
                    <span className="font-bold text-slate-900 uppercase">{pos.side === 'no' ? 'LAY' : 'BACK'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Odds / Price</span>
                    <span className="font-bold text-slate-900 font-mono">{typeof pos.buyPrice === 'number' ? pos.buyPrice.toFixed(2) : pos.buyPrice}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shares / Stake</span>
                    <span className="font-bold text-slate-900 font-mono">₹{pos.shares.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Stake</span>
                    <span className="font-black text-slate-900 font-mono text-lg">₹{pos.investment.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      await useTradingStore.getState().cashOut(pos.id, pos.buyPrice);
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                  >
                    Cash Out (₹{(pos.investment * 0.95).toFixed(0)})
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-900 mb-1">No Active Positions</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm">You don't have any open bets or exchange positions right now. Head over to the Sportsbook to place a wager.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settled' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {settledBets.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {settledBets.map((tx, idx) => {
                const statusStr = (tx.status as string) || '';
                const isWon = statusStr === 'Completed' || statusStr === 'Won';
                const isLost = statusStr === 'Failed' || statusStr === 'Lost';
                return (
                  <div key={tx.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isWon ? 'bg-emerald-50 text-emerald-600' : isLost ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isWon ? <CheckCircle2 className="w-5 h-5" /> : isLost ? <XCircle className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-snug">{tx.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">{tx.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-medium text-slate-500">{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black font-mono ${isWon ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider ${
                        isWon ? 'bg-emerald-50 text-emerald-700' : isLost ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Trophy className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-900 mb-1">No Settled Bets History</h3>
              <p className="text-sm text-slate-500 font-medium">Your settled bets will appear here once matches are concluded and graded.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
