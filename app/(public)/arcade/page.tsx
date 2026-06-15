import { ARCADE_GAMES } from "@/lib/arcade-games";
import Link from "next/link";
import { Gamepad2, TrendingUp, Sparkles, Play } from "lucide-react";

export default function ArcadeHubPage() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 p-4 sm:p-6 lg:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <Gamepad2 className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest">Instant Play Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Arcade & Casual
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed font-medium mt-2">
            High-performance WebGL titles that render instantly in your browser. Switch seamlessly between Demo practice modes and Real money execution contexts without plugin downloads.
          </p>
        </div>

        {/* Featured / Filters row */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-6 overflow-x-auto pb-2">
            <button className="text-sm font-bold text-slate-900 relative whitespace-nowrap">
              All Games
              <span className="absolute -bottom-4.5 left-0 w-full h-0.5 bg-red-600 rounded-t-full" />
            </button>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
              Action & Arcade
            </button>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
              Puzzle & Logic
            </button>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
              Racing & Sports
            </button>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
              Strategy & Board
            </button>
          </div>
        </div>

        {/* Game Grid - Minimalist approach */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARCADE_GAMES.map((game) => (
            <Link href={`/arcade/game/${game.id}`} key={game.id} className="group block">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-video overflow-hidden bg-slate-50">
                  {/* Fallback image style since we use generic external images */}
                  <img 
                    src={game.thumbnail} 
                    alt={game.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300" />
                  
                  {game.isNew && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur border border-slate-200 text-slate-900 text-[9px] font-black uppercase tracking-widest rounded shadow-sm">
                      New
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl text-red-600 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 ml-1" />
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {game.provider}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 flex-1">
                    {game.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 rounded-full bg-red-100 border border-white flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-red-600" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-emerald-100 border border-white flex items-center justify-center">
                          <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Optimized</span>
                    </div>
                    
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest group-hover:underline underline-offset-2">
                      Play Now
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
