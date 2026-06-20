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
      <Link href={`/casino/game/${mainGame.id}`} className="group relative col-span-1 md:col-span-2 rounded-3xl overflow-hidden bg-white isolation-auto border border-slate-200 transition-all duration-700 hover:shadow-lg block h-[400px] md:h-full">
        
        {/* Cinematic Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${mainGame.image})` }}
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent opacity-90 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent opacity-90" />
        
        {/* Hover State Overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 border-2 border-white/40 rounded-3xl scale-[0.98] transition-transform duration-500 group-hover:scale-100" />
          <div className="w-20 h-20 rounded-full bg-blue-600/90 border border-blue-400 flex items-center justify-center backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out delay-75 shadow-xl">
            <Play className="w-8 h-8 text-slate-900 ml-1 fill-white" />
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-2/3 z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-md border border-slate-200 text-blue-600 text-xs font-black uppercase tracking-widest rounded-lg mb-4 shadow-sm">
            🔥 Featured
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 drop-shadow-sm">
            {mainGame.title}
          </h2>
          <p className="text-slate-600 text-sm md:text-base font-medium line-clamp-2 max-w-md">
            Jump into the most popular game on the platform. Play instantly, no downloads required. Powered by {mainGame.provider}.
          </p>
        </div>
      </Link>

      {/* SIDE COLUMN (2 smaller bento boxes) */}
      <div className="col-span-1 grid grid-rows-2 gap-4 md:gap-6 h-[500px] md:h-full">
        
        {/* SIDE GAME 1 */}
        <Link href={`/casino/game/${sideGame1.id}`} className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200 transition-all duration-500 hover:shadow-md block h-full">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${sideGame1.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent opacity-90" />
          
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-blue-600/90 border border-blue-400 flex items-center justify-center backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 shadow-lg">
              <Play className="w-5 h-5 text-slate-900 ml-1 fill-white" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-5 z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{sideGame1.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Trending Now</span>
            </div>
          </div>
        </Link>

        {/* SIDE GAME 2 */}
        <Link href={`/casino/game/${sideGame2.id}`} className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200 transition-all duration-500 hover:shadow-md block h-full">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${sideGame2.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent opacity-90" />
          
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-blue-600/90 border border-blue-400 flex items-center justify-center backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 shadow-lg">
              <Play className="w-5 h-5 text-slate-900 ml-1 fill-white" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-5 z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{sideGame2.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">Live Players</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
