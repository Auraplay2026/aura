"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, Search, Filter, Star, ChevronDown, X, Heart, 
  ShieldAlert, BadgeInfo, Play, TrendingUp, Users, Flame, 
  Sparkles, Trophy, Coins, RotateCcw, AlertTriangle, ShieldCheck,
  Zap, ArrowRight, Dices, ChevronRight, SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { GameCard } from "@/components/casino/GameCard";
import { useTradingStore } from "@/lib/store";
import { GAMES, getGamesByCategory, CategoryId, Game } from "@/lib/games";

const PROVIDERS = ["All", "Originals", "Pragmatic Play", "Evolution", "Spribe", "NetEnt", "SoftSwiss"];
const SORT_OPTIONS = [
  { id: "popular", label: "Most Popular" },
  { id: "rtp", label: "Highest RTP %" },
  { id: "new", label: "Newest Releases" },
  { id: "az", label: "A to Z" }
];

const CASINO_CATEGORIES = [
  { id: "live", name: "Live Casino & Shows", emoji: "🔴", href: "/casino/live", count: 18 },
  { id: "poker", name: "Desi Live (Teen Patti)", emoji: "🇮🇳", href: "/casino/poker", count: 12 },
  { id: "roulette", name: "Table Roulette", emoji: "🎡", href: "/casino/roulette", count: 14 },
  { id: "blackjack", name: "Live Blackjack", emoji: "🃏", href: "/casino/blackjack", count: 16 },
  { id: "crash", name: "Crash (Aviator)", emoji: "🚀", href: "/casino/crash", count: 8 },
  { id: "slots", name: "Slots & Drops", emoji: "🎰", href: "/casino/slots", count: 32 },
  { id: "originals", name: "Dice & Originals", emoji: "🎲", href: "/casino/originals", count: 20 },
  { id: "hot", name: "Hot Arena", emoji: "🔥", href: "/casino/hot", count: 25 },
  { id: "aaa", name: "Cloud Library", emoji: "🎮", href: "/casino/aaa", count: 15 },
];

export default function CasinoCategoryPage() {
  const routerParams = useParams();
  const rawCat = (routerParams?.category as string) || "live";
  const categorySlug = rawCat.toLowerCase();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [selectedSort, setSelectedSort] = useState("popular");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(36);

  // Live Activity Feed
  const [liveBets, setLiveBets] = useState<{ id: string; user: string; game: string; amount: number; payout: number; mult: number; won: boolean }[]>([]);

  useEffect(() => {
    const initialGames = ["Sweet Bonanza", "Gates of Olympus", "Aviator", "Mines", "Tower", "Crash", "Baccarat", "Blackjack", "Plinko", "Andar Bahar"];
    const initialUsers = ["GoldenAce", "CryptoKing", "VIP_Roller", "Rafi_77", "LuckySpins", "DanishBet", "RenderHype", "BetPro"];
    const generated: typeof liveBets = [];
    for (let i = 0; i < 6; i++) {
      const amount = Math.floor(Math.random() * 1500) + 100;
      const mult = parseFloat((Math.random() * 4 + 1.1).toFixed(2));
      const won = Math.random() > 0.45;
      const payout = won ? Math.round(amount * mult) : 0;
      generated.push({
        id: `bet-${Math.random()}`,
        user: initialUsers[Math.floor(Math.random() * initialUsers.length)],
        game: initialGames[Math.floor(Math.random() * initialGames.length)],
        amount,
        payout,
        mult,
        won
      });
    }
    setLiveBets(generated);

    const timer = setInterval(() => {
      const amount = Math.floor(Math.random() * 2500) + 100;
      const mult = Math.random() > 0.8 ? parseFloat((Math.random() * 40 + 2.5).toFixed(2)) : parseFloat((Math.random() * 3 + 1.1).toFixed(2));
      const won = Math.random() > 0.48;
      const payout = won ? Math.round(amount * mult) : 0;
      const newBet = {
        id: `bet-${Math.random()}`,
        user: initialUsers[Math.floor(Math.random() * initialUsers.length)],
        game: initialGames[Math.floor(Math.random() * initialGames.length)],
        amount,
        payout,
        mult,
        won
      };
      setLiveBets(prev => [newBet, ...prev.slice(0, 5)]);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const mappedCategory = categorySlug as CategoryId;
  const categoryGames = useMemo(() => {
    if (categorySlug === "hot") {
      return [...GAMES].sort((a, b) => (b.players || 0) - (a.players || 0));
    }
    return getGamesByCategory(mappedCategory) || [];
  }, [categorySlug, mappedCategory]);
  
  const filteredGames = useMemo(() => {
    let result = categoryGames.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedProvider === "All" || g.provider === selectedProvider)
    );

    if (selectedSort === "popular") {
      result.sort((a, b) => (b.players || 0) - (a.players || 0));
    } else if (selectedSort === "rtp") {
      result.sort((a, b) => (b.rtp || 0) - (a.rtp || 0));
    } else if (selectedSort === "new") {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (selectedSort === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [categoryGames, searchQuery, selectedProvider, selectedSort]);

  const displayedGames = useMemo(() => filteredGames.slice(0, visibleCount), [filteredGames, visibleCount]);

  // Featured Hero Game for the current category
  const featuredGame = useMemo<Game | null>(() => {
    if (categoryGames.length === 0) return null;
    if (categorySlug === "crash") return categoryGames.find(g => g.id === "crash-1" || g.id === "orig-1") || categoryGames[0];
    if (categorySlug === "blackjack") return categoryGames.find(g => g.id === "orig-8" || g.id === "table-2") || categoryGames[0];
    if (categorySlug === "roulette") return categoryGames.find(g => g.id === "orig-r1" || g.id === "table-1") || categoryGames[0];
    if (categorySlug === "slots") return categoryGames.find(g => g.id === "slot-2" || g.id === "slot-1") || categoryGames[0];
    if (categorySlug === "poker") return categoryGames.find(g => g.id === "poker-1" || g.title.includes("Bahar") || g.title.includes("Patti")) || categoryGames[0];
    if (categorySlug === "originals") return categoryGames.find(g => g.id === "orig-3" || g.id === "orig-4" || g.id === "orig-5") || categoryGames[0];
    return categoryGames[0];
  }, [categoryGames, categorySlug]);

  const currentCategoryInfo = useMemo(() => {
    const found = CASINO_CATEGORIES.find(c => c.id === categorySlug);
    if (found) return found;
    return {
      id: categorySlug,
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1) + " Arena",
      emoji: "🎰",
      href: `/casino/${categorySlug}`,
      count: categoryGames.length
    };
  }, [categorySlug, categoryGames]);

  return (
    <div className="flex flex-col min-h-full w-full bg-slate-50 p-3 sm:p-6 pb-24 max-w-full overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full space-y-4 sm:space-y-6">

        {/* ═══ 1. HORIZONTAL QUICK CATEGORY SELECTOR RIBBON ═══ */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-1.5 -mx-1 px-1 select-none">
          <div className="flex items-center gap-2 min-w-max">
            {CASINO_CATEGORIES.map((cat) => {
              const isActive = cat.id === categorySlug;
              return (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs active:scale-95 touch-manipulation ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/25 ring-2 ring-red-500/40"
                      : "bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 border border-slate-200"
                  }`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ═══ 2. STREAMLINED WORLD-CLASS HERO SHOWCASE ═══ */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left: Category Title & Details */}
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Arena Online
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" /> Provably Fair & Certified
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
              <span>{currentCategoryInfo.emoji}</span>
              <span>{currentCategoryInfo.name}</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
              Access the top 1% verified iGaming tables, instant multiplier payouts, and cloud streaming nodes with real-time multi-dealer synchronization.
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-black font-mono">{(categoryGames.length * 1200 + 4500).toLocaleString()} Players</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Gamepad2 className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px] font-black font-mono">{categoryGames.length} Game Nodes</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-black font-mono text-emerald-400">99.5% Max RTP</span>
              </div>
            </div>
          </div>

          {/* Right: Featured Hot Game Launch Box */}
          {featuredGame && (
            <div className="relative z-10 lg:max-w-xs w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Top Featured
                </span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                  {featuredGame.rtp || 99.0}% RTP
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                <img 
                  src={featuredGame.image} 
                  alt={featuredGame.title} 
                  className="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0" 
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white truncate">{featuredGame.title}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{featuredGame.provider}</span>
                </div>
              </div>

              <Link
                href={`/casino/game/${featuredGame.id}`}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 touch-manipulation text-center"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Instant Play Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* ═══ 3. SEARCH, PROVIDER & SORT CONTROLS BAR ═══ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or provider..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            
            {/* Provider Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setShowProviderDropdown(!showProviderDropdown); setShowSortDropdown(false); }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="text-slate-400 font-normal">Provider:</span>
                <span>{selectedProvider}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showProviderDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden font-black text-[11px] uppercase tracking-wider text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150 py-1">
                  {PROVIDERS.map(prov => (
                    <button
                      key={prov}
                      onClick={() => {
                        setSelectedProvider(prov);
                        setShowProviderDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${selectedProvider === prov ? "text-red-600 bg-red-50/50 font-black" : ""}`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowProviderDropdown(false); }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>{SORT_OPTIONS.find(s => s.id === selectedSort)?.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden font-black text-[11px] uppercase tracking-wider text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150 py-1">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedSort(opt.id);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${selectedSort === opt.id ? "text-red-600 bg-red-50/50 font-black" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Total Results Counter */}
            <span className="text-[11px] font-bold text-slate-400 px-2 whitespace-nowrap hidden md:inline">
              {filteredGames.length} Games Available
            </span>
          </div>

        </div>

        {/* ═══ 4. MAIN CONTENT GRID (GAMES LIST & ACTIVITY PANEL) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Primary Games Panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Game Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {displayedGames.map((game) => (
                <GameCard 
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  provider={game.provider}
                  image={game.image}
                  isNew={game.isNew}
                  rtp={game.rtp}
                  players={game.players}
                  hideTitle={game.hideTitle}
                />
              ))}
            </div>

            {/* Empty State */}
            {displayedGames.length === 0 && (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-800">No games matched your filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search query or selecting &ldquo;All Providers&rdquo; to browse the complete catalogue.
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedProvider("All"); }}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < filteredGames.length && (
              <div className="w-full flex justify-center pt-4 pb-8">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="bg-white hover:bg-slate-50 text-slate-900 font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-full transition-all border border-slate-200 shadow-sm hover:shadow active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Load More Games ({filteredGames.length - visibleCount} Remaining)</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}

          </div>

          {/* Side Panel: Live Bets & Hot Streaks Feed */}
          <div className="space-y-6">
            
            {/* Real-Time Live Bets */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> Live Bets Feed
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex flex-col gap-2.5 min-h-[320px]">
                <AnimatePresence mode="popLayout">
                  {liveBets.map((bet) => (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-slate-50 hover:bg-slate-100/80 border border-slate-150 p-3 rounded-2xl flex justify-between items-center transition-all select-none"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-black text-slate-900">{bet.user}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[120px]">{bet.game}</span>
                      </div>
                      
                      <div className="text-right flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-700 font-mono">₹{bet.amount.toLocaleString()}</span>
                        <span className={`text-[9px] font-black uppercase font-mono ${bet.won ? "text-emerald-600" : "text-slate-400"}`}>
                          {bet.won ? `+₹${bet.payout.toLocaleString()} (${bet.mult}x)` : "Missed"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Trending Hot Streaks */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Hot RTP Streaks
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">Live %</span>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { title: "Sweet Bonanza 1000", rtp: 112.4, change: "+3.2%", status: "hot" },
                  { title: "Gates of Olympus", rtp: 108.7, change: "+1.9%", status: "hot" },
                  { title: "Aviator High-Multi", rtp: 104.2, change: "+0.8%", status: "hot" },
                  { title: "Lightning Roulette", rtp: 101.5, change: "+0.4%", status: "hot" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-xs">{item.title}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">24H Momentum</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black font-mono text-emerald-600 text-xs">{item.rtp}%</span>
                      <span className="text-[9px] font-bold text-emerald-500 block">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}