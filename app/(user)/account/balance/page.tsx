"use client";

import { useTradingStore } from "@/lib/store";
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft, ShieldCheck, Gamepad2 } from "lucide-react";
import { useState } from "react";

export default function BalanceOverviewPage() {
  const { currentUser, balance, switchAccountType } = useTradingStore();
  const [isSwitching, setIsSwitching] = useState(false);

  const isDemo = currentUser?.accountType === 'demo';

  const handleSwitch = async () => {
    setIsSwitching(true);
    await switchAccountType(isDemo ? 'real' : 'demo');
    setIsSwitching(false);
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          Balance Overview
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isDemo ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isDemo ? 'Demo Mode' : 'Real Mode'}
          </span>
        </h1>
        <p className="text-slate-500 font-medium mt-2">Manage your funds, track balances, and switch active execution contexts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`col-span-1 lg:col-span-2 rounded-2xl p-8 border ${isDemo ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'} relative overflow-hidden hover:shadow-xl transition-all duration-300`}>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDemo ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                <Wallet className="w-5 h-5" />
              </div>
              <span className={`font-bold uppercase tracking-widest text-sm ${isDemo ? 'text-amber-700' : 'text-emerald-700'}`}>
                Active Balance
              </span>
            </div>
            
            <div>
              <span className={`text-sm font-bold uppercase tracking-widest mb-1 block ${isDemo ? 'text-amber-600/80' : 'text-emerald-600/80'}`}>Total Available</span>
              <div className={`text-6xl font-black tracking-tighter ${isDemo ? 'text-amber-900' : 'text-emerald-900'}`}>
                ${balance.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 opacity-10">
            <Wallet className="w-96 h-96" />
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex-1 flex flex-col justify-center">
            <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Context Switcher</h3>
            <p className="text-sm text-slate-600 font-medium mb-6 leading-relaxed">
              Switching your account context changes the global state across the entire platform. 
              {isDemo ? ' Switch to Real to play with actual funds.' : ' Switch to Demo to practice risk-free.'}
            </p>
            <button 
              onClick={handleSwitch}
              disabled={isSwitching}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isDemo 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              } disabled:opacity-50`}
            >
              {isSwitching ? 'Switching...' : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Switch to {isDemo ? 'Real' : 'Demo'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Cold Storage Security</h3>
            <p className="text-sm text-slate-500 font-medium">99% of your Real Mode funds are held offline in secure, multi-signature cold storage infrastructure.</p>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Arcade Instants</h3>
            <p className="text-sm text-slate-500 font-medium">Your balance seamlessly transfers across Real-Time Casino Nodes and Arcade components instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
