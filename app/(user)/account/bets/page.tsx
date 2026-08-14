"use client";

import { useTradingStore } from "@/lib/store";
import { Activity, Clock, Trophy, Lock, RefreshCw, Ticket, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MyBetsPage() {
  const { positions, transactions, syncFromServer, currentUser } = useTradingStore();
  const [activeTab, setActiveTab] = useState<'locked' | 'settled' | 'all'>('locked');

  useEffect(() => {
    if (currentUser) {
      syncFromServer().catch(() => {});
    }
  }, [currentUser, syncFromServer]);

  const openPositions = positions.filter(p => p.shares > 0);
  
  const allSportsTransactions = transactions.filter(t => 
    t.type === 'trade' || 
    t.details?.toLowerCase().includes('placed') || 
    t.details?.toLowerCase().includes('bet') || 
    t.details?.toLowerCase().includes('settle') ||
    t.details?.toLowerCase().includes('locked')
  );

  const lockedBets = allSportsTransactions.filter(t => {
    const s = String(t.status || '').toLowerCase();
    return s === 'locked' || s === 'pending' || s === 'accepted';
  });

  const settledBets = allSportsTransactions.filter(t => {
    const s = String(t.status || '').toLowerCase();
    return s === 'completed' || s === 'won' || s === 'failed' || s === 'lost' || s === 'void';
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            My Bets & Positions
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Track locked exchange wagers and verified match settlement records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sportsbook"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            + Place New Bet
          </Link>
          <button 
            onClick={() => syncFromServer()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Policy Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 text-xs text-slate-600 shadow-sm">
        <Lock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-black text-slate-900 uppercase tracking-wide">
            Immutable Bet Freeze Protocol Active
          </span>
          <p className="text-slate-600 leading-relaxed font-medium">
            Once accepted by the market engine, every wager is permanently <span className="font-bold text-slate-900">Locked &amp; Isolated</span>. No edits, modifications, cancellations, or cashouts are permitted. Payouts and account adjustments are calculated automatically by the settlement engine upon official match completion.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('locked')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'locked' ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Locked Wagers ({openPositions.length || lockedBets.length})
          {activeTab === 'locked' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('settled')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'settled' ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Settled History ({settledBets.length})
          {activeTab === 'settled' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Locked & Active Wagers */}
      {activeTab === 'locked' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openPositions.length > 0 ? (
            openPositions.map((pos, i) => {
              const isLay = pos.side === 'no' || (pos.side as string) === 'lay';
              const cleanTitle = pos.marketTitle.replace('[LOCKED] ', '');
              const oddsVal = typeof pos.buyPrice === 'number' ? pos.buyPrice : parseFloat(pos.buyPrice) || 2.0;
              const potentialProfit = isLay ? pos.shares : Math.round(pos.investment * (oddsVal - 1) * 100) / 100;
              const totalReturn = isLay ? pos.investment + pos.shares : Math.round(pos.investment * oddsVal * 100) / 100;

              return (
                <div key={pos.id || i} className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Order #{pos.id ? pos.id.substring(0, 10) : `BET-${i + 1}`}
                          </span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            Accepted
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-sm mt-0.5 leading-snug">{cleanTitle}</h3>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3 text-amber-400" />
                      LOCKED
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-3 px-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Side</span>
                      <span className={`font-black text-xs uppercase mt-0.5 ${isLay ? 'text-pink-600' : 'text-emerald-700'}`}>
                        {isLay ? 'LAY' : 'BACK'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Locked Odds</span>
                      <span className="font-black text-slate-900 font-mono text-xs mt-0.5">{oddsVal.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Locked Stake</span>
                      <span className="font-black text-slate-900 font-mono text-xs mt-0.5">₹{pos.investment.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Potential Return</span>
                      <span className="font-black text-emerald-600 font-mono text-sm">₹{totalReturn.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Awaiting Match Settlement</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-900 mb-1">No Active Locked Wagers</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm">
                You do not have any open exchange wagers awaiting settlement. Head over to the Sportsbook to place a wager.
              </p>
              <Link
                href="/sportsbook"
                className="mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                Browse Sports Schedule
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Settled Bets History */}
      {activeTab === 'settled' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {settledBets.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {settledBets.map((tx, idx) => {
                const statusStr = String(tx.status || '').toLowerCase();
                const isWon = statusStr === 'completed' || statusStr === 'won';
                const isLost = statusStr === 'failed' || statusStr === 'lost';
                const isVoid = statusStr === 'void';

                return (
                  <div key={tx.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isWon ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                        isLost ? 'bg-rose-50 text-rose-600 border border-rose-200' : 
                        isVoid ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {isWon ? <CheckCircle2 className="w-5 h-5" /> : 
                         isLost ? <XCircle className="w-5 h-5" /> : 
                         isVoid ? <AlertCircle className="w-5 h-5" /> :
                         <Ticket className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-snug">{tx.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">{tx.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-medium text-slate-500">{new Date(tx.timestamp).toLocaleString()}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase">Settled by Match Engine</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black font-mono ${isWon ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider ${
                        isWon ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                        isLost ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                        isVoid ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {isWon ? 'Won ✓' : isLost ? 'Lost ✗' : isVoid ? 'Voided (Refunded)' : tx.status}
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
              <p className="text-sm text-slate-500 font-medium max-w-sm">
                Your settled bets and official match outcomes will appear here once events have officially concluded.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
