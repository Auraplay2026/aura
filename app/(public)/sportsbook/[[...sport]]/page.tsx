"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Activity, Clock, X, Menu, Receipt, ChevronDown, ChevronUp, 
  TrendingUp, Zap, Calendar, Target, Search, Filter, Pin, Settings,
  User, Check, AlertCircle, ShieldCheck, PlayCircle, Flame, Gamepad2,
  Wallet, RefreshCw, ChevronRight, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { adjustOddsForExposure } from "@/lib/mathEngine";
import { CricketDataService } from "@/lib/cricket/service";

// ─── LEAGUE HIERARCHY DATA ───────────────────────────────────────────────────
const TOURNAMENT_LEAGUES: Record<string, string[]> = {
  Cricket: [
    "All Cricket",
    "Indian Premier League (IPL)",
    "Big Bash League (BBL)",
    "Pakistan Super League (PSL)",
    "International T20s",
    "One Day Internationals",
    "ICC World Test Championship",
    "The Hundred 2026",
    "Ranji Trophy",
    "SA20 League",
    "Tamil Nadu Premier League (TNPL)"
  ],
  Soccer: [
    "All Soccer",
    "English Premier League",
    "UEFA Champions League",
    "Spanish La Liga",
    "Italian Serie A",
    "German Bundesliga",
    "French Ligue 1",
    "English Sky Bet Championship"
  ],
  Tennis: [
    "All Tennis",
    "ATP Cincinnati Open",
    "WTA Cincinnati Open",
    "US Open 2026",
    "Wimbledon Championships",
    "ATP Challenger Tour"
  ],
  E_Soccer: [
    "All E-Soccer",
    "GT Sports League",
    "Battle Champions League",
    "Volta e-Tournaments"
  ]
};

export default function SportsbookPage({ params }: { params: Promise<{ sport?: string[] }> }) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const sportQuery = searchParams.get("sport");

  const parsedSlug = unwrappedParams.sport?.[0] 
    ? unwrappedParams.sport[0].replace(/-/g, ' ') 
    : (sportQuery || "cricket");
  const sportParam = parsedSlug === "all" ? "All Sports" : parsedSlug.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [activeSport, setActiveSport] = useState(sportParam === "All Sports" ? "Cricket" : sportParam);
  const [selectedLeague, setSelectedLeague] = useState<string>("All Cricket");
  const [selectedDateTab, setSelectedDateTab] = useState<"inplay" | "today" | "tomorrow">("inplay");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLeagueDrawerOpen, setIsLeagueDrawerOpen] = useState(false);
  const [oneClickBet, setOneClickBet] = useState(false);
  const [oneClickStake, setOneClickStake] = useState<number>(500);

  // Active Bet Slip Selection
  const [selectedBet, setSelectedBet] = useState<{
    matchId: number | string;
    matchTitle: string;
    selection: string;
    type: 'back' | 'lay';
    odds: number;
    stake: number;
  } | null>(null);

  const [pinnedMatches, setPinnedMatches] = useState<(number | string)[]>([]);
  const [betFeedback, setBetFeedback] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const walletBalance = useTradingStore(s => s.balance);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  // Real-time EventSource SSE Stream with fallback SWR polling
  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    const rawKey = activeSport.toLowerCase();
    const sportKey = (rawKey === 'all' || rawKey === 'all sports') ? 'all' : (rawKey === 'football' ? 'soccer' : rawKey);

    const processIncomingMatches = (incoming: any[]) => {
      setMatches(incoming);
      setIsLoading(false);
    };

    const fetchFallback = async () => {
      try {
        const res = await fetch(`/api/sports/live?sport=${sportKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && active && Array.isArray(data.matches)) {
            processIncomingMatches(data.matches);
          }
        }
      } catch (e) {
        console.warn("Sportsbook fallback fetch error:", e);
      }
    };

    setIsLoading(true);
    fetchFallback();

    try {
      eventSource = new EventSource(`/api/sports/stream?sport=${sportKey}`);
      eventSource.onmessage = (event) => {
        if (!active) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "LISTING_UPDATE" && Array.isArray(parsed.matches)) {
            processIncomingMatches(parsed.matches);
          }
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        if (!fallbackInterval && active) {
          fallbackInterval = setInterval(fetchFallback, 6000);
        }
      };
    } catch {
      fallbackInterval = setInterval(fetchFallback, 6000);
    }

    return () => {
      active = false;
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [activeSport]);

  const togglePinMatch = (id: number | string) => {
    setPinnedMatches(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectOdds = (match: any, selection: string, odds: number, type: 'back' | 'lay') => {
    if (oneClickBet) {
      setIsPlacing(true);
      setTimeout(() => {
        setIsPlacing(false);
        setBetFeedback(`✅ 1-Click Bet Placed: ${selection} (${type.toUpperCase()}) @ ${odds.toFixed(2)} with ₹${oneClickStake}`);
        setTimeout(() => setBetFeedback(null), 3500);
      }, 350);
      return;
    }

    setSelectedBet({
      matchId: match.id,
      matchTitle: `${match.team1} v ${match.team2}`,
      selection,
      type,
      odds,
      stake: 100
    });
  };

  const handlePlaceBetslip = async () => {
    if (!selectedBet) return;
    setIsPlacing(true);
    try {
      const res = await fetch("/api/sports/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: String(selectedBet.matchId),
          selection: selectedBet.selection,
          type: selectedBet.type,
          odds: selectedBet.odds,
          stake: selectedBet.stake,
          sequenceId: Date.now()
        })
      });
      const data = await res.json();
      if (data.success) {
        setBetFeedback(`✅ Bet Placed: ${selectedBet.selection} @ ${selectedBet.odds}`);
        setSelectedBet(null);
      } else {
        setBetFeedback(`⚠️ ${data.error || "Failed to place bet"}`);
      }
    } catch (e: any) {
      setBetFeedback(`⚠️ Order error: ${e.message}`);
    } finally {
      setIsPlacing(false);
      setTimeout(() => setBetFeedback(null), 3500);
    }
  };

  // Filtered Matches
  const filteredMatches = matches.filter(m => {
    if (selectedDateTab === "inplay" && m.status !== "Live") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.team1} ${m.team2} ${m.seriesName || ""}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const liveMatchCount = matches.filter(m => m.status === "Live").length;

  return (
    <div className="min-h-screen bg-[#0d151c] text-slate-100 font-sans pb-24 select-none">
      
      {/* ═══════════════════════════════════════════════════════════════
          1. CLEAN MOBILE HEADER (Brand Minimal + Balance + Search)
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-[#111d27]/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2.5 sticky top-0 z-40">
        <div className="max-w-md mx-auto sm:max-w-5xl flex items-center justify-between gap-2">
          
          {/* AURA Brand Pill */}
          <Link href="/sportsbook" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-sm shadow-md shadow-emerald-950/40">
              A
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                AURA
              </span>
              <span className="text-[10px] text-slate-400 font-bold block">Sports Exchange</span>
            </div>
          </Link>

          {/* Quick Balance & Search Controls */}
          <div className="flex items-center gap-2">
            {/* Live Count Pill */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-mono font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{liveMatchCount} Live</span>
            </div>

            {/* Wallet Balance Pill */}
            <Link 
              href="/account/balance"
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-mono font-black text-amber-300 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>₹{(walletBalance || 25400).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </Link>

            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                "p-2 rounded-full border transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center",
                isSearchOpen ? "bg-emerald-500 text-slate-950 border-emerald-400" : "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white"
              )}
              aria-label="Search Matches"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Search Input */}
        {isSearchOpen && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 max-w-md mx-auto sm:max-w-5xl animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Teams, Tournaments, or Matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. HORIZONTAL SPORT CHIPS & LIVE STATUS BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111d27]/70 border-b border-slate-800/80 px-3 py-2 overflow-x-auto scrollbar-none sticky top-[53px] z-30 backdrop-blur-md">
        <div className="max-w-md mx-auto sm:max-w-5xl flex items-center gap-1.5">
          {[
            { id: "Cricket", label: "🏏 Cricket", count: 12 },
            { id: "Soccer", label: "⚽ Soccer", count: 8 },
            { id: "Tennis", label: "🎾 Tennis", count: 6 },
            { id: "E_Soccer", label: "🎮 E-Soccer", count: 4 },
            { id: "All Sports", label: "⚡ All Sports", count: null }
          ].map(sport => (
            <button
              key={sport.id}
              onClick={() => {
                setActiveSport(sport.id);
                setSelectedLeague(`All ${sport.id}`);
              }}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px]",
                activeSport.toLowerCase() === sport.id.toLowerCase()
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60"
                  : "bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
              )}
            >
              <span>{sport.label}</span>
              {sport.count !== null && (
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black",
                  activeSport.toLowerCase() === sport.id.toLowerCase() ? "bg-white/20 text-white" : "bg-slate-700/80 text-slate-300"
                )}>
                  {sport.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. TIME FILTER PILLS & LEAGUE ACCORDION BUTTON
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-md mx-auto sm:max-w-5xl px-3 pt-3 flex items-center justify-between gap-2">
        {/* Time Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {[
            { id: "inplay", label: "🔴 Live" },
            { id: "today", label: "Today" },
            { id: "tomorrow", label: "Tomorrow" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedDateTab(t.id as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer min-h-[36px] flex items-center justify-center",
                selectedDateTab === t.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* League Selector Drawer Toggle */}
        <button
          onClick={() => setIsLeagueDrawerOpen(!isLeagueDrawerOpen)}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 cursor-pointer min-h-[44px]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[110px]">{selectedLeague.replace("All ", "")}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      {/* Collapsible League Drawer */}
      {isLeagueDrawerOpen && (
        <div className="max-w-md mx-auto sm:max-w-5xl px-3 pt-2 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Select Tournament / League
            </span>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
              {(TOURNAMENT_LEAGUES[activeSport] || TOURNAMENT_LEAGUES.Cricket).map(league => (
                <button
                  key={league}
                  onClick={() => {
                    setSelectedLeague(league);
                    setIsLeagueDrawerOpen(false);
                  }}
                  className={cn(
                    "text-left px-2.5 py-2 rounded-lg text-xs font-bold truncate transition-colors min-h-[40px] flex items-center",
                    selectedLeague === league
                      ? "bg-emerald-600 text-white font-black"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {league}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {betFeedback && (
        <div className="max-w-md mx-auto sm:max-w-5xl px-3 pt-2">
          <div className="bg-emerald-950 border border-emerald-500/60 text-emerald-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <span>{betFeedback}</span>
            <button onClick={() => setBetFeedback(null)} className="text-slate-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          4. MOBILE MATCH CARDS FEED (Ergonomic Touch Targets 44px+)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="max-w-md mx-auto sm:max-w-5xl p-3 space-y-2.5">
        
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Syncing live verified feeds...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800/80">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-black uppercase tracking-wider text-slate-200">No Matches Available</p>
            <p className="text-xs text-slate-400 mt-1">Try switching to the Today or All Sports tab</p>
            <button
              onClick={() => { setSelectedDateTab("inplay"); setSelectedLeague("All Cricket"); }}
              className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-xl cursor-pointer shadow-md transition-colors min-h-[44px]"
            >
              Show All Live Matches
            </button>
          </div>
        ) : (
          filteredMatches.map((m: any) => {
            const isPinned = pinnedMatches.includes(m.id);
            const isLive = m.status === "Live";
            const o1 = m.odds?.team1 || 2.10;
            const o2 = m.odds?.team2 || 2.30;
            const oDraw = m.odds?.draw;

            const lay1 = parseFloat((o1 + 0.02).toFixed(2));
            const lay2 = parseFloat((o2 + 0.02).toFixed(2));

            return (
              <div
                key={m.id}
                className="bg-[#13202b] border border-slate-800/90 rounded-2xl p-3.5 shadow-md hover:border-slate-700/80 transition-all relative overflow-hidden"
              >
                {/* Top Meta Line: Format + Series Name + Pin Button */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/70 text-[10px] font-bold text-slate-400 uppercase">
                  <div className="flex items-center gap-1.5 truncate">
                    {isLive ? (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-black">
                        {m.timeStr || "SCHEDULED"}
                      </span>
                    )}
                    <span className="text-slate-300 font-bold truncate">{m.seriesName || "Tournament League"}</span>
                  </div>

                  <button
                    onClick={() => togglePinMatch(m.id)}
                    className={cn(
                      "p-1.5 rounded-lg cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors",
                      isPinned ? "text-amber-400 bg-amber-500/10" : "text-slate-500 hover:text-slate-300"
                    )}
                    aria-label="Pin match"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Match Info (Clickable Link to Match Center) */}
                <Link
                  href={`/sportsbook/match/${m.id}`}
                  className="block group"
                >
                  <div className="space-y-1.5">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-[10px] text-emerald-400">
                          {m.team1.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-black text-sm text-slate-100 group-hover:text-emerald-400 transition-colors truncate max-w-[180px] sm:max-w-none">
                          {m.team1}
                        </span>
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-[10px] text-teal-400">
                          {m.team2.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-black text-sm text-slate-100 group-hover:text-emerald-400 transition-colors truncate max-w-[180px] sm:max-w-none">
                          {m.team2}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Score Summary Badge */}
                  {m.score && (
                    <div className="mt-2 py-1 px-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 flex items-center justify-between font-mono text-xs">
                      <span className="text-emerald-400 font-black">{m.score}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 group-hover:text-white">
                        Match Center <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </Link>

                {/* Back / Lay Mobile Action Buttons (44px Touch Targets) */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/70 grid grid-cols-2 gap-2">
                  
                  {/* Team 1 Back / Lay Group */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSelectOdds(m, m.team1, o1, 'back')}
                      className="flex-1 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs py-2 rounded-xl flex flex-col items-center justify-center cursor-pointer min-h-[44px] shadow-sm leading-none transition-all"
                    >
                      <span className="text-[9px] opacity-75 font-bold uppercase">Back</span>
                      <span className="text-sm font-black">{o1.toFixed(2)}</span>
                    </button>
                    <button
                      onClick={() => handleSelectOdds(m, m.team1, lay1, 'lay')}
                      className="flex-1 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs py-2 rounded-xl flex flex-col items-center justify-center cursor-pointer min-h-[44px] shadow-sm leading-none transition-all"
                    >
                      <span className="text-[9px] opacity-75 font-bold uppercase">Lay</span>
                      <span className="text-sm font-black">{lay1.toFixed(2)}</span>
                    </button>
                  </div>

                  {/* Team 2 Back / Lay Group */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSelectOdds(m, m.team2, o2, 'back')}
                      className="flex-1 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs py-2 rounded-xl flex flex-col items-center justify-center cursor-pointer min-h-[44px] shadow-sm leading-none transition-all"
                    >
                      <span className="text-[9px] opacity-75 font-bold uppercase">Back</span>
                      <span className="text-sm font-black">{o2.toFixed(2)}</span>
                    </button>
                    <button
                      onClick={() => handleSelectOdds(m, m.team2, lay2, 'lay')}
                      className="flex-1 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs py-2 rounded-xl flex flex-col items-center justify-center cursor-pointer min-h-[44px] shadow-sm leading-none transition-all"
                    >
                      <span className="text-[9px] opacity-75 font-bold uppercase">Lay</span>
                      <span className="text-sm font-black">{lay2.toFixed(2)}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════════════
          5. MOBILE QUICK BET BOTTOM SHEET (Slides up on Odds tap)
      ═══════════════════════════════════════════════════════════════ */}
      {selectedBet && (
        <div className="fixed inset-x-0 bottom-16 z-50 p-3 max-w-md mx-auto animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-[#111d27] border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl space-y-3">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-black text-sm text-white">{selectedBet.selection}</span>
                <span className="text-[10px] text-slate-400 font-bold block">{selectedBet.matchTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] uppercase font-black",
                  selectedBet.type === 'back' ? "bg-[#72bbef] text-[#002b49]" : "bg-[#faa9ba] text-[#4a0011]"
                )}>
                  {selectedBet.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedBet(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Odds</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedBet.odds}
                  onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-sm text-white focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Stake (₹)</label>
                <input
                  type="number"
                  value={selectedBet.stake}
                  onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-sm text-white focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {/* Quick Stake Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 500, 1000, 5000].map(val => (
                <button
                  key={val}
                  onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 rounded-xl cursor-pointer min-h-[36px] transition-colors"
                >
                  +₹{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            {/* Potential PnL */}
            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-800">
              {selectedBet.type === 'back' ? (
                <>
                  <span className="text-slate-400">Potential Profit:</span>
                  <strong className="text-emerald-400 font-mono text-sm">
                    +₹{Math.round(selectedBet.stake * (selectedBet.odds - 1)).toLocaleString()}
                  </strong>
                </>
              ) : (
                <>
                  <span className="text-slate-400">Max Liability:</span>
                  <strong className="text-rose-400 font-mono text-sm">
                    -₹{Math.round(selectedBet.stake * (selectedBet.odds - 1)).toLocaleString()}
                  </strong>
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              disabled={isPlacing || selectedBet.stake <= 0}
              onClick={handlePlaceBetslip}
              className={cn(
                "w-full py-3 font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg min-h-[48px] active:scale-98",
                isPlacing ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-110"
              )}
            >
              {isPlacing ? "Placing Order..." : "Confirm & Place Bet"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. COMPACT MOBILE BOTTOM NAVIGATION (Ergonomic App Bar)
      ═══════════════════════════════════════════════════════════════ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-[#0d151c]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
        <div className="max-w-md mx-auto sm:max-w-5xl grid grid-cols-5 gap-1">
          
          <Link
            href="/sportsbook"
            className="flex flex-col items-center justify-center py-1 text-emerald-400 font-black text-[10px] min-h-[44px] rounded-xl"
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span>Sports</span>
          </Link>

          <button
            onClick={() => setSelectedDateTab("inplay")}
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 font-bold text-[10px] min-h-[44px] rounded-xl cursor-pointer"
          >
            <Flame className="w-5 h-5 mb-0.5 text-red-400 animate-pulse" />
            <span>In-Play</span>
          </button>

          <Link
            href="/account/bets"
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 font-bold text-[10px] min-h-[44px] rounded-xl"
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>My Bets</span>
          </Link>

          <Link
            href="/casino"
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 font-bold text-[10px] min-h-[44px] rounded-xl"
          >
            <Gamepad2 className="w-5 h-5 mb-0.5 text-amber-400" />
            <span>Casino</span>
          </Link>

          <Link
            href="/account"
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 font-bold text-[10px] min-h-[44px] rounded-xl"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Account</span>
          </Link>

        </div>
      </nav>

    </div>
  );
}
