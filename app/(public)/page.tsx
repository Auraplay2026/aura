import React from "next";
import { InteractiveArcadeShowcase } from "@/components/games/InteractiveArcadeShowcase";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";
import { TickingVolume } from "@/components/casino/TickingVolume";
import { ChevronRight, Crosshair, Flag, Map, Trophy, Smile, Gamepad2, Zap, Star, CircleDot } from "lucide-react";
import { UltraHubTabs } from "@/components/casino/UltraHubTabs";
import Link from "next/link";
import { getGamesByCategory } from "@/lib/games";

const CLOUD_CATEGORIES = [
  { id: "aaa", title: "AAA Cloud Rentals", icon: <Trophy className="w-5 h-5 text-amber-500" />, games: getGamesByCategory("aaa") },
  { id: "action", title: "RPG & Action Adventures", icon: <Map className="w-5 h-5 text-blue-400" />, games: getGamesByCategory("action") }
];

const CASINO_CATEGORIES = [
  { id: "slots", title: "Premium Slots & Drops", icon: <Gamepad2 className="w-5 h-5 text-yellow-500" />, games: getGamesByCategory("slots") },
  { id: "originals", title: "Aura Originals & Crash", icon: <Crosshair className="w-5 h-5 text-red-500" />, games: getGamesByCategory("originals") },
  { id: "live", title: "Live Dealer Shows", icon: <Zap className="w-5 h-5 text-pink-400" />, games: getGamesByCategory("live") },
  { id: "roulette", title: "Roulette Tables", icon: <CircleDot className="w-5 h-5 text-emerald-400" />, games: getGamesByCategory("roulette") },
  { id: "blackjack", title: "Blackjack VIP", icon: <Star className="w-5 h-5 text-cyan-400" />, games: getGamesByCategory("blackjack") },
  { id: "poker", title: "Poker & Card Games", icon: <Star className="w-5 h-5 text-orange-400" />, games: getGamesByCategory("poker") },
];

const SECONDARY_CATEGORIES = [
  { id: "fps", title: "FPS & Shooters", icon: <Crosshair className="w-4 h-4 text-red-400" />, games: getGamesByCategory("fps") },
  { id: "driving", title: "Racing & Simulators", icon: <Flag className="w-4 h-4 text-neon-green" />, games: getGamesByCategory("driving") },
  { id: "puzzle", title: "Strategy & Coop", icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />, games: getGamesByCategory("puzzle") },
  { id: "live", title: "Live Dealers", icon: <Smile className="w-4 h-4 text-pink-400" />, games: getGamesByCategory("live") }
];

export default function Home() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-12 bg-[#020202]">
      
      {/* Cinematic Hero Bento Box */}
      <section className="pt-4">
        <InteractiveArcadeShowcase />
      </section>

      {/* Ticking Volume / Social Proof */}
      <TickingVolume />

      {/* Cloud Gaming Station */}
      <div className="space-y-12">
        <div className="border-b border-white/5 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-cyan-400 uppercase tracking-widest">⚡ Cloud Renting Station</h2>
        </div>
        {CLOUD_CATEGORIES.map((cat) => (
          <section key={cat.title} className="space-y-5 relative">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                {cat.icon}
                {cat.title}
              </h2>
              <Link href={`/casino/${cat.id}`} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 group bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full border border-white/5 backdrop-blur-md">
                View All 
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative group">
              <div className="flex overflow-x-auto gap-4 md:gap-6 custom-scrollbar pb-6 pt-2 px-2 scroll-smooth snap-x">
                {cat.games.map((game) => (
                  <div key={game.id} className="min-w-[180px] md:min-w-[240px] lg:min-w-[280px] snap-start shrink-0">
                    <GameCard {...game} />
                  </div>
                ))}
              </div>
              
              {/* Fade masks for elegant scrolling edges */}
              <div className="absolute top-0 bottom-6 right-0 w-24 bg-gradient-to-l from-[#020202] to-transparent pointer-events-none" />
              <div className="absolute top-0 bottom-6 left-0 w-8 bg-gradient-to-r from-[#020202] to-transparent pointer-events-none" />
            </div>
          </section>
        ))}
      </div>

      {/* Casino & Betting Vault */}
      <div className="space-y-12 pt-6">
        <div className="border-b border-white/5 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-yellow-500 uppercase tracking-widest">🎰 Casino & Betting Vault</h2>
        </div>
        {CASINO_CATEGORIES.map((cat) => (
          cat.games.length > 0 && (
            <section key={cat.title} className="space-y-5 relative">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                  {cat.icon}
                  {cat.title}
                </h2>
                <Link href={`/casino/${cat.id}`} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 group bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full border border-white/5 backdrop-blur-md">
                  View All 
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Horizontal Scroll Container */}
              <div className="relative group">
                <div className="flex overflow-x-auto gap-4 md:gap-6 custom-scrollbar pb-6 pt-2 px-2 scroll-smooth snap-x">
                  {cat.games.map((game) => (
                    <div key={game.id} className="min-w-[180px] md:min-w-[240px] lg:min-w-[280px] snap-start shrink-0">
                      <GameCard {...game} />
                    </div>
                  ))}
                </div>
                
                {/* Fade masks for elegant scrolling edges */}
                <div className="absolute top-0 bottom-6 right-0 w-24 bg-gradient-to-l from-[#020202] to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-6 left-0 w-8 bg-gradient-to-r from-[#020202] to-transparent pointer-events-none" />
              </div>
            </section>
          )
        ))}
      </div>

      {/* The Ultra Hub (Clean Tabbed Layout for Secondary Categories) */}
      <section className="bg-[#050505] rounded-3xl border border-white/5 p-6 md:p-10 shadow-2xl">
        <UltraHubTabs categories={SECONDARY_CATEGORIES} />
      </section>

      {/* Live Action Feed */}
      <section className="pt-10 pb-16">
        <div className="flex flex-col space-y-6">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-wide px-2">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-[#020202]"></span>
            </span>
            Live Hub Activity
          </h2>
          <div className="bg-[#050505] rounded-3xl p-6 border border-white/5 shadow-2xl backdrop-blur-xl">
            <LiveActionFeed />
          </div>
        </div>
      </section>
      
    </div>
  );
}
