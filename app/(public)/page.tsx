"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Gamepad2, TrendingUp, ShieldCheck, Flame, Star, Activity } from "lucide-react";
import { getGamesByCategory } from "@/lib/games";
import { ARCADE_GAMES } from "@/lib/arcade-games";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";

export default function GlobalHomepage() {
  const featuredCasino = getGamesByCategory("slots").slice(0, 4);
  const featuredArcade = ARCADE_GAMES.slice(0, 4);
  const liveDealers = getGamesByCategory("live").slice(0, 4);

  return (
    <div className="flex flex-col gap-12 max-w-[1600px] mx-auto pb-20 w-full overflow-hidden">
      
      {/* 1. MASTER HERO SECTION (TOP 1% ENTERPRISE THEME) */}
      <section className="relative w-full rounded-3xl overflow-hidden min-h-[500px] flex items-center bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white z-10" />
          {/* Extremely subtle ambient glow */}
          <div className="absolute right-[10%] top-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-white to-transparent opacity-50 blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-20 w-full p-10 lg:p-20 flex flex-col items-start max-w-5xl mx-auto text-center lg:text-left lg:mx-0">
          <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 flex items-center gap-2 mb-8 mx-auto lg:mx-0 shadow-sm transition-all hover:bg-slate-100">
            <Zap className="w-3.5 h-3.5 text-slate-900" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700">Next-Gen iGaming Engine</span>
          </div>
          
          <h1 className="text-5xl lg:text-[80px] font-black text-slate-900 tracking-tighter leading-[1.05] mb-6">
            The Ultimate <br/>
            <span className="text-slate-400">
              Entertainment Hub
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-500 font-medium max-w-2xl mb-12 leading-relaxed mx-auto lg:mx-0">
            Experience sub-millisecond bet executions, live dealer streams, and instant-play WebGL arcade games all powered by a unified wallet architecture.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mx-auto lg:mx-0">
            <Link href="/sportsbook" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
              Explore Sportsbook
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/arcade" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md">
              <Gamepad2 className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              Play Arcade
            </Link>
          </div>

          <div className="mt-20 flex flex-wrap items-center justify-center lg:justify-start gap-10 opacity-80">
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">150+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Markets</span>
            </div>
            <div className="w-px h-12 bg-slate-200 hidden sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">&lt;50ms</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Execution Speed</span>
            </div>
            <div className="w-px h-12 bg-slate-200 hidden sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">0%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Transfer Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE SPORTS TICKER / MINI-EXCHANGE */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Sports Exchange</h2>
              <p className="text-sm font-medium text-slate-500">Real-time matching engine.</p>
            </div>
          </div>
          <Link href="/sportsbook" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
            View All Markets <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 1, sport: "Cricket", event: "IND vs AUS", score: "IND 210/4", odds1: 1.85, odds2: 2.10, live: true },
            { id: 2, sport: "Soccer", event: "Real Madrid vs Barcelona", score: "1 - 1", odds1: 2.40, odds2: 2.55, live: true },
            { id: 3, sport: "Tennis", event: "Alcaraz vs Sinner", score: "Set 3", odds1: 1.50, odds2: 3.10, live: true }
          ].map((match) => (
            <div key={match.id} className="bg-white border border-slate-200/60 p-6 rounded-3xl hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200/50">{match.sport}</span>
                {match.live && <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live</span>}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{match.event}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">{match.score}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Back 1</span>
                  <span className="text-sm font-black text-slate-900">{match.odds1.toFixed(2)}</span>
                </button>
                <button className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Back 2</span>
                  <span className="text-sm font-black text-slate-900">{match.odds2.toFixed(2)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PREMIUM CASINO FEATURED */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Premium Casino & Slots</h2>
              <p className="text-sm font-medium text-slate-500">Provably fair RNG and massive multipliers.</p>
            </div>
          </div>
          <Link href="/casino" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
            Enter Casino <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredCasino.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* 4. ARCADE HUB FEATURED */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Instant WebGL Arcade</h2>
              <p className="text-sm font-medium text-slate-500">Seamless, zero-download casual gaming.</p>
            </div>
          </div>
          <Link href="/arcade" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
            View All Games <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredArcade.map(game => (
            <Link key={game.id} href={`/arcade/game/${game.id}`} className="group block relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-4">
                <h3 className="font-black text-white truncate text-lg">{game.title}</h3>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest truncate">{game.provider}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. LIVE DEALERS & OFFERS GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Live Dealers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {liveDealers.map(game => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Latest Action</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-[260px] overflow-hidden relative shadow-sm">
             <LiveActionFeed />
             <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="w-full bg-blue-600 rounded-3xl p-12 text-center flex flex-col items-center justify-center relative overflow-hidden mt-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <ShieldCheck className="w-12 h-12 text-white mb-6" />
        <h2 className="text-4xl font-black tracking-tighter text-white mb-4">Ready to enter the top 1%?</h2>
        <p className="text-blue-100 font-medium max-w-lg mb-8">Join the fastest, most advanced iGaming platform in the world. Secure cold-storage funds and instant withdrawals.</p>
        
        <button className="px-10 py-4 bg-white text-blue-600 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-slate-50 transition-all shadow-xl">
          Register Now
        </button>
      </section>

    </div>
  );
}
