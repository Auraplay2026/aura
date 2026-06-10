"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdventureEngineProps {
  gameId: string;
  isPlaying: boolean;
  isTurbo: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function AdventureEngine({ gameId, isPlaying, onComplete }: AdventureEngineProps) {
  const unlocked = true;

  // Determine game URL based on gameId
  let gameUrl = "https://krunker.io/"; // Default: Krunker FPS Action
  
  if (gameId === "adventure-1" || gameId.includes("gonzo")) {
    // Tomb Raider classic for adventure
    gameUrl = "https://xproger.info/projects/OpenLara/";
  } else if (gameId === "adventure-4" || gameId.includes("ruins")) {
    // Doom
    gameUrl = "https://silentspacemarine.com/";
  } else if (gameId === "adventure-5" || gameId.includes("viking")) {
    // Minecraft Classic
    gameUrl = "https://classic.minecraft.net/";
  } else if (gameId === "adventure-2" || gameId.includes("temple")) {
    // Zelda
    gameUrl = "https://www.retrogames.cc/embed/41551-the-legend-of-zelda-a-link-to-the-past-usa.html";
  } else if (gameId === "adventure-3" || gameId.includes("book")) {
    // Metroid
    gameUrl = "https://www.retrogames.cc/embed/41795-super-metroid-usa.html";
  }

  return (
    <div className="w-full h-full min-h-[600px] md:min-h-[800px] bg-black rounded-3xl border border-slate-800 relative overflow-hidden shadow-[inset_0_0_150px_rgba(0,0,0,1)] group">
      
      {/* Interactive WebGL 3D Game Feed */}
      <iframe
        className="absolute inset-0 w-full h-full opacity-100"
        src={gameUrl}
        frameBorder="0"
        allow="autoplay; fullscreen; pointer-lock"
      ></iframe>
      
      {/* Active Session Overlay */}
      <AnimatePresence>
        {unlocked && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md border border-yellow-500/50 px-6 py-2 rounded-full pointer-events-none shadow-[0_0_20px_rgba(234,179,8,0.3)]"
          >
             <span className="text-yellow-500 font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-2">
               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
               Arcade Session Active
             </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
