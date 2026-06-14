"use client";

import { useTradingStore } from "@/lib/store";
import { Activity, Clock, Trophy, Ban, RefreshCw, Ticket } from "lucide-react";
import { useState } from "react";

export default function MyBetsPage() {
  const { positions } = useTradingStore();
  const [activeTab, setActiveTab] = useState<'open' | 'settled'>('open');

  const filteredPositions = positions.filter(p => {
    if (activeTab === 'open') return p.shares > 0;
    return false; // Settled positions logic requires historical parsing which we simulate
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            My Bets
          </h1>
          <p className="text-slate-500 font-medium mt-2">Track your active wagers, open exchange positions, and pending sports slips.</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('open')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
            activeTab === 'open' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Open Positions
          {activeTab === 'open' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('settled')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
            activeTab === 'settled' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Settled Bets
          {activeTab === 'settled' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPositions.length > 0 ? (
            filteredPositions.map((pos, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exchange Position</span>
                      <h3 className="font-black text-slate-900">{pos.marketTitle}</h3>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selection</span>
                    <span className="font-bold text-slate-900 uppercase">{pos.side}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Price</span>
                    <span className="font-bold text-slate-900 font-mono">{pos.buyPrice}%</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shares</span>
                    <span className="font-bold text-slate-900 font-mono">{pos.shares.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Stake</span>
                    <span className="font-black text-slate-900 font-mono text-lg">${pos.investment.toFixed(2)}</span>
                  </div>
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors">
                    Cash Out
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-900 mb-1">No Active Positions</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm">You don't have any open bets or exchange positions right now. Head over to the Sportsbook to get started.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settled' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Trophy className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-1">No Settled Bets History</h3>
            <p className="text-sm text-slate-500 font-medium">Your settled bets will appear here once matches are concluded and graded.</p>
          </div>
        </div>
      )}
    </div>
  );
}
