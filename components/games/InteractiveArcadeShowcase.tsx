"use client";

import { motion } from "framer-motion";
import { Play, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GAMES } from "@/lib/games";

export function InteractiveArcadeShowcase() {
  // Select top 3 games for the Hero Bento Box
  const featuredGames = [
    GAMES.find(g => g.id === "action-1") || GAMES[0], // Hole.io (Massive)
    GAMES.find(g => g.id === "fps-3") || GAMES[1],    // 1v1.LOL
    GAMES.find(g => g.id === "driving-1") || GAMES[2] // Slow Roads
  ];

  const [mainGame, sideGame1, sideGame2] = featuredGames;

  return (
    <div className="w-full h-auto md:h-[500px] lg:h-[600px] grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
      
      {/* MAIN FEATURED GAME (Takes up 2/3 of the width on desktop) */}
      <Link href={`/casino/game/${mainGame.id}`} className="group relative col-span-1 md:col-span-2 rounded-3xl overflow-hidden bg-slate-900 isolation-auto border border-white/10 transition-all duration-700 hover:shadow-[0_0_80px_rgba(255,255,255,0.15)] block h-[400px] md:h-full">
        
        {/* Cinematic Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${mainGame.image})` }}
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-black/40 to-transparent opacity-90 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent opacity-80" />
        
        {/* Hover State Overlay */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 border-2 border-white/10 rounded-3xl scale-[0.98] transition-transform duration-500 group-hover:scale-100" />
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out delay-75 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <Play className="w-8 h-8 text-white ml-1 fill-white" />
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-2/3 z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest rounded-lg mb-4 shadow-lg">
            🔥 Featured
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-3 drop-shadow-xl">
            {mainGame.title}
          </h2>
          <p className="text-slate-300 text-sm md:text-base font-medium line-clamp-2 max-w-md drop-shadow-md">
            Jump into the most popular game on the platform. Play instantly, no downloads required. Powered by {mainGame.provider}.
          </p>
        </div>
      </Link>

      {/* SIDE COLUMN (2 smaller bento boxes) */}
      <div className="col-span-1 grid grid-rows-2 gap-4 md:gap-6 h-[500px] md:h-full">
        
        {/* SIDE GAME 1 */}
        <Link href={`/casino/game/${sideGame1.id}`} className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] block h-full">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${sideGame1.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent opacity-90" />
          
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
              <Play className="w-5 h-5 text-white ml-1 fill-white" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-5 z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">{sideGame1.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Trending Now</span>
            </div>
          </div>
        </Link>

        {/* SIDE GAME 2 */}
        <Link href={`/casino/game/${sideGame2.id}`} className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] block h-full">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${sideGame2.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent opacity-90" />
          
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
              <Play className="w-5 h-5 text-white ml-1 fill-white" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-5 z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">{sideGame2.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Live Players</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
