"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Search, Filter, Star, ChevronDown, X } from "lucide-react";
import { useState, use, useMemo } from "react";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";

import { GAMES, getGamesByCategory, CategoryId } from "@/lib/games";

const PROVIDERS = ["All", "Originals", "Pragmatic Play", "Play'n GO", "Evolution", "Spribe", "Pragmatic Play Live", "BetRadar", "1X2 Gaming", "NetEnt", "Push Gaming", "Relax Gaming", "BGaming"];

// Using React.use() to unwrap params in Next.js 15+
export default function CasinoCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const unwrappedParams = use(params);
  const categorySlug = unwrappedParams.category.toLowerCase();
  const categoryName = categorySlug.replace(/-/g, " ");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [sortPopular, setSortPopular] = useState(false);

  // Category metadata for hero banner
  const CATEGORY_META: Record<string, { emoji: string; label: string; desc: string; accent: string; image: string }> = {
    aaa:        { emoji: "⚡", label: "AAA Cloud Gaming",      desc: "Stream the world's biggest titles from our cloud nodes.",           accent: "from-purple-600 to-indigo-900", image: "/games/roobetlabs_vault-tron-deadly-race-BOHwFqEYb.jpeg" },
    fps:        { emoji: "🔫", label: "FPS & Shooters",        desc: "High-adrenaline first-person shooters streamed at 60FPS.",          accent: "from-red-700 to-slate-900",    image: "/games/krunker_1780932718197.png" },
    driving:    { emoji: "🏎️", label: "Racing & Simulators",   desc: "Feel every corner — cloud-rendered racing at 2K60.",               accent: "from-green-700 to-slate-900",  image: "/games/evo_race-track-3-R_1h--SOL.jpeg" },
    action:     { emoji: "⚔️", label: "RPG & Adventure",       desc: "Open worlds, epic RPGs and action-adventures on demand.",           accent: "from-blue-700 to-slate-900",  image: "/games/gamingcorps_AztecRitual-hiQjxsUxE.jpeg" },
    puzzle:     { emoji: "🧩", label: "Strategy & Co-op",      desc: "Brain-bending strategy and cooperative multiplayer.",              accent: "from-cyan-700 to-slate-900",  image: "/games/roobetlabs_trex-arcade-bomb-defuse-5X6Y9LtAg.jpeg" },
    boring:     { emoji: "🌾", label: "Cozy & Chill",          desc: "Relaxing simulation and life games to unwind.",                    accent: "from-emerald-700 to-slate-900",image: "/games/hub88_hyh_cooked-DHUjfSTnh.jpeg" },
    slots:      { emoji: "🎰", label: "Premium Slots",          desc: "Thousands of slots with live Drops & Wins jackpots.",              accent: "from-yellow-600 to-orange-900",image: "/games/pragmatic_vs20sugarrushx.jpg" },
    originals:  { emoji: "🎲", label: "Originals & Crash",     desc: "Exclusive in-house games. Provably fair, always on.",              accent: "from-rose-700 to-slate-900",  image: "/games/housegames_crash-aBwlW8Ez2.jpeg" },
    crash:      { emoji: "🚀", label: "Crash Games",            desc: "Cash out before it crashes — heart-pounding multipliers.",        accent: "from-red-600 to-slate-900",   image: "/games/spribe_aviator-7zuT5hj-B.jpeg" },
    live:       { emoji: "🔴", label: "Live Dealer Shows",      desc: "Real dealers, real time — broadcast from our studios.",           accent: "from-pink-700 to-slate-900",  image: "/games/live_cover_crazy.png" },
    roulette:   { emoji: "🎡", label: "Roulette",               desc: "Classic and modern roulette across premium live tables.",          accent: "from-emerald-600 to-slate-900",image: "/games/live_cover_roulette.png" },
    blackjack:  { emoji: "🃏", label: "Blackjack VIP",          desc: "Unlimited-player Blackjack — Free Bet, VIP Diamond and more.",    accent: "from-slate-600 to-black",    image: "/games/live_cover_blackjack.png" },
    poker:      { emoji: "♠️", label: "Poker & Card Games",    desc: "Texas Hold'em, Triple Card, Video Poker and more.",               accent: "from-indigo-600 to-slate-900",image: "/games/evo_blackjack-vip-19-eUcYAImJF.jpeg" },
    casual:     { emoji: "😎", label: "Casual Games",           desc: "Jump-in, jump-out fun with no learning curve.",                   accent: "from-amber-600 to-slate-900", image: "/games/funny_thumbnail_1780932135777.png" },
    funny:      { emoji: "😂", label: "Funny & Weird",          desc: "Silly physics and unexpected chaos — for a good laugh.",          accent: "from-pink-600 to-slate-900",  image: "/games/funny_thumbnail_1780932135777.png" },
  };

  const meta = CATEGORY_META[categorySlug] || {
    emoji: "🎮", label: categoryName, desc: `Explore all ${categoryName} games on AuraPlay.`,
    accent: "from-slate-700 to-slate-900", image: "/games/pragmatic_vswaysmadame.jpg"
  };

  const categoryMap: Record<string, CategoryId> = {
    // Casino games
    "slots": "slots",
    "live": "live",
    "shows": "shows",
    "table": "table",
    "originals": "originals",
    "crash": "crash",
    "poker": "poker",
    "esports": "esports",
    "roulette": "roulette",
    "blackjack": "blackjack",
    "baccarat": "baccarat",
    "dice": "table",
    "mines": "puzzle",
    // Cloud gaming
    "aaa": "aaa",
    "fps": "fps",
    "driving": "driving",
    "action": "action",
    "puzzle": "puzzle",
    "boring": "boring",
    "casual": "casual",
    "funny": "funny",
    "adventure": "adventure",
    "racing": "racing",
    "open-world": "open-world",
    "3d": "3d",
    // Aliases
    "racing-sims": "driving",
    "shooters": "fps",
    "cloud": "aaa",
  };

  
  const mappedCategory = categoryMap[categorySlug];
  
  const games = useMemo(() => {
    let result = mappedCategory ? getGamesByCategory(mappedCategory) : 
                  (categorySlug === "popular" || categorySlug === "favorites") ? 
                  GAMES.slice(0).sort((a,b) => (b.players || 0) - (a.players || 0)) : 
                  GAMES.slice(0, 20);

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter(game => game.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Provider filter
    if (selectedProvider !== "All") {
      result = result.filter(game => game.provider === selectedProvider);
    }

    // Popular sort
    if (sortPopular) {
      result = [...result].sort((a, b) => (b.players || 0) - (a.players || 0));
    }

    return result;
  }, [mappedCategory, unwrappedParams.category, searchQuery, selectedProvider, sortPopular]);

  return (
    <div className="flex min-h-full w-full max-w-[1600px] mx-auto text-slate-200 p-4 sm:p-6 lg:p-8 flex-col space-y-8">
      
      {/* Dynamic Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-48 md:h-64 rounded-3xl overflow-hidden relative group shrink-0"
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${meta.accent} opacity-90 z-10`} />
        <img 
          src={meta.image}
          alt={meta.label}
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700 mix-blend-overlay"
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12">
          <span className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" /> AuraPlay
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight flex items-center gap-4">
            <span className="text-4xl md:text-5xl">{meta.emoji}</span>
            {meta.label}
          </h1>
          <p className="text-white/70 mt-2 max-w-md font-medium">{meta.desc}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 w-fit">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-bold">{games.length} games available</span>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-neon-purple transition-colors shadow-inner"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Provider Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setShowProviderDropdown(!showProviderDropdown)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:border-neon-purple/50 transition-colors"
            >
              <Filter className="w-4 h-4" /> 
              {selectedProvider === "All" ? "Providers" : selectedProvider}
              <ChevronDown className={`w-3 h-3 transition-transform ${showProviderDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProviderDropdown && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden z-50 shadow-2xl">
                {PROVIDERS.map(p => (
                  <button 
                    key={p} 
                    onClick={() => { setSelectedProvider(p); setShowProviderDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${p === selectedProvider ? 'bg-neon-purple text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Popular Sort Toggle */}
          <button 
            onClick={() => setSortPopular(!sortPopular)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all ${
              sortPopular 
                ? 'bg-neon-yellow/10 border-neon-yellow/50 text-neon-yellow shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" /> Popular
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedProvider !== "All" || sortPopular || searchQuery) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Filters:</span>
          {selectedProvider !== "All" && (
            <button onClick={() => setSelectedProvider("All")} className="flex items-center gap-1.5 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neon-purple/20 transition-colors">
              {selectedProvider} <X className="w-3 h-3" />
            </button>
          )}
          {sortPopular && (
            <button onClick={() => setSortPopular(false)} className="flex items-center gap-1.5 bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neon-yellow/20 transition-colors">
              Popular <X className="w-3 h-3" />
            </button>
          )}
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-colors">
              &quot;{searchQuery}&quot; <X className="w-3 h-3" />
            </button>
          )}
          <button onClick={() => { setSelectedProvider("All"); setSortPopular(false); setSearchQuery(""); }} className="text-xs font-bold text-slate-500 hover:text-white transition-colors underline underline-offset-2 ml-2">
            Clear All
          </button>
        </div>
      )}

      {/* Game Grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 pb-12">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <GameCard {...game} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-slate-500 font-bold text-lg mb-4">No games found {searchQuery ? `matching "${searchQuery}"` : 'for these filters'}</p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedProvider("All"); setSortPopular(false); }}
            className="bg-neon-purple/20 border border-neon-purple/30 text-neon-purple px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-neon-purple/30 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-xs font-bold text-slate-600">
        Showing {games.length} game{games.length !== 1 ? 's' : ''} 
        {selectedProvider !== "All" && ` by ${selectedProvider}`}
      </div>

      {/* Live Bets Footer Feed */}
      <div className="pt-8">
        <LiveActionFeed />
      </div>

    </div>
  );
}
