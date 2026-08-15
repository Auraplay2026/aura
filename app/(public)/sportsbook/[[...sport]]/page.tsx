"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Activity, Clock, X, Menu, Receipt, ChevronDown, ChevronUp, 
  TrendingUp, Zap, Calendar, Target, Search, Filter, Star, Pin, Settings,
  User, Check, AlertCircle, ShieldCheck, PlayCircle, Flame, Gamepad2,
  SlidersHorizontal, ChevronRight, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { CricketOddsEngine } from "@/lib/cricketOddsEngine";

// ─── LEAGUE HIERARCHY DATA (Exact Match from Reference Video) ────────────────
const TOURNAMENT_LEAGUES: Record<string, string[]> = {
  Cricket: [
    "All Cricket",
    "Assam Premier League",
    "Big Bash League",
    "Delhi Premier League",
    "German Super League T10",
    "ICC Cricket World Cup Challenge League",
    "ICC Men's T20 WC Europe Qualifier",
    "Indian Premier League SRL",
    "International Twenty20 Matches",
    "Metro Bank Womens One Day Cup",
    "Netherlands Topklasse T20",
    "One Day Internationals",
    "Pakistan Super League SRL",
    "Ranji Trophy",
    "SA20 SRL",
    "Super Smash SRL",
    "T20 International SRL",
    "Tamil Nadu Premier League",
    "Test Matches",
    "The Hundred 2026"
  ],
  Soccer: [
    "All Soccer",
    "English Premier League",
    "Spanish La Liga",
    "Italian Serie A",
    "German Bundesliga",
    "French Ligue 1",
    "UEFA Champions League",
    "Portuguese Primeira Liga",
    "Austrian Bundesliga",
    "Belgian Pro League",
    "Brazilian Serie A",
    "CONMEBOL Copa Libertadores",
    "English Sky Bet Championship"
  ],
  Tennis: [
    "All Tennis",
    "ATP Cincinnati 2026",
    "WTA Cincinnati 2026",
    "Asiago Challenger 2026",
    "Bloomsburg Challenger 2026",
    "Hamburg Challenger 2026",
    "Men's Wimbledon 2027",
    "Women's Wimbledon 2027",
    "US Open 2026"
  ],
  E_Soccer: [
    "All E-Soccer",
    "GT Sports Leagues",
    "Battle Champions League",
    "Volta e-Tournaments"
  ],
  FancyBet: [
    "All Fancy Bet",
    "Subcontinent Fancy Runs",
    "Khadda Specials",
    "Ball by Ball Sessions",
    "Odd / Even In-Play"
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
  const [activeNavTab, setActiveNavTab] = useState<string>("In Play");
  const [selectedDateTab, setSelectedDateTab] = useState<"inplay" | "today" | "tomorrow">("inplay");
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("Cricket");
  const [searchQuery, setSearchQuery] = useState<string>("");
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
  const [isMobileLeagueOpen, setIsMobileLeagueOpen] = useState(false);

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
          fallbackInterval = setInterval(fetchFallback, 4000);
        }
      };
    } catch {
      fallbackInterval = setInterval(fetchFallback, 4000);
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
        setBetFeedback(`✅ 1-Click Bet: ${selection} (${type.toUpperCase()}) @ ${odds.toFixed(2)} with PIN ${oneClickStake}`);
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

  // Filter matches with active Tournament selection
  const filteredMatches = matches.filter(m => {
    if (selectedDateTab === "inplay" && m.status !== "Live") return false;
    
    // Check specific tournament sidebar selection
    if (selectedLeague && !selectedLeague.startsWith("All ")) {
      const lClean = selectedLeague.toLowerCase().replace(/20\d\d|srl/g, "").trim();
      const mSeries = (m.seriesName || "").toLowerCase();
      if (!mSeries.includes(lClean)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.team1} ${m.team2} ${m.seriesName || ""}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans select-none pb-20 lg:pb-6">

      {/* ═══════════════════════════════════════════════════════════════
          1. SIGNATURE PINE GREEN NAVIGATION RIBBON & NEWS TICKER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#1b4332] border-b border-[#2d5a45] px-3 py-1.5 shadow-md">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          
          {/* Category Navigation Tabs with Counters */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: "In Play", label: "In Play", badge: "18" },
              { id: "Cricket", label: "Cricket", badge: "19" },
              { id: "Soccer", label: "Soccer", badge: "17" },
              { id: "Tennis", label: "Tennis", badge: "14" },
              { id: "Virtual Cricket", label: "Virtual Cricket", badge: null },
              { id: "E-Soccer", label: "E-Soccer", badge: null },
              { id: "Casino", label: "Casino", badge: "NEW" },
              { id: "Result", label: "Result", badge: null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveNavTab(tab.id);
                  if (tab.id === "In Play") setSelectedDateTab("inplay");
                  else if (tab.id === "Cricket" || tab.id === "Soccer" || tab.id === "Tennis") {
                    setActiveSport(tab.id);
                    setSelectedSportFilter(tab.id);
                    setSelectedLeague(`All ${tab.id}`);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md font-bold uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]",
                  activeNavTab === tab.id
                    ? "bg-[#ffb800] text-slate-950 font-black shadow-sm"
                    : "text-emerald-100 hover:bg-[#255740] hover:text-white"
                )}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                    tab.badge === "NEW" ? "bg-red-600 text-white" : activeNavTab === tab.id ? "bg-slate-900 text-white" : "bg-[#2f634d] text-emerald-100"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Search & 1-Click Bet HUD */}
          <div className="flex items-center gap-2 justify-end">
            <div className="relative w-44 md:w-56">
              <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#122e22] border border-[#2d5a45] rounded-md pl-8 pr-6 py-1 text-xs text-white placeholder:text-emerald-300/60 focus:outline-hidden focus:border-amber-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* One-Click Bet Switch */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#122e22] border border-[#2d5a45] px-2.5 py-1 rounded-md text-xs">
              <span className="font-bold text-[11px] text-emerald-200">1-Click</span>
              <button
                onClick={() => setOneClickBet(!oneClickBet)}
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative p-0.5 cursor-pointer",
                  oneClickBet ? "bg-emerald-500" : "bg-slate-600"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full bg-white transition-transform",
                  oneClickBet ? "translate-x-4" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Marquee News Ticker (Matching Video) ── */}
      <div className="bg-[#133827] border-b border-[#234938] px-3 py-1 flex items-center gap-2 text-xs font-bold text-emerald-100">
        <span className="bg-[#ffb800] text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
          <Volume2 className="w-3 h-3" /> News
        </span>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee pl-[100%] text-[11px] text-emerald-50 font-medium">
            📢 21-Aug-2026 Event: Pakistan Blues v Pakistan Greens | Market: F Zaman Runs ... Whole Market Voided Due To Player Injury ... Fast Live Feeds Active.
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. MAIN 3-COLUMN WORKSPACE (Desktop) & RESPONSIVE FEED (Mobile)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1700px] mx-auto p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* ── LEFT COLUMN: ALL SPORTS LEAGUE TREE ACCORDION (3 COLS) ── */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-fit">
          <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600" /> All Sports
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {Object.entries(TOURNAMENT_LEAGUES).map(([sportKey, leagues]) => {
              const isOpen = activeSport.toLowerCase().replace(" ", "_") === sportKey.toLowerCase();
              return (
                <div key={sportKey} className="group">
                  <button
                    onClick={() => {
                      setActiveSport(sportKey === "E_Soccer" ? "E-Soccer" : sportKey);
                      setSelectedLeague(`All ${sportKey}`);
                    }}
                    className={cn(
                      "w-full px-3.5 py-2.5 flex items-center justify-between font-bold text-left transition-colors cursor-pointer",
                      isOpen ? "bg-emerald-50/80 text-emerald-800 font-black" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <span>{sportKey.replace("_", " ")}</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-emerald-700" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="bg-slate-50/60 py-1 border-t border-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                      {leagues.map(league => (
                        <button
                          key={league}
                          onClick={() => setSelectedLeague(league)}
                          className={cn(
                            "w-full text-left px-5 py-1.5 text-xs truncate transition-colors cursor-pointer",
                            selectedLeague === league ? "text-emerald-800 font-black bg-emerald-100/60" : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
                          )}
                        >
                          {league}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER STAGE: 6-BOX MATCHED EXCHANGE GRID (6 COLS) ── */}
        <main className="col-span-1 lg:col-span-6 space-y-2.5">
          
          {/* Dynamic League Header Skin or Featured Hero */}
          {selectedLeague && !selectedLeague.startsWith("All ") ? (
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 border border-emerald-700 rounded-xl p-4 shadow-sm flex items-center justify-between text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-200 uppercase">
                  <span>{activeSport}</span>
                  <ChevronRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-amber-300 font-black">{selectedLeague}</span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">{selectedLeague}</h2>
                <p className="text-xs text-emerald-100 font-medium">Official Tournament Workspace • {filteredMatches.length} Fixtures Active</p>
              </div>
              <button
                onClick={() => setSelectedLeague(`All ${activeSport}`)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-600/40 p-4 shadow-sm flex items-center justify-between text-white">
              <div className="space-y-1">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">Featured</span>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">INTERNATIONAL CASINO & CRICKET</h2>
                <p className="text-xs text-emerald-100 font-medium">Instant Settlements • Zero Latency Live Feeds • 100% Verified Bhav</p>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
              </div>
            </div>
          )}

          {/* Time Filter Tabs & Mobile League Accordion Button */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1">
              {[
                { id: "inplay", label: "In-Play" },
                { id: "today", label: "Today" },
                { id: "tomorrow", label: "Tomorrow" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedDateTab(t.id as any)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[36px]",
                    selectedDateTab === t.id
                      ? "bg-[#ffb800] text-slate-950 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Mobile League Selector Toggle */}
            <button
              onClick={() => setIsMobileLeagueOpen(!isMobileLeagueOpen)}
              className="lg:hidden flex items-center gap-1 bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 cursor-pointer min-h-[36px]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[100px]">{selectedLeague.replace("All ", "")}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          {/* Collapsible Mobile League Drawer */}
          {isMobileLeagueOpen && (
            <div className="lg:hidden bg-white border border-slate-200 rounded-xl p-2 shadow-lg animate-in slide-in-from-top-2">
              <span className="text-[10px] font-black uppercase text-slate-500 px-2 block mb-1">Select Tournament</span>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                {(TOURNAMENT_LEAGUES[activeSport] || TOURNAMENT_LEAGUES.Cricket).map(lg => (
                  <button
                    key={lg}
                    onClick={() => {
                      setSelectedLeague(lg);
                      setIsMobileLeagueOpen(false);
                    }}
                    className={cn(
                      "text-left px-2.5 py-2 rounded-lg text-xs font-bold truncate transition-colors min-h-[38px] flex items-center",
                      selectedLeague === lg ? "bg-emerald-700 text-white font-black" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {lg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {betFeedback && (
            <div className="bg-emerald-50 border border-emerald-400 text-emerald-900 px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-between shadow-xs">
              <span>{betFeedback}</span>
              <button onClick={() => setBetFeedback(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* 6-BOX MATCHED EXCHANGE TABLE (Matching Video) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            
            {/* Table Header */}
            <div className="bg-slate-100/80 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-[11px] font-black text-slate-700 uppercase tracking-wider">
              <div className="flex-1">{selectedLeague.startsWith("All ") ? "Sports Highlights" : selectedLeague}</div>
              <div className="hidden sm:flex items-center gap-1 w-[260px] justify-end">
                <div className="w-16 text-center text-[#0284c7] font-black">1 Back</div>
                <div className="w-16 text-center text-[#e11d48] font-black">1 Lay</div>
                <div className="w-16 text-center text-[#0284c7] font-black">2 Back</div>
                <div className="w-16 text-center text-[#e11d48] font-black">2 Lay</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Syncing live verified feeds...</span>
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-black uppercase text-slate-800">No Matches for {selectedLeague}</p>
                  <p className="text-xs text-slate-500 mt-1">Switch to All Cricket or Today</p>
                </div>
              ) : (
                filteredMatches.map(m => {
                  const isPinned = pinnedMatches.includes(m.id);
                  const isLive = m.status === "Live";
                  const o1 = m.odds?.team1 || 2.10;
                  const o2 = m.odds?.team2 || 2.30;
                  const lay1 = parseFloat((o1 + 0.02).toFixed(2));
                  const lay2 = parseFloat((o2 + 0.02).toFixed(2));

                  return (
                    <div key={m.id} className="p-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      
                      {/* Match Meta & Names (Clickable Link) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => togglePinMatch(m.id)}
                            className={cn("p-1 rounded cursor-pointer transition-colors", isPinned ? "text-amber-500" : "text-slate-400 hover:text-slate-700")}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {isLive ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded text-[9px] font-black uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> Live
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded text-[9px] font-black">
                              {m.timeStr || "SCHEDULED"}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 font-bold uppercase truncate">{m.seriesName || "Exchange Market"}</span>
                        </div>

                        <Link href={`/sportsbook/match/${m.id}`} className="block group">
                          <div className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {m.team1} v {m.team2}
                          </div>
                          {m.score && (
                            <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                              {m.score}
                            </div>
                          )}
                        </Link>

                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Matched: PIN 592,746,458.20
                        </div>
                      </div>

                      {/* 6-Box Back/Lay Action Cells (Desktop Grid / Mobile Touch Targets) */}
                      <div className="grid grid-cols-4 sm:flex items-center gap-1.5 shrink-0">
                        {/* Team 1 Back */}
                        <button
                          onClick={() => handleSelectOdds(m, m.team1, o1, 'back')}
                          className="w-full sm:w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-xs min-h-[44px]"
                        >
                          <span className="text-[8px] opacity-75 font-bold uppercase">Back</span>
                          <span className="text-sm font-black">{o1.toFixed(2)}</span>
                        </button>

                        {/* Team 1 Lay */}
                        <button
                          onClick={() => handleSelectOdds(m, m.team1, lay1, 'lay')}
                          className="w-full sm:w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-xs min-h-[44px]"
                        >
                          <span className="text-[8px] opacity-75 font-bold uppercase">Lay</span>
                          <span className="text-sm font-black">{lay1.toFixed(2)}</span>
                        </button>

                        {/* Team 2 Back */}
                        <button
                          onClick={() => handleSelectOdds(m, m.team2, o2, 'back')}
                          className="w-full sm:w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-xs min-h-[44px]"
                        >
                          <span className="text-[8px] opacity-75 font-bold uppercase">Back</span>
                          <span className="text-sm font-black">{o2.toFixed(2)}</span>
                        </button>

                        {/* Team 2 Lay */}
                        <button
                          onClick={() => handleSelectOdds(m, m.team2, lay2, 'lay')}
                          className="w-full sm:w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-xs min-h-[44px]"
                        >
                          <span className="text-[8px] opacity-75 font-bold uppercase">Lay</span>
                          <span className="text-sm font-black">{lay2.toFixed(2)}</span>
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </main>

        {/* ── RIGHT COLUMN: STICKY BET SLIP WORKSPACE (3 COLS) ── */}
        <aside className="hidden lg:block lg:col-span-3 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm sticky top-3">
            
            <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" /> Bet Slip
              </span>
              <span className="text-[10px] text-slate-500 font-mono">PIN: {(walletBalance || 25400).toLocaleString()}</span>
            </div>

            {selectedBet ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-black text-sm text-slate-900">{selectedBet.selection}</span>
                    <span className="text-[10px] text-slate-500 font-bold block">{selectedBet.matchTitle}</span>
                  </div>
                  <button onClick={() => setSelectedBet(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedBet.odds}
                      onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-black text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Stake</label>
                    <input
                      type="number"
                      value={selectedBet.stake}
                      onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-black text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Quick Stake Buttons (Exact from Video) */}
                <div className="grid grid-cols-4 gap-1">
                  {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-bold text-slate-800 rounded-md cursor-pointer transition-colors"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Potential Return:</span>
                  <strong className="text-emerald-700 font-mono">
                    PIN {Math.round(selectedBet.stake * (selectedBet.odds - 1)).toLocaleString()}
                  </strong>
                </div>

                <button
                  disabled={isPlacing || selectedBet.stake <= 0}
                  onClick={handlePlaceBetslip}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 font-black text-xs text-white uppercase tracking-wider rounded-lg shadow-sm cursor-pointer transition-all"
                >
                  {isPlacing ? "Placing Order..." : "Place Bet"}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                <p className="font-bold text-slate-600">Click any odd to create a bet</p>
              </div>
            )}

          </div>
        </aside>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. SLIDING QUICK BET BOTTOM SHEET (Mobile Only)
      ═══════════════════════════════════════════════════════════════ */}
      {selectedBet && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-3 max-w-md mx-auto animate-in slide-in-from-bottom-6">
          <div className="bg-white border-2 border-emerald-600 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-black text-sm text-slate-900">{selectedBet.selection}</span>
                <span className="text-[10px] text-slate-500 font-bold block">{selectedBet.matchTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-black", selectedBet.type === 'back' ? "bg-[#72bbef] text-[#002b49]" : "bg-[#faa9ba] text-[#4a0011]")}>
                  {selectedBet.type.toUpperCase()}
                </span>
                <button onClick={() => setSelectedBet(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Odds</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedBet.odds}
                  onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-black text-sm text-slate-900 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Stake</label>
                <input
                  type="number"
                  value={selectedBet.stake}
                  onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-black text-sm text-slate-900 min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[100, 500, 1000, 5000].map(val => (
                <button
                  key={val}
                  onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold text-slate-800 rounded-xl cursor-pointer min-h-[36px]"
                >
                  +{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            <button
              disabled={isPlacing || selectedBet.stake <= 0}
              onClick={handlePlaceBetslip}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 font-black text-sm text-white uppercase tracking-wider rounded-xl cursor-pointer shadow-md min-h-[48px]"
            >
              {isPlacing ? "Placing Order..." : "Confirm & Place Bet"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
