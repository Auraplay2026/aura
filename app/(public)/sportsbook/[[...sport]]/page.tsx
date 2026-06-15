"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, Activity, CalendarDays, TrendingUp, TrendingDown, Clock, X, Menu, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMatches, Match } from "@/lib/sportsData";
import { useTradingStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { useSidebarContext } from "@/components/layout/AppProviders";

const SPORTS = ["Soccer", "Tennis", "Basketball", "Cricket"];

// High Density Back/Lay cell for general Match Odds
const ExchangeCell = ({ value, trend, type, onClick, isSelected, suspended }: any) => {
  const isBack = type === 'back';
  
  if (suspended) {
    return (
      <div className="relative flex flex-col items-center justify-center w-[50px] sm:w-[60px] h-[40px] border border-slate-200 bg-slate-100 overflow-hidden cursor-not-allowed">
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-10">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Suspend</span>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center w-[50px] sm:w-[60px] h-[40px] transition-colors group",
        isBack 
          ? "bg-[#D1FAE5] hover:bg-[#A7F3D0] border-r border-white/50" 
          : "bg-[#FCE7F3] hover:bg-[#fbcfe8] border-r border-white/50",
        isSelected && (isBack ? "border-[#059669] border-2" : "border-[#DB2777] border-2"),
        trend === 'up' && "animate-flash-green",
        trend === 'down' && "animate-flash-red"
      )}
    >
      <span className={cn(
        "font-bold text-sm leading-none",
        isBack ? "text-[#059669]" : "text-[#DB2777]"
      )}>
        {value ? value.toFixed(2) : '-'}
      </span>
      <span className="text-[9px] text-slate-500 font-medium">
        ₹{Math.floor(Math.random() * 1000) + 100}
      </span>
    </button>
  );
};

// High density borderless Outcome row with Back/Lay selection for Micro-Markets
const MicroMarketOutcomeRow = ({ outcomeName, backOdds, layOdds, trend, isSuspended, onSelect, activeSelection }: any) => {
  return (
    <div className="flex items-center justify-between py-1 bg-white border-b border-slate-100">
      <span className="text-xs font-bold text-slate-800 tracking-wide truncate max-w-[130px] sm:max-w-[180px]">{outcomeName}</span>
      <div className="flex items-center gap-1 shrink-0">
        
        {/* Back Button (Green theme) */}
        <button
          onClick={() => !isSuspended && onSelect('back', backOdds)}
          disabled={isSuspended}
          className={cn(
            "flex flex-col items-center justify-center w-[55px] h-[34px] transition-colors rounded-sm border border-slate-100",
            isSuspended 
              ? "bg-slate-50 cursor-not-allowed opacity-50" 
              : "bg-[#D1FAE5] hover:bg-[#A7F3D0] border-emerald-100",
            activeSelection?.type === 'back' && "border-2 border-emerald-600 bg-[#A7F3D0]"
          )}
        >
          <span className={cn(
            "font-black text-xs leading-none transition-all duration-200",
            isSuspended ? "text-slate-400" : "text-emerald-800",
            trend === 'up' && "text-[#16A34A] scale-110",
            trend === 'down' && "text-[#DC2626] scale-95"
          )}>
            {backOdds ? backOdds.toFixed(2) : '-'}
          </span>
          <span className="text-[7.5px] text-emerald-600 font-medium leading-none mt-0.5">
            ₹{Math.floor(Math.random() * 5000) + 500}
          </span>
        </button>

        {/* Lay Button (Pink theme) */}
        <button
          onClick={() => !isSuspended && onSelect('lay', layOdds)}
          disabled={isSuspended}
          className={cn(
            "flex flex-col items-center justify-center w-[55px] h-[34px] transition-colors rounded-sm border border-slate-100",
            isSuspended 
              ? "bg-slate-50 cursor-not-allowed opacity-50" 
              : "bg-[#FCE7F3] hover:bg-[#fbcfe8] border-pink-100",
            activeSelection?.type === 'lay' && "border-2 border-pink-600 bg-[#fbcfe8]"
          )}
        >
          <span className={cn(
            "font-black text-xs leading-none transition-all duration-200",
            isSuspended ? "text-slate-400" : "text-pink-800",
            trend === 'up' && "text-[#16A34A] scale-95",
            trend === 'down' && "text-[#DC2626] scale-110"
          )}>
            {layOdds ? layOdds.toFixed(2) : '-'}
          </span>
          <span className="text-[7.5px] text-pink-600 font-medium leading-none mt-0.5">
            ₹{Math.floor(Math.random() * 5000) + 500}
          </span>
        </button>

      </div>
    </div>
  );
};

export default function SportsbookPage({ params }: { params: Promise<{ sport?: string[] }> }) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const sportQuery = searchParams.get("sport");
  const { setIsMobileMenuOpen } = useSidebarContext();
  
  const initialSportSlug = unwrappedParams.sport?.[0] ? unwrappedParams.sport[0].replace(/-/g, ' ') : "soccer";
  const sportParam = initialSportSlug.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [activeSport, setActiveSport] = useState(sportParam);
  const [activeFilter, setActiveFilter] = useState<'In-Play' | 'Today' | 'Tomorrow'>('In-Play');
  const [activeMarket, setActiveMarket] = useState('Match Odds');
  const [showMobileBetslip, setShowMobileBetslip] = useState(false);
  
  // Traditional Match Odds Bet Slip
  const [betslip, setBetslip] = useState<{ matchId: number; selection: string; odds: number; type: 'back' | 'lay'; stake: number }[]>([]);
  
  const placeSportsBet = useTradingStore(s => s.placeSportsBet);
  const walletBalance = useTradingStore(s => s.balance);
  
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  // Expanded match for micro-markets
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  // --- High Velocity Micro-Market Math & State Engine ---
  const [acceptAnyOdds, setAcceptAnyOdds] = useState(false);
  const [simulatedLatency, setSimulatedLatency] = useState(150); // slider range 50 - 600ms
  const [streamTime, setStreamTime] = useState<number>(Date.now());

  // Cricket Lines & Odds (Over/Under Session and Delivery)
  const [cricketLine, setCricketLine] = useState(155.5);
  const [cricketOdds, setCricketOdds] = useState({ over: 1.85, under: 1.85 });
  const [cricketTrend, setCricketTrend] = useState({ over: null as 'up'|'down'|null, under: null as 'up'|'down'|null });
  const [tossLineTrend, setTossLineTrend] = useState<'up' | 'down' | null>(null);
  
  const [ballLine, setBallLine] = useState({ line: 1.5, overOdds: 1.80, underOdds: 1.95 });
  const [ballTrend, setBallTrend] = useState({ over: null as 'up'|'down'|null, under: null as 'up'|'down'|null });

  // Tennis Point-by-point & Deuce Odds
  const [tennisPointOdds, setTennisPointOdds] = useState({ p1: 1.65, p2: 2.10 });
  const [tennisPointTrend, setTennisPointTrend] = useState({ p1: null as 'up'|'down'|null, p2: null as 'up'|'down'|null });
  const [tennisDeuceOdds, setTennisDeuceOdds] = useState({ yes: 3.40, no: 1.25 });
  const [tennisDeuceTrend, setTennisDeuceTrend] = useState({ yes: null as 'up'|'down'|null, no: null as 'up'|'down'|null });

  // Soccer minute proposition events
  const [soccerMinuteOdds, setSoccerMinuteOdds] = useState({ corner: 3.50, card: 6.00, goal: 12.00, throwIn: 1.15 });
  const [soccerMinuteTrend, setSoccerMinuteTrend] = useState({ corner: null as 'up'|'down'|null, card: null as 'up'|'down'|null, goal: null as 'up'|'down'|null, throwIn: null as 'up'|'down'|null });

  // Micro-market Betting HUD Selection
  const [hudSelection, setHudSelection] = useState<{
    matchId: number;
    matchTitle: string;
    sport: string;
    marketName: string;
    selectionName: string;
    odds: number;
    type: 'back' | 'lay';
    lineValue?: number;
  } | null>(null);

  const [hudStake, setHudStake] = useState<number>(100);
  const [betPlacing, setBetPlacing] = useState(false);
  const [betSuccessFlash, setBetSuccessFlash] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  
  // Placed bets ledger for risk validation
  const [placedMicroBets, setPlacedMicroBets] = useState<any[]>([]);

  useEffect(() => {
    if (sportQuery) {
      const formatted = sportQuery.charAt(0).toUpperCase() + sportQuery.slice(1);
      setActiveSport(formatted);
    }
  }, [sportQuery]);

  // Fetch real matches
  useEffect(() => {
    let active = true;
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const sportKey = activeSport.toLowerCase();
        const res = await fetch(`/api/sports/live?sport=${sportKey === 'live overview' ? 'soccer' : sportKey}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.success && active) {
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error("Failed to fetch sports matches:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchMatches();
    const listInterval = setInterval(fetchMatches, 30000);

    return () => {
      active = false;
      clearInterval(listInterval);
    };
  }, [activeSport]);

  // Fluctuate General Match Odds
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(current => current.map(match => {
        if (Math.random() > 0.35) return match; 
        const tweak = () => (Math.random() * 0.04 - 0.02);
        const isSuspended = Math.random() < 0.01;

        return {
          ...match,
          suspended: isSuspended ? true : (match.suspended || false),
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

  // --- High-Velocity Micro-Market Feeds Simulator ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setStreamTime(now - simulatedLatency); // stream time lags by simulated latency

      const delta = () => (Math.random() * 0.08 - 0.04);

      // 1. Shift cricket runs line
      if (Math.random() < 0.20) {
        setCricketLine(line => {
          const shift = Math.random() > 0.5 ? 1 : -1;
          const newLine = Math.max(120.5, Math.min(220.5, line + shift));
          return newLine;
        });
      }

      // 2. Fluctuating odds & lines
      setCricketOdds(prev => {
        const diff = delta();
        setCricketTrend({
          over: diff > 0 ? 'up' : 'down',
          under: diff < 0 ? 'up' : 'down'
        });
        setTimeout(() => setCricketTrend({ over: null, under: null }), 800);
        return {
          over: Math.max(1.10, Math.min(4.50, prev.over + diff)),
          under: Math.max(1.10, Math.min(4.50, prev.under - diff))
        };
      });

      setBallLine(prev => {
        const diff = delta();
        setBallTrend({
          over: diff > 0 ? 'up' : 'down',
          under: diff < 0 ? 'up' : 'down'
        });
        setTimeout(() => setBallTrend({ over: null, under: null }), 800);
        return {
          ...prev,
          overOdds: Math.max(1.10, prev.overOdds + diff),
          underOdds: Math.max(1.10, prev.underOdds - diff)
        };
      });

      setTennisPointOdds(prev => {
        const diff = delta();
        setTennisPointTrend({
          p1: diff > 0 ? 'up' : 'down',
          p2: diff < 0 ? 'up' : 'down'
        });
        setTimeout(() => setTennisPointTrend({ p1: null, p2: null }), 800);
        return {
          p1: Math.max(1.05, prev.p1 + diff),
          p2: Math.max(1.05, prev.p2 - diff)
        };
      });

      setTennisDeuceOdds(prev => {
        const diff = delta();
        setTennisDeuceTrend({
          yes: diff > 0 ? 'up' : 'down',
          no: diff < 0 ? 'up' : 'down'
        });
        setTimeout(() => setTennisDeuceTrend({ yes: null, no: null }), 800);
        return {
          yes: Math.max(1.1, prev.yes + diff),
          no: Math.max(1.02, prev.no - diff)
        };
      });

      setSoccerMinuteOdds(prev => {
        const diff = delta();
        setSoccerMinuteTrend({
          corner: diff > 0 ? 'up' : 'down',
          card: Math.random() > 0.5 ? 'up' : 'down',
          goal: Math.random() > 0.5 ? 'up' : 'down',
          throwIn: diff < 0 ? 'up' : 'down'
        });
        setTimeout(() => setSoccerMinuteTrend({ corner: null, card: null, goal: null, throwIn: null }), 800);
        return {
          corner: Math.max(1.10, prev.corner + diff),
          card: Math.max(2.0, prev.card + delta() * 2),
          goal: Math.max(4.0, prev.goal + delta() * 4),
          throwIn: Math.max(1.02, prev.throwIn + delta() * 0.1)
        };
      });

      if (Math.random() < 0.1) {
        setTossLineTrend(Math.random() > 0.5 ? 'up' : 'down');
        setTimeout(() => setTossLineTrend(null), 800);
      }

    }, 1500);

    return () => clearInterval(interval);
  }, [simulatedLatency]);

  // General Bet slip methods
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

  // Match Filter
  const filteredMatches = matches.filter((match: any) => {
    if (activeFilter === 'In-Play') {
      return match.status === 'Live';
    } else {
      return match.status === 'Upcoming';
    }
  });

  // Latency suspension active status
  const isFeedSuspended = simulatedLatency > 350 && !acceptAnyOdds;

  // Interdependent Ledger Risk Validation
  const validatePlatformRisk = (newBet: any, existingBets: any[]): { safe: boolean; maxLiability: number } => {
    const RISK_CAP = 100000; // ₹100,000 risk threshold
    const allBets = [...existingBets, newBet];
    
    // Evaluate binary session overlapping lines
    const runLines = allBets
      .filter(b => b.marketName === 'Session Runs' || b.marketName === 'Ball-by-Ball Runs')
      .map(b => b.lineValue || 155.5);
    
    // Boundary test points
    const testPoints = [0, 50, 100, 150, 200, 250, 300];
    runLines.forEach(l => {
      testPoints.push(l - 0.5);
      testPoints.push(l + 0.5);
    });

    let maxPlatformLoss = 0;

    for (const point of testPoints) {
      let platformNet = 0;
      for (const bet of allBets) {
        if (bet.marketName === 'Session Runs' || bet.marketName === 'Ball-by-Ball Runs') {
          const isOver = bet.selectionName.toLowerCase().includes('over');
          const isWin = isOver ? (point > (bet.lineValue || 0)) : (point < (bet.lineValue || 0));
          
          if (bet.type === 'back') {
            if (isWin) {
              platformNet -= bet.stake * (bet.odds - 1);
            } else {
              platformNet += bet.stake;
            }
          } else { // Lay bet
            if (isWin) {
              platformNet += bet.stake;
            } else {
              platformNet -= bet.stake * (bet.odds - 1);
            }
          }
        } else {
          // Independent market worst-case payouts
          const isWin = Math.random() > 0.5; // generic simulation for independent worst case scenario
          if (bet.type === 'back') {
            platformNet -= bet.stake * (bet.odds - 1);
          } else {
            platformNet -= bet.stake * (bet.odds - 1);
          }
        }
      }
      const platformLoss = -platformNet;
      if (platformLoss > maxPlatformLoss) {
        maxPlatformLoss = platformLoss;
      }
    }

    return {
      safe: maxPlatformLoss <= RISK_CAP,
      maxLiability: maxPlatformLoss
    };
  };

  return (
    <div className="flex relative h-[calc(100vh-56px)] w-full bg-exchange-bg text-exchange-text overflow-hidden">
      
      {/* Mobile Drawer Overlays */}
      {showMobileBetslip && (
        <div 
          className="fixed inset-0 bg-black/50 z-[48] lg:hidden" 
          onClick={() => setShowMobileBetslip(false)}
        />
      )}

      {/* Column 2: Exchange Data Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-exchange-surface">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-exchange-border bg-white shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex items-center gap-2 font-bold text-sm">
            <Menu className="w-5 h-5 text-exchange-muted" />
            <span className="uppercase text-exchange-text">{activeSport}</span>
          </button>
          <button onClick={() => setShowMobileBetslip(true)} className="relative flex items-center gap-2 font-bold text-sm text-exchange-muted hover:text-exchange-text">
            <Receipt className="w-5 h-5" />
            {betslip.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center">
                {betslip.length}
              </span>
            )}
          </button>
        </div>

        {/* Filtering Tabs */}
        <div className="flex items-center gap-4 border-b border-exchange-border px-4 py-2 bg-white shrink-0">
          {['In-Play', 'Today', 'Tomorrow'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={cn(
                "px-2 py-1 text-sm font-bold transition-all relative",
                activeFilter === filter 
                  ? "text-slate-900" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {filter}
              {activeFilter === filter && (
                <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#ef4444] rounded-t-sm" />
              )}
            </button>
          ))}
        </div>

        {/* Matrix Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-exchange-border bg-slate-100 shrink-0">
          <div className="flex-1 text-xs font-bold text-exchange-muted uppercase tracking-wider">Match (Click to expand micro-markets)</div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex w-[100px] sm:w-[120px] justify-center text-[10px] font-bold text-exchange-muted uppercase">1</div>
            <div className="flex w-[100px] sm:w-[120px] justify-center text-[10px] font-bold text-exchange-muted uppercase">X</div>
            <div className="flex w-[100px] sm:w-[120px] justify-center text-[10px] font-bold text-exchange-muted uppercase">2</div>
          </div>
        </div>

        {/* Matches Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="w-8 h-8 border-4 border-t-red-600 border-r-transparent border-slate-200 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold uppercase tracking-wider">Syncing worldwide sports exchange data...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Trophy className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold uppercase tracking-wider">No {activeFilter} Matches Available</p>
              <p className="text-xs text-slate-400 mt-1">Check other filters or try again later</p>
            </div>
          ) : (
            filteredMatches.map((match: any) => (
              <div key={match.id} className="flex flex-col border-b border-exchange-border hover:bg-slate-50 transition-colors relative">
                
                {/* Main Match Odds Row */}
                <div className="flex flex-col lg:flex-row items-center justify-between">
                  <div 
                    onClick={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                    className="flex-1 w-full px-4 py-3 flex items-center gap-4 cursor-pointer select-none"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                          {match.team1Logo && (
                            <img 
                              src={match.team1Logo} 
                              alt={match.team1} 
                              className="w-5 h-5 object-contain rounded-full bg-slate-100 p-0.5 border border-slate-200 shrink-0" 
                              onError={(e) => { (e.target as any).style.display = 'none'; }}
                            />
                          )}
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                            {match.team1}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase shrink-0">vs</span>
                        <div className="flex items-center gap-2">
                          {match.team2Logo && (
                            <img 
                              src={match.team2Logo} 
                              alt={match.team2} 
                              className="w-5 h-5 object-contain rounded-full bg-slate-100 p-0.5 border border-slate-200 shrink-0" 
                              onError={(e) => { (e.target as any).style.display = 'none'; }}
                            />
                          )}
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                            {match.team2}
                          </span>
                        </div>
                        <span className="text-slate-400 ml-1">
                          {expandedMatchId === match.id ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                        {match.status === 'Live' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-800 animate-pulse shrink-0">
                            ● LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-800 shrink-0">
                            SCHEDULED
                          </span>
                        )}
                        <span>•</span>
                        <span>ID: #{match.id.toString().padStart(6, '0')}</span>
                        <span>•</span>
                        <span className={cn(match.status === 'Live' ? "text-emerald-600 font-black normal-case text-xs" : "text-slate-600 normal-case")}>
                          {match.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High Density Back/Lay Grid */}
                  <div className="flex items-center gap-px shrink-0 p-2 border-t lg:border-t-0 border-exchange-border w-full lg:w-auto justify-end bg-slate-50/50">
                    
                    {/* Selection 1 */}
                    <div className="flex gap-px mr-1">
                      <ExchangeCell 
                        value={match.odds.team1} trend={match.trend.team1} type="back" suspended={match.suspended}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team1 && b.type === 'back')}
                        onClick={() => !match.suspended && toggleBet(match.id, match.team1, match.odds.team1, 'back')} 
                      />
                      <ExchangeCell 
                        value={match.odds.team1 + 0.02} trend={match.trend.team1} type="lay" suspended={match.suspended}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team1 && b.type === 'lay')}
                        onClick={() => !match.suspended && toggleBet(match.id, match.team1, match.odds.team1 + 0.02, 'lay')} 
                      />
                    </div>

                    {/* Selection X */}
                    <div className="flex gap-px mr-1">
                      <ExchangeCell 
                        value={match.odds.draw} trend={match.trend.draw} type="back" suspended={match.suspended || match.odds.draw === null}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === "Draw" && b.type === 'back')}
                        onClick={() => !match.suspended && match.odds.draw !== null && toggleBet(match.id, "Draw", match.odds.draw, 'back')} 
                      />
                      <ExchangeCell 
                        value={match.odds.draw ? match.odds.draw + 0.05 : null} trend={match.trend.draw} type="lay" suspended={match.suspended || match.odds.draw === null}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === "Draw" && b.type === 'lay')}
                        onClick={() => !match.suspended && match.odds.draw !== null && toggleBet(match.id, "Draw", match.odds.draw + 0.05, 'lay')} 
                      />
                    </div>

                    {/* Selection 2 */}
                    <div className="flex gap-px">
                      <ExchangeCell 
                        value={match.odds.team2} trend={match.trend.team2} type="back" suspended={match.suspended}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team2 && b.type === 'back')}
                        onClick={() => !match.suspended && toggleBet(match.id, match.team2, match.odds.team2, 'back')} 
                      />
                      <ExchangeCell 
                        value={match.odds.team2 + 0.02} trend={match.trend.team2} type="lay" suspended={match.suspended}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team2 && b.type === 'lay')}
                        onClick={() => !match.suspended && toggleBet(match.id, match.team2, match.odds.team2 + 0.02, 'lay')} 
                      />
                    </div>

                  </div>
                </div>

                {/* --- 4. Inline Expansion Panel (Micro-Markets HUD) --- */}
                {expandedMatchId === match.id && (
                  <div className="w-full bg-[#FFFFFF] border-t border-exchange-border p-3.5 space-y-4">
                    
                    {/* Controls & Protections Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded border border-slate-200 shadow-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#16A34A] animate-pulse" />
                          <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                            Live Micro-Market & Session Betting
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          High-velocity binary session options. Platform Risk Cap: ₹100,000 max liability.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        {/* Latency slider */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-600 uppercase">Simulated Latency:</span>
                          <input
                            type="range"
                            min="50"
                            max="600"
                            step="50"
                            value={simulatedLatency}
                            onChange={(e) => setSimulatedLatency(parseInt(e.target.value))}
                            className="w-20 sm:w-24 h-1 accent-[#16A34A] bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className={cn(
                            "text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded leading-none",
                            simulatedLatency > 350 ? "bg-red-100 text-[#DC2626]" : "bg-emerald-100 text-[#16A34A]"
                          )}>
                            {simulatedLatency}ms
                          </span>
                        </div>

                        {/* Accept any odds checkbox */}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptAnyOdds}
                            onChange={(e) => setAcceptAnyOdds(e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#16A34A] rounded text-[#16A34A] border-slate-300"
                          />
                          <span className="text-[10px] font-black text-slate-700 uppercase select-none">
                            Accept Any Odds
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Latency Warning Block */}
                    {isFeedSuspended && (
                      <div className="bg-red-50 border border-red-200 rounded p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#DC2626] animate-spin" />
                          <span className="text-[10px] font-black text-[#DC2626] uppercase tracking-wide">
                            Data Stream Suspended (Feed Latency: {simulatedLatency}ms &gt; 350ms threshold)
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-red-500 uppercase">
                          Enable "Accept Any Odds" to override
                        </span>
                      </div>
                    )}

                    {/* Dynamic Sports Micro-Markets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      
                      {/* --- Cricket Markets --- */}
                      {match.sport === 'Cricket' && (
                        <>
                          {/* Toss Winner */}
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">Toss Winner</span>
                            <MicroMarketOutcomeRow 
                              outcomeName={match.team1}
                              backOdds={1.91}
                              layOdds={1.96}
                              trend={tossLineTrend}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Cricket',
                                marketName: 'Toss Winner',
                                selectionName: match.team1,
                                odds,
                                type
                              })}
                              activeSelection={hudSelection?.marketName === 'Toss Winner' && hudSelection?.selectionName === match.team1 ? hudSelection : null}
                            />
                            <MicroMarketOutcomeRow 
                              outcomeName={match.team2}
                              backOdds={1.91}
                              layOdds={1.96}
                              trend={tossLineTrend}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Cricket',
                                marketName: 'Toss Winner',
                                selectionName: match.team2,
                                odds,
                                type
                              })}
                              activeSelection={hudSelection?.marketName === 'Toss Winner' && hudSelection?.selectionName === match.team2 ? hudSelection : null}
                            />
                          </div>

                          {/* Session runs Over/Under */}
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                              <span>Session Runs (1st Innings 20 Ov)</span>
                              <span className="text-[#DC2626] font-black animate-pulse bg-red-50 px-1 py-0.5 rounded">Line: {cricketLine}</span>
                            </div>
                            <MicroMarketOutcomeRow 
                              outcomeName={`Over ${cricketLine}`}
                              backOdds={cricketOdds.over}
                              layOdds={cricketOdds.over + 0.05}
                              trend={cricketTrend.over}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Cricket',
                                marketName: 'Session Runs',
                                selectionName: `Over ${cricketLine}`,
                                odds,
                                type,
                                lineValue: cricketLine
                              })}
                              activeSelection={hudSelection?.marketName === 'Session Runs' && hudSelection?.selectionName.includes('Over') ? hudSelection : null}
                            />
                            <MicroMarketOutcomeRow 
                              outcomeName={`Under ${cricketLine}`}
                              backOdds={cricketOdds.under}
                              layOdds={cricketOdds.under + 0.05}
                              trend={cricketTrend.under}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Cricket',
                                marketName: 'Session Runs',
                                selectionName: `Under ${cricketLine}`,
                                odds,
                                type,
                                lineValue: cricketLine
                              })}
                              activeSelection={hudSelection?.marketName === 'Session Runs' && hudSelection?.selectionName.includes('Under') ? hudSelection : null}
                            />
                          </div>

                          {/* Ball-by-ball Proposition */}
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">
                              Ball-by-Ball (19th Over - 5th Ball)
                            </span>
                            <MicroMarketOutcomeRow 
                              outcomeName={`Over ${ballLine.line} Runs`}
                              backOdds={ballLine.overOdds}
                              layOdds={ballLine.overOdds + 0.05}
                              trend={ballTrend.over}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Cricket',
                                marketName: 'Ball-by-Ball Runs',
                                selectionName: `Over ${ballLine.line}`,
                                odds,
                                type,
                                lineValue: ballLine.line
                              })}
                              activeSelection={hudSelection?.marketName === 'Ball-by-Ball Runs' && hudSelection?.selectionName.includes('Over') ? hudSelection : null}
                            />
                            <MicroMarketOutcomeRow 
                              outcomeName={`Under ${ballLine.line} Runs`}
                              backOdds={ballLine.underOdds}
                              layOdds={ballLine.underOdds + 0.05}
                              trend={ballTrend.under}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Cricket',
                                marketName: 'Ball-by-Ball Runs',
                                selectionName: `Under ${ballLine.line}`,
                                odds,
                                type,
                                lineValue: ballLine.line
                              })}
                              activeSelection={hudSelection?.marketName === 'Ball-by-Ball Runs' && hudSelection?.selectionName.includes('Under') ? hudSelection : null}
                            />
                          </div>
                        </>
                      )}

                      {/* --- Tennis Point-by-Point Markets --- */}
                      {match.sport === 'Tennis' && (
                        <>
                          {/* Point Winner */}
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">Point Winner (Curr Game)</span>
                            <MicroMarketOutcomeRow 
                              outcomeName={match.team1}
                              backOdds={tennisPointOdds.p1}
                              layOdds={tennisPointOdds.p1 + 0.05}
                              trend={tennisPointTrend.p1}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Tennis',
                                marketName: 'Point Winner',
                                selectionName: match.team1,
                                odds,
                                type
                              })}
                              activeSelection={hudSelection?.marketName === 'Point Winner' && hudSelection?.selectionName === match.team1 ? hudSelection : null}
                            />
                            <MicroMarketOutcomeRow 
                              outcomeName={match.team2}
                              backOdds={tennisPointOdds.p2}
                              layOdds={tennisPointOdds.p2 + 0.05}
                              trend={tennisPointTrend.p2}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Tennis',
                                marketName: 'Point Winner',
                                selectionName: match.team2,
                                odds,
                                type
                              })}
                              activeSelection={hudSelection?.marketName === 'Point Winner' && hudSelection?.selectionName === match.team2 ? hudSelection : null}
                            />
                          </div>

                          {/* Deuce Status */}
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">Will game reach Deuce (40-40)?</span>
                            <MicroMarketOutcomeRow 
                              outcomeName="Yes (Deuce)"
                              backOdds={tennisDeuceOdds.yes}
                              layOdds={tennisDeuceOdds.yes + 0.10}
                              trend={tennisDeuceTrend.yes}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Tennis',
                                marketName: 'Deuce Status',
                                selectionName: 'Yes',
                                odds,
                                type
                              })}
                              activeSelection={hudSelection?.marketName === 'Deuce Status' && hudSelection?.selectionName === 'Yes' ? hudSelection : null}
                            />
                            <MicroMarketOutcomeRow 
                              outcomeName="No (Deuce)"
                              backOdds={tennisDeuceOdds.no}
                              layOdds={tennisDeuceOdds.no + 0.05}
                              trend={tennisDeuceTrend.no}
                              isSuspended={isFeedSuspended}
                              onSelect={(type: any, odds: any) => setHudSelection({
                                matchId: match.id,
                                matchTitle: `${match.team1} vs ${match.team2}`,
                                sport: 'Tennis',
                                marketName: 'Deuce Status',
                                selectionName: 'No',
                                odds,
                                type
                              })}
                              activeSelection={hudSelection?.marketName === 'Deuce Status' && hudSelection?.selectionName === 'No' ? hudSelection : null}
                            />
                          </div>
                        </>
                      )}

                      {/* --- Soccer In-Play Flash Markets --- */}
                      {match.sport === 'Soccer' && (
                        <>
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm md:col-span-2 lg:col-span-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">
                              Soccer In-Play Flash (Next 1-Minute Event Tracker)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              
                              <div className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                <MicroMarketOutcomeRow 
                                  outcomeName="Corner Kick"
                                  backOdds={soccerMinuteOdds.corner}
                                  layOdds={soccerMinuteOdds.corner + 0.1}
                                  trend={soccerMinuteTrend.corner}
                                  isSuspended={isFeedSuspended}
                                  onSelect={(type: any, odds: any) => setHudSelection({
                                    matchId: match.id,
                                    matchTitle: `${match.team1} vs ${match.team2}`,
                                    sport: 'Soccer',
                                    marketName: '1-Min Event',
                                    selectionName: 'Corner',
                                    odds,
                                    type
                                  })}
                                  activeSelection={hudSelection?.marketName === '1-Min Event' && hudSelection?.selectionName === 'Corner' ? hudSelection : null}
                                />
                              </div>

                              <div className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                <MicroMarketOutcomeRow 
                                  outcomeName="Booking Card"
                                  backOdds={soccerMinuteOdds.card}
                                  layOdds={soccerMinuteOdds.card + 0.2}
                                  trend={soccerMinuteTrend.card}
                                  isSuspended={isFeedSuspended}
                                  onSelect={(type: any, odds: any) => setHudSelection({
                                    matchId: match.id,
                                    matchTitle: `${match.team1} vs ${match.team2}`,
                                    sport: 'Soccer',
                                    marketName: '1-Min Event',
                                    selectionName: 'Card',
                                    odds,
                                    type
                                  })}
                                  activeSelection={hudSelection?.marketName === '1-Min Event' && hudSelection?.selectionName === 'Card' ? hudSelection : null}
                                />
                              </div>

                              <div className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                <MicroMarketOutcomeRow 
                                  outcomeName="Goal Scored"
                                  backOdds={soccerMinuteOdds.goal}
                                  layOdds={soccerMinuteOdds.goal + 0.5}
                                  trend={soccerMinuteTrend.goal}
                                  isSuspended={isFeedSuspended}
                                  onSelect={(type: any, odds: any) => setHudSelection({
                                    matchId: match.id,
                                    matchTitle: `${match.team1} vs ${match.team2}`,
                                    sport: 'Soccer',
                                    marketName: '1-Min Event',
                                    selectionName: 'Goal',
                                    odds,
                                    type
                                  })}
                                  activeSelection={hudSelection?.marketName === '1-Min Event' && hudSelection?.selectionName === 'Goal' ? hudSelection : null}
                                />
                              </div>

                              <div className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                <MicroMarketOutcomeRow 
                                  outcomeName="Throw-In"
                                  backOdds={soccerMinuteOdds.throwIn}
                                  layOdds={soccerMinuteOdds.throwIn + 0.02}
                                  trend={soccerMinuteTrend.throwIn}
                                  isSuspended={isFeedSuspended}
                                  onSelect={(type: any, odds: any) => setHudSelection({
                                    matchId: match.id,
                                    matchTitle: `${match.team1} vs ${match.team2}`,
                                    sport: 'Soccer',
                                    marketName: '1-Min Event',
                                    selectionName: 'Throw-In',
                                    odds,
                                    type
                                  })}
                                  activeSelection={hudSelection?.marketName === '1-Min Event' && hudSelection?.selectionName === 'Throw-In' ? hudSelection : null}
                                />
                              </div>

                            </div>
                          </div>
                        </>
                      )}

                      {/* Supported sport fallback */}
                      {match.sport !== 'Cricket' && match.sport !== 'Tennis' && match.sport !== 'Soccer' && (
                        <div className="bg-white rounded border border-slate-200 p-4 text-center md:col-span-2 lg:col-span-3">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Live Micro-Markets are currently only supported for Cricket, Tennis, and Soccer.
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Inline Stake HUD (Dropdown expansion dashboard) */}
                    {hudSelection && hudSelection.matchId === match.id && (
                      <div className={cn(
                        "bg-white rounded border p-3.5 flex flex-col gap-3 transition-all duration-300 shadow-md",
                        betSuccessFlash ? "border-[#16A34A] bg-[#D1FAE5]/20" : "border-slate-300"
                      )}>
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Target Market: {hudSelection.marketName}
                            </span>
                            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              {hudSelection.selectionName} 
                              {hudSelection.type === 'lay' ? (
                                <span className="text-pink-700 bg-pink-50 px-1 py-0.5 rounded text-[9px] font-black uppercase">LAY</span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[9px] font-black uppercase">BACK</span>
                              )}
                              @ {hudSelection.odds.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => setHudSelection(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mid Row: Stake tokens & calculations */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          
                          {/* Fast HUD Stake buttons */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Stake (₹):</span>
                              <input
                                type="number"
                                value={hudStake}
                                onChange={(e) => setHudStake(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-24 border border-slate-300 rounded px-2.5 py-1 text-xs font-black focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              {[100, 500, 1000, 5000, 10000].map(val => (
                                <button
                                  key={val}
                                  onClick={() => setHudStake(val)}
                                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black py-1 px-1.5 rounded text-[9.5px] leading-none transition-colors"
                                >
                                  ₹{val.toLocaleString('en-IN')}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Exposure / Liability details */}
                          <div className="flex items-center gap-4 text-xs font-black text-slate-600 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Exposure/Liability</span>
                              <span className="text-[#DC2626] font-black text-sm mt-0.5">
                                ₹{hudSelection.type === 'back' ? hudStake : Math.round(hudStake * (hudSelection.odds - 1))}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Potential Profit</span>
                              <span className="text-[#16A34A] font-black text-sm mt-0.5">
                                ₹{hudSelection.type === 'back' ? Math.round(hudStake * (hudSelection.odds - 1)) : hudStake}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Error Alert Display */}
                        {betError && (
                          <div className="bg-red-50 border border-red-200 text-[#DC2626] text-[10px] font-black uppercase tracking-wider p-2 rounded">
                            ⚠️ {betError}
                          </div>
                        )}

                        {/* Rapid Bet button */}
                        <button
                          disabled={betPlacing}
                          onClick={() => {
                            setBetPlacing(true);
                            setBetError(null);
                            
                            // Non-blocking client-side asynchronous threads
                            setTimeout(() => {
                              const T_user = Date.now();
                              const deltaT = T_user - streamTime;
                              
                              // Latency protection check
                              if (deltaT > 350 && !acceptAnyOdds) {
                                setBetError(`LATENCY EXCEEDED (${deltaT}ms > 350ms). Odds are stale. Bet suspended.`);
                                setBetPlacing(false);
                                return;
                              }

                              const newBet = {
                                marketName: hudSelection.marketName,
                                selectionName: hudSelection.selectionName,
                                lineValue: hudSelection.lineValue,
                                stake: hudStake,
                                odds: hudSelection.odds,
                                type: hudSelection.type
                              };

                              // Platform Risk Ledger Validation
                              const riskCheck = validatePlatformRisk(newBet, placedMicroBets);
                              if (!riskCheck.safe) {
                                setBetError(`RISK CAP EXCEEDED. Platform liability limit is ₹100,000. Potential platform loss: ₹${Math.round(riskCheck.maxLiability)}.`);
                                setBetPlacing(false);
                                return;
                              }

                              // Balance check
                              const requiredFunds = hudSelection.type === 'back' ? hudStake : hudStake * (hudSelection.odds - 1);
                              if (requiredFunds > walletBalance) {
                                setBetError("INSUFFICIENT BALANCE FOR STAKE + LIABILITY");
                                setBetPlacing(false);
                                return;
                              }

                              // Commit bet directly to Zustand store (data binding)
                              placeSportsBet(
                                hudSelection.matchTitle,
                                `${hudSelection.marketName}: ${hudSelection.selectionName} ${hudSelection.lineValue ? '(' + hudSelection.lineValue + ')' : ''}`,
                                hudSelection.odds,
                                hudStake,
                                hudSelection.type === 'back' ? 'yes' : 'no',
                                `MICRO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                              );

                              // Save locally to display
                              setPlacedMicroBets(prev => [...prev, newBet]);
                              
                              setBetSuccessFlash(true);
                              setBetPlacing(false);
                              setTimeout(() => setBetSuccessFlash(false), 1500);
                            }, 300);
                          }}
                          className={cn(
                            "w-full py-2.5 rounded text-white font-bold text-xs uppercase tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5",
                            betSuccessFlash 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : "bg-slate-900 hover:bg-slate-800",
                            betPlacing && "opacity-60 cursor-wait"
                          )}
                        >
                          {betPlacing ? "Processing Transaction..." : betSuccessFlash ? "Bet Placed Successfully! ✓" : "Place Instant Bet"}
                        </button>

                      </div>
                    )}

                    {/* Active micro bets feed list */}
                    {placedMicroBets.length > 0 && (
                      <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b pb-1">
                          Active Session Bets ({placedMicroBets.length})
                        </span>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                          {placedMicroBets.map((bet, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] font-bold border-b border-slate-100 py-1.5">
                              <span className="text-slate-800 font-bold">
                                {bet.marketName}: {bet.selectionName} @ {bet.odds.toFixed(2)}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase leading-none",
                                  bet.type === 'back' ? "text-emerald-700 bg-emerald-50" : "text-pink-700 bg-pink-50"
                                )}>
                                  {bet.type === 'back' ? 'Back' : 'Lay'} (₹{bet.stake})
                                </span>
                                <span className="text-yellow-600 font-extrabold uppercase animate-pulse">Pending</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )))}
        </div>
      </div>

      {/* Column 3: Side-Docked Transaction Slip */}
      <div className={cn(
        "flex flex-col w-[320px] max-w-[85vw] bg-exchange-surface border-l border-exchange-border shrink-0 z-[49] lg:z-40 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] transition-transform duration-300",
        "fixed top-14 bottom-0 right-0 h-[calc(100vh-56px)] lg:top-0 lg:relative lg:translate-x-0 lg:h-full",
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
                    isBack ? "border-[#a7f3d0]" : "border-[#fbcfe8]"
                  )}>
                    <div className={cn("px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase flex items-center justify-between", isBack ? "bg-[#D1FAE5]" : "bg-[#FCE7F3]")}>
                      <span>{isBack ? "Back" : "Lay"}</span>
                      <button onClick={() => removeBet(bet.matchId, bet.selection, bet.type)} className="hover:bg-slate-900/10 rounded-full p-0.5">
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
                          <label className="text-[10px] text-exchange-muted font-bold uppercase block mb-1">Stake (₹)</label>
                          <input 
                            type="number" 
                            value={bet.stake}
                            onChange={(e) => updateStake(bet.matchId, bet.selection, bet.type, parseInt(e.target.value) || 0)}
                            className="w-full border border-exchange-border rounded-sm px-2 py-1.5 text-sm font-black focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>

                      {/* Interactive Risk Slider */}
                      <div className="mt-4 pt-3 border-t border-exchange-border">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-exchange-muted uppercase">Risk Slider</span>
                          <span className={cn(isBack ? "text-emerald-600" : "text-pink-600")}>₹{bet.stake}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="1000" 
                          step="10" 
                          value={bet.stake}
                          onChange={(e) => updateStake(bet.matchId, bet.selection, bet.type, parseInt(e.target.value))}
                          className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold">
                          <span className="text-slate-500">Liability: <span className="text-red-600">₹{isBack ? bet.stake : (bet.stake * bet.odds - bet.stake).toFixed(2)}</span></span>
                          <span className="text-slate-500">Profit: <span className="text-green-600">₹{isBack ? (bet.stake * bet.odds - bet.stake).toFixed(2) : bet.stake}</span></span>
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
              <span className="text-red-600">₹{totalLiability.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-exchange-muted">
              <span>Total Return:</span>
              <span className="text-green-600">₹{totalPotentialReturn.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                placeSportsBet("Exchange Bet", `${betslip.length} selections`, 1.0, totalLiability);
                setBetslip([]);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-sm transition-colors mt-2"
            >
              Place Bets
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
