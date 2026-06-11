"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RacingEngineProps {
  gameId: string;
  isPlaying: boolean;
  onComplete: (won: boolean) => void;
}

export function RacingEngine({ gameId, isPlaying, onComplete }: RacingEngineProps) {
  const unlocked = true;

  // Determine game URL based on gameId
  let gameUrl = "https://slowroads.io/"; // Default: High-end 3D driving for generic racing
  
  if (gameId === "sports-2" || gameId.includes("nba")) {
    gameUrl = "https://www.retrogames.cc/embed/41793-nba-jam-tournament-edition-usa.html";
  } else if (gameId === "sports-1" || gameId.includes("fifa")) {
    gameUrl = "https://www.retrogames.cc/embed/40238-fifa-soccer-96-usa.html";
  } else if (gameId === "sports-3" || gameId.includes("tennis")) {
    gameUrl = "https://www.retrogames.cc/embed/41838-super-tennis-usa.html";
  } else if (gameId === "sports-4" || gameId.includes("nfl")) {
    gameUrl = "https://www.retrogames.cc/embed/40375-madden-nfl-94-usa.html";
  } else if (gameId === "racing-1" || gameId.includes("f1")) {
    gameUrl = "https://hexgl.bkcore.com/play/";
  } else if (gameId === "racing-3" || gameId.includes("derby")) {
    gameUrl = "https://www.retrogames.cc/embed/42011-super-mario-kart-usa.html";
  } else if (gameId === "racing-2" || gameId.includes("greyhound")) {
    // A retro arcade classic for generic retro racing
    gameUrl = "https://www.retrogames.cc/embed/40209-f-zero-usa.html";
  }

  return (
    <div className="w-full h-full min-h-[600px] md:min-h-[800px] bg-white rounded-3xl border border-slate-200 relative overflow-hidden shadow-[inset_0_0_150px_rgba(0,0,0,1)] group">
      
      {/* Interactive WebGL 3D Game Feed */}
      <iframe
        className="absolute inset-0 w-full h-full opacity-100"
        src={gameUrl}
        frameBorder="0"
        allow="autoplay; fullscreen; keyboard-map"
      ></iframe>
      
      {/* Active Session Overlay */}
      <AnimatePresence>
        {unlocked && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md border border-emerald-500/50 px-6 py-2 rounded-full pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
             <span className="text-emerald-500 font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
               Arcade Session Active
             </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
