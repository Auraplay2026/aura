"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Gamepad2, TrendingUp, ShieldCheck, Flame, Star, Activity, Crown, Percent, Gift } from "lucide-react";
import { getGamesByCategory } from "@/lib/games";
import { ARCADE_GAMES } from "@/lib/arcade-games";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";

export default function GlobalHomepage() {
  const featuredCasino = getGamesByCategory("slots").slice(0, 8);
  const featuredArcade = ARCADE_GAMES.slice(0, 4);
  const originals = getGamesByCategory("originals").slice(0, 4);
  const liveDealers = getGamesByCategory("live").slice(0, 4);

  return (
    <div className="flex flex-col gap-16 max-w-[1600px] mx-auto pb-20 w-full overflow-hidden">
      
      {/* 1. MASTER HERO SECTION (TOP 1% ENTERPRISE THEME) */}
      <section className="relative w-full rounded-[2.5rem] overflow-hidden min-h-[550px] flex items-center bg-white border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] mt-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white z-10" />
          
          {/* Animated Ambient Glows */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-[10%] -top-[20%] w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-[100px] rounded-full pointer-events-none z-10" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -left-[10%] -bottom-[20%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-400/20 to-cyan-400/20 blur-[100px] rounded-full pointer-events-none z-10" 
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 z-10 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        <div className="relative z-20 w-full p-10 lg:p-20 flex flex-col items-center lg:items-start max-w-6xl mx-auto text-center lg:text-left">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center gap-2 mb-8"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
              <Zap className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Next-Gen iGaming Engine</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-[85px] font-black text-slate-900 tracking-tighter leading-[1.05] mb-6"
          >
            The Ultimate <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600">
              Entertainment Hub
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-slate-500 font-medium max-w-2xl mb-10 leading-relaxed"
          >
            Experience sub-millisecond bet executions, live dealer streams, and instant-play WebGL arcade games all powered by a unified wallet architecture.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/sportsbook" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
              Explore Sportsbook
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/casino" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md">
              <Gamepad2 className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              Play Casino
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}
            className="mt-16 flex flex-wrap items-center justify-center lg:justify-start gap-10 lg:gap-16"
          >
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-center gap-1">150<span className="text-blue-500">+</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Markets</span>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-center gap-1">&lt;50<span className="text-purple-500">ms</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Execution Speed</span>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-center gap-1">0<span className="text-emerald-500">%</span></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Transfer Fees</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. EXCLUSIVE OFFERS & PROMOTIONS (NEW) */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100">
              <Gift className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Promotions</h2>
              <p className="text-sm font-medium text-slate-500">Claim your exclusive rewards and bonuses.</p>
            </div>
          </div>
          <Link href="/promotions" className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden rounded-3xl p-8 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors" />
            <div className="relative z-10">
              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-4 inline-block shadow-sm">Welcome</span>
              <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">100% Deposit<br/>Match Bonus</h3>
              <p className="text-sm font-medium text-slate-600 mb-6 max-w-[200px]">Double your first deposit up to ₹50,000 instantly.</p>
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 transition-colors">Claim Now <ArrowRight className="w-4 h-4" /></span>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl p-8 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors" />
            <div className="relative z-10">
              <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-4 inline-block shadow-sm">Daily</span>
              <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">20% Unlimited<br/>Cashback</h3>
              <p className="text-sm font-medium text-slate-600 mb-6 max-w-[200px]">Get daily cashback on all your casino losses automatically.</p>
              <span className="text-sm font-bold text-purple-600 group-hover:text-purple-700 flex items-center gap-1 transition-colors">Learn More <ArrowRight className="w-4 h-4" /></span>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl p-8 border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50/50 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-colors" />
            <div className="relative z-10">
              <span className="px-3 py-1 bg-yellow-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-md mb-4 inline-block shadow-sm">VIP Club</span>
              <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Unlock Elite<br/>Rewards</h3>
              <p className="text-sm font-medium text-slate-600 mb-6 max-w-[200px]">Level up to earn luxury prizes and dedicated managers.</p>
              <span className="text-sm font-bold text-yellow-600 group-hover:text-yellow-700 flex items-center gap-1 transition-colors">Join VIP <ArrowRight className="w-4 h-4" /></span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AURA ORIGINALS (NEW) */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Gamepad2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">AuraPlay Originals</h2>
              <p className="text-sm font-medium text-slate-500">Provably fair, exclusively built minigames.</p>
            </div>
          </div>
          <Link href="/casino/originals" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {originals.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* 4. LIVE SPORTS TICKER / MINI-EXCHANGE */}
      <section className="w-full bg-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Dark Mode Background Vibe for Sports */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop')] opacity-[0.03] mix-blend-screen bg-cover bg-center pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shadow-inner">
              <Activity className="w-6 h-6 text-red-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Live Sports Exchange</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Real-time matching engine with zero latency.</p>
            </div>
          </div>
          <Link href="/sportsbook" className="hidden md:flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-colors backdrop-blur-sm border border-white/5">
            Open Trading Terminal <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {[
            { id: 1, sport: "Cricket", event: "IND vs AUS", score: "IND 210/4", odds1: 1.85, odds2: 2.10, live: true },
            { id: 2, sport: "Soccer", event: "Real Madrid vs Barcelona", score: "1 - 1", odds1: 2.40, odds2: 2.55, live: true },
            { id: 3, sport: "Tennis", event: "Alcaraz vs Sinner", score: "Set 3", odds1: 1.50, odds2: 3.10, live: true }
          ].map((match) => (
            <div key={match.id} className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 group cursor-pointer shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50">{match.sport}</span>
                {match.live && <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Live</span>}
              </div>
              <h3 className="text-lg font-black text-white mb-1 tracking-wide">{match.event}</h3>
              <p className="text-sm font-bold text-slate-400 mb-6 font-mono bg-slate-900/50 px-3 py-1 rounded inline-block">{match.score}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20 group-hover:border-blue-500/40">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Back (Yes)</span>
                  <span className="text-base font-black text-white font-mono mt-0.5">{match.odds1.toFixed(2)}</span>
                </button>
                <button className="flex flex-col items-center justify-center py-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 transition-colors border border-pink-500/20 group-hover:border-pink-500/40">
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Lay (No)</span>
                  <span className="text-base font-black text-white font-mono mt-0.5">{match.odds2.toFixed(2)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PREMIUM CASINO FEATURED */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Premium Slots</h2>
              <p className="text-sm font-medium text-slate-500">Industry-leading titles with massive multipliers.</p>
            </div>
          </div>
          <Link href="/casino/slots" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors">
            Enter Casino <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredCasino.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* 6. ARCADE HUB FEATURED */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Gamepad2 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Instant WebGL Arcade</h2>
              <p className="text-sm font-medium text-slate-500">Seamless, zero-download casual gaming.</p>
            </div>
          </div>
          <Link href="/arcade" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All Games <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredArcade.map(game => (
            <Link key={game.id} href={`/arcade/game/${game.id}`} className="group block relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 w-full p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-white truncate text-lg group-hover:text-blue-400 transition-colors">{game.title}</h3>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest truncate">{game.provider}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. LIVE DEALERS & OFFERS GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Live Dealers
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {liveDealers.map(game => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Latest Action
            </h2>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 h-[260px] overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
             <LiveActionFeed />
             <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="w-full bg-slate-900 rounded-[2rem] p-12 lg:p-20 text-center flex flex-col items-center justify-center relative overflow-hidden mt-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <ShieldCheck className="w-16 h-16 text-blue-500 mb-8" />
        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-white mb-6">Ready to enter the top 1%?</h2>
        <p className="text-slate-400 font-medium max-w-2xl mb-10 text-lg leading-relaxed">Join the fastest, most advanced iGaming platform in the world. Secure cold-storage funds, provably fair gaming, and instant crypto withdrawals.</p>
        
        <button className="px-12 py-5 bg-white text-slate-900 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
          Create Account Now
        </button>
      </section>

    </div>
  );
}
