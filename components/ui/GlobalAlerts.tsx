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

  // Hide win/jackpot alerts on admin routes or for administrators to prevent view obstruction
  if (!pathname || pathname.startsWith("/admin") || currentUser?.role === 'admin') {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-[90%] max-w-[400px] flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        {currentAlert && currentAlert.isMega && (
          <motion.div
            key={currentAlert.id}
            initial={{ y: -100, opacity: 0, scale: 0.5, rotateX: 45 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1, 
              rotateX: 0,
              x: [0, -10, 10, -10, 10, -5, 5, 0] // Screen shake effect
            }}
            exit={{ y: -100, opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{ 
              duration: 0.8, 
              type: "spring", 
              bounce: 0.5,
              x: { duration: 0.4, delay: 0.2 } // Shake delay
            }}
            className="relative bg-gradient-to-b from-yellow-900/90 to-black/95 backdrop-blur-2xl border-2 border-yellow-500 p-6 rounded-3xl shadow-[0_0_100px_rgba(234,179,8,0.6),inset_0_0_30px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col items-center gap-2"
          >
            {/* Animated shine sweep */}
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
            
            <div className="flex items-center gap-3 text-yellow-600 font-black tracking-widest uppercase text-xs sm:text-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Mega Jackpot Triggered
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <div className="text-center mt-2 relative z-10">
              <p className="text-slate-700 text-sm sm:text-base font-bold mb-1">
                <span className="text-slate-900">{currentAlert.user}</span> just hit <span className="text-neon-purple font-black">{currentAlert.multi}x</span> on {currentAlert.game}!
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl sm:text-4xl text-neon-green font-black font-mono drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                  ₹{currentAlert.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {currentAlert && !currentAlert.isMega && (
          <motion.div
            key={currentAlert.id}
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.9 }}
            className="bg-white/90 backdrop-blur-xl border border-yellow-500/30 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_50px_rgba(234,179,8,0.4)]"
          >
            <div className="bg-yellow-500/20 p-2 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              <Trophy className="w-4 h-4 text-neon-yellow" />
            </div>
            <p className="text-slate-900 font-bold text-xs sm:text-sm tracking-wide">
              <span className="text-neon-yellow">{currentAlert.user}</span> won{" "}
              <span className="text-green-600 font-black tracking-widest font-mono">₹{currentAlert.amount.toLocaleString()}</span> on{" "}
              <span className="text-slate-700">{currentAlert.game}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
