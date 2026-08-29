"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTradingStore } from "@/lib/store";

const GAMES = ["Sweet Bonanza", "Crash", "Gates of Olympus", "Crazy Time", "Lightning Roulette", "Arsenal vs Liverpool", "CS:GO Major"];
const USERS = ["CryptoWhale", "Hidden**", "RahulK**", "Priya99", "VikramS", "DiamondHands", "LuckyStrike", "HighRoller99"];

export function GlobalAlerts() {
  const pathname = usePathname();
  const [currentAlert, setCurrentAlert] = useState<any>(null);
  const { currentUser } = useTradingStore();

  useEffect(() => {
    // If we are on admin route or admin user, do not run alerts logic
    if (!pathname || pathname.startsWith("/admin") || currentUser?.role === 'admin') {
      setCurrentAlert(null);
      return;
    }

    let active = true;
    const timeouts: NodeJS.Timeout[] = [];

    const triggerRandomAlert = () => {
      if (!active) return;
      // 10% chance for a MEGA JACKPOT (1000x+), otherwise normal win
      const isMega = Math.random() > 0.85;
      
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const user = USERS[Math.floor(Math.random() * USERS.length)];
      
      let amount, multi;
      if (isMega) {
        amount = Math.floor(Math.random() * 50000) + 10000;
        multi = Math.floor(Math.random() * 4000) + 1000;
      } else {
        amount = Math.floor(Math.random() * 5000) + 500;
        multi = Math.floor(Math.random() * 50) + 10;
      }
      
      const payout = amount * multi;

      setCurrentAlert({
        id: Date.now(),
        user,
        game,
        amount: payout,
        multi,
        isMega
      });

      // Clear alert after some time (longer for mega)
      const clearT = setTimeout(() => {
        if (active) setCurrentAlert(null);
      }, isMega ? 8000 : 5000);
      timeouts.push(clearT);
    };

    // Fire randomly every 15-30 seconds
    const scheduleNext = () => {
      if (!active) return;
      const delay = Math.random() * 15000 + 15000;
      const nextT = setTimeout(() => {
        triggerRandomAlert();
        scheduleNext();
      }, delay);
      timeouts.push(nextT);
    };
    
    // Initial fire after 10 seconds
    const initialTimeout = setTimeout(() => {
      triggerRandomAlert();
      scheduleNext();
    }, 10000);
    timeouts.push(initialTimeout);

    return () => {
      active = false;
      timeouts.forEach(t => clearTimeout(t));
      setCurrentAlert(null);
    };
  }, [pathname]);

  // Hide win/jackpot alerts on admin routes or match detail pages to prevent view obstruction
  if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/sportsbook/match") || currentUser?.role === 'admin') {
    return null;
  }

  return (
    <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-[92%] max-w-sm flex flex-col items-center select-none">
      <AnimatePresence mode="wait">
        {currentAlert && currentAlert.isMega && (
          <motion.div
            key={currentAlert.id}
            initial={{ y: -40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative bg-slate-900/95 backdrop-blur-xl border border-yellow-500/50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 shrink-0 shadow-sm">
              <Trophy className="w-5 h-5 fill-slate-950" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase">Mega Jackpot Hit</span>
              </div>
              <p className="text-white text-xs font-bold truncate">
                <span className="text-yellow-300 font-extrabold">{currentAlert.user}</span> won{" "}
                <span className="text-emerald-400 font-black font-mono">₹{currentAlert.amount.toLocaleString()}</span> on {currentAlert.game}
              </p>
            </div>
          </motion.div>
        )}

        {currentAlert && !currentAlert.isMega && (
          <motion.div
            key={currentAlert.id}
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg text-white"
          >
            <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 shrink-0">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold truncate text-slate-200">
              <span className="text-yellow-400 font-black">{currentAlert.user}</span> won{" "}
              <span className="text-emerald-400 font-black font-mono">₹{currentAlert.amount.toLocaleString()}</span> on {currentAlert.game}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
