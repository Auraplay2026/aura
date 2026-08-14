"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { Trophy, Activity, Clock, X, Menu, Receipt, ChevronDown, ChevronUp, TrendingUp, Zap, Calendar, Target, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { useSidebarContext } from "@/components/layout/AppProviders";
import { validateTransactionIdempotency, adjustOddsForExposure, parseAndSettleBet } from "@/lib/mathEngine";
import { MarketPulseTicker } from "@/components/sportsbook/MarketPulseTicker";
import { DateNavigationCarousel } from "@/components/sportsbook/DateNavigationCarousel";

// ─── Exchange Cell (Match Odds Back/Lay) ─────────────────────────────────────
const ExchangeCell = ({ value, trend, type, onClick, isSelected, suspended }: any) => {
  const isBack = type === 'back';

  if (suspended) {
    return (
      <div className="relative flex flex-col items-center justify-center w-[50px] sm:w-[60px] h-[40px] border border-slate-200 bg-slate-100 overflow-hidden cursor-not-allowed">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center z-10">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Suspend</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center w-[50px] sm:w-[60px] h-[40px] transition-all group",
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

// ─── Pre-Match Market Cell ────────────────────────────────────────────────────
const PreMatchCell = ({ value, type, onClick, isSelected, disabled }: any) => {
  const isBack = type === 'back';
  if (disabled || !value) {
    return (
      <div className="flex flex-col items-center justify-center w-[50px] sm:w-[58px] h-[38px] bg-slate-100 border border-slate-200 rounded-sm cursor-not-allowed">
        <span className="text-[10px] text-slate-400 font-bold">-</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-[50px] sm:w-[58px] h-[38px] rounded-sm transition-all border",
        isBack
          ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
          : "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800",
        isSelected && (isBack ? "border-2 border-blue-600 bg-blue-100" : "border-2 border-purple-600 bg-purple-100")
      )}
    >
      <span className="font-bold text-sm leading-none">{value.toFixed(2)}</span>
      <span className={cn("text-[9px] font-medium", isBack ? "text-blue-500" : "text-purple-500")}>
        {isBack ? 'BACK' : 'LAY'}
      </span>
    </button>
  );
};

// ─── Live Micro-Market Outcome Row ────────────────────────────────────────────
const MicroMarketOutcomeRow = ({ outcomeName, backOdds, layOdds, trend, isSuspended, onSelect, activeSelection, selectionId, baseBackOdds, baseLayOdds }: any) => {
  return (
    <div className="flex items-center justify-between py-1 bg-white border-b border-slate-100">
      <span className="text-xs font-bold text-slate-800 tracking-wide truncate max-w-[130px] sm:max-w-[180px]">{outcomeName}</span>
      <div className="flex items-center gap-1 shrink-0">
        {/* Back Button */}
        <button
          onClick={() => !isSuspended && onSelect('back', backOdds, baseBackOdds, selectionId)}
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

        {/* Lay Button */}
        <button
          onClick={() => !isSuspended && onSelect('lay', layOdds, baseLayOdds, selectionId)}
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

// ─── Pre-Match Markets Panel ──────────────────────────────────────────────────
const PreMatchPanel = ({ match, betslip, toggleBet }: any) => {
  // Generate stable pre-match odds based on match id
  const seed = match.id;
  const handicapLine = -0.5;
  const totalLine = match.sport === 'cricket' ? 155.5 : match.sport === 'basketball' ? 210.5 : 2.5;
  const totalLabel = match.sport === 'cricket' ? 'Total Runs' : match.sport === 'basketball' ? 'Total Points' : 'Total Goals';

  return (
    <div className="w-full bg-[#F8FAFF] border-t border-exchange-border p-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <Calendar className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Pre-Match Markets</span>
        <span className="ml-auto text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">3 Markets</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Market 1: Match Result */}
        <div className="bg-white rounded border border-slate-200 p-2.5 shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 mb-2">Match Result</span>
          <div className="space-y-1">
            {/* Team 1 */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{match.team1}</span>
              <div className="flex gap-1">
                <PreMatchCell
                  value={match.odds?.team1}
                  type="back"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === match.team1 && b.type === 'back')}
                  onClick={() => toggleBet(match.id, match.team1, match.odds?.team1, 'back')}
                />
                <PreMatchCell
                  value={match.odds?.team1 ? match.odds.team1 + 0.02 : null}
                  type="lay"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === match.team1 && b.type === 'lay')}
                  onClick={() => toggleBet(match.id, match.team1, match.odds?.team1 + 0.02, 'lay')}
                />
              </div>
            </div>
            {/* Draw (if applicable) */}
            {match.odds?.draw !== null && match.odds?.draw !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Draw</span>
                <div className="flex gap-1">
                  <PreMatchCell
                    value={match.odds?.draw}
                    type="back"
                    isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === 'Draw' && b.type === 'back')}
                    onClick={() => toggleBet(match.id, 'Draw', match.odds?.draw, 'back')}
                  />
                  <PreMatchCell
                    value={match.odds?.draw ? match.odds.draw + 0.05 : null}
                    type="lay"
                    isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === 'Draw' && b.type === 'lay')}
                    onClick={() => toggleBet(match.id, 'Draw', match.odds?.draw + 0.05, 'lay')}
                  />
                </div>
              </div>
            )}
            {/* Team 2 */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{match.team2}</span>
              <div className="flex gap-1">
                <PreMatchCell
                  value={match.odds?.team2}
                  type="back"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === match.team2 && b.type === 'back')}
                  onClick={() => toggleBet(match.id, match.team2, match.odds?.team2, 'back')}
                />
                <PreMatchCell
                  value={match.odds?.team2 ? match.odds.team2 + 0.02 : null}
                  type="lay"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === match.team2 && b.type === 'lay')}
                  onClick={() => toggleBet(match.id, match.team2, match.odds?.team2 + 0.02, 'lay')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Market 2: Asian Handicap */}
        <div className="bg-white rounded border border-slate-200 p-2.5 shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 mb-2">
            Handicap <span className="text-blue-500">({handicapLine})</span>
          </span>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                {match.team1} {handicapLine}
              </span>
              <div className="flex gap-1">
                <PreMatchCell
                  value={match.odds?.team1 ? Math.max(1.20, match.odds.team1 * 0.92) : null}
                  type="back"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `${match.team1} HC${handicapLine}` && b.type === 'back')}
                  onClick={() => toggleBet(match.id, `${match.team1} HC${handicapLine}`, Math.max(1.20, match.odds.team1 * 0.92), 'back')}
                />
                <PreMatchCell
                  value={match.odds?.team1 ? Math.max(1.22, match.odds.team1 * 0.94) : null}
                  type="lay"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `${match.team1} HC${handicapLine}` && b.type === 'lay')}
                  onClick={() => toggleBet(match.id, `${match.team1} HC${handicapLine}`, Math.max(1.22, match.odds.team1 * 0.94), 'lay')}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                {match.team2} +{Math.abs(handicapLine)}
              </span>
              <div className="flex gap-1">
                <PreMatchCell
                  value={match.odds?.team2 ? Math.max(1.20, match.odds.team2 * 0.92) : null}
                  type="back"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `${match.team2} HC+${Math.abs(handicapLine)}` && b.type === 'back')}
                  onClick={() => toggleBet(match.id, `${match.team2} HC+${Math.abs(handicapLine)}`, Math.max(1.20, match.odds.team2 * 0.92), 'back')}
                />
                <PreMatchCell
                  value={match.odds?.team2 ? Math.max(1.22, match.odds.team2 * 0.94) : null}
                  type="lay"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `${match.team2} HC+${Math.abs(handicapLine)}` && b.type === 'lay')}
                  onClick={() => toggleBet(match.id, `${match.team2} HC+${Math.abs(handicapLine)}`, Math.max(1.22, match.odds.team2 * 0.94), 'lay')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Market 3: Over/Under Totals */}
        <div className="bg-white rounded border border-slate-200 p-2.5 shadow-sm">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b pb-1.5 mb-2 flex justify-between items-center">
            <span>{totalLabel}</span>
            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-black">Line: {totalLine}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Over {totalLine}</span>
              <div className="flex gap-1">
                <PreMatchCell
                  value={1.88}
                  type="back"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `Over ${totalLine}` && b.type === 'back')}
                  onClick={() => toggleBet(match.id, `Over ${totalLine}`, 1.88, 'back')}
                />
                <PreMatchCell
                  value={1.93}
                  type="lay"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `Over ${totalLine}` && b.type === 'lay')}
                  onClick={() => toggleBet(match.id, `Over ${totalLine}`, 1.93, 'lay')}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Under {totalLine}</span>
              <div className="flex gap-1">
                <PreMatchCell
                  value={1.88}
                  type="back"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `Under ${totalLine}` && b.type === 'back')}
                  onClick={() => toggleBet(match.id, `Under ${totalLine}`, 1.88, 'back')}
                />
                <PreMatchCell
                  value={1.93}
                  type="lay"
                  isSelected={betslip.some((b: any) => b.matchId === match.id && b.selection === `Under ${totalLine}` && b.type === 'lay')}
                  onClick={() => toggleBet(match.id, `Under ${totalLine}`, 1.93, 'lay')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center pt-1">
        Live in-play markets (Session / Toss / Ball-by-Ball) will unlock when the match goes live
      </p>
    </div>
  );
};

// ─── Page Component ───────────────────────────────────────────────────────────
export default function SportsbookPage({ params }: { params: Promise<{ sport?: string[] }> }) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const sportQuery = searchParams.get("sport");
  const { setIsMobileMenuOpen } = useSidebarContext();

  const initialSportSlug = unwrappedParams.sport?.[0] ? unwrappedParams.sport[0].replace(/-/g, ' ') : "football";
  const sportParam = initialSportSlug.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [activeSport, setActiveSport] = useState(sportParam);
  const [selectedDate, setSelectedDate] = useState<string>("live");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showMobileBetslip, setShowMobileBetslip] = useState(false);

  // Traditional Match Odds Bet Slip
  const [betslip, setBetslip] = useState<{ matchId: number; selection: string; odds: number; type: 'back' | 'lay'; stake: number }[]>([]);

  const placeSportsBet = useTradingStore(s => s.placeSportsBet);
  const walletBalance = useTradingStore(s => s.balance);
  const deposit = useTradingStore(s => s.deposit);
  const [liveCommentary, setLiveCommentary] = useState("Waiting for match feed updates...");

  const getSelectionLiability = (selectionId: string) => {
    return placedMicroBets
      .filter(b => b.selectionId === selectionId)
      .reduce((sum, b) => sum + (b.type === 'lay' ? b.stake * (b.odds - 1) : b.stake), 0);
  };

  const getAdjustedOdds = (baseOdds: number, selectionId: string) => {
    const liability = getSelectionLiability(selectionId);
    return adjustOddsForExposure(baseOdds, selectionId, liability);
  };

  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const [acceptAnyOdds, setAcceptAnyOdds] = useState(false);
  const [simulatedLatency, setSimulatedLatency] = useState(150);
  const [streamTime, setStreamTime] = useState<number>(Date.now());

  // Cricket state
  const [cricketLine, setCricketLine] = useState(155.5);
  const [cricketOdds, setCricketOdds] = useState({ over: 1.85, under: 1.85 });
  const [cricketTrend, setCricketTrend] = useState({ over: null as 'up'|'down'|null, under: null as 'up'|'down'|null });
  const [tossLineTrend, setTossLineTrend] = useState<'up' | 'down' | null>(null);
  const [ballLine, setBallLine] = useState({ line: 1.5, overOdds: 1.80, underOdds: 1.95 });
  const [ballTrend, setBallTrend] = useState({ over: null as 'up'|'down'|null, under: null as 'up'|'down'|null });

  // Tennis state
  const [tennisPointOdds, setTennisPointOdds] = useState({ p1: 1.65, p2: 2.10 });
  const [tennisPointTrend, setTennisPointTrend] = useState({ p1: null as 'up'|'down'|null, p2: null as 'up'|'down'|null });
  const [tennisDeuceOdds, setTennisDeuceOdds] = useState({ yes: 3.40, no: 1.25 });
  const [tennisDeuceTrend, setTennisDeuceTrend] = useState({ yes: null as 'up'|'down'|null, no: null as 'up'|'down'|null });

  // Soccer state
  const [soccerMinuteOdds, setSoccerMinuteOdds] = useState({ corner: 3.50, card: 6.00, goal: 12.00, throwIn: 1.15 });
  const [soccerMinuteTrend, setSoccerMinuteTrend] = useState({ corner: null as 'up'|'down'|null, card: null as 'up'|'down'|null, goal: null as 'up'|'down'|null, throwIn: null as 'up'|'down'|null });

  // HUD
  const [hudSelection, setHudSelection] = useState<{
    matchId: number;
    matchTitle: string;
    sport: string;
    marketName: string;
    selectionName: string;
    odds: number;
    baseOdds: number;
    selectionId: string;
    type: 'back' | 'lay';
    lineValue?: number;
  } | null>(null);

  const [hudStake, setHudStake] = useState<number>(100);
  const [betPlacing, setBetPlacing] = useState(false);
  const [betSuccessFlash, setBetSuccessFlash] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [placedMicroBets, setPlacedMicroBets] = useState<any[]>([]);

  useEffect(() => {
    if (sportQuery) {
      const formatted = sportQuery.charAt(0).toUpperCase() + sportQuery.slice(1);
      setActiveSport(formatted);
    }
  }, [sportQuery]);

  // Fetch matches
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
    return () => { active = false; clearInterval(listInterval); };
  }, [activeSport]);

  // Live settlement simulation
  const settlePendingBets = useCallback((eventType: string, outcome: string, value?: number) => {
    setPlacedMicroBets(prev => prev.map(bet => {
      if (bet.status !== 'Pending') return bet;

      let isMatch = false;
      let won = false;
      let payout = 0;

      if (bet.marketName === 'Toss Winner' && eventType === 'Toss') {
        isMatch = true;
        won = bet.selectionName === outcome;
        payout = won ? (bet.type === 'back' ? bet.stake * bet.odds : bet.stake) : 0;
      } else if (bet.marketName === 'Session Runs' && eventType === 'Session') {
        isMatch = true;
        const actualRuns = value || 0;
        const res = parseAndSettleBet(bet, actualRuns);
        won = res.won;
        payout = res.payout;
      } else if (bet.marketName === 'Ball-by-Ball Runs' && eventType === 'Ball') {
        isMatch = true;
        const actualRuns = value || 0;
        const res = parseAndSettleBet(bet, actualRuns);
        won = res.won;
        payout = res.payout;
      } else if (bet.marketName === 'Point Winner' && eventType === 'TennisPoint') {
        isMatch = true;
        won = bet.selectionName === outcome;
        payout = won ? (bet.type === 'back' ? bet.stake * bet.odds : bet.stake) : 0;
      } else if (bet.marketName === 'Deuce Status' && eventType === 'TennisDeuce') {
        isMatch = true;
        won = bet.selectionName === outcome;
        payout = won ? (bet.type === 'back' ? bet.stake * bet.odds : bet.stake) : 0;
      } else if (bet.marketName === '1-Min Event' && eventType === 'SoccerEvent') {
        isMatch = true;
        won = bet.selectionName === outcome;
        payout = won ? (bet.type === 'back' ? bet.stake * bet.odds : bet.stake) : 0;
      }

      if (isMatch) {
        if (bet.id) {
          const settleWager = async () => {
            try {
              const email = useTradingStore.getState().currentUser?.username || useTradingStore.getState().currentUser?.email || "";
              const res = await fetch('/api/sports/settle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email,
                  transactionId: bet.id,
                  status: won ? 'Won' : 'Lost',
                  payout: Math.round(payout)
                })
              });
              const data = await res.json();
              if (res.ok && data.success) {
                useTradingStore.getState().syncFromServer();
              } else {
                console.error(data.error || "Failed to settle sports wager on server");
              }
            } catch (err) {
              console.error("Failed to call sports settle API", err);
            }
          };
          settleWager();
        }
        return { ...bet, status: won ? 'Won' : 'Lost', payout: Math.round(payout) };
      }
      return bet;
    }));
  }, []);

  // Commentary ticker for expanded live match
  useEffect(() => {
    if (expandedMatchId === null) return;
    const currentMatch = matches.find(m => m.id === expandedMatchId);
    if (!currentMatch || currentMatch.status !== 'Live') return;

    const sportLower = (currentMatch.sport || '').toLowerCase();

    const interval = setInterval(() => {
      if (sportLower === 'cricket') {
        const rand = Math.random();
        if (rand < 0.25) {
          const winner = Math.random() > 0.5 ? currentMatch.team1 : currentMatch.team2;
          setLiveCommentary(`Toss completed: ${winner} won the toss and elected to field.`);
          settlePendingBets('Toss', winner);
        } else if (rand < 0.65) {
          const runs = [0, 1, 2, 4, 6, 1][Math.floor(Math.random() * 6)];
          setLiveCommentary(`Delivery 19.5 bowled. Batsman scored ${runs} run(s).`);
          settlePendingBets('Ball', '', runs);
        } else {
          const totalRuns = Math.floor(Math.random() * 50) + 135;
          setLiveCommentary(`1st Innings finished (20 Overs). Team total runs: ${totalRuns}.`);
          settlePendingBets('Session', '', totalRuns);
        }
      } else if (sportLower === 'tennis') {
        const rand = Math.random();
        if (rand < 0.5) {
          const winner = Math.random() > 0.5 ? currentMatch.team1 : currentMatch.team2;
          setLiveCommentary(`Point won by ${winner} with a clean baseline forehand.`);
          settlePendingBets('TennisPoint', winner);
        } else {
          const deuce = Math.random() > 0.5 ? 'Yes' : 'No';
          setLiveCommentary(`Game finished. Reached deuce state: ${deuce}.`);
          settlePendingBets('TennisDeuce', deuce);
        }
      } else if (sportLower === 'soccer') {
        const events = ['Corner', 'Card', 'Goal', 'Throw-In'];
        const event = events[Math.floor(Math.random() * events.length)];
        setLiveCommentary(`Minute 68: Active play resulted in a ${event}!`);
        settlePendingBets('SoccerEvent', event);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [expandedMatchId, matches, settlePendingBets]);

  // Fluctuate Match Odds
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

  // Micro-market feed simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setStreamTime(now - simulatedLatency);
      const delta = () => (Math.random() * 0.08 - 0.04);

      if (Math.random() < 0.20) {
        setCricketLine(line => Math.max(120.5, Math.min(220.5, line + (Math.random() > 0.5 ? 1 : -1))));
      }

      setCricketOdds(prev => {
        const diff = delta();
        setCricketTrend({ over: diff > 0 ? 'up' : 'down', under: diff < 0 ? 'up' : 'down' });
        setTimeout(() => setCricketTrend({ over: null, under: null }), 800);
        return { over: Math.max(1.10, Math.min(4.50, prev.over + diff)), under: Math.max(1.10, Math.min(4.50, prev.under - diff)) };
      });

      setBallLine(prev => {
        const diff = delta();
        setBallTrend({ over: diff > 0 ? 'up' : 'down', under: diff < 0 ? 'up' : 'down' });
        setTimeout(() => setBallTrend({ over: null, under: null }), 800);
        return { ...prev, overOdds: Math.max(1.10, prev.overOdds + diff), underOdds: Math.max(1.10, prev.underOdds - diff) };
      });

      setTennisPointOdds(prev => {
        const diff = delta();
        setTennisPointTrend({ p1: diff > 0 ? 'up' : 'down', p2: diff < 0 ? 'up' : 'down' });
        setTimeout(() => setTennisPointTrend({ p1: null, p2: null }), 800);
        return { p1: Math.max(1.05, prev.p1 + diff), p2: Math.max(1.05, prev.p2 - diff) };
      });

      setTennisDeuceOdds(prev => {
        const diff = delta();
        setTennisDeuceTrend({ yes: diff > 0 ? 'up' : 'down', no: diff < 0 ? 'up' : 'down' });
        setTimeout(() => setTennisDeuceTrend({ yes: null, no: null }), 800);
        return { yes: Math.max(1.1, prev.yes + diff), no: Math.max(1.02, prev.no - diff) };
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

  // Bet slip helpers
  const toggleBet = (matchId: number, selection: string, odds: number, type: 'back' | 'lay') => {
    setBetslip(prev => {
      const existing = prev.find(b => b.matchId === matchId && b.selection === selection && b.type === type);
      if (existing) return prev.filter(b => !(b.matchId === matchId && b.selection === selection && b.type === type));
      return [...prev, { matchId, selection, odds, type, stake: 100 }];
    });
  };

  const removeBet = (matchId: number, selection: string, type: 'back' | 'lay') => {
    setBetslip(prev => prev.filter(b => !(b.matchId === matchId && b.selection === selection && b.type === type)));
  };

  const updateStake = (matchId: number, selection: string, type: 'back' | 'lay', newStake: number) => {
    setBetslip(prev => prev.map(b =>
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

  // Filter matches
  const filteredMatches = matches.filter((match: any) => {
    // 1. Date filter
    if (selectedDate === "live") {
      if (match.status !== "Live") return false;
    } else if (selectedDate !== "all") {
      if (match.dateStr !== selectedDate) return false;
    }

    // 2. Format filter
    if (selectedFormat !== "ALL") {
      const fmt = (match.matchFormat || "").toUpperCase();
      if (!fmt.includes(selectedFormat.toUpperCase())) return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${match.team1} ${match.team2} ${match.seriesName || ""} ${match.matchFormat || ""}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // Group matches by Date Header for Cricbuzz / CREX view
  const groupedMatches = filteredMatches.reduce((groups: Record<string, any[]>, match: any) => {
    const headerKey = (selectedDate === "live" || match.status === "Live") 
      ? "🔴 In-Play / Live Now" 
      : (match.displayDate || "Scheduled Fixtures");
    if (!groups[headerKey]) groups[headerKey] = [];
    groups[headerKey].push(match);
    return groups;
  }, {});

  const isFeedSuspended = simulatedLatency > 350 && !acceptAnyOdds;

  const validatePlatformRisk = (newBet: any, existingBets: any[]): { safe: boolean; maxLiability: number } => {
    const RISK_CAP = 100000;
    const allBets = [...existingBets, newBet];
    const runLines = allBets
      .filter(b => b.marketName === 'Session Runs' || b.marketName === 'Ball-by-Ball Runs')
      .map(b => b.lineValue || 155.5);
    const testPoints = [0, 50, 100, 150, 200, 250, 300];
    runLines.forEach(l => { testPoints.push(l - 0.5); testPoints.push(l + 0.5); });

    let maxPlatformLoss = 0;
    for (const point of testPoints) {
      let platformNet = 0;
      for (const bet of allBets) {
        if (bet.marketName === 'Session Runs' || bet.marketName === 'Ball-by-Ball Runs') {
          const isOver = bet.selectionName.toLowerCase().includes('over');
          const isWin = isOver ? (point > (bet.lineValue || 0)) : (point < (bet.lineValue || 0));
          if (bet.type === 'back') {
            platformNet += isWin ? -(bet.stake * (bet.odds - 1)) : bet.stake;
          } else {
            platformNet += isWin ? bet.stake : -(bet.stake * (bet.odds - 1));
          }
        } else {
          platformNet -= bet.stake * (bet.odds - 1);
        }
      }
      const platformLoss = -platformNet;
      if (platformLoss > maxPlatformLoss) maxPlatformLoss = platformLoss;
    }
    return { safe: maxPlatformLoss <= RISK_CAP, maxLiability: maxPlatformLoss };
  };

  return (
    <div className="flex relative h-[calc(100vh-56px)] w-full bg-exchange-bg text-exchange-text overflow-hidden">

      {/* Mobile Drawer Overlay */}
      {showMobileBetslip && (
        <div className="fixed inset-0 bg-white/50 z-[48] lg:hidden" onClick={() => setShowMobileBetslip(false)} />
      )}

      {/* Main Exchange Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-exchange-surface">
        
        {/* Live Market Pulse Ticker Stream */}
        <MarketPulseTicker />

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-exchange-border bg-white shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex items-center gap-2 font-bold text-sm">
            <Menu className="w-5 h-5 text-exchange-muted" />
            <span className="uppercase text-exchange-text">{activeSport}</span>
          </button>
          <button onClick={() => setShowMobileBetslip(true)} className="relative flex items-center gap-2 font-bold text-sm text-exchange-muted hover:text-exchange-text">
            <Receipt className="w-5 h-5" />
            {betslip.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-slate-900 rounded-full text-[10px] flex items-center justify-center">
                {betslip.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Cricbuzz / CREX Horizontal Date Carousel ── */}
        <DateNavigationCarousel
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          matches={matches}
        />

        {/* ── Sub-Bar: Format Filter & Quick Search ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-exchange-border bg-slate-50 shrink-0 select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-400" /> Format:
            </span>
            {["ALL", "T20", "TEST", "ODI", "EPL", "NBA", "ATP"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-black transition-all uppercase tracking-wide cursor-pointer shrink-0",
                  selectedFormat === fmt
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-exchange-border bg-slate-100 shrink-0 select-none">
          <div className="flex-1 text-xs font-bold text-exchange-muted uppercase tracking-wider">
            {selectedDate === "live" ? "Live Match (Click to expand in-play markets)" : "Scheduled Match (Click for pre-match markets)"}
          </div>
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
              <p className="text-sm font-bold uppercase tracking-wider">No Matches Scheduled For Selected Filter</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting another date or clear format filter</p>
              <button
                type="button"
                onClick={() => { setSelectedDate("all"); setSelectedFormat("ALL"); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
              >
                View All Upcoming Fixtures
              </button>
            </div>
          ) : (
            Object.entries(groupedMatches).map(([dateHeader, groupMatches]: [string, any[]]) => (
              <div key={dateHeader} className="border-b-2 border-slate-200">
                {/* Section Header */}
                <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-4 py-2 border-y border-slate-200 flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wider shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>{dateHeader}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {groupMatches.length} {groupMatches.length === 1 ? "Match" : "Matches"}
                  </span>
                </div>

                {groupMatches.map((match: any) => {
                  const isLive = match.status === "Live";
                  const isExpanded = expandedMatchId === match.id;
                  const sportLower = (match.sport || "").toLowerCase();
                  const liveMarketCount = sportLower === "cricket" ? 6 : sportLower === "tennis" ? 4 : sportLower === "soccer" ? 5 : 1;

                  return (
                    <div
                      key={match.id}
                      className={cn(
                        "flex flex-col border-b border-exchange-border hover:bg-slate-50 transition-colors relative",
                        isLive && "border-l-2 border-l-red-500"
                      )}
                    >
                      {/* Match Row - Direct Link to Dedicated Match Center */}
                      <div className="flex flex-col lg:flex-row items-center justify-between">
                        <Link
                          href={`/sportsbook/match/${match.id || 'aus-xi-vs-ban'}`}
                          className="flex-1 w-full px-4 py-3 flex items-center gap-4 cursor-pointer select-none group"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            {/* Series & Format Line */}
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {match.matchFormat && (
                                <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[9px] font-black">
                                  {match.matchFormat}
                                </span>
                              )}
                              <span className="truncate max-w-[200px] text-slate-600 font-bold">
                                {match.seriesName || (sportLower === 'cricket' ? 'The Hundred 2026' : 'International Championship')}
                              </span>
                              {match.timeStr && (
                                <span className="ml-auto font-mono text-slate-700 font-black">
                                  ⏰ {match.timeStr}
                                </span>
                              )}
                            </div>

                            {/* Teams Line */}
                            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                              <div className="flex items-center gap-2">
                                {match.team1Logo && (
                                  <img
                                    src={match.team1Logo}
                                    alt={match.team1}
                                    className="w-5 h-5 object-contain rounded-full bg-slate-100 p-0.5 border border-slate-200 shrink-0"
                                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                                  />
                                )}
                                <span className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]">{match.team1}</span>
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
                                <span className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]">{match.team2}</span>
                              </div>
                              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded ml-auto sm:ml-2 flex items-center gap-1 group-hover:bg-red-600 group-hover:text-white transition-all">
                                Match Center ➔
                              </span>
                            </div>

                            {/* Status Line */}
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                              {isLive ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-800 animate-pulse shrink-0">
                                  ● LIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 text-blue-700 shrink-0">
                                  <Calendar className="w-2.5 h-2.5" /> SCHEDULED
                                </span>
                              )}
                              <span>•</span>
                              <span>ID: #{match.id.toString().padStart(6, '0')}</span>
                              <span>•</span>
                              <span className={cn(isLive ? "text-emerald-600 font-black normal-case text-xs" : "text-slate-600 normal-case")}>
                                {match.score}
                              </span>
                              {/* Market count badge */}
                              <span className={cn(
                                "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                                isLive
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-blue-50 text-blue-600 border-blue-200"
                              )}>
                                {isLive ? `${liveMarketCount}` : '3'} Mkts
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Back/Lay Grid */}
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

                      {/* ── UPCOMING: Pre-Match Panel ── */}
                      {isExpanded && !isLive && (
                        <PreMatchPanel match={match} betslip={betslip} toggleBet={toggleBet} />
                      )}

                      {/* ── LIVE: Full Micro-Market HUD ── */}
                  {isExpanded && isLive && (
                    <div className="w-full bg-[#FFFFFF] border-t border-exchange-border p-3.5 space-y-4">

                      {/* Controls Banner */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded border border-slate-200 shadow-sm">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#16A34A] animate-pulse" />
                            <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                              Live Micro-Market &amp; Session Betting
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            High-velocity binary session options. Platform Risk Cap: ₹100,000 max liability.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase">Simulated Latency:</span>
                            <input
                              type="range" min="50" max="600" step="50" value={simulatedLatency}
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

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox" checked={acceptAnyOdds}
                              onChange={(e) => setAcceptAnyOdds(e.target.checked)}
                              className="w-3.5 h-3.5 accent-[#16A34A] rounded border-slate-300"
                            />
                            <span className="text-[10px] font-black text-slate-700 uppercase select-none">Accept Any Odds</span>
                          </label>
                        </div>
                      </div>

                      {/* Suspension Warning */}
                      {isFeedSuspended && (
                        <div className="bg-red-50 border border-red-200 rounded p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#DC2626] animate-spin" />
                            <span className="text-[10px] font-black text-[#DC2626] uppercase tracking-wide">
                              Data Stream Suspended (Feed Latency: {simulatedLatency}ms &gt; 350ms threshold)
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-red-500 uppercase">Enable &quot;Accept Any Odds&quot; to override</span>
                        </div>
                      )}

                      {/* Live Commentary Ticker */}
                      <div className="bg-white text-slate-900 rounded p-2.5 flex items-center justify-between text-xs font-black uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                          <span className="text-red-400">Live Feed:</span>
                          <span className="text-slate-200">{liveCommentary}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold hidden sm:block">Autopilot Settlement Active</span>
                      </div>

                      {/* Live Markets Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* ─── Cricket Live Markets ─── */}
                        {sportLower === 'cricket' && (
                          <>
                            {/* Toss Winner */}
                            <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">Toss Winner</span>
                              <MicroMarketOutcomeRow
                                outcomeName={match.team1}
                                backOdds={getAdjustedOdds(1.91, `cricket-toss-${match.team1}`)}
                                layOdds={getAdjustedOdds(1.96, `cricket-toss-${match.team1}`)}
                                trend={tossLineTrend} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Cricket', marketName: 'Toss Winner', selectionName: match.team1, odds, baseOdds, selectionId, type })}
                                activeSelection={hudSelection?.marketName === 'Toss Winner' && hudSelection?.selectionName === match.team1 ? hudSelection : null}
                                selectionId={`cricket-toss-${match.team1}`} baseBackOdds={1.91} baseLayOdds={1.96}
                              />
                              <MicroMarketOutcomeRow
                                outcomeName={match.team2}
                                backOdds={getAdjustedOdds(1.91, `cricket-toss-${match.team2}`)}
                                layOdds={getAdjustedOdds(1.96, `cricket-toss-${match.team2}`)}
                                trend={tossLineTrend} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Cricket', marketName: 'Toss Winner', selectionName: match.team2, odds, baseOdds, selectionId, type })}
                                activeSelection={hudSelection?.marketName === 'Toss Winner' && hudSelection?.selectionName === match.team2 ? hudSelection : null}
                                selectionId={`cricket-toss-${match.team2}`} baseBackOdds={1.91} baseLayOdds={1.96}
                              />
                            </div>

                            {/* Session Runs */}
                            <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                                <span>Session Runs (1st Inn. 20 Ov)</span>
                                <span className="text-[#DC2626] font-black animate-pulse bg-red-50 px-1 py-0.5 rounded">Line: {cricketLine}</span>
                              </div>
                              <MicroMarketOutcomeRow
                                outcomeName={`Over ${cricketLine}`}
                                backOdds={getAdjustedOdds(cricketOdds.over, `cricket-session-over`)}
                                layOdds={getAdjustedOdds(cricketOdds.over + 0.05, `cricket-session-over`)}
                                trend={cricketTrend.over} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Cricket', marketName: 'Session Runs', selectionName: `Over ${cricketLine}`, odds, baseOdds, selectionId, type, lineValue: cricketLine })}
                                activeSelection={hudSelection?.marketName === 'Session Runs' && hudSelection?.selectionName.includes('Over') ? hudSelection : null}
                                selectionId={`cricket-session-over`} baseBackOdds={cricketOdds.over} baseLayOdds={cricketOdds.over + 0.05}
                              />
                              <MicroMarketOutcomeRow
                                outcomeName={`Under ${cricketLine}`}
                                backOdds={getAdjustedOdds(cricketOdds.under, `cricket-session-under`)}
                                layOdds={getAdjustedOdds(cricketOdds.under + 0.05, `cricket-session-under`)}
                                trend={cricketTrend.under} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Cricket', marketName: 'Session Runs', selectionName: `Under ${cricketLine}`, odds, baseOdds, selectionId, type, lineValue: cricketLine })}
                                activeSelection={hudSelection?.marketName === 'Session Runs' && hudSelection?.selectionName.includes('Under') ? hudSelection : null}
                                selectionId={`cricket-session-under`} baseBackOdds={cricketOdds.under} baseLayOdds={cricketOdds.under + 0.05}
                              />
                            </div>

                            {/* Ball-by-Ball */}
                            <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">
                                Ball-by-Ball (19th Over - 5th Ball)
                              </span>
                              <MicroMarketOutcomeRow
                                outcomeName={`Over ${ballLine.line} Runs`}
                                backOdds={getAdjustedOdds(ballLine.overOdds, `cricket-ball-over`)}
                                layOdds={getAdjustedOdds(ballLine.overOdds + 0.05, `cricket-ball-over`)}
                                trend={ballTrend.over} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Cricket', marketName: 'Ball-by-Ball Runs', selectionName: `Over ${ballLine.line}`, odds, baseOdds, selectionId, type, lineValue: ballLine.line })}
                                activeSelection={hudSelection?.marketName === 'Ball-by-Ball Runs' && hudSelection?.selectionName.includes('Over') ? hudSelection : null}
                                selectionId={`cricket-ball-over`} baseBackOdds={ballLine.overOdds} baseLayOdds={ballLine.overOdds + 0.05}
                              />
                              <MicroMarketOutcomeRow
                                outcomeName={`Under ${ballLine.line} Runs`}
                                backOdds={getAdjustedOdds(ballLine.underOdds, `cricket-ball-under`)}
                                layOdds={getAdjustedOdds(ballLine.underOdds + 0.05, `cricket-ball-under`)}
                                trend={ballTrend.under} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Cricket', marketName: 'Ball-by-Ball Runs', selectionName: `Under ${ballLine.line}`, odds, baseOdds, selectionId, type, lineValue: ballLine.line })}
                                activeSelection={hudSelection?.marketName === 'Ball-by-Ball Runs' && hudSelection?.selectionName.includes('Under') ? hudSelection : null}
                                selectionId={`cricket-ball-under`} baseBackOdds={ballLine.underOdds} baseLayOdds={ballLine.underOdds + 0.05}
                              />
                            </div>
                          </>
                        )}

                        {/* ─── Tennis Live Markets ─── */}
                        {sportLower === 'tennis' && (
                          <>
                            <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">Point Winner (Curr Game)</span>
                              <MicroMarketOutcomeRow
                                outcomeName={match.team1}
                                backOdds={getAdjustedOdds(tennisPointOdds.p1, `tennis-point-p1`)}
                                layOdds={getAdjustedOdds(tennisPointOdds.p1 + 0.05, `tennis-point-p1`)}
                                trend={tennisPointTrend.p1} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Tennis', marketName: 'Point Winner', selectionName: match.team1, odds, baseOdds, selectionId, type })}
                                activeSelection={hudSelection?.marketName === 'Point Winner' && hudSelection?.selectionName === match.team1 ? hudSelection : null}
                                selectionId={`tennis-point-p1`} baseBackOdds={tennisPointOdds.p1} baseLayOdds={tennisPointOdds.p1 + 0.05}
                              />
                              <MicroMarketOutcomeRow
                                outcomeName={match.team2}
                                backOdds={getAdjustedOdds(tennisPointOdds.p2, `tennis-point-p2`)}
                                layOdds={getAdjustedOdds(tennisPointOdds.p2 + 0.05, `tennis-point-p2`)}
                                trend={tennisPointTrend.p2} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Tennis', marketName: 'Point Winner', selectionName: match.team2, odds, baseOdds, selectionId, type })}
                                activeSelection={hudSelection?.marketName === 'Point Winner' && hudSelection?.selectionName === match.team2 ? hudSelection : null}
                                selectionId={`tennis-point-p2`} baseBackOdds={tennisPointOdds.p2} baseLayOdds={tennisPointOdds.p2 + 0.05}
                              />
                            </div>

                            <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">Will game reach Deuce (40-40)?</span>
                              <MicroMarketOutcomeRow
                                outcomeName="Yes (Deuce)"
                                backOdds={getAdjustedOdds(tennisDeuceOdds.yes, `tennis-deuce-yes`)}
                                layOdds={getAdjustedOdds(tennisDeuceOdds.yes + 0.10, `tennis-deuce-yes`)}
                                trend={tennisDeuceTrend.yes} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Tennis', marketName: 'Deuce Status', selectionName: 'Yes', odds, baseOdds, selectionId, type })}
                                activeSelection={hudSelection?.marketName === 'Deuce Status' && hudSelection?.selectionName === 'Yes' ? hudSelection : null}
                                selectionId={`tennis-deuce-yes`} baseBackOdds={tennisDeuceOdds.yes} baseLayOdds={tennisDeuceOdds.yes + 0.10}
                              />
                              <MicroMarketOutcomeRow
                                outcomeName="No (Deuce)"
                                backOdds={getAdjustedOdds(tennisDeuceOdds.no, `tennis-deuce-no`)}
                                layOdds={getAdjustedOdds(tennisDeuceOdds.no + 0.05, `tennis-deuce-no`)}
                                trend={tennisDeuceTrend.no} isSuspended={isFeedSuspended}
                                onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Tennis', marketName: 'Deuce Status', selectionName: 'No', odds, baseOdds, selectionId, type })}
                                activeSelection={hudSelection?.marketName === 'Deuce Status' && hudSelection?.selectionName === 'No' ? hudSelection : null}
                                selectionId={`tennis-deuce-no`} baseBackOdds={tennisDeuceOdds.no} baseLayOdds={tennisDeuceOdds.no + 0.05}
                              />
                            </div>
                          </>
                        )}

                        {/* ─── Soccer Live Markets ─── */}
                        {sportLower === 'soccer' && (
                          <div className="bg-white rounded border border-slate-200 p-3 flex flex-col gap-1.5 shadow-sm md:col-span-2 lg:col-span-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1.5">
                              Soccer In-Play Flash (Next 1-Minute Event Tracker)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { name: 'Corner Kick', selName: 'Corner', odds: soccerMinuteOdds.corner, layOdds: soccerMinuteOdds.corner + 0.1, trend: soccerMinuteTrend.corner, id: 'soccer-corner' },
                                { name: 'Booking Card', selName: 'Card', odds: soccerMinuteOdds.card, layOdds: soccerMinuteOdds.card + 0.2, trend: soccerMinuteTrend.card, id: 'soccer-card' },
                                { name: 'Goal Scored', selName: 'Goal', odds: soccerMinuteOdds.goal, layOdds: soccerMinuteOdds.goal + 0.5, trend: soccerMinuteTrend.goal, id: 'soccer-goal' },
                                { name: 'Throw-In', selName: 'Throw-In', odds: soccerMinuteOdds.throwIn, layOdds: soccerMinuteOdds.throwIn + 0.02, trend: soccerMinuteTrend.throwIn, id: 'soccer-throwin' },
                              ].map(ev => (
                                <div key={ev.id} className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                  <MicroMarketOutcomeRow
                                    outcomeName={ev.name}
                                    backOdds={getAdjustedOdds(ev.odds, ev.id)}
                                    layOdds={getAdjustedOdds(ev.layOdds, ev.id)}
                                    trend={ev.trend} isSuspended={isFeedSuspended}
                                    onSelect={(type: any, odds: any, baseOdds: number, selectionId: string) => setHudSelection({ matchId: match.id, matchTitle: `${match.team1} vs ${match.team2}`, sport: 'Soccer', marketName: '1-Min Event', selectionName: ev.selName, odds, baseOdds, selectionId, type })}
                                    activeSelection={hudSelection?.marketName === '1-Min Event' && hudSelection?.selectionName === ev.selName ? hudSelection : null}
                                    selectionId={ev.id} baseBackOdds={ev.odds} baseLayOdds={ev.layOdds}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fallback for other sports */}
                        {sportLower !== 'cricket' && sportLower !== 'tennis' && sportLower !== 'soccer' && (
                          <div className="bg-white rounded border border-slate-200 p-4 text-center md:col-span-2 lg:col-span-3">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              Live Micro-Markets are currently supported for Cricket, Tennis, and Soccer.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Inline Stake HUD */}
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
                            <button onClick={() => setHudSelection(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Stake (₹):</span>
                                <input
                                  type="number" value={hudStake}
                                  onChange={(e) => setHudStake(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-24 border border-slate-300 rounded px-2.5 py-1 text-xs font-black focus:outline-none focus:border-emerald-600"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                {[100, 500, 1000, 5000, 10000].map(val => (
                                  <button
                                    key={val} onClick={() => setHudStake(val)}
                                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black py-1 px-1.5 rounded text-[9.5px] leading-none transition-colors"
                                  >
                                    ₹{val.toLocaleString('en-IN')}
                                  </button>
                                ))}
                              </div>
                            </div>

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

                          {betError && (
                            <div className="bg-red-50 border border-red-200 text-[#DC2626] text-[10px] font-black uppercase tracking-wider p-2 rounded">
                              ⚠️ {betError}
                            </div>
                          )}

                          <button
                            disabled={betPlacing}
                            onClick={() => {
                              setBetPlacing(true);
                              setBetError(null);
                              setTimeout(async () => {
                                const T_user = Date.now();
                                const deltaT = T_user - streamTime;
                                if (deltaT > 350 && !acceptAnyOdds) {
                                  setBetError(`LATENCY EXCEEDED (${deltaT}ms > 350ms). Odds are stale. Bet suspended.`);
                                  setBetPlacing(false);
                                  return;
                                }
                                const currentAdjustedOdds = getAdjustedOdds(hudSelection.baseOdds, hudSelection.selectionId);
                                const newBet = {
                                  marketName: hudSelection.marketName,
                                  selectionName: hudSelection.selectionName,
                                  lineValue: hudSelection.lineValue,
                                  stake: hudStake,
                                  odds: currentAdjustedOdds,
                                  baseOdds: hudSelection.baseOdds,
                                  selectionId: hudSelection.selectionId,
                                  type: hudSelection.type,
                                  status: 'Pending' as const,
                                  payout: 0,
                                  id: ""
                                };
                                const riskCheck = validatePlatformRisk(newBet, placedMicroBets);
                                if (!riskCheck.safe) {
                                  setBetError(`RISK CAP EXCEEDED. Platform liability limit is ₹100,000. Potential platform loss: ₹${Math.round(riskCheck.maxLiability)}.`);
                                  setBetPlacing(false);
                                  return;
                                }
                                const validation = validateTransactionIdempotency(walletBalance, hudStake, currentAdjustedOdds, hudSelection.type);
                                if (!validation.success) {
                                  setBetError(validation.error || "INSUFFICIENT BALANCE FOR STAKE + LIABILITY");
                                  setBetPlacing(false);
                                  return;
                                }
                                const betRes = await placeSportsBet(
                                  hudSelection.matchTitle,
                                  `${hudSelection.marketName}: ${hudSelection.selectionName} ${hudSelection.lineValue ? '(' + hudSelection.lineValue + ')' : ''}`,
                                  currentAdjustedOdds, hudStake,
                                  hudSelection.type === 'back' ? 'yes' : 'no',
                                  `MICRO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                                );
                                if (betRes && betRes.success) {
                                  const confirmedBet = {
                                    ...newBet,
                                    id: betRes.transactionId
                                  };
                                  setPlacedMicroBets(prev => [...prev, confirmedBet]);
                                  setBetSuccessFlash(true);
                                  setBetPlacing(false);
                                  setTimeout(() => setBetSuccessFlash(false), 1500);
                                } else {
                                  setBetError(betRes?.error || "Failed to place bet on server.");
                                  setBetPlacing(false);
                                }
                              }, 300);
                            }}
                            className={cn(
                              "w-full py-2.5 rounded text-slate-900 font-bold text-xs uppercase tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5",
                              betSuccessFlash ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white hover:bg-slate-50",
                              betPlacing && "opacity-60 cursor-wait"
                            )}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {betPlacing ? "Processing Transaction..." : betSuccessFlash ? "Bet Placed Successfully! ✓" : "Place Instant Bet"}
                          </button>
                        </div>
                      )}

                      {/* Active Session Bets Ledger */}
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
                                  <span className={cn(
                                    "font-extrabold uppercase",
                                    bet.status === 'Pending' && "text-yellow-600 animate-pulse",
                                    bet.status === 'Won' && "text-emerald-600",
                                    bet.status === 'Lost' && "text-slate-400"
                                  )}>
                                    {bet.status === 'Won' ? `Won (+₹${bet.payout})` : bet.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ))
      )}
        </div>
      </div>

      {/* Right Bet Slip Sidebar */}
      <div className={cn(
        "flex flex-col w-[320px] max-w-[85vw] bg-exchange-surface border-l border-exchange-border shrink-0 z-[60] lg:z-40 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] transition-transform duration-300",
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
              <Target className="w-10 h-10 text-slate-300 mb-3" />
              <span className="text-exchange-muted text-sm font-medium">Click on odds to add selections to your bet slip.</span>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {betslip.map(bet => {
                const betMatch = matches.find(m => m.id === bet.matchId);
                const isBack = bet.type === 'back';
                return (
                  <div key={`${bet.matchId}-${bet.selection}-${bet.type}`} className={cn(
                    "border rounded-sm bg-white overflow-hidden shadow-sm relative group",
                    isBack ? "border-[#a7f3d0]" : "border-[#fbcfe8]"
                  )}>
                    <div className={cn("px-3 py-1.5 text-[10px] font-bold text-slate-900 uppercase flex items-center justify-between", isBack ? "bg-[#D1FAE5]" : "bg-[#FCE7F3]")}>
                      <span>{isBack ? "Back" : "Lay"}</span>
                      <button onClick={() => removeBet(bet.matchId, bet.selection, bet.type)} className="hover:bg-white/10 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] text-exchange-muted uppercase tracking-wide truncate mb-1">
                        {betMatch?.team1} vs {betMatch?.team2}
                      </div>
                      <div className="text-sm font-bold text-exchange-text mb-3">{bet.selection}</div>
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
                            type="number" value={bet.stake}
                            onChange={(e) => updateStake(bet.matchId, bet.selection, bet.type, parseInt(e.target.value) || 0)}
                            className="w-full border border-exchange-border rounded-sm px-2 py-1.5 text-sm font-black focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-exchange-border">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-exchange-muted uppercase">Risk Slider</span>
                          <span className={cn(isBack ? "text-emerald-600" : "text-pink-600")}>₹{bet.stake}</span>
                        </div>
                        <input
                          type="range" min="10" max="1000" step="10" value={bet.stake}
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

        {betslip.length > 0 && (
          <div className="p-4 bg-slate-100 border-t border-exchange-border shrink-0 space-y-2 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-4">
            <div className="flex justify-between text-xs font-bold text-exchange-muted">
              <span>Total Liability:</span>
              <span className="text-red-600">₹{totalLiability.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-exchange-muted">
              <span>Total Return:</span>
              <span className="text-green-600">₹{totalPotentialReturn.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBetslip([])}
                className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-200 font-bold py-3 rounded-lg transition-colors text-xs uppercase tracking-wide cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={async () => {
                  if (betslip.length === 0) return;
                  let placedCount = 0;
                  let lastError = "";

                  for (const bet of betslip) {
                    const betMatch = matches.find(m => m.id === bet.matchId);
                    const matchTitle = betMatch ? `${betMatch.team1} vs ${betMatch.team2}` : 'Sports Match';
                    const side = bet.type === 'lay' ? 'no' : 'yes';

                    const res = await placeSportsBet(
                      matchTitle,
                      bet.selection,
                      bet.odds,
                      bet.stake,
                      side
                    );

                    if (res && res.success) {
                      placedCount++;
                    } else {
                      lastError = res?.error || "Failed to place bet.";
                      break;
                    }
                  }

                  if (placedCount === betslip.length) {
                    setBetslip([]);
                    setShowMobileBetslip(false);
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate([20, 40]);
                    }
                    await useTradingStore.getState().syncFromServer();
                  } else {
                    alert(lastError || "Some bets could not be placed.");
                    await useTradingStore.getState().syncFromServer();
                  }
                }}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-lg transition-all text-xs uppercase tracking-wider shadow-md active:scale-95 cursor-pointer"
              >
                Confirm Bets (₹{totalLiability.toFixed(0)})
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
