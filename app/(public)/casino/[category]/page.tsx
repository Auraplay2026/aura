"use client";

import { motion } from "framer-motion";
import { Gamepad2, Search, Filter, Star, ChevronDown, X, Heart, ShieldAlert, BadgeInfo, Play } from "lucide-react";
import Link from "next/link";
import { useState, use, useMemo } from "react";
import { GameCard } from "@/components/casino/GameCard";
import { useTradingStore } from "@/lib/store";
import { GAMES, getGamesByCategory, CategoryId } from "@/lib/games";

const PROVIDERS = ["All", "Originals", "Pragmatic Play", "Evolution", "Spribe", "NetEnt"];
const TOKENS = [20, 50, 100, 200, 500];

export default function CasinoCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const unwrappedParams = use(params);
  const categorySlug = unwrappedParams.category.toLowerCase();
  const categoryName = categorySlug.replace(/-/g, " ");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [sortPopular, setSortPopular] = useState(false);

  // Casino State
  const [activeToken, setActiveToken] = useState<number>(100);
  const [bets, setBets] = useState<Record<string, number>>({});
  const { balance } = useTradingStore();

  const handleBetDrop = (zone: string) => {
    setBets(prev => ({
      ...prev,
      [zone]: (prev[zone] || 0) + activeToken
    }));
  };

  const clearBets = () => setBets({});
  const repeatBets = () => { /* No-op for demo */ };
  const submitBets = () => { alert("Bets submitted!"); setBets({}); };

  const TokenCarousel = () => (
    <div className="flex flex-col items-center gap-4 mt-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-3 w-full border border-exchange-border rounded-sm bg-slate-50 p-3">
        {TOKENS.map(token => (
          <button 
            key={token}
            onClick={() => setActiveToken(token)}
            className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-sm transition-all ${
              activeToken === token 
                ? "bg-red-600 text-white shadow-lg scale-110 border-4 border-red-200" 
                : "bg-white text-exchange-text border-2 border-exchange-border hover:bg-slate-100"
            }`}
          >
            ${token}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <button onClick={clearBets} className="text-exchange-muted hover:text-exchange-text font-bold uppercase tracking-widest text-xs transition-colors">Cancel</button>
        <button onClick={repeatBets} className="text-exchange-muted hover:text-exchange-text font-bold uppercase tracking-widest text-xs transition-colors">Repeat</button>
        <button onClick={submitBets} className="text-red-600 hover:text-red-800 font-black uppercase tracking-widest text-xs transition-colors">Submit</button>
      </div>
    </div>
  );

  // Specific Nodes
  if (categorySlug === "blackjack") {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-exchange-bg p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
          <h1 className="text-2xl font-black text-exchange-text uppercase tracking-widest mb-2">Blackjack Node</h1>
          <p className="text-sm text-exchange-muted font-medium mb-12">Place tokens on primary or side-bet zones</p>

          <div className="relative w-full aspect-[2/1] max-w-3xl bg-slate-100 border border-exchange-border rounded-t-full flex flex-col items-center justify-end pb-12 shadow-inner">
            <div className="absolute top-1/4 text-center text-slate-700 font-black text-4xl uppercase tracking-[0.5em] select-none pointer-events-none">
              Dealer Must Draw to 16
            </div>
            
            <div className="flex gap-12 relative z-10">
              {/* Perfect Pairs */}
              <button 
                onClick={() => handleBetDrop("perfect-pairs")}
                className="w-24 h-24 rounded-full border-2 border-dashed border-exchange-border flex flex-col items-center justify-center bg-slate-900/50 hover:bg-red-50/40 transition-colors relative"
              >
                <span className="text-[10px] font-bold text-exchange-muted uppercase">Pairs</span>
                {bets["perfect-pairs"] && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shadow-md">
                    ${bets["perfect-pairs"]}
                  </div>
                )}
              </button>

              {/* Main Hand */}
              <button 
                onClick={() => handleBetDrop("main")}
                className="w-32 h-32 rounded-full border-4 border-exchange-border flex flex-col items-center justify-center bg-white hover:bg-red-50/40 transition-colors relative shadow-sm"
              >
                <span className="text-xs font-black text-exchange-text uppercase">Main Hand</span>
                {bets["main"] && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg">
                    ${bets["main"]}
                  </div>
                )}
              </button>

              {/* Bonus */}
              <button 
                onClick={() => handleBetDrop("bonus")}
                className="w-24 h-24 rounded-full border-2 border-dashed border-exchange-border flex flex-col items-center justify-center bg-slate-900/50 hover:bg-red-50/40 transition-colors relative"
              >
                <span className="text-[10px] font-bold text-exchange-muted uppercase">Bonus</span>
                {bets["bonus"] && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shadow-md">
                    ${bets["bonus"]}
                  </div>
                )}
              </button>
            </div>
          </div>

          <TokenCarousel />
        </div>
      </div>
    );
  }

  if (categorySlug === "poker") {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-exchange-bg p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black text-exchange-text uppercase tracking-widest">Human Poker Node</h1>
            <div className="flex items-center gap-3 bg-white px-4 py-2 border border-exchange-border rounded-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-exchange-text tracking-widest uppercase">Live Feed Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-slate-50 border border-exchange-border rounded-sm p-6 flex flex-col items-center justify-center min-h-[400px] relative">
              {/* Community Cards */}
              <div className="flex gap-3 mb-16">
                {["A♠", "K♥", "Q♣", "J♦", "10♠"].map((card, i) => (
                  <div key={i} className="w-16 h-24 bg-white border border-slate-300 rounded-md shadow-sm flex items-center justify-center text-xl font-black text-slate-800">
                    {card}
                  </div>
                ))}
              </div>

              {/* Player Cards */}
              <div className="flex gap-4 relative">
                {/* Hand Strength Badge */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-sm text-xs font-bold tracking-widest uppercase whitespace-nowrap shadow-sm">
                  Strength: 92% (Straight)
                </div>
                <div className="w-20 h-28 bg-white border border-slate-300 rounded-md shadow-md flex items-center justify-center text-2xl font-black text-slate-800 rotate-[-5deg]">
                  A♣
                </div>
                <div className="w-20 h-28 bg-white border border-slate-300 rounded-md shadow-md flex items-center justify-center text-2xl font-black text-red-600 rotate-[5deg]">
                  K♦
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 border border-exchange-border rounded-sm p-6 flex-1 flex flex-col justify-center gap-6">
                <span className="text-xs font-bold text-exchange-muted uppercase tracking-widest text-center">Action Required</span>
                <div className="grid grid-cols-2 gap-4">
                  <button className="text-center text-exchange-muted hover:text-exchange-text font-black text-xl uppercase tracking-widest transition-colors py-4">Fold</button>
                  <button className="text-center text-exchange-muted hover:text-exchange-text font-black text-xl uppercase tracking-widest transition-colors py-4">Check</button>
                  <button className="text-center text-red-600 hover:text-red-800 font-black text-xl uppercase tracking-widest transition-colors py-4 col-span-2">Call ₹500</button>
                  <button className="text-center text-pink-600 hover:text-pink-800 font-black text-xl uppercase tracking-widest transition-colors py-4 col-span-2">Raise</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Generic List Layout
  const mappedCategory = categorySlug as CategoryId;
  const games = getGamesByCategory(mappedCategory) || GAMES.slice(0, 20);

  const filteredGames = games.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const [visibleCount, setVisibleCount] = useState(36);

  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-exchange-bg p-6 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto w-full space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-exchange-border rounded-sm">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-exchange-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..." 
              className="w-full bg-slate-50 border border-exchange-border rounded-sm pl-9 pr-9 py-2 text-xs font-medium text-exchange-text focus:outline-none focus:border-red-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-exchange-muted hover:text-exchange-text">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-sm font-bold text-exchange-text uppercase tracking-widest">
            {categoryName}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">
          {displayedGames.map((game, i) => (
            <GameCard 
              key={game.id}
              id={game.id}
              title={game.title}
              provider={game.provider}
              image={game.image}
              isNew={game.isNew}
              rtp={game.rtp}
              players={game.players}
            />
          ))}
        </div>

        {visibleCount < filteredGames.length && (
          <div className="w-full flex justify-center pb-12">
            <button 
              onClick={() => setVisibleCount(prev => prev + 36)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-sm px-8 py-3 rounded-full transition-colors border border-slate-700 shadow-lg"
            >
              Load More Games
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
