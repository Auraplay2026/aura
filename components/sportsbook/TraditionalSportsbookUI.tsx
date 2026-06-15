"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Trophy, Search, ChevronRight, TrendingUp, TrendingDown, Star, AlertCircle, Zap } from "lucide-react";
import { BetslipDrawer, DraftBet } from "./BetslipDrawer";
import { useLiveMarkets, Market } from "@/hooks/useLiveMarkets";
import { useTradingStore } from "@/lib/store";

const SPORTS_NAV = [
  { id: 'cricket', label: '🏏 Cricket (IPL)', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1360/1360408.png' },
  { id: 'kabaddi', label: '🤼 Pro Kabaddi', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png' },
  { id: 'football', label: '⚽ Football (ISL)', iconUrl: 'https://cdn-icons-png.flaticon.com/512/53/53283.png' },
  { id: 'bgmi', label: '🎮 BGMI / Esports', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3048/3048386.png' },
  { id: 'badminton', label: '🏸 Badminton', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3663/3663189.png' },
  { id: 'chess', label: '♟️ Chess', iconUrl: 'https://cdn-icons-png.flaticon.com/512/806/806086.png' },
  { id: 'hockey', label: '🏑 Field Hockey', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3248/3248106.png' },
];

export function TraditionalSportsbookUI() {
  const liveMarkets = useLiveMarkets('sports');
  const [activeTopNav, setActiveTopNav] = useState('All Sports');
  const [activeSport, setActiveSport] = useState('cricket');
  const [activeFilter, setActiveFilter] = useState('all'); // all, popular, tournament
  const [activeType, setActiveType] = useState('matches'); // matches, outrights
  const [draftBet, setDraftBet] = useState<DraftBet | null>(null);
  const [isTurboBetEnabled, setIsTurboBetEnabled] = useState(false);

  const { positions, placeTrade, balance } = useTradingStore();

  // Filter the mock liveMarkets using the new sportId property
  const getMatchesForSport = (sportId: string, markets: Market[]) => {
    return markets.filter(m => m.sportId === sportId);
  };

  const filteredMarkets = getMatchesForSport(activeSport, liveMarkets);
  const liveMatches = filteredMarkets.filter(m => m.status === 'live');
  const upcomingMatches = filteredMarkets.filter(m => m.status === 'upcoming');

  // Helper to convert probability percentage (1-99) to decimal odds
  const toDecimalOdds = (prob: number) => {
    return (100 / prob).toFixed(2);
  };

  const handleOddsClick = (market: Market, side: 'yes' | 'no') => {
    if (isTurboBetEnabled) {
      if (balance >= 1000) {
        placeTrade(market.id, market.title, side, 1000, side === 'yes' ? market.yes : market.no);
      } else {
        alert("Insufficient balance for Turbo Bet (₹1,000)");
      }
      return;
    }

    const prob = side === 'yes' ? market.yes : market.no;
    const teamName = side === 'yes' ? market.title.split(' vs ')[0] || "Yes" : market.title.split(' vs ')[1] || "No";
    
    // Fallback parsing if title doesn't have "vs"
    let parsedTeam = teamName;
    if (market.title.includes("Will ")) {
      parsedTeam = side === 'yes' ? "Yes" : "No";
    }

    setDraftBet({
      marketId: market.id,
      marketTitle: market.title,
      team: parsedTeam,
      side,
      odds: Number(toDecimalOdds(prob)),
      price: prob
    });
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-slate-50 text-slate-700 font-sans">
      
      {/* Top Main Nav */}
      <div className="flex items-center gap-6 px-6 pt-6 border-b border-slate-200">
        {['Featured', 'In-Play', 'All Sports', 'My Bets'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTopNav(tab)}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors relative ${activeTopNav === tab ? 'border-[#FFD700] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
            {tab === 'My Bets' && positions.length > 0 && (
              <span className="absolute top-0 -right-4 w-4 h-4 bg-slate-50 text-black text-[10px] rounded-full flex items-center justify-center">{positions.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTopNav === 'My Bets' ? (
        <div className="p-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-xl font-black text-slate-900 mb-4">Active Bets</h3>
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold">No active bets.</p>
                <button onClick={() => setActiveTopNav('All Sports')} className="mt-4 text-[#FFD700] hover:underline text-sm font-bold">Browse Sports</button>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map(p => (
                  <div key={p.id} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-700">
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">{p.marketTitle}</p>
                      <p className="text-slate-900 font-black text-lg">Picked {p.side.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-1">Stake</p>
                      <p className="text-neon-green font-black">₹{p.investment.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Secondary Sports Icons Nav */}
          <div className="flex items-center gap-6 px-6 py-4 overflow-x-auto custom-scrollbar bg-slate-50 border-b border-slate-200 shrink-0">
            {SPORTS_NAV.map(sport => (
              <button 
                key={sport.id}
                onClick={() => setActiveSport(sport.id)}
                className={`flex flex-col items-center gap-3 min-w-[80px] transition-all duration-300 group ${activeSport === sport.id ? 'text-[#FFD700]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center transition-all duration-300 ${activeSport === sport.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'opacity-50 grayscale group-hover:opacity-80 group-hover:grayscale-0'}`}>
                  <img src={sport.iconUrl} alt={sport.label} className="w-full h-full object-contain filter" style={{ filter: activeSport === sport.id ? 'invert(75%) sepia(85%) saturate(735%) hue-rotate(352deg) brightness(101%) contrast(105%)' : 'none' }} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${activeSport === sport.id ? 'text-slate-900' : ''}`}>{sport.label}</span>
              </button>
            ))}
          </div>

          {/* Search & Turbo Toggle */}
          <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search events, teams, leagues..."
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-600 outline-none transition-colors"
              />
            </div>
            <button 
              onClick={() => setIsTurboBetEnabled(!isTurboBetEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isTurboBetEnabled ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}
            >
              <Zap className="w-4 h-4" /> 
              {isTurboBetEnabled ? 'Turbo Bet ON (₹1K)' : 'Turbo Bet OFF'}
            </button>
          </div>

          {/* Filter Pills */}
          <div className="p-6 flex items-center gap-3 overflow-x-auto custom-scrollbar shrink-0">
            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${activeFilter === 'all' ? 'bg-slate-50 text-slate-900 border-slate-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              All <span className="bg-slate-700 px-1.5 rounded text-[10px]">{filteredMarkets.length}</span>
            </button>
            <button onClick={() => setActiveFilter('popular')} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeFilter === 'popular' ? 'bg-[#5a4fcf] text-slate-900 border-[#5a4fcf] shadow-[0_0_10px_rgba(90,79,207,0.3)]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Popular
            </button>
            <button onClick={() => setActiveFilter('tournament')} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${activeFilter === 'tournament' ? 'bg-slate-50 text-slate-900 border-slate-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Trophy className="w-3 h-3 text-[#FFD700]" /> {SPORTS_NAV.find(s => s.id === activeSport)?.label} Global League
            </button>
          </div>

          {/* Matches / Outrights Toggle */}
          <div className="px-6 flex items-center gap-2 mb-6">
            <div className="bg-white rounded-lg p-1 flex border border-slate-200 relative">
              <div className={`absolute top-1 bottom-1 w-1/2 bg-slate-50 rounded shadow-sm transition-transform duration-300 ${activeType === 'outrights' ? 'translate-x-full' : 'translate-x-0'}`} />
              <button onClick={() => setActiveType('matches')} className={`px-6 py-1.5 rounded text-xs font-bold relative z-10 transition-colors w-[90px] ${activeType === 'matches' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Matches</button>
              <button onClick={() => setActiveType('outrights')} className={`px-6 py-1.5 rounded text-xs font-bold relative z-10 transition-colors w-[90px] ${activeType === 'outrights' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Outrights</button>
            </div>
          </div>

          {/* Match Table Header */}
          <div className="px-6 mt-6 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-900 font-black text-lg uppercase tracking-widest">
              <Trophy className="w-5 h-5 text-slate-700" /> 
              {activeFilter === 'live' ? 'LIVE OVERVIEW' : 'GLOBAL LEAGUE'} {SPORTS_NAV.find(s => s.id === activeSport)?.label.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') /* strip emoji for header */}
            </div>
            <div className="bg-slate-50 text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full border border-slate-200">
              {filteredMarkets.length} Matches Found
            </div>
          </div>

          {/* Matches Container */}
          <div className="px-6 space-y-3 pb-32">
            {filteredMarkets.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <Trophy className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-900 font-bold text-lg mb-1">No Matches Found</p>
                <p className="text-slate-500 text-sm">There are no matches available for this category right now.</p>
              </div>
            ) : (
              <>
                {/* Ongoing Matches Section */}
                {liveMatches.length > 0 && (
                  <div className="space-y-2">
                    {liveMatches.map((market) => {
                      const yesOdds = toDecimalOdds(market.yes);
                      const noOdds = toDecimalOdds(market.no);
                      const isYesTrendingUp = market.yes > market.history[0];
                      const isNoTrendingUp = market.no > (100 - market.history[0]);
                      const team1Name = market.title.split(' vs ')[0] || "Home";
                      const team2Name = market.title.split(' vs ')[1] || "Away";

                      return (
                        <div key={market.id} className="bg-slate-50 border border-transparent hover:border-slate-700 rounded-xl transition-colors">
                          <div className="flex flex-col md:flex-row items-center p-4">
                            
                            {/* Left: Status & Score */}
                            <div className="flex flex-col items-center justify-center w-28 shrink-0 md:border-r border-slate-200 pr-4 mb-4 md:mb-0">
                              <div className="text-[10px] font-bold text-red-500 border border-red-500/30 bg-red-500/10 px-3 py-0.5 rounded-full mb-1">
                                LIVE
                              </div>
                              <div className="text-xs font-bold text-slate-900 mb-0.5">0 - 0</div>
                              <div className="text-[10px] text-slate-600">(21')</div>
                            </div>

                            {/* Middle: Teams */}
                            <div className="flex-1 px-6 flex flex-col gap-3 w-full">
                              <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                                  {market.team1Logo ? <img src={market.team1Logo} alt={team1Name} className="w-full h-full object-cover" /> : <span className="text-[10px]">T1</span>}
                                </div>
                                <span className="truncate">{team1Name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                                  {market.team2Logo ? <img src={market.team2Logo} alt={team2Name} className="w-full h-full object-cover" /> : <span className="text-[10px]">T2</span>}
                                </div>
                                <span className="truncate">{team2Name}</span>
                              </div>
                            </div>

                            {/* Right: Odds */}
                            <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
                              <button 
                                onClick={() => handleOddsClick(market, 'yes')}
                                className={`flex items-center justify-between w-full md:w-[90px] h-12 bg-[#E0F2FE] hover:bg-[#c0e0fc] rounded-lg px-3 transition-colors border ${draftBet?.marketId === market.id && draftBet?.side === 'yes' ? 'border-sky-500 ring-2 ring-sky-200' : 'border-sky-200/40'}`}
                              >
                                <span className="text-sky-800 text-[10px] font-black uppercase tracking-wider">Back</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-black text-slate-950 font-mono tracking-tight">{yesOdds}</span>
                                  {isYesTrendingUp ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
                                </div>
                              </button>
                              
                              <button 
                                onClick={() => handleOddsClick(market, 'no')}
                                className={`flex items-center justify-between w-full md:w-[90px] h-12 bg-[#FCE7F3] hover:bg-[#f9cce4] rounded-lg px-3 transition-colors border ${draftBet?.marketId === market.id && draftBet?.side === 'no' ? 'border-pink-500 ring-2 ring-pink-200' : 'border-pink-200/40'}`}
                              >
                                <span className="text-pink-800 text-[10px] font-black uppercase tracking-wider">Lay</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-black text-slate-950 font-mono tracking-tight">{noOdds}</span>
                                  {isNoTrendingUp ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
                                </div>
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upcoming Matches Section */}
                {upcomingMatches.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-slate-600 font-bold text-sm uppercase tracking-widest mt-8 mb-4">
                      UPCOMING
                    </h3>
                    {upcomingMatches.map((market) => {
                      const yesOdds = toDecimalOdds(market.yes);
                      const noOdds = toDecimalOdds(market.no);
                      const team1Name = market.title.split(' vs ')[0] || "Home";
                      const team2Name = market.title.split(' vs ')[1] || "Away";
      
                      return (
                        <div key={market.id} className="bg-slate-50 border border-transparent hover:border-slate-700 rounded-xl transition-colors opacity-80 hover:opacity-100">
                          <div className="flex flex-col md:flex-row items-center p-4">
                            
                            {/* Left: Status & Score */}
                            <div className="flex flex-col items-center justify-center w-28 shrink-0 md:border-r border-slate-200 pr-4 mb-4 md:mb-0">
                              <div className="text-[10px] font-bold text-slate-600 mb-1">
                                {market.startTime}
                              </div>
                            </div>

                            {/* Middle: Teams */}
                            <div className="flex-1 px-6 flex flex-col gap-3 w-full">
                              <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                                  {market.team1Logo ? <img src={market.team1Logo} alt={team1Name} className="w-full h-full object-cover grayscale" /> : <span className="text-[10px]">T1</span>}
                                </div>
                                <span className="truncate">{team1Name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                                  {market.team2Logo ? <img src={market.team2Logo} alt={team2Name} className="w-full h-full object-cover grayscale" /> : <span className="text-[10px]">T2</span>}
                                </div>
                                <span className="truncate">{team2Name}</span>
                              </div>
                            </div>
      
                            {/* Right: Odds */}
                            <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
                              <button 
                                onClick={() => handleOddsClick(market, 'yes')}
                                className={`flex items-center justify-between w-full md:w-[90px] h-12 bg-[#E0F2FE] hover:bg-[#c0e0fc] rounded-lg px-3 transition-colors border ${draftBet?.marketId === market.id && draftBet?.side === 'yes' ? 'border-sky-500 ring-2 ring-sky-200' : 'border-sky-200/40'}`}
                              >
                                <span className="text-sky-850 text-[10px] font-black uppercase tracking-wider">Back</span>
                                <span className="text-sm font-black text-slate-950 font-mono tracking-tight">{yesOdds}</span>
                              </button>
                              
                              <button 
                                onClick={() => handleOddsClick(market, 'no')}
                                className={`flex items-center justify-between w-full md:w-[90px] h-12 bg-[#FCE7F3] hover:bg-[#f9cce4] rounded-lg px-3 transition-colors border ${draftBet?.marketId === market.id && draftBet?.side === 'no' ? 'border-pink-500 ring-2 ring-pink-200' : 'border-pink-200/40'}`}
                              >
                                <span className="text-pink-850 text-[10px] font-black uppercase tracking-wider">Lay</span>
                                <span className="text-sm font-black text-slate-950 font-mono tracking-tight">{noOdds}</span>
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Anchored Bottom Betslip Drawer */}
      <BetslipDrawer draftBet={draftBet} onClearBet={() => setDraftBet(null)} />
    </div>
  );
}
