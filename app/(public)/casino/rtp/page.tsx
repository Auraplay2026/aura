"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Flame, Snowflake, Activity } from "lucide-react";

const RTP_GAMES = [
  { id: 1, title: "Gates of Olympus", provider: "Pragmatic Play", rtp: 112.4, status: "hot", image: "/games/pragmatic_vs20olympgold-tPIoAOc1Q.jpeg" },
  { id: 2, title: "Sweet Bonanza", provider: "Pragmatic Play", rtp: 108.7, status: "hot", image: "/games/pragmatic_vs20swbon2500-bKETWU2kP.jpeg" },
  { id: 3, title: "Wanted Dead", provider: "Hacksaw", rtp: 105.2, status: "hot", image: "/games/hacksaw_2296-XJEzD8pTx.jpeg" },
  { id: 4, title: "Crazy Time", provider: "Evolution", rtp: 96.0, status: "normal", image: "/games/live_cover_crazy.png" },
  { id: 5, title: "Limbo", provider: "Originals", rtp: 88.5, status: "cold", image: "/games/housegames_limbo-ukEog2zpr.jpeg" },
  { id: 6, title: "Lightning Roulette", provider: "Evolution", rtp: 82.1, status: "cold", image: "/games/evo_xxxtreme-lightning-roulette-s2M5fQi64.jpeg" },
];

export default function LiveRTPPage() {
  return (
    <div className="flex min-h-full w-full max-w-[1400px] mx-auto text-slate-800 p-4 sm:p-6 lg:p-8 flex-col space-y-8">
      
      {/* Header */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Activity className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-4 tracking-tight mb-2">
              <span className="w-2 h-10 bg-neon-yellow rounded-full shadow-[0_0_15px_rgba(234,179,8,0.6)]"></span>
              Live RTP
            </h1>
            <p className="text-slate-600 max-w-xl text-lg">Real-time Return To Player statistics based on millions of spins across the network in the last 24 hours.</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RTP_GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-slate-50/40 border rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group cursor-pointer transition-all duration-300 ${
              game.status === 'hot' ? 'border-orange-500/30 hover:border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.05)] hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]' :
              game.status === 'cold' ? 'border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.05)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]' :
              'border-slate-200/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{game.title}</h3>
                <p className="text-sm text-slate-500 font-medium">{game.provider}</p>
              </div>
            </div>

            <div className="flex items-end justify-between mb-4">
              <div className="flex items-center gap-2">
                {game.status === 'hot' && <Flame className="w-5 h-5 text-orange-500" />}
                {game.status === 'cold' && <Snowflake className="w-5 h-5 text-cyan-500" />}
                {game.status === 'normal' && <Activity className="w-5 h-5 text-slate-500" />}
                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Live RTP</span>
              </div>
              <div className={`text-4xl font-black tracking-tighter ${
                game.status === 'hot' ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]' :
                game.status === 'cold' ? 'text-cyan-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]' :
                'text-slate-900'
              }`}>
                {game.rtp}%
              </div>
            </div>

            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(game.rtp, 100)}%` }}
                className={`h-full ${
                  game.status === 'hot' ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                  game.status === 'cold' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' :
                  'bg-slate-100'
                }`}
              />
            </div>
            
            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button className={`px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 ${
                game.status === 'hot' ? 'bg-orange-500 text-slate-950' :
                game.status === 'cold' ? 'bg-cyan-500 text-slate-950' :
                'bg-white text-slate-950'
              }`}>
                Play Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
