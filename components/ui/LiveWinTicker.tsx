"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

export function LiveWinTicker() {
  const [wins, setWins] = useState<any[]>([]);

  useEffect(() => {
    const users = ["CryptoWhale", "AuraPlayer", "Lucky777", "NeonRacer", "GoldHunter", "SlotsPro", "VIP_Aura", "SpinKing", "VipPass"];
    const games = ["Neon Surfer Slot", "Roulette Pro", "Blackjack VIP", "Crash Multiplier", "Hilo Extreme", "Mines Gold"];
    
    const initialWins = Array.from({ length: 15 }, (_, i) => {
      const user = users[Math.floor(Math.random() * users.length)];
      const game = games[Math.floor(Math.random() * games.length)];
      const amount = Math.floor(Math.random() * 85000) + 1500;
      return {
        id: `TICK-${i}-${Math.random().toString(36).substring(2, 5)}`,
        user,
        game,
        amount
      };
    });
    setWins(initialWins);

    const interval = setInterval(() => {
      setWins(prev => {
        const next = [...prev];
        const replaceIdx = Math.floor(Math.random() * next.length);
        const user = users[Math.floor(Math.random() * users.length)];
        const game = games[Math.floor(Math.random() * games.length)];
        const amount = Math.floor(Math.random() * 95000) + 2000;
        next[replaceIdx] = {
          id: `TICK-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          user,
          game,
          amount
        };
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white border-t border-b border-slate-900 overflow-hidden py-2.5 shrink-0 select-none">
      <div className="flex w-max animate-shimmer-ticker gap-8 px-4 items-center">
        {/* Double list to create seamless looping */}
        {[...wins, ...wins].map((win, idx) => (
          <div key={`${win.id}-${idx}`} className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-slate-400">
            <Coins className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-slate-900">{win.user}</span>
            <span>won</span>
            <span className="text-emerald-400 font-extrabold font-mono">₹{win.amount.toLocaleString()}</span>
            <span>on</span>
            <span className="text-purple-400 font-extrabold">{win.game}</span>
            <span className="text-slate-700 mx-2">|</span>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes ticker-slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-shimmer-ticker {
          animation: ticker-slide 35s linear infinite;
        }
        .animate-shimmer-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
