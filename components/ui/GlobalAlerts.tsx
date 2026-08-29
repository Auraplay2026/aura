"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTradingStore } from "@/lib/store";

const GAMES = ["Sweet Bonanza", "Crash", "Gates of Olympus", "Crazy Time", "Lightning Roulette", "Arsenal vs Liverpool", "CS:GO Major"];
const USERS = ["CryptoWhale", "Hidden**", "RahulK**", "Priya99", "VikramS", "DiamondHands", "LuckyStrike", "HighRoller99"];

export function GlobalAlerts() {
  const pathname = usePathname();
  const [currentAlert, setCurrentAlert] = useState<any>(null);
  const { currentUser } = useTradingStore();

  // Suppress in game rooms, betting cockpits, matches, and admin to prevent intercepting user bets
  const isBettingOrGameRoute = 
    !pathname || 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/casino/game") || 
    pathname.startsWith("/casino/crash") || 
    pathname.startsWith("/casino/live") || 
    pathname.startsWith("/casino/roulette") || 
    pathname.startsWith("/casino/blackjack") || 
    pathname.startsWith("/casino/poker") || 
    pathname.startsWith("/casino/slots") || 
    pathname.startsWith("/casino/originals") || 
    pathname.startsWith("/sportsbook/match") || 
    currentUser?.role === 'admin';

  useEffect(() => {
    if (isBettingOrGameRoute) {
      setCurrentAlert(null);
      return;
    }

    let active = true;
    const timeouts: NodeJS.Timeout[] = [];

    const triggerRandomAlert = () => {
      if (!active) return;
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

      const clearT = setTimeout(() => {
        if (active) setCurrentAlert(null);
      }, isMega ? 7000 : 4500);
      timeouts.push(clearT);
    };

    const scheduleNext = () => {
      if (!active) return;
      const delay = Math.random() * 20000 + 20000;
      const nextT = setTimeout(() => {
        triggerRandomAlert();
        scheduleNext();
      }, delay);
      timeouts.push(nextT);
    };
    
    const initialTimeout = setTimeout(() => {
      triggerRandomAlert();
      scheduleNext();
    }, 15000);
    timeouts.push(initialTimeout);

    return () => {
      active = false;
      timeouts.forEach(t => clearTimeout(t));
      setCurrentAlert(null);
    };
  }, [pathname, isBettingOrGameRoute]);

  if (isBettingOrGameRoute) {
    return null;
  }

  return (
    <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[80] pointer-events-none w-[94%] max-w-sm flex flex-col items-center select-none">
      <AnimatePresence mode="wait">
        {currentAlert && currentAlert.isMega && (
          <motion.div
            key={currentAlert.id}
            drag="x"
            dragDirectionLock
            dragElastic={0.6}
            dragConstraints={{ left: -180, right: 180 }}
            onDragEnd={(event, info) => {
              if (Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 300) {
                setCurrentAlert(null);
              }
            }}
            initial={{ y: -40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto cursor-grab active:cursor-grabbing touch-pan-y relative bg-slate-900/95 backdrop-blur-xl border border-yellow-500/50 pl-3.5 pr-8 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 overflow-hidden group"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentAlert(null);
              }}
              aria-label="Dismiss alert"
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 shrink-0 shadow-sm">
              <Trophy className="w-4 h-4 fill-slate-950" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase">Mega Jackpot</span>
              </div>
              <p className="text-white text-xs font-bold truncate">
                <span className="text-yellow-300 font-extrabold">{currentAlert.user}</span> won{" "}
                <span className="text-emerald-400 font-black font-mono">₹{currentAlert.amount.toLocaleString()}</span>
              </p>
            </div>
          </motion.div>
        )}

        {currentAlert && !currentAlert.isMega && (
          <motion.div
            key={currentAlert.id}
            drag="x"
            dragDirectionLock
            dragElastic={0.6}
            dragConstraints={{ left: -180, right: 180 }}
            onDragEnd={(event, info) => {
              if (Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 300) {
                setCurrentAlert(null);
              }
            }}
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto cursor-grab active:cursor-grabbing touch-pan-y relative bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 pl-3.5 pr-8 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg text-white group"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentAlert(null);
              }}
              aria-label="Dismiss alert"
              className="absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

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
