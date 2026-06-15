"use client";

import { useEffect } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ShieldCheck } from "lucide-react";

export function AchievementToast() {
  const { latestAchievementUnlocked, clearLatestAchievement } = useTradingStore();

  useEffect(() => {
    if (latestAchievementUnlocked) {
      const timer = setTimeout(() => {
        clearLatestAchievement();
      }, 4000); // Dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [latestAchievementUnlocked, clearLatestAchievement]);

  return (
    <AnimatePresence>
      {latestAchievementUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] w-[90%] max-w-md bg-slate-900/90 backdrop-blur-xl border border-yellow-500/40 rounded-3xl p-5 shadow-[0_20px_50px_rgba(234,179,8,0.25)] flex items-center gap-4 overflow-hidden group pointer-events-auto"
        >
          {/* Gold Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

          {/* Achievement Icon Badge */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.4)] relative">
            <div className="absolute inset-0 rounded-full border border-yellow-300/30 animate-pulse-slow" />
            <span className="relative z-10">{latestAchievementUnlocked.icon || "🏆"}</span>
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-yellow-400 text-[11px] font-black uppercase tracking-widest">
              <Award className="w-3.5 h-3.5" />
              Achievement Unlocked
            </div>
            <h4 className="text-white font-extrabold text-base tracking-tight truncate mt-0.5">
              {latestAchievementUnlocked.title}
            </h4>
            <p className="text-slate-300 text-xs truncate mt-0.5">
              {latestAchievementUnlocked.description}
            </p>
          </div>

          {/* Rewards Badge */}
          <div className="shrink-0 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl py-1.5 px-3 flex flex-col items-center">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">
              Rewards
            </span>
            <span className="text-white font-extrabold text-xs mt-0.5">
              +{latestAchievementUnlocked.xpReward} XP
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
