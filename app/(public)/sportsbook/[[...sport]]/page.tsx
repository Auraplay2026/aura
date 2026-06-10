"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Activity, CalendarDays, Search, Trash2, CheckCircle2, TrendingUp, TrendingDown, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMatches, Match } from "@/lib/sportsData";
import { useTradingStore } from "@/lib/store";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";

const SPORTS = ["Soccer", "Tennis", "Basketball", "Esports", "Cricket", "Table Tennis"];

const SPORT_ICONS: Record<string, React.ReactNode> = {
  "Soccer": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>, // Generic Soccer
  "Tennis": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 22A10 10 0 0 0 12 2"/><path d="M2 12h20"/></svg>, // Generic Tennis
  "Basketball": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M5.636 5.636a9 9 0 0 1 12.728 12.728M2 12h20 M12 2v20 M7 7l10 10 M17 7L7 17" /></svg>,
  "Esports": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4 M8 10v4 M15 13h.01 M18 11h.01" /></svg>,
  "Cricket": <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.06 4.77l-2.83-2.83a1.5 1.5 0 0 0-2.12 0l-5.66 5.66a1.5 1.5 0 0 0 0 2.12l2.83 2.83a1.5 1.5 0 0 0 2.12 0l5.66-5.66a1.5 1.5 0 0 0 0-2.12zm-4.24 2.12l-2.83-2.83 1.41-1.41 2.83 2.83-1.41 1.41zM2 22l6.36-6.36-2.83-2.83L2 19.17V22zm3-1.5H3.5v-1.5l5.3-5.3 1.5 1.5-5.3 5.3z"/><circle cx="15.5" cy="15.5" r="2.5"/></svg>,
  "Table Tennis": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="16" cy="8" r="4"/><path d="M13.17 10.83l-3.5 3.5 M9.5 14.5L5 19 M17.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
};

export default function SportsbookPage({ params }: { params: Promise<{ sport?: string[] }> }) {
  const unwrappedParams = use(params);
  
  const initialSportSlug = unwrappedParams.sport?.[0] ? unwrappedParams.sport[0].replace(/-/g, ' ') : "live overview";
  const sportParam = initialSportSlug.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [activeSport, setActiveSport] = useState(sportParam);
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [betslip, setBetslip] = useState<{ matchId: number; selection: string; odds: number }[]>([]);
  const [isBetslipDrawerOpen, setIsBetslipDrawerOpen] = useState(false);
  const [stake, setStake] = useState<number>(100);
  const placeSportsBet = useTradingStore(s => s.placeSportsBet);
  
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const loadMatches = async (sport: string) => {
    setIsLoading(true);
    const sportKey = sport.toLowerCase();
    
    // Default simulated matches first, in case we need them as quick default or fallback
    const simulated = (sportKey === "live overview") ? [
      ...generateMatches("soccer", 5),
      ...generateMatches("tennis", 5),
      ...generateMatches("basketball", 5),
      ...generateMatches("esports", 5),
    ] : generateMatches(sport, 40);

    if (sportKey === "cricket" || sportKey === "tennis" || sportKey === "live overview") {
      try {
        const fetchUrl = sportKey === "live overview" 
          ? "/api/sports/live?sport=all"
          : `/api/sports/live?sport=${sportKey}`;
          
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (sportKey === "live overview") {
              const scrapedCricket = data.cricket || [];
              const scrapedTennis = data.tennis || [];
              const merged = [
                ...generateMatches("soccer", 5),
                ...scrapedTennis.slice(0, 5),
                ...generateMatches("basketball", 5),
                ...generateMatches("esports", 5),
                ...scrapedCricket.slice(0, 5),
              ];
              setMatches(merged);
            } else {
              setMatches(data.matches || []);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch live matches, falling back to simulated data", err);
      }
    }
    
    setMatches(simulated);
    setIsLoading(false);
  };

  // Sync matches when sportParam changes (e.g. navigation via sidebar)
  useEffect(() => {
    setActiveSport(sportParam);
    loadMatches(sportParam);
  }, [sportParam]);

  // Sync matches when activeSport changes internally (via the horizontal nav)
  useEffect(() => {
    loadMatches(activeSport);
  }, [activeSport]);

  // Simulate live odds shifting
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(current => current.map(match => {
        if (match.status !== "Live") return match;
        // Randomly tweak odds for live matches
        const tweak = () => (Math.random() * 0.1 - 0.05); // -0.05 to +0.05
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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleBet = (matchId: number, selection: string, odds: number) => {
    setBetslip((prev) => {
      const existing = prev.find((b) => b.matchId === matchId);
      if (existing && existing.selection === selection) {
        return prev.filter((b) => b.matchId !== matchId);
      }
      if (existing) {
        return prev.map((b) => (b.matchId === matchId ? { ...b, selection, odds } : b));
      }
      return [...prev, { matchId, selection, odds }];
    });
  };

  const removeBet = (matchId: number) => {
    setBetslip((prev) => prev.filter((b) => b.matchId !== matchId));
  };

  const totalOdds = betslip.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2);
  const potentialWin = (parseFloat(totalOdds) * 1000).toFixed(2);

  const OddsButton = ({ label, value, trend, isSelected, onClick }: any) => {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-between px-2.5 sm:px-4 flex-1 md:flex-none md:w-[100px] h-[44px] sm:h-[48px] rounded-xl border transition-all duration-300 group overflow-hidden active:scale-[0.97] active:translate-y-[1px]",
          isSelected
            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-slate-950 shadow-[0_5px_15px_rgba(234,179,8,0.4),inset_0_2px_5px_rgba(255,255,255,0.4)] md:scale-105 z-10"
            : "bg-[#11131c]/80 backdrop-blur-md border-white/10 hover:border-yellow-500/60 hover:bg-[#1a1c29] text-white shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_4px_15px_rgba(234,179,8,0.1)]"
        )}
      >
        {isSelected && <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] animate-glare mix-blend-overlay" />}
        
        <span className={cn("text-[10px] sm:text-[11px] font-black tracking-wider uppercase truncate max-w-[40%] relative z-10", isSelected ? "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]" : "text-slate-400 group-hover:text-slate-300 transition-colors")}>{label}</span>
        
        <div className="flex items-center gap-1 relative z-10">
          <span className={cn("font-black text-xs sm:text-sm md:text-base tracking-tight", isSelected && "drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]")}>
            {value.toFixed(2)}
          </span>
        </div>
        
        {!isSelected && trend === 'up' && <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neon-green absolute top-1.5 right-1.5 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
        {!isSelected && trend === 'down' && <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neon-pink absolute top-1.5 right-1.5 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />}
      </button>
    );
  };

  const TeamLogo = ({ name }: { name: string }) => {
    const [imgError, setImgError] = useState(false);
    
    const KNOWN_LOGOS: Record<string, string> = {
      "Chennai Super Kings": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/120px-Chennai_Super_Kings_Logo.svg.png",
      "Mumbai Indians": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/120px-Mumbai_Indians_Logo.svg.png",
      "Kolkata Knight Riders": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/120px-Kolkata_Knight_Riders_Logo.svg.png",
      "India": "https://flagcdn.com/w40/in.png",
      "Australia": "https://flagcdn.com/w40/au.png",
      "England": "https://flagcdn.com/w40/gb-eng.png",
      "Pakistan": "https://flagcdn.com/w40/pk.png",
      "South Africa": "https://flagcdn.com/w40/za.png",
      "New Zealand": "https://flagcdn.com/w40/nz.png",
      "Sri Lanka": "https://flagcdn.com/w40/lk.png",
      "West Indies": "https://upload.wikimedia.org/wikipedia/en/thumb/2/20/West_Indies_Cricket_Board_Logo.svg/120px-West_Indies_Cricket_Board_Logo.svg.png",
      "Bangladesh": "https://flagcdn.com/w40/bd.png",
      "Afghanistan": "https://flagcdn.com/w40/af.png",
      "Gujarat Titans": "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/120px-Gujarat_Titans_Logo.svg.png",
      "Lucknow Super Giants": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_IPL_Logo.svg/120px-Lucknow_Super_Giants_IPL_Logo.svg.png",
      "Delhi Capitals": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/120px-Delhi_Capitals_Logo.svg.png",
      "UP Warriorz": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/UP_Warriorz_logo.svg/120px-UP_Warriorz_logo.svg.png",
      "Mumbai Indians W": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/120px-Mumbai_Indians_Logo.svg.png",
      "Delhi Capitals W": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/120px-Delhi_Capitals_Logo.svg.png",
      "Gujarat Giants": "https://upload.wikimedia.org/wikipedia/en/thumb/8/86/Gujarat_Giants_WPL_logo.svg/120px-Gujarat_Giants_WPL_logo.svg.png",
      "Royal Challengers Bengaluru": "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Royal_Challengers_Bengaluru_logo.svg/120px-Royal_Challengers_Bengaluru_logo.svg.png",
      "Royal Challengers Bangalore W": "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Royal_Challengers_Bengaluru_logo.svg/120px-Royal_Challengers_Bengaluru_logo.svg.png",
      "Rajasthan Royals": "https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/120px-Rajasthan_Royals_Logo.svg.png",
      "Punjab Kings": "https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Punjab_Kings_Logo.svg/120px-Punjab_Kings_Logo.svg.png",
      "Sunrisers Hyderabad": "https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/120px-Sunrisers_Hyderabad.svg.png",
      "Mohun Bagan SG": "https://r2.thesportsdb.com/images/media/team/badge/g3zmfx1694438403.png",
      "Mumbai City FC": "https://r2.thesportsdb.com/images/media/team/badge/0ggcag1690787479.png",
      "Kerala Blasters FC": "https://r2.thesportsdb.com/images/media/team/badge/95t4dn1583254742.png",
      "Bengaluru FC": "https://r2.thesportsdb.com/images/media/team/badge/d9172h1770822547.png",
      "FC Goa": "https://r2.thesportsdb.com/images/media/team/badge/7z8ueq1583254723.png",
      "Chennaiyin FC": "https://r2.thesportsdb.com/images/media/team/badge/g5rypn1583254717.png",
      "Odisha FC": "https://r2.thesportsdb.com/images/media/team/badge/ljpjmn1693034492.png",
      "East Bengal FC": "https://r2.thesportsdb.com/images/media/team/badge/2dcje31694990604.png",
      "NorthEast United FC": "https://r2.thesportsdb.com/images/media/team/badge/h86ghn1583254754.png",
      "Hyderabad FC": "https://r2.thesportsdb.com/images/media/team/badge/awfp7x1773260261.png",
      "Jamshedpur FC": "https://r2.thesportsdb.com/images/media/team/badge/vn0g0y1583254736.png",
      "Punjab FC": "https://r2.thesportsdb.com/images/media/team/badge/qwet071770822967.png",
      "Mohammedan SC": "https://r2.thesportsdb.com/images/media/team/badge/lsxe8s1589707552.png",
      "Gokulam Kerala FC": "https://r2.thesportsdb.com/images/media/team/badge/8rol0v1583250983.png",
      "Real Kashmir FC": "https://r2.thesportsdb.com/images/media/team/badge/97ef9i1583251016.png"
    };

    if (KNOWN_LOGOS[name] && !imgError) {
      return (
        <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-gradient-to-br from-white/10 to-transparent p-1 shadow-inner">
          <img 
            src={KNOWN_LOGOS[name]} 
            alt={name} 
            className="w-full h-full object-contain filter drop-shadow-md" 
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    // Generate a consistent hue based on team name string
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    
    const EMOJI_PALETTE = ["🦅","🦁","🐅","🐺","🦈","🐉","🦂","🐍","🦍","🐻","🦊","🦄","⚡","🔥","🌪️","🌊","⚔️","🛡️","👑","💎", "🎯", "🎲", "🚀", "🛸", "☄️"];
    const emoji = EMOJI_PALETTE[Math.abs(hash) % EMOJI_PALETTE.length];
    
    return (
      <div 
        className="w-full h-full rounded-full flex items-center justify-center shadow-[inset_0_-2px_10px_rgba(0,0,0,0.6)] border shrink-0 overflow-hidden"
        style={{ 
          background: `radial-gradient(circle at 30% 30%, hsl(${hue}, 80%, 50%), hsl(${hue}, 90%, 15%))`, 
          borderColor: `hsl(${hue}, 70%, 40%)`
        }}
      >
        <span className="text-xl sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] scale-110 sm:scale-125 transform transition-transform group-hover:scale-[1.4]">{emoji}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto text-slate-200">

      
      {/* Horizontal Sports Bar (Categories) */}
      <div className="flex items-center gap-4 bg-[#1a1b2a] px-6 py-4 overflow-x-auto custom-scrollbar shrink-0 border-b border-[#25273c]">
        {SPORTS.map((sport) => (
          <button 
            key={sport}
            onClick={() => setActiveSport(sport)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[70px] transition-colors group",
              activeSport === sport ? "opacity-100" : "opacity-50 hover:opacity-100"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-[#25273c] flex items-center justify-center group-hover:bg-[#31334b] transition-colors p-1.5 overflow-hidden border border-transparent group-hover:border-slate-600 text-slate-300 group-hover:text-white">
              {SPORT_ICONS[sport] || <Trophy className="w-4 h-4" />}
            </div>
            <span className="text-xs font-bold text-white whitespace-nowrap">{sport}</span>
          </button>
        ))}
      </div>

      {/* Main Content: Matches Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-[#0a0b10] relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/5 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-[1000px] mx-auto space-y-6 pb-32 relative z-10">
          
          {/* Featured Match Banner (If there's a live match) */}
          {activeFilter !== 'upcoming' && matches.find(m => m.status === 'Live') && (
            <div className="mb-10 animate-fade-in-up">
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                Featured Live Match
              </h3>
              {(() => {
                const featuredMatch = matches.find(m => m.status === 'Live')!;
                return (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1b2a] to-[#0f1018] border border-white/10 shadow-2xl group">
                    {/* Background effects */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full group-hover:bg-yellow-500/20 transition-all duration-700" />
                    
                    <div className="relative p-5 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                      {/* Teams Info */}
                      <div className="flex-1 w-full flex items-center justify-between">
                        {/* Team 1 */}
                        <div className="flex flex-col items-center gap-2 sm:gap-3 w-[40%]">
                          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-900/50 p-1.5 sm:p-2 border border-white/10 shadow-xl backdrop-blur-sm">
                            <TeamLogo name={featuredMatch.team1} />
                          </div>
                          <span className="text-white font-black text-xs sm:text-lg text-center leading-tight line-clamp-2">{featuredMatch.team1}</span>
                        </div>
                        
                        {/* VS / Score */}
                        <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 w-[20%]">
                          <span className="text-red-500 font-bold text-[10px] sm:text-xs bg-red-500/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">LIVE</span>
                          <span className="text-xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-lg">{featuredMatch.score.split(',')[0]}</span>
                        </div>
                        
                        {/* Team 2 */}
                        <div className="flex flex-col items-center gap-2 sm:gap-3 w-[40%]">
                          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-900/50 p-1.5 sm:p-2 border border-white/10 shadow-xl backdrop-blur-sm">
                            <TeamLogo name={featuredMatch.team2} />
                          </div>
                          <span className="text-white font-black text-xs sm:text-lg text-center leading-tight line-clamp-2">{featuredMatch.team2}</span>
                        </div>
                      </div>
                      
                      {/* Featured Odds */}
                      <div className="w-full lg:w-auto flex flex-row lg:flex-col gap-2 sm:gap-3 justify-center">
                        <OddsButton 
                          label="1" 
                          value={featuredMatch.odds.team1} 
                          trend={featuredMatch.trend.team1}
                          isSelected={betslip.some(b => b.matchId === featuredMatch.id && b.selection === featuredMatch.team1)}
                          onClick={() => toggleBet(featuredMatch.id, featuredMatch.team1, featuredMatch.odds.team1)}
                        />
                        {featuredMatch.odds.draw && (
                          <OddsButton 
                            label="X" 
                            value={featuredMatch.odds.draw} 
                            trend={featuredMatch.trend.draw}
                            isSelected={betslip.some(b => b.matchId === featuredMatch.id && b.selection === "Draw")}
                            onClick={() => toggleBet(featuredMatch.id, "Draw", featuredMatch.odds.draw!)}
                          />
                        )}
                        <OddsButton 
                          label="2" 
                          value={featuredMatch.odds.team2} 
                          trend={featuredMatch.trend.team2}
                          isSelected={betslip.some(b => b.matchId === featuredMatch.id && b.selection === featuredMatch.team2)}
                          onClick={() => toggleBet(featuredMatch.id, featuredMatch.team2, featuredMatch.odds.team2)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* List Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">{activeSport} Global League</h2>
              </div>
              {(activeSport.toLowerCase() === "cricket" || activeSport.toLowerCase() === "tennis" || activeSport.toLowerCase() === "live overview") && (
                <span className="flex items-center gap-1.5 text-xs text-neon-green font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  Live Sync Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setActiveFilter('all')} 
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-colors border", activeFilter === 'all' ? "bg-white text-slate-900 border-white" : "bg-transparent text-slate-400 border-[#25273c] hover:border-slate-500")}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('live')} 
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-colors border flex items-center gap-2", activeFilter === 'live' ? "bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-transparent text-slate-400 border-[#25273c] hover:border-slate-500")}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", activeFilter === 'live' ? "bg-white animate-pulse" : "bg-red-500")}></span>
                Live Matches
              </button>
              <button 
                onClick={() => setActiveFilter('upcoming')} 
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-colors border", activeFilter === 'upcoming' ? "bg-[#31334b] text-white border-[#31334b]" : "bg-transparent text-slate-400 border-[#25273c] hover:border-slate-500")}
              >
                Upcoming
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end mb-4">
            <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {matches.filter(m => activeFilter === 'all' || (activeFilter === 'live' && m.status === 'Live') || (activeFilter === 'upcoming' && m.status === 'Upcoming')).length} Matches Found
            </span>
          </div>

          {/* Virtualized/Mapped rendering (limit to 50 for performance without true virtualization) */}
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 w-full">
                <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                <span className="text-sm font-bold text-slate-400">Fetching live match cards...</span>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold w-full">No active matches found.</div>
            ) : (
              matches
                .filter(m => activeFilter === 'all' || (activeFilter === 'live' && m.status === 'Live') || (activeFilter === 'upcoming' && m.status === 'Upcoming'))
                .map((match, i) => (
                <motion.div 
                  layout
                  key={match.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: i < 10 ? i * 0.02 : 0 }}
                  className="bg-transparent hover:bg-white/[0.02] transition-colors duration-300 group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 py-2 px-3 sm:px-4"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:to-yellow-500/[0.03] transition-all duration-500 pointer-events-none" />
                  
                  {/* Match Info */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex flex-row sm:flex-col items-center justify-center sm:w-20 shrink-0 sm:border-r border-white/5 sm:pr-4 py-1 gap-2 sm:gap-0">
                      {match.status === "Live" ? (
                        <span className="flex items-center gap-1.5 text-red-500 font-bold text-[10px] uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
                          LIVE
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Up Next</span>
                      )}
                      <span className="text-white font-black text-xs sm:text-sm mt-0 sm:mt-2 whitespace-nowrap">{match.score.split(',')[0]}</span>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2 w-full py-1">
                      <div className="flex items-center gap-3 group/team">
                        <div className="w-5 h-5 sm:w-6 sm:h-6">
                          <TeamLogo name={match.team1} />
                        </div>
                        <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide truncate group-hover/team:text-yellow-400 transition-colors">{match.team1}</h3>
                      </div>
                      <div className="flex items-center gap-3 group/team">
                        <div className="w-5 h-5 sm:w-6 sm:h-6">
                          <TeamLogo name={match.team2} />
                        </div>
                        <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide truncate group-hover/team:text-yellow-400 transition-colors">{match.team2}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Odds Grid */}
                  <div className="flex flex-row items-center justify-between lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    <OddsButton 
                      label="1" 
                      value={match.odds.team1} 
                      trend={match.trend.team1}
                      isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team1)}
                      onClick={() => toggleBet(match.id, match.team1, match.odds.team1)}
                    />
                    
                    {match.odds.draw && (
                      <OddsButton 
                        label="X" 
                        value={match.odds.draw} 
                        trend={match.trend.draw}
                        isSelected={betslip.some(b => b.matchId === match.id && b.selection === "Draw")}
                        onClick={() => toggleBet(match.id, "Draw", match.odds.draw!)}
                      />
                    )}

                    <OddsButton 
                      label="2" 
                      value={match.odds.team2} 
                      trend={match.trend.team2}
                      isSelected={betslip.some(b => b.matchId === match.id && b.selection === match.team2)}
                      onClick={() => toggleBet(match.id, match.team2, match.odds.team2)}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        
        {/* Live Bets Footer Feed */}
        <div className="max-w-[1000px] mx-auto pt-8">
           <LiveActionFeed />
        </div>
      </div>

      {/* Bottom Betslip Bar */}
      <AnimatePresence>
        {betslip.length > 0 && !isBetslipDrawerOpen && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 inset-x-0 lg:left-[260px] z-40 flex justify-center pointer-events-none"
          >
            <div 
              onClick={() => setIsBetslipDrawerOpen(true)}
              className="bg-yellow-500 text-slate-950 font-bold px-6 py-3 rounded-t-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto flex items-center gap-6 cursor-pointer hover:bg-yellow-400 transition-colors w-full max-w-[600px] justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="bg-slate-950 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-black shadow-inner">
                  {betslip.length}
                </span>
                <span className="uppercase tracking-widest text-sm font-black hidden sm:block">Betslip</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-2 sm:mr-4">
                   <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-800">Total Odds</span>
                   <span className="text-sm sm:text-base font-black tracking-tighter">{totalOdds}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm bg-slate-950/10 px-3 py-1 rounded-lg">
                  <span className="font-bold">Quick Bet</span>
                  <div className="w-8 h-4 bg-slate-950 rounded-full p-0.5 flex">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full ml-auto shadow-sm" />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 -rotate-90 hidden sm:block" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Betslip Quick Bet Drawer */}
      <AnimatePresence>
        {isBetslipDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBetslipDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:left-[260px]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 lg:left-[260px] z-50 flex justify-center pointer-events-none"
            >
              <div className="bg-[#1a1b2a] border-t border-[#25273c] w-full max-w-[600px] rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col overflow-hidden max-h-[85vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-[#25273c] flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-500 text-slate-950 w-6 h-6 rounded flex items-center justify-center text-xs font-black shadow-inner">
                      {betslip.length}
                    </span>
                    <h3 className="font-bold text-white uppercase tracking-widest text-sm">Betslip</h3>
                  </div>
                  <button 
                    onClick={() => setIsBetslipDrawerOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                {/* Selections */}
                <div className="overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar flex-shrink">
                  {betslip.map(bet => {
                    const match = matches.find(m => m.id === bet.matchId);
                    return (
                      <div key={`${bet.matchId}-${bet.selection}`} className="bg-black/30 border border-[#25273c] rounded-xl p-3 flex flex-col gap-2 relative group">
                        <button 
                          onClick={() => toggleBet(bet.matchId, bet.selection, bet.odds)}
                          className="absolute top-3 right-3 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                        <div className="pr-6">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{match?.team1} vs {match?.team2}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-white text-sm">{bet.selection}</span>
                            <span className="font-black text-yellow-500">{bet.odds.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="p-5 border-t border-[#25273c] bg-slate-950/50 flex flex-col gap-4">
                  
                  {/* Stake Input */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={stake}
                        onChange={(e) => setStake(Math.max(10, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#151623] border border-[#25273c] rounded-xl pl-8 pr-4 py-3 text-white font-black text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[100, 500, 1000].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => setStake(amt)}
                          className="px-3 py-3 bg-[#151623] hover:bg-white/10 border border-[#25273c] rounded-xl text-xs font-bold text-slate-300 transition-colors"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-slate-400 font-bold">Total Odds</span>
                    <span className="text-white font-black">{totalOdds}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pb-2 border-b border-[#25273c]">
                    <span className="text-slate-400 font-bold">Est. Payout</span>
                    <span className="text-neon-green font-black text-lg">₹{(stake * parseFloat(totalOdds)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* Action */}
                  <button 
                    onClick={() => {
                      if (betslip.length === 0) return;
                      // Place single or multi bet logic
                      const title = betslip.length === 1 ? matches.find(m => m.id === betslip[0].matchId)?.team1 + ' vs ' + matches.find(m => m.id === betslip[0].matchId)?.team2 : 'Multi Bet';
                      const sel = betslip.length === 1 ? betslip[0].selection : `${betslip.length} Selections`;
                      placeSportsBet(title || 'Sports Bet', sel, parseFloat(totalOdds), stake);
                      setBetslip([]);
                      setIsBetslipDrawerOpen(false);
                      // Add a small generic notification or trigger confetti here if we had one
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform active:scale-[0.98]"
                  >
                    Place Bet
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
