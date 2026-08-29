"use client";

import { useEffect } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ShieldCheck, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function AchievementToast() {
  const pathname = usePathname();
  const { latestAchievementUnlocked, clearLatestAchievement, currentUser } = useTradingStore();

  useEffect(() => {
    if (latestAchievementUnlocked) {
      const timer = setTimeout(() => {
        clearLatestAchievement();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [latestAchievementUnlocked, clearLatestAchievement]);

  if (currentUser?.role === 'admin' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <AnimatePresence>
      {latestAchievementUnlocked && (
        <motion.div
          drag="x"
          dragDirectionLock
          dragElastic={0.7}
          dragConstraints={{ left: -250, right: 250 }}
          onDragEnd={(event, info) => {
            if (Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 300) {
              clearLatestAchievement();
            }
          }}
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, x: 150, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="fixed top-16 sm:top-20 right-4 z-[88] w-[92%] max-w-sm bg-white/95 backdrop-blur-xl border border-yellow-500/40 rounded-2xl p-4 shadow-xl flex items-center gap-3 overflow-hidden group pointer-events-auto cursor-grab active:cursor-grabbing touch-pan-y select-none"
        >
          <button
            onClick={() => clearLatestAchievement()}
            aria-label="Dismiss achievement notification"
            className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Achievement Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xl shrink-0 shadow-sm relative">
            <span className="relative z-10">{latestAchievementUnlocked.icon || "🏆"}</span>
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-wider">
              <Award className="w-3 h-3" />
              Achievement Unlocked
            </div>
            <h4 className="text-slate-900 font-extrabold text-xs tracking-tight truncate mt-0.5">
              {latestAchievementUnlocked.title}
            </h4>
            <p className="text-slate-600 text-[11px] truncate mt-0.5">
              {latestAchievementUnlocked.description}
            </p>
          </div>

          {/* Rewards Badge */}
          <div className="shrink-0 bg-yellow-500/10 border border-yellow-500/30 rounded-xl py-1 px-2.5 flex flex-col items-center">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider">
              XP
            </span>
            <span className="text-slate-900 font-black text-xs">
              +{latestAchievementUnlocked.xpReward}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
