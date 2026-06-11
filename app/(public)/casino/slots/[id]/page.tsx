"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Wallet } from "lucide-react";
import { ExternalGameWrapper } from "@/components/games/ExternalGameWrapper";
import { useTradingStore } from "@/lib/store";

export default function ExternalSlotPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const { balance, playCasino } = useTradingStore();
  
  // Hydration safety check
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  const safeBalance = isClient && typeof balance === 'number' ? balance : 100000;

  // Handlers bridging the ExternalGameWrapper to our local state
  const handlePlaceBet = (amount: number) => {
    if (balance >= amount) {
      playCasino(amount, 0, "Slot " + params.id);
      return { success: true, newBalance: balance - amount };
    } else {
      console.warn(`[Platform] Bet of ₹${amount} rejected. Insufficient funds.`);
      return { success: false, newBalance: balance, error: "INSUFFICIENT_FUNDS" };
    }
  };

  const handleSettleWin = (multiplier: number, payoutAmount: number) => {
    playCasino(0, payoutAmount, "Slot " + params.id);
    return { success: true, newBalance: balance + payoutAmount };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Platform Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        
        {/* Back Button */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium tracking-wide uppercase text-sm">Back to Lobby</span>
        </button>

        {/* Real-time Wallet */}
        <div className="flex items-center gap-3 bg-emerald-100 border border-emerald-300 px-4 py-1.5 rounded-full">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest leading-none">Wallet</span>
            <span className="font-mono font-bold text-slate-900 leading-none mt-1">₹{safeBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

      </header>

      {/* External Game Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-center justify-center relative">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-100 blur-[120px] pointer-events-none rounded-full" />

        <div className="w-full max-w-6xl h-full relative z-10">
          <ExternalGameWrapper
            gameUrl="https://example.com/dummy-game" // Replace with real provider URL
            gameId={params.id}
            providerName="EvolutionGaming"
            currentBalance={safeBalance}
            onPlaceBet={handlePlaceBet}
            onSettleWin={handleSettleWin}
            onError={(type, msg) => console.error(type, msg)}
          />
        </div>
        
      </main>
      
    </div>
  );
}
