"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, Activity, CalendarDays, TrendingUp, TrendingDown, Clock, X, Menu, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMatches, Match } from "@/lib/sportsData";
import { useTradingStore } from "@/lib/store";

const SPORTS = ["Soccer", "Tennis", "Basketball", "Cricket"];

const ExchangeCell = ({ value, trend, type, onClick, isSelected }: any) => {
  const isBack = type === 'back';
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center w-[50px] sm:w-[60px] h-[40px] border transition-colors group",
        isBack 
          ? "bg-back-bg border-[#bae6fd] hover:bg-[#bae6fd]" 
          : "bg-lay-bg border-[#fbcfe8] hover:bg-[#fbcfe8]",
        isSelected && (isBack ? "border-blue-500 border-2" : "border-pink-500 border-2"),
        trend === 'up' && "animate-flash-green",
        trend === 'down' && "animate-flash-red"
      )}
    >
      <span className={cn(
        "font-bold text-sm leading-none",
        isBack ? "text-back-text" : "text-lay-text"
      )}>
        {value ? value.toFixed(2) : '-'}
      </span>
      <span className="text-[9px] text-slate-500 font-medium">
        ${Math.floor(Math.random() * 1000) + 100}
      </span>
    </button>
  );
};

export default function SportsbookPage({ params }: { params: Promise<{ sport?: string[] }> }) {
  const unwrappedParams = use(params);
  
  const initialSportSlug = unwrappedParams.sport?.[0] ? unwrappedParams.sport[0].replace(/-/g, ' ') : "soccer";
  const sportParam = initialSportSlug.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [activeSport, setActiveSport] = useState(sportParam);
  const [activeFilter, setActiveFilter] = useState<'In-Play' | 'Today' | 'Tomorrow'>('In-Play');
  const [activeMarket, setActiveMarket] = useState('Match Odds');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileBetslip, setShowMobileBetslip] = useState(false);
  const [betslip, setBetslip] = useState<{ matchId: number; selection: string; odds: number; type: 'back' | 'lay'; stake: number }[]>([]);
  const placeSportsBet = useTradingStore(s => s.placeSportsBet);
  
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const sportKey = activeSport.toLowerCase();
    const simulated = generateMatches(sportKey === 'live overview' ? 'soccer' : sportKey, 20);
    setMatches(simulated.map(m => ({ ...m, status: activeFilter === 'In-Play' ? 'Live' : 'Upcoming' })));
    setIsLoading(false);
  }, [activeSport, activeFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(current => current.map(match => {
        if (Math.random() > 0.3) return match; 
        const tweak = () => (Math.random() * 0.04 - 0.02);
        return {
          ...match,
          odds: {
            team1: Math.max(1.01, match.odds.team1 + tweak()),
            draw: match.odds.draw ? Math.max(1.01, match.odds.draw + tweak()) : null,
            team2: Math.max(1.01, match.odds.team2 + tweak())
          },
          trend: {
            team1: Math.random() > 0.5 ? 'up' : 'down',
            draw: match.trend.draw ? (Math.random() > 0.5 ? 'up' : 'down') : null,
            team2: Math.random() > 0.5 ? 'up' : 'down'
          }
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleBet = (matchId: number, selection: string, odds: number, type: 'back' | 'lay') => {
    setBetslip((prev) => {
      const existing = prev.find((b) => b.matchId === matchId && b.selection === selection && b.type === type);
      if (existing) {
        return prev.filter((b) => !(b.matchId === matchId && b.selection === selection && b.type === type));
      }
      return [...prev, { matchId, selection, odds, type, stake: 100 }];
    });
  };

  const removeBet = (matchId: number, selection: string, type: 'back' | 'lay') => {
    setBetslip((prev) => prev.filter((b) => !(b.matchId === matchId && b.selection === selection && b.type === type)));
  };

  const updateStake = (matchId: number, selection: string, type: 'back' | 'lay', newStake: number) => {
    setBetslip((prev) => prev.map(b => 
      (b.matchId === matchId && b.selection === selection && b.type === type) ? { ...b, stake: newStake } : b
    ));
  };

  const totalLiability = betslip.reduce((acc, bet) => {
    if (bet.type === 'back') return acc + bet.stake;
    if (bet.type === 'lay') return acc + (bet.stake * bet.odds - bet.stake);
    return acc;
  }, 0);

  const totalPotentialReturn = betslip.reduce((acc, bet) => {
    if (bet.type === 'back') return acc + (bet.stake * bet.odds);
    if (bet.type === 'lay') return acc + bet.stake;
    return acc;
  }, 0);

  return (
    <div className="flex relative h-[calc(100vh-56px)] w-full bg-exchange-bg text-exchange-text overflow-hidden">
      
      {/* Mobile Drawer Overlays */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      {showMobileBetslip && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setShowMobileBetslip(false)}
        />
      )}

      {/* Column 1: Sports & Categories Hierarchy */}
      <div className={cn(
        "flex flex-col w-60 border-r border-exchange-border bg-exchange-surface shrink-0 z-40 transition-transform duration-300",
        "fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full",
        showMobileSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-exchange-border flex justify-between items-center">
          <h2 className="font-bold text-sm text-exchange-text uppercase tracking-wider">Categories</h2>
          <button className="md:hidden text-exchange-muted hover:text-exchange-text" onClick={() => setShowMobileSidebar(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {SPORTS.map(sport => (
            <div key={sport} className="flex flex-col">
              <button 
                onClick={() => setActiveSport(sport)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                  activeSport === sport ? "bg-slate-100 text-exchange-text font-bold border-l-2 border-blue-600" : "text-exchange-muted hover:bg-slate-50 hover:text-exchange-text"
                )}
              >
                <span>{sport}</span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm">{Math.floor(Math.random() * 50) + 10}</span>
              </button>
              {activeSport === sport && (
                <div className="ml-4 pl-2 border-l border-exchange-border mt-1 space-y-1">
                  {['Match Odds', 'Handicap', 'Over/Under'].map(market => (
                    <button 
                      key={market}
                      onClick={() => {
                        setActiveMarket(market);
                        setShowMobileSidebar(false);
                      }}
                      className={cn(
                        "text-xs block py-1 w-full text-left transition-colors",
                        activeMarket === market ? "text-blue-600 font-bold" : "text-exchange-muted hover:text-exchange-text"
                      )}
                    >
                      {market}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Exchange Data Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-exchange-surface">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-exchange-border bg-white shrink-0">
          <button onClick={() => setShowMobileSidebar(true)} className="flex items-center gap-2 font-bold text-sm">
            <Menu className="w-5 h-5 text-exchange-muted" />
            <span className="uppercase text-exchange-text">{activeSport}</span>
          </button>
          <button onClick={() => setShowMobileBetslip(true)} className="relative flex items-center gap-2 font-bold text-sm text-exchange-muted hover:text-exchange-text">
            <Receipt className="w-5 h-5" />
            {betslip.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center">
                {betslip.length}
              </span>
            )}
          </button>
        </div>

        {/* Filtering Tabs */}
        <div className="flex items-center gap-1 border-b border-exchange-border px-4 py-2 bg-slate-50 shrink-0">
          {['In-Play', 'Today', 'Tomorrow'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold transition-colors rounded-sm",
                activeFilter === filter 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-exchange-muted hover:bg-slate-200 hover:text-exchange-text"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Matrix Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-exchange-border bg-slate-100 shrink-0">
          <div className="flex-1 text-xs font-bold text-exchange-muted uppercase tracking-wider">Match</div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex w-[100px] sm:w-[120px] justify-center text-[10px] font-bold text-exchange-muted uppercase">1</div>
            <div className="flex w-[100px] sm:w-[120px] justify-center text-[10px] font-bold text-exchange-muted uppercase">X</div>
            <div className="flex w-[100px] sm:w-[120px] justify-center text-[10px] font-bold text-exchange-muted uppercase">2</div>
          </div>
        </div>

        {/* Matches Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {matches.map(match => (
            <div key={match.id} className="flex flex-col lg:flex-row items-center justify-between border-b border-exchange-border hover:bg-slate-50 transition-colors">
              
              <div className="flex-1 w-full px-4 py-3 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center shrink-0 w-12 text-center border-r border-exchange-border pr-3">
                  <span className="text-[10px] font-bold text-exchange-muted uppercase mb-1">{match.status === 'Live' ? <span className="text-green-600 animate-pulse">Live</span> : 'Soon'}</span>
                  <span className="text-xs font-black text-exchange-text">{match.score.split(',')[0] || "0-0"}</span>
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <span className="text-sm font-bold text-exchange-text truncate">{match.team1}</span>
                  <span className="text-sm font-bold text-exchange-text truncate">{match.team2}</span>
                </div>
              </div>

              {/* High Density Back/Lay Grid */}
              <div className="flex items-center gap-1 shrink-0 p-2 border-t lg:border-t-0 border-exchange-border w-full lg:w-auto justify-end bg-slate-50/50">
                
                {/* Selection 1 */}
                <div className="flex">
                  <ExchangeCell 
                    value={match.odds.team1} trend={match.trend.team1} type="back" 
                    isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team1 && b.type === 'back')}
                    onClick={() => toggleBet(match.id, match.team1, match.odds.team1, 'back')} 
                  />
                  <ExchangeCell 
                    value={match.odds.team1 + 0.02} trend={match.trend.team1} type="lay" 
                    isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team1 && b.type === 'lay')}
                    onClick={() => toggleBet(match.id, match.team1, match.odds.team1 + 0.02, 'lay')} 
                  />
                </div>

                {/* Selection X */}
                <div className="flex">
                  <ExchangeCell 
                    value={match.odds.draw || 3.5} trend={match.trend.draw} type="back" 
                    isSelected={betslip.some(b => b.matchId === match.id && b.selection === "Draw" && b.type === 'back')}
                    onClick={() => toggleBet(match.id, "Draw", match.odds.draw || 3.5, 'back')} 
                  />
                  <ExchangeCell 
                    value={(match.odds.draw || 3.5) + 0.05} trend={match.trend.draw} type="lay" 
                    isSelected={betslip.some(b => b.matchId === match.id && b.selection === "Draw" && b.type === 'lay')}
                    onClick={() => toggleBet(match.id, "Draw", (match.odds.draw || 3.5) + 0.05, 'lay')} 
                  />
                </div>

                {/* Selection 2 */}
                <div className="flex">
                  <ExchangeCell 
                    value={match.odds.team2} trend={match.trend.team2} type="back" 
                    isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team2 && b.type === 'back')}
                    onClick={() => toggleBet(match.id, match.team2, match.odds.team2, 'back')} 
                  />
                  <ExchangeCell 
                    value={match.odds.team2 + 0.02} trend={match.trend.team2} type="lay" 
                    isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team2 && b.type === 'lay')}
                    onClick={() => toggleBet(match.id, match.team2, match.odds.team2 + 0.02, 'lay')} 
                  />
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Side-Docked Transaction Slip */}
      <div className={cn(
        "flex flex-col w-[320px] max-w-[85vw] bg-exchange-surface border-l border-exchange-border shrink-0 z-40 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] transition-transform duration-300",
        "fixed inset-y-0 right-0 lg:relative lg:translate-x-0 h-full",
        showMobileBetslip ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 border-b border-exchange-border bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-sm text-exchange-text uppercase tracking-wider">Bet Slip</h2>
          <button className="lg:hidden text-exchange-muted hover:text-exchange-text" onClick={() => setShowMobileBetslip(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          {betslip.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-50">
              <span className="text-exchange-muted text-sm font-medium">Click on odds to add selections to your bet slip.</span>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {betslip.map(bet => {
                const match = matches.find(m => m.id === bet.matchId);
                const isBack = bet.type === 'back';
                return (
                  <div key={`${bet.matchId}-${bet.selection}-${bet.type}`} className={cn(
                    "border rounded-sm bg-white overflow-hidden shadow-sm relative group",
                    isBack ? "border-[#bae6fd]" : "border-[#fbcfe8]"
                  )}>
                    <div className={cn("px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase flex items-center justify-between", isBack ? "bg-blue-500" : "bg-pink-500")}>
                      <span>{isBack ? "Back" : "Lay"}</span>
                      <button onClick={() => removeBet(bet.matchId, bet.selection, bet.type)} className="hover:bg-slate-900/20 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] text-exchange-muted uppercase tracking-wide truncate mb-1">
                        {match?.team1} vs {match?.team2}
                      </div>
                      <div className="text-sm font-bold text-exchange-text mb-3">
                        {bet.selection}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] text-exchange-muted font-bold uppercase block mb-1">Odds</label>
                          <div className="bg-slate-50 border border-exchange-border rounded-sm px-2 py-1.5 text-sm font-black text-center">
                            {bet.odds.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-[2]">
                          <label className="text-[10px] text-exchange-muted font-bold uppercase block mb-1">Stake ($)</label>
                          <input 
                            type="number" 
                            value={bet.stake}
                            onChange={(e) => updateStake(bet.matchId, bet.selection, bet.type, parseInt(e.target.value) || 0)}
                            className="w-full border border-exchange-border rounded-sm px-2 py-1.5 text-sm font-black focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Interactive Risk Slider */}
                      <div className="mt-4 pt-3 border-t border-exchange-border">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-exchange-muted uppercase">Risk Slider</span>
                          <span className={cn(isBack ? "text-blue-600" : "text-pink-600")}>${bet.stake}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="1000" 
                          step="10" 
                          value={bet.stake}
                          onChange={(e) => updateStake(bet.matchId, bet.selection, bet.type, parseInt(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold">
                          <span className="text-slate-500">Liability: <span className="text-red-600">${isBack ? bet.stake : (bet.stake * bet.odds - bet.stake).toFixed(2)}</span></span>
                          <span className="text-slate-500">Profit: <span className="text-green-600">${isBack ? (bet.stake * bet.odds - bet.stake).toFixed(2) : bet.stake}</span></span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {betslip.length > 0 && (
          <div className="p-4 bg-slate-100 border-t border-exchange-border shrink-0 space-y-2">
            <div className="flex justify-between text-xs font-bold text-exchange-muted">
              <span>Total Liability:</span>
              <span className="text-red-600">${totalLiability.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-exchange-muted">
              <span>Total Return:</span>
              <span className="text-green-600">${totalPotentialReturn.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                placeSportsBet("Exchange Bet", `${betslip.length} selections`, 1.0, totalLiability);
                setBetslip([]);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-sm transition-colors mt-2"
            >
              Place Bets
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
