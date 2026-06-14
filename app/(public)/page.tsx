"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Gamepad2, TrendingUp, ShieldCheck, Flame, Star, Activity, Crown, Percent, Gift, ChevronRight } from "lucide-react";
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
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-20 w-full overflow-hidden px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* 1. TOP PROMO BANNER (Full Width Image Style) */}
      <Link href="/promotions" className="relative w-full rounded-md overflow-hidden aspect-[4/1] md:aspect-[6/1] lg:aspect-[8/1] flex items-center bg-slate-900 group shadow-sm cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity z-0 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent to-slate-900 z-10" />
        
        <div className="relative z-20 flex items-center justify-between w-full px-6 md:px-12">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-black tracking-widest uppercase text-sm md:text-base">AuraPlay Exchange</span>
            </div>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase italic">
              Get Your Online ID
            </h2>
            <div className="mt-2 inline-block px-4 py-1 border-2 border-yellow-400 text-yellow-400 font-bold text-sm md:text-base w-max">
              5% BONUS ON FIRST DEPOSIT
            </div>
          </div>
          <div className="hidden md:flex bg-yellow-400 text-slate-900 font-black px-6 py-3 rounded uppercase items-center gap-2 hover:bg-yellow-300 transition-colors">
            Register Now <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </Link>

      {/* 2. SECOND ROW: SPORTS (60%) & BLOG (40%) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* SPORTS BANNER */}
        <Link href="/sportsbook" className="md:col-span-3 relative w-full rounded-md overflow-hidden aspect-[16/9] md:aspect-auto md:h-[280px] group cursor-pointer shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1e128014792c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 z-0" />
          
          <div className="relative z-20 w-full h-full p-6 flex flex-col justify-between">
            <div className="flex justify-end">
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-md p-3 min-w-[140px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs font-medium text-slate-300">
                  <div className="flex justify-between items-center"><span>Cricket</span><span className="bg-slate-800 px-1.5 py-0.5 rounded text-white">21</span></div>
                  <div className="flex justify-between items-center"><span>Soccer</span><span className="bg-slate-800 px-1.5 py-0.5 rounded text-white">6</span></div>
                  <div className="flex justify-between items-center"><span>Tennis</span><span className="bg-slate-800 px-1.5 py-0.5 rounded text-white">33</span></div>
                  <div className="flex justify-between items-center"><span>E-Soccer</span><span className="bg-slate-800 px-1.5 py-0.5 rounded text-white">4</span></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-end justify-between w-full">
              <h3 className="text-3xl md:text-4xl font-black text-white italic tracking-wide drop-shadow-lg">Sports</h3>
              <div className="bg-yellow-400 text-slate-900 text-sm font-black px-4 py-1.5 uppercase rounded-sm shadow-md">
                Play Now
              </div>
            </div>
          </div>
        </Link>

        {/* BLOG BANNER */}
        <Link href="/blog" className="md:col-span-2 relative w-full rounded-md overflow-hidden aspect-[16/9] md:aspect-auto md:h-[280px] bg-gradient-to-br from-yellow-400 to-amber-500 group cursor-pointer shadow-sm flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="bg-blue-500 text-white font-black text-6xl md:text-7xl italic tracking-tighter px-6 py-2 rounded-xl shadow-xl transform -rotate-2 mb-4 border-4 border-white">
              BLOG
            </div>
            <p className="text-slate-900 font-black uppercase tracking-widest text-sm mb-6 bg-white px-3 py-1 rounded">News | Sporting Info | Etc.</p>
            
            <div className="flex justify-center gap-4 text-slate-900 w-full bg-slate-900/10 p-3 rounded-lg">
              <div className="flex flex-col items-center gap-1"><Trophy className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Cricket</span></div>
              <div className="flex flex-col items-center gap-1"><Activity className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Tennis</span></div>
              <div className="flex flex-col items-center gap-1"><Star className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Football</span></div>
            </div>
          </div>
        </Link>

      </div>

      {/* 3. THIRD ROW: PROVIDERS (33% each) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Betradar */}
        <Link href="/casino?provider=betradar" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-blue-900 group cursor-pointer shadow-sm">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <h3 className="text-3xl font-black text-white tracking-tighter mb-1">bet<span className="text-blue-400">radar</span></h3>
          </div>
        </Link>

        {/* Evolution */}
        <Link href="/casino?provider=evolution" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-purple-900 group cursor-pointer shadow-sm">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <Flame className="w-8 h-8 text-white" />
               <h3 className="text-3xl font-black text-white tracking-tighter">Evolution</h3>
             </div>
          </div>
        </Link>

        {/* SmartSoft */}
        <Link href="/casino?provider=smartsoft" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-slate-900 group cursor-pointer shadow-sm">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518331647614-7a1f04cd34ce?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">S</div>
               <h3 className="text-3xl font-black text-white tracking-tighter">SmartSoft</h3>
             </div>
          </div>
        </Link>

      </div>

      <div className="h-4" /> {/* Spacer */}

      {/* 4. AURA ORIGINALS */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">AuraPlay Originals</h2>
          </div>
          <Link href="/casino/originals" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {originals.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* 5. PREMIUM CASINO FEATURED */}
      <section className="w-full mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Premium Slots</h2>
          </div>
          <Link href="/casino/slots" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
            Enter Casino
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredCasino.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* 6. ARCADE HUB FEATURED */}
      <section className="w-full mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Instant Arcade</h2>
          </div>
          <Link href="/arcade" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All Games
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredArcade.map(game => (
            <Link key={game.id} href={`/arcade/game/${game.id}`} className="group block relative rounded-md overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-full p-4">
                <h3 className="font-black text-white truncate text-base group-hover:text-yellow-400 transition-colors">{game.title}</h3>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest truncate">{game.provider}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. LIVE DEALERS */}
      <section className="w-full mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Live Dealers</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {liveDealers.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

    </div>
  );
}
