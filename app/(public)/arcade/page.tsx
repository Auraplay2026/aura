"use client";

import { useState, useMemo } from "react";
import { ARCADE_GAMES, ArcadeCategoryId } from "@/lib/arcade-games";
import Link from "next/link";
import { Gamepad2, TrendingUp, Sparkles, Play, Search, Flame, Trophy, Cpu, Gauge } from "lucide-react";

const CATEGORY_TABS: { id: string; label: string; filter?: ArcadeCategoryId }[] = [
  { id: "all", label: "All Arcade" },
  { id: "3d", label: "3D Next-Gen WebGL", filter: "3d" },
  { id: "racing", label: "Racing & Sports", filter: "racing" },
  { id: "action", label: "Action & Shooters", filter: "action" },
  { id: "puzzle", label: "Puzzle & Physics", filter: "puzzle" }
];

export default function ArcadeHubPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = useMemo(() => {
    return ARCADE_GAMES.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            game.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (selectedCategory === "all") return true;
      if (selectedCategory === "3d") return game.categories.includes("3d");
      if (selectedCategory === "racing") return game.categories.includes("racing") || game.categories.includes("sports");
      if (selectedCategory === "action") return game.categories.includes("action") || game.categories.includes("runner");
      if (selectedCategory === "puzzle") return game.categories.includes("puzzle") || game.categories.includes("physics");
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Hero Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
              <Cpu className="w-3.5 h-3.5" />
              <span>Native WebGL 60 FPS Engine Suite</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Next-Gen <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">Arcade & 3D</span> Arena
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Experience zero-latency, high-end 3D WebGL drifting, zero-G dogfighting, cyber parkour, and physics simulations running directly in your browser with zero plugins or external downloads.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>60 FPS Hardware Acceleration</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>100% Unique Game Mechanics</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Zero Broken Iframes Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-red-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <Link href={`/arcade/game/${game.id}`} key={game.id} className="group block">
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-red-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                
                {/* Thumbnail Container */}
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <img 
                    src={game.thumbnail} 
                    alt={game.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors duration-300" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {game.categories.includes("3d") && (
                      <span className="px-2 py-0.5 bg-cyan-500/90 backdrop-blur text-slate-950 text-[9px] font-black uppercase tracking-wider rounded shadow-sm">
                        3D WebGL
                      </span>
                    )}
                  </div>

                  {game.rating && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur text-yellow-400 text-[10px] font-black uppercase tracking-wider rounded border border-slate-700/80 flex items-center gap-1">
                      <span>★</span> {game.rating}
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/30 backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-2xl text-white transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-5 h-5 ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="mb-2">
                    <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {game.provider}
                    </p>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed flex-1 line-clamp-2">
                    {game.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Instant Load
                    </span>
                    
                    <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Play <Play className="w-2.5 h-2.5 fill-red-600" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No arcade games found</h3>
            <p className="text-xs text-slate-400 mt-1">Try switching categories or searching for a different title.</p>
          </div>
        )}

      </div>
    </div>
  );
}
