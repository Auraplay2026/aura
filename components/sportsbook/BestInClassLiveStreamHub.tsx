"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Tv, Radio, Activity, Zap, Volume2, VolumeX, Maximize2, 
  ExternalLink, Trophy, Shield, RefreshCw, X, SlidersHorizontal, Sparkles
} from "lucide-react";
import { LiveStreamPlayer } from "./LiveStreamPlayer";
import { Virtual3DPitchRadar } from "./Virtual3DPitchRadar";
import { cn } from "@/lib/utils";

interface BestInClassLiveStreamHubProps {
  matchId: string;
  sportType?: "cricket" | "football" | "tennis";
  matchTitle?: string;
  team1Name?: string;
  team2Name?: string;
  team1Score?: string;
  team2Score?: string;
  currentOver?: string;
  matchStatus?: string;
  customStreamUrl?: string;
  onClose?: () => void;
}

export function BestInClassLiveStreamHub({
  matchId,
  sportType = "cricket",
  matchTitle = "India vs Australia • 2nd T20I",
  team1Name = "India",
  team2Name = "Australia",
  team1Score = "184/3",
  team2Score = "179/7",
  currentOver = "18.4",
  matchStatus = "India need 12 runs in 8 balls",
  customStreamUrl,
  onClose
}: BestInClassLiveStreamHubProps) {
  const [broadcastMode, setBroadcastMode] = useState<"video" | "radar" | "split">("video");

  return (
    <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none">
      {/* ═══ MASTER BROADCAST BAR ═══ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-600/20 border border-red-500/40 text-red-400 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>REAL LIVE BROADCAST</span>
          </div>

          <h3 className="text-xs sm:text-sm font-black text-white truncate">
            {matchTitle}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            100% Free Live Stream Active
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ STREAM VIEWPORT AREA ═══ */}
      <div className="w-full relative bg-slate-950">
        <AnimatePresence mode="wait">
          {broadcastMode === "radar" ? (
            <motion.div
              key="radar"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Virtual3DPitchRadar
                sportType={sportType}
                team1Name={team1Name}
                team2Name={team2Name}
                team1Score={team1Score}
                team2Score={team2Score}
                currentOver={currentOver}
                matchStatus={matchStatus}
              />
            </motion.div>
          ) : (
            <motion.div
              key="video"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <LiveStreamPlayer
                matchId={matchId}
                sportType={sportType}
                matchTitle={matchTitle}
                customStreamUrl={customStreamUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MATCH STATUS TICKER ═══ */}
      <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-extrabold font-mono">0.1s Zero-Lag Telemetry</span>
          <span>•</span>
          <span className="text-slate-200">{matchStatus}</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[10px]">
          <span>Format: T20 International</span>
          <span>•</span>
          <span>Venue: Melbourne Cricket Ground</span>
        </div>
      </div>
    </div>
  );
}