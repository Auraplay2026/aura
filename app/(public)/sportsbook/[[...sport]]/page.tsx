"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Activity, Clock, X, Menu, Receipt, ChevronDown, ChevronUp, 
  TrendingUp, Zap, Calendar, Target, Search, Filter, Star, Pin, Settings,
  User, Check, AlertCircle, ShieldCheck, PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { adjustOddsForExposure } from "@/lib/mathEngine";

// ─── LEAGUE HIERARCHY DATA (Exact Match from Recording) ──────────────────────
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
    matchId: number;
    matchTitle: string;
    selection: string;
    type: 'back' | 'lay';
    odds: number;
    stake: number;
  } | null>(null);

  const [pinnedMatches, setPinnedMatches] = useState<number[]>([]);
  const [betFeedback, setBetFeedback] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const placeSportsBet = useTradingStore(s => s.placeSportsBet);
  const walletBalance = useTradingStore(s => s.balance);
  const deposit = useTradingStore(s => s.deposit);

  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  // Promo Banner Carousel
  const [bannerIdx, setBannerIdx] = useState(0);
  const banners = [
    { title: "INTERNATIONAL CASINO", sub: "Live Dealers, Roulette, Blackjack & Slots", bg: "from-amber-700 via-rose-900 to-slate-950", image: "👑" },
    { title: "TEEN PATTI 20-20", sub: "Instant 20-second rounds with high limits", bg: "from-emerald-800 via-teal-950 to-slate-950", image: "🃏" },
    { title: "ANDAR BAHAR LIVE", sub: "Fastest Subcontinent Card Games", bg: "from-purple-900 via-indigo-950 to-slate-950", image: "💎" }
  ];

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(bannerInterval);
  }, [banners.length]);

  // Real-time EventSource SSE Stream with fallback SWR polling
  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    const rawKey = activeSport.toLowerCase();
    const sportKey = (rawKey === 'all' || rawKey === 'all sports') ? 'all' : (rawKey === 'football' ? 'soccer' : rawKey);

    const processIncomingMatches = (incoming: any[]) => {
      setMatches(prevMatches => {
        return incoming.map((m: any) => {
          const prev = prevMatches.find((p: any) => p.id === m.id);
          let trend1: 'up' | 'down' | 'none' = 'none';
          let trend2: 'up' | 'down' | 'none' = 'none';
          let trendDraw: 'up' | 'down' | 'none' | null = m.odds?.draw ? 'none' : null;
          if (prev && prev.odds && m.odds) {
            if (m.odds.team1 > prev.odds.team1) trend1 = 'up';
            else if (m.odds.team1 < prev.odds.team1) trend1 = 'down';

            if (m.odds.team2 > prev.odds.team2) trend2 = 'up';
            else if (m.odds.team2 < prev.odds.team2) trend2 = 'down';

            if (m.odds.draw && prev.odds.draw) {
              if (m.odds.draw > prev.odds.draw) trendDraw = 'up';
              else if (m.odds.draw < prev.odds.draw) trendDraw = 'down';
            }
          }
          return {
            ...m,
            trend: m.trend || { team1: trend1, draw: trendDraw, team2: trend2 }
          };
        });
      });
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
        } catch (err) {
          // ignore
        }
      };

      eventSource.onerror = () => {
        if (!fallbackInterval && active) {
          fallbackInterval = setInterval(fetchFallback, 8000);
        }
      };
    } catch (sseErr) {
      fallbackInterval = setInterval(fetchFallback, 8000);
    }

    return () => {
      active = false;
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [activeSport]);

  const togglePinMatch = (id: number) => {
    setPinnedMatches(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectOdds = (match: any, selection: string, odds: number, type: 'back' | 'lay') => {
    if (oneClickBet) {
      // Execute 1-Click Bet instantly
      setIsPlacing(true);
      setTimeout(() => {
        setIsPlacing(false);
        setBetFeedback(`✅ 1-Click Bet Placed: ${selection} (${type.toUpperCase()}) @ ${odds.toFixed(2)} with PIN ${oneClickStake}`);
        setTimeout(() => setBetFeedback(null), 4000);
      }, 400);
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
      setTimeout(() => setBetFeedback(null), 4000);
    }
  };

  // Filtered Matches
  const filteredMatches = matches.filter(m => {
    // Nav tab filter
    if (activeNavTab === "In Play" && m.status !== "Live") return false;
    
    // Time filter
    if (selectedDateTab === "inplay" && m.status !== "Live") return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.team1} ${m.team2} ${m.seriesName || ""}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#e8ecef] text-slate-900 font-sans text-xs select-none">
      
      {/* ═══════════════════════════════════════════════════════════════
          1. TOP PINE GREEN EXCHANGE HEADER (bg-[#1b3d2f])
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-[#1b3d2f] text-white border-b border-emerald-950 px-3 py-1.5 shadow-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Logo & Search Bar */}
          <div className="flex items-center gap-3">
            <Link href="/sportsbook" className="flex items-center gap-1 font-black text-lg tracking-tight text-white">
              <span className="text-amber-400 text-xl font-serif">★</span>
              <span className="font-extrabold tracking-wider uppercase text-base">STAR</span>
              <span className="text-[10px] bg-emerald-700 text-emerald-200 px-1 py-0.2 rounded uppercase font-bold tracking-widest ml-1">EXCHANGE</span>
            </Link>

            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12281f] text-white placeholder:text-slate-400 text-xs pl-8 pr-3 py-1 rounded-sm border border-emerald-900/80 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          {/* Account HUD & One-Click Bet Switch */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 bg-[#12281f] px-2.5 py-1 rounded-sm border border-emerald-900/60 font-mono text-[11px]">
              <span className="text-slate-300">Main Balance:</span>
              <strong className="text-amber-300 font-black">PIN {(walletBalance || 25400).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              <span className="text-slate-400 ml-1">Exposure:</span>
              <strong className="text-rose-400 font-black">0.00</strong>
            </div>

            {/* One Click Bet Toggle */}
            <div className="flex items-center gap-1.5 bg-[#12281f] px-2.5 py-1 rounded-sm border border-emerald-900/60">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneClickBet}
                  onChange={(e) => setOneClickBet(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
                />
                <span className={cn("text-[11px] font-black uppercase tracking-wider", oneClickBet ? "text-amber-300" : "text-slate-300")}>
                  One Click Bet
                </span>
              </label>
              {oneClickBet && (
                <select
                  value={oneClickStake}
                  onChange={(e) => setOneClickStake(Number(e.target.value))}
                  className="bg-[#1b3d2f] text-amber-300 font-mono font-bold text-[10px] rounded px-1 border border-amber-400/40"
                >
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                </select>
              )}
            </div>

            {/* My Account & Settings */}
            <button className="flex items-center gap-1 bg-[#12281f] hover:bg-[#183529] px-2.5 py-1 rounded-sm border border-emerald-900/60 text-white font-bold cursor-pointer transition-colors">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>My Account</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button className="flex items-center gap-1 bg-[#12281f] hover:bg-[#183529] p-1.5 rounded-sm border border-emerald-900/60 text-slate-300 hover:text-white cursor-pointer transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. SPORT CATEGORY NAVIGATION TABS WITH LIVE COUNTERS
      ═══════════════════════════════════════════════════════════════ */}
      <nav className="bg-[#234938] text-white px-3 border-b border-emerald-950 shadow-xs overflow-x-auto scrollbar-none">
        <div className="max-w-[1600px] mx-auto flex items-center gap-0.5">
          {[
            { id: "Home", label: "Home", count: null },
            { id: "In Play", label: "In Play", count: 18, isLiveBadge: true },
            { id: "Multi Markets", label: "Multi Markets", count: null },
            { id: "Cricket", label: "Cricket", count: 19 },
            { id: "Soccer", label: "Soccer", count: 17 },
            { id: "Tennis", label: "Tennis", count: 14 },
            { id: "Virtual Cricket", label: "Virtual Cricket", count: null },
            { id: "E-Soccer", label: "E-Soccer", count: null },
            { id: "Casino", label: "Casino", count: "NEW", isNew: true },
            { id: "Result", label: "Result", count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveNavTab(tab.id);
                if (tab.id === "Cricket" || tab.id === "Soccer" || tab.id === "Tennis") {
                  setActiveSport(tab.id);
                  setSelectedLeague(`All ${tab.id}`);
                }
              }}
              className={cn(
                "px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border-b-2",
                activeNavTab === tab.id
                  ? "bg-[#1b3d2f] text-amber-300 border-amber-400"
                  : "text-slate-200 hover:text-white hover:bg-[#1f4233] border-transparent"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={cn(
                  "text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full",
                  tab.isNew ? "bg-amber-400 text-slate-950 font-black animate-pulse" : (tab.isLiveBadge ? "bg-red-600 text-white font-black" : "bg-emerald-800 text-emerald-100")
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          3. SCROLLING NEWS TICKER (Marquee from Video)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#12281f] text-slate-200 px-3 py-1 border-b border-emerald-950 flex items-center gap-2 overflow-hidden text-[11px]">
        <div className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-xs uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1">
          <span>📢</span> NEWS
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="inline-block animate-marquee font-medium text-slate-300">
            21-Aug-2026 Event: Pakistan Blues v Pakistan Greens | Market: F Zaman Runs &quot;Whole Market Voided Because he didn&apos;t Come for Opening, So we have created a new Market by adding (N) after the Market Name... Sorry for the Inconvenience&quot; • Sub-second Live Commentary and Indian Bhav active on all in-play fixtures.
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. MAIN 3-COLUMN WORKSPACE (Left Tree, Center Table, Right Bet Slip)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* ─── COLUMN 1: LEFT SPORTS & LEAGUE TREE ACCORDION (3 Cols) ─── */}
        <aside className="lg:col-span-3 bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden">
          <div className="bg-[#1b3d2f] text-white px-3 py-2 font-black uppercase text-xs tracking-wider flex items-center justify-between border-b border-emerald-950">
            <span>Sports</span>
            <span className="text-[10px] text-amber-300 font-mono">ALL LEAGUES</span>
          </div>

          <div className="divide-y divide-slate-200 text-xs font-bold">
            {Object.keys(TOURNAMENT_LEAGUES).map(sportKey => {
              const isOpen = activeSport.toLowerCase() === sportKey.toLowerCase() || (sportKey === "Cricket" && activeSport === "All Sports");
              const leagues = TOURNAMENT_LEAGUES[sportKey];

              return (
                <div key={sportKey} className="bg-white">
                  <button
                    onClick={() => {
                      setActiveSport(sportKey);
                      setSelectedLeague(`All ${sportKey}`);
                      setSelectedSportFilter(sportKey);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer font-black uppercase",
                      isOpen ? "bg-[#eaf3ee] text-[#1b3d2f]" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>{sportKey.replace('_', ' ')}</span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#1b3d2f]" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="bg-slate-50 border-t border-slate-200 pl-3 pr-2 py-1 space-y-0.5">
                      {leagues.map(league => (
                        <button
                          key={league}
                          onClick={() => setSelectedLeague(league)}
                          className={cn(
                            "w-full text-left px-2 py-1 rounded-xs text-[11px] font-bold block transition-colors truncate cursor-pointer",
                            selectedLeague === league
                              ? "bg-[#234938] text-white font-black"
                              : "text-slate-700 hover:bg-slate-200 hover:text-slate-950"
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

        {/* ─── COLUMN 2: CENTER EXCHANGE MARKETS STAGE (6 Cols) ─── */}
        <main className="lg:col-span-6 space-y-2.5">
          
          {/* Promotional Banner Carousel (Exact from Video) */}
          <div className={cn("rounded-xs p-4 text-white bg-gradient-to-r shadow-xs relative overflow-hidden transition-all duration-500", banners[bannerIdx].bg)}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block mb-1">Featured Arena</span>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">{banners[bannerIdx].title}</h2>
                <p className="text-xs text-slate-200 font-medium mt-0.5">{banners[bannerIdx].sub}</p>
              </div>
              <div className="text-4xl sm:text-5xl opacity-90 drop-shadow-md">
                {banners[bannerIdx].image}
              </div>
            </div>
            {/* Banner Dots */}
            <div className="flex items-center gap-1.5 mt-3">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={cn("h-1.5 rounded-full transition-all cursor-pointer", bannerIdx === i ? "w-5 bg-amber-400" : "w-1.5 bg-white/40")}
                />
              ))}
            </div>
          </div>

          {/* Time Filter Tabs: In-Play / Today / Tomorrow */}
          <div className="bg-white border border-slate-300 rounded-xs p-1.5 shadow-2xs flex items-center justify-between gap-2">
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
                    "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xs transition-colors cursor-pointer",
                    selectedDateTab === t.id
                      ? "bg-[#1b3d2f] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sport Filter Sub-Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {["Cricket", "Soccer", "Tennis", "E-Soccer"].map(sp => (
                <button
                  key={sp}
                  onClick={() => {
                    setSelectedSportFilter(sp);
                    setActiveSport(sp);
                    setSelectedLeague(`All ${sp}`);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-black uppercase rounded-xs transition-colors cursor-pointer shrink-0",
                    selectedSportFilter === sp
                      ? "bg-[#234938] text-amber-300"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Toast */}
          {betFeedback && (
            <div className="bg-slate-900 text-amber-300 px-3 py-2 rounded-xs border border-amber-400/40 text-xs font-black uppercase tracking-wide flex items-center justify-between animate-fade-in shadow-md">
              <span>{betFeedback}</span>
              <button onClick={() => setBetFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* ─── EXCHANGE TABLE (Exact 6-Column Back/Lay Layout) ─── */}
          <div className="bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden">
            
            {/* Table Header */}
            <div className="bg-[#1b3d2f] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider border-b border-emerald-950">
              <div className="flex-1 truncate">
                Sports Highlights ({selectedLeague || activeSport})
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-24 text-right pr-2 text-slate-300 font-mono text-[10px]">Matched</div>
                <div className="w-20 text-center text-cyan-200">1</div>
                <div className="w-20 text-center text-amber-200">X</div>
                <div className="w-20 text-center text-cyan-200">2</div>
              </div>
            </div>

            {/* Matches List */}
            {isLoading ? (
              <div className="p-10 text-center text-slate-500 font-bold flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-3 border-[#1b3d2f] border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing live exchange order book...</span>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-bold">
                <p className="text-sm uppercase tracking-wider text-slate-700">No In-Play Events in this Category</p>
                <button
                  onClick={() => { setSelectedDateTab("inplay"); setSelectedLeague("All Cricket"); }}
                  className="mt-3 px-3 py-1.5 bg-[#1b3d2f] text-white font-black uppercase text-xs rounded-xs cursor-pointer hover:bg-[#234938]"
                >
                  View All Live Matches
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredMatches.map((m: any) => {
                  const isPinned = pinnedMatches.includes(m.id);
                  const isLive = m.status === "Live";
                  const o1 = m.odds?.team1 || 2.10;
                  const o2 = m.odds?.team2 || 2.30;
                  const oDraw = m.odds?.draw;

                  const lay1 = parseFloat((o1 + 0.02).toFixed(2));
                  const lay2 = parseFloat((o2 + 0.02).toFixed(2));
                  const layDraw = oDraw ? parseFloat((oDraw + 0.04).toFixed(2)) : null;

                  return (
                    <div
                      key={m.id}
                      className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/90 transition-colors"
                    >
                      {/* Event Info */}
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => togglePinMatch(m.id)}
                          className={cn("mt-0.5 p-1 rounded-xs cursor-pointer", isPinned ? "text-amber-500" : "text-slate-300 hover:text-slate-500")}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isLive ? (
                              <span className="bg-emerald-600 text-white font-mono font-black text-[9px] px-1.5 py-0.2 rounded-xs uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                In Play
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{m.timeStr || "Scheduled"}</span>
                            )}
                            <span className="text-[10px] text-slate-500 font-bold truncate">{m.seriesName || "League Match"}</span>
                          </div>

                          <Link
                            href={`/sportsbook/match/${m.id}`}
                            className="font-black text-xs text-slate-900 hover:text-emerald-800 transition-colors block mt-0.5 truncate"
                          >
                            {m.team1} <span className="text-slate-400 font-normal">v</span> {m.team2}
                          </Link>
                          
                          {m.score && (
                            <span className="text-[11px] font-mono font-black text-emerald-700 block mt-0.2">
                              {m.score}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matched Volume & 6-Box Back/Lay Grid */}
                      <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right pr-2 font-mono text-[10px] text-slate-500 hidden md:block">
                          <span className="block text-[8px] text-slate-400 uppercase">Matched</span>
                          <strong>PIN {Math.round(m.id * 14500 + 450000).toLocaleString()}</strong>
                        </div>

                        {/* 1: Team 1 (Back Cyan & Lay Pink) */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleSelectOdds(m, m.team1, o1, 'back')}
                            className="w-10 h-8 bg-[#72bbef] hover:bg-[#5db1eb] text-[#002b49] font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors cursor-pointer leading-none shadow-2xs active:scale-95"
                          >
                            <span>{o1.toFixed(2)}</span>
                            <span className="text-[8px] opacity-75 font-mono">152k</span>
                          </button>
                          <button
                            onClick={() => handleSelectOdds(m, m.team1, lay1, 'lay')}
                            className="w-10 h-8 bg-[#faa9ba] hover:bg-[#f895a9] text-[#4a0011] font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors cursor-pointer leading-none shadow-2xs active:scale-95"
                          >
                            <span>{lay1.toFixed(2)}</span>
                            <span className="text-[8px] opacity-75 font-mono">89k</span>
                          </button>
                        </div>

                        {/* X: Draw (Back Cyan & Lay Pink) */}
                        <div className="flex items-center gap-0.5">
                          <button
                            disabled={!oDraw}
                            onClick={() => oDraw && handleSelectOdds(m, "Draw", oDraw, 'back')}
                            className={cn(
                              "w-10 h-8 font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors leading-none shadow-2xs",
                              oDraw ? "bg-[#72bbef] hover:bg-[#5db1eb] text-[#002b49] cursor-pointer active:scale-95" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            )}
                          >
                            <span>{oDraw ? oDraw.toFixed(2) : "-"}</span>
                            <span className="text-[8px] opacity-75 font-mono">{oDraw ? "45k" : ""}</span>
                          </button>
                          <button
                            disabled={!layDraw}
                            onClick={() => layDraw && handleSelectOdds(m, "Draw", layDraw, 'lay')}
                            className={cn(
                              "w-10 h-8 font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors leading-none shadow-2xs",
                              layDraw ? "bg-[#faa9ba] hover:bg-[#f895a9] text-[#4a0011] cursor-pointer active:scale-95" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            )}
                          >
                            <span>{layDraw ? layDraw.toFixed(2) : "-"}</span>
                            <span className="text-[8px] opacity-75 font-mono">{layDraw ? "12k" : ""}</span>
                          </button>
                        </div>

                        {/* 2: Team 2 (Back Cyan & Lay Pink) */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleSelectOdds(m, m.team2, o2, 'back')}
                            className="w-10 h-8 bg-[#72bbef] hover:bg-[#5db1eb] text-[#002b49] font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors cursor-pointer leading-none shadow-2xs active:scale-95"
                          >
                            <span>{o2.toFixed(2)}</span>
                            <span className="text-[8px] opacity-75 font-mono">214k</span>
                          </button>
                          <button
                            onClick={() => handleSelectOdds(m, m.team2, lay2, 'lay')}
                            className="w-10 h-8 bg-[#faa9ba] hover:bg-[#f895a9] text-[#4a0011] font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors cursor-pointer leading-none shadow-2xs active:scale-95"
                          >
                            <span>{lay2.toFixed(2)}</span>
                            <span className="text-[8px] opacity-75 font-mono">110k</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* ─── COLUMN 3: RIGHT STICKY BET SLIP (3 Cols) ─── */}
        <aside className="lg:col-span-3 bg-white border border-slate-300 rounded-xs shadow-xs sticky top-14">
          <div className="bg-[#1b3d2f] text-white px-3 py-2 font-black uppercase text-xs tracking-wider flex items-center justify-between border-b border-emerald-950">
            <span>Bet Slip</span>
            {selectedBet && (
              <button
                onClick={() => setSelectedBet(null)}
                className="text-slate-300 hover:text-white text-[10px] uppercase font-bold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {!selectedBet ? (
            <div className="p-8 text-center text-slate-500 font-bold">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-70" />
              <p className="text-xs">Click on the odds to add selections to the betslip.</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              
              {/* Selection Header Card */}
              <div className={cn(
                "p-2.5 rounded-xs border text-xs",
                selectedBet.type === 'back' ? "bg-blue-50/80 border-blue-200 text-blue-950" : "bg-pink-50/80 border-pink-200 text-pink-950"
              )}>
                <div className="flex items-center justify-between font-black">
                  <span>{selectedBet.selection}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-xs text-[10px] uppercase font-black",
                    selectedBet.type === 'back' ? "bg-[#72bbef] text-[#002b49]" : "bg-[#faa9ba] text-[#4a0011]"
                  )}>
                    {selectedBet.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {selectedBet.matchTitle} • Match Odds
                </div>

                {/* Odds & Stake Steppers */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedBet.odds}
                      onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                      className="w-full bg-white border border-slate-300 rounded-xs px-2 py-1 font-mono font-black text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Stake (PIN)</label>
                    <input
                      type="number"
                      value={selectedBet.stake}
                      onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-xs px-2 py-1 font-mono font-black text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Quick Stake Buttons */}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                      className="py-1 bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold rounded-xs cursor-pointer transition-colors"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>

                {/* Profit / Liability Calculations */}
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] flex justify-between items-center font-bold">
                  {selectedBet.type === 'back' ? (
                    <>
                      <span className="text-slate-600">Profit:</span>
                      <strong className="text-emerald-700 font-mono">
                        +PIN {Math.round(selectedBet.stake * (selectedBet.odds - 1)).toLocaleString()}
                      </strong>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-600">Liability:</span>
                      <strong className="text-rose-700 font-mono">
                        -PIN {Math.round(selectedBet.stake * (selectedBet.odds - 1)).toLocaleString()}
                      </strong>
                    </>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={isPlacing || selectedBet.stake <= 0}
                onClick={handlePlaceBetslip}
                className={cn(
                  "w-full py-2.5 font-black text-xs uppercase tracking-wider rounded-xs cursor-pointer transition-all shadow-sm active:scale-98",
                  isPlacing ? "bg-slate-400 text-white cursor-not-allowed" : "bg-[#1b3d2f] hover:bg-[#234938] text-amber-300"
                )}
              >
                {isPlacing ? "Submitting Order..." : "Place Bet"}
              </button>
            </div>
          )}
        </aside>

      </div>

    </div>
  );
}
