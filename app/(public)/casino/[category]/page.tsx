"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, Search, Filter, Star, ChevronDown, X, Heart, 
  ShieldAlert, BadgeInfo, Play, TrendingUp, Users, Flame, 
  Sparkles, Trophy, Coins, RotateCcw, AlertTriangle, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useState, use, useMemo, useEffect, useRef } from "react";
import { GameCard } from "@/components/casino/GameCard";
import { useTradingStore } from "@/lib/store";
import { GAMES, getGamesByCategory, CategoryId } from "@/lib/games";

const PROVIDERS = ["All", "Originals", "Pragmatic Play", "Evolution", "Spribe", "NetEnt"];
const TOKENS = [100, 500, 1000, 5000, 10000];

const LOBBY_CATEGORIES = [
  { slug: "hot", name: "HOT", emoji: "🔥" },
  { slug: "slots", name: "Slots & Drops", emoji: "🎰" },
  { slug: "live", name: "Live Dealers", emoji: "🔴" },
  { slug: "crash", name: "Crash Games", emoji: "🚀" },
  { slug: "roulette", name: "Table Roulette", emoji: "🎡" },
  { slug: "blackjack", name: "Blackjack", emoji: "🃏" },
  { slug: "poker", name: "Poker Heads Up", emoji: "♠️" },
];

export default function CasinoCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const unwrappedParams = use(params);
  const categorySlug = unwrappedParams.category.toLowerCase();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(36);

  // Casino States
  const [activeToken, setActiveToken] = useState<number>(500);
  const [bets, setBets] = useState<Record<string, number>>({});
  const { balance } = useTradingStore();

  // Teaser states for all categories
  // 1. HOT Teaser
  const [hotSpinning, setHotSpinning] = useState(false);
  const [hotWheelResult, setHotWheelResult] = useState<string | null>(null);
  const [hotMsg, setHotMsg] = useState("");

  // 2. Slots Teaser
  const [slotsSpinning, setSlotsSpinning] = useState(false);
  const [slotsReels, setSlotsReels] = useState(["🍒", "🍋", "🍇"]);
  const [slotsWinMsg, setSlotsWinMsg] = useState("");

  // 3. Live Dealers / Baccarat Teaser
  const [baccaratSide, setBaccaratSide] = useState("PLAYER");
  const [baccaratPlayer, setBaccaratPlayer] = useState<{ val: string; suit: string; color: string; score: number }[]>([]);
  const [baccaratBanker, setBaccaratBanker] = useState<{ val: string; suit: string; color: string; score: number }[]>([]);
  const [baccaratMsg, setBaccaratMsg] = useState("");
  const [baccaratDealing, setBaccaratDealing] = useState(false);

  // 4. Crash Teaser
  const [crashActive, setCrashActive] = useState(false);
  const [crashMultiplier, setCrashMultiplier] = useState(1.0);
  const [crashFled, setCrashFled] = useState(false);
  const [crashCashedOut, setCrashCashedOut] = useState(false);
  const [crashMsg, setCrashMsg] = useState("");
  const crashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 5. Dice Teaser
  const [diceTarget, setDiceTarget] = useState(50.5);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceMsg, setDiceMsg] = useState("");

  // 6. Table Roulette Teaser
  const [rouletteBet, setRouletteBet] = useState("RED");
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteMsg, setRouletteMsg] = useState("");

  // 7. Blackjack Teaser
  const [teaserDealt, setTeaserDealt] = useState(false);
  const [teaserDealing, setTeaserDealing] = useState(false);
  const [teaserMsg, setTeaserMsg] = useState("");
  const [teaserPlayerHand, setTeaserPlayerHand] = useState<{ val: string; suit: string; color: string; score: number }[]>([]);
  const [teaserDealerHand, setTeaserDealerHand] = useState<{ val: string; suit: string; color: string; score: number }[]>([]);

  // 8. Poker Teaser
  const [pokerHand, setPokerHand] = useState<string[]>([]);
  const [pokerCommunity, setPokerCommunity] = useState<string[]>([]);
  const [pokerState, setPokerState] = useState("idle"); // idle, flop, turn, river, showdown
  const [pokerMsg, setPokerMsg] = useState("");
  const [pokerDealing, setPokerDealing] = useState(false);

  // Real-time live bets feed
  const [liveBets, setLiveBets] = useState<{ id: string; user: string; game: string; amount: number; payout: number; mult: number; won: boolean }[]>([]);

  useEffect(() => {
    const initialGames = ["Sweet Bonanza", "Gates of Olympus", "Aviator", "Mines", "Tower", "Crash", "Baccarat", "Blackjack", "Plinko", "Andar Bahar"];
    const initialUsers = ["GoldenAce", "CryptoKing", "VIP_Roller", "Rafi_77", "LuckySpins", "DanishBet", "RenderHype", "BetPro"];
    const generated: typeof liveBets = [];
    for (let i = 0; i < 6; i++) {
      const amount = Math.floor(Math.random() * 1500) + 100;
      const mult = parseFloat((Math.random() * 4 + 1.1).toFixed(2));
      const won = Math.random() > 0.45;
      const payout = won ? Math.round(amount * mult) : 0;
      generated.push({
        id: `bet-${Math.random()}`,
        user: initialUsers[Math.floor(Math.random() * initialUsers.length)],
        game: initialGames[Math.floor(Math.random() * initialGames.length)],
        amount,
        payout,
        mult,
        won
      });
    }
    setLiveBets(generated);

    const timer = setInterval(() => {
      const amount = Math.floor(Math.random() * 2500) + 100;
      const mult = Math.random() > 0.8 ? parseFloat((Math.random() * 40 + 2.5).toFixed(2)) : parseFloat((Math.random() * 3 + 1.1).toFixed(2));
      const won = Math.random() > 0.48;
      const payout = won ? Math.round(amount * mult) : 0;
      const newBet = {
        id: `bet-${Math.random()}`,
        user: initialUsers[Math.floor(Math.random() * initialUsers.length)],
        game: initialGames[Math.floor(Math.random() * initialGames.length)],
        amount,
        payout,
        mult,
        won
      };
      setLiveBets(prev => [newBet, ...prev.slice(0, 5)]);
    }, 4000);

    return () => {
      clearInterval(timer);
      if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    };
  }, []);

  const handleBetDrop = (zone: string) => {
    if (balance < activeToken) {
      alert("Insufficient balance. Please visit the cashier to deposit.");
      return;
    }
    setBets(prev => ({
      ...prev,
      [zone]: (prev[zone] || 0) + activeToken
    }));
  };

  const clearBets = () => setBets({});
  const repeatBets = () => {
    setBets({ main: 1000 });
  };

  // 1. Spin HOT Wheel Teaser
  const spinHotWheel = () => {
    if (hotSpinning) return;
    setHotSpinning(true);
    setHotMsg("SPINNING THE HOT WHEEL...");
    const awards = [
      "250% Deposit Match Boost",
      "₹5,000 Cash Drop Reward",
      "50 Free Spins (Gates of Olympus)",
      "100x Crash Safety Shield",
      "VIP Level-Up Upgrade Bonus"
    ];
    setTimeout(() => {
      const winner = awards[Math.floor(Math.random() * awards.length)];
      setHotWheelResult(winner);
      setHotMsg(`🔥 UNLOCKED: ${winner}!`);
      setHotSpinning(false);
    }, 2000);
  };

  // 2. Spin Slots Teaser
  const spinSlotsTeaser = () => {
    if (slotsSpinning) return;
    setSlotsSpinning(true);
    setSlotsWinMsg("");
    const symbols = ["🍒", "🍉", "🍇", "🍭", "👑", "⭐"];
    let ticks = 0;
    const interval = setInterval(() => {
      setSlotsReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
      ticks++;
      if (ticks >= 15) {
        clearInterval(interval);
        setSlotsSpinning(false);
        setSlotsReels(prev => {
          const allSame = prev[0] === prev[1] && prev[1] === prev[2];
          const anyTwo = prev[0] === prev[1] || prev[1] === prev[2] || prev[0] === prev[2];
          if (allSame) {
            setSlotsWinMsg(`🎰 JACKPOT! 3x ${prev[0]} matched! (50x Winnings)`);
          } else if (anyTwo) {
            setSlotsWinMsg(`🎉 BIG WIN! 2x matched! (10x Winnings)`);
          } else {
            setSlotsWinMsg("❌ Better luck next spin!");
          }
          return prev;
        });
      }
    }, 100);
  };

  // 3. Deal Baccarat Teaser
  const dealBaccaratTeaser = () => {
    if (baccaratDealing) return;
    setBaccaratDealing(true);
    setBaccaratMsg("");
    setBaccaratPlayer([]);
    setBaccaratBanker([]);

    const cards = [
      { val: "A", suit: "♠", color: "text-slate-900", score: 1 },
      { val: "K", suit: "♦️", color: "text-red-600", score: 0 },
      { val: "Q", suit: "♥️", color: "text-red-600", score: 0 },
      { val: "J", suit: "♣️", color: "text-slate-900", score: 0 },
      { val: "9", suit: "♠", color: "text-slate-900", score: 9 },
      { val: "8", suit: "♥️", color: "text-red-600", score: 8 },
      { val: "7", suit: "♦️", color: "text-red-600", score: 7 },
      { val: "6", suit: "♣️", color: "text-slate-900", score: 6 },
      { val: "5", suit: "♠", color: "text-slate-900", score: 5 }
    ];

    setTimeout(() => {
      const p1 = cards[Math.floor(Math.random() * cards.length)];
      const b1 = cards[Math.floor(Math.random() * cards.length)];
      const p2 = cards[Math.floor(Math.random() * cards.length)];
      const b2 = cards[Math.floor(Math.random() * cards.length)];

      setBaccaratPlayer([p1, p2]);
      setBaccaratBanker([b1, b2]);

      const pScore = (p1.score + p2.score) % 10;
      const bScore = (b1.score + b2.score) % 10;

      let winSide = "TIE";
      if (pScore > bScore) winSide = "PLAYER";
      else if (bScore > pScore) winSide = "BANKER";

      const won = baccaratSide === winSide;
      if (winSide === "TIE") {
        setBaccaratMsg(`Tie Hand (${pScore} - ${bScore})! ${won ? "You Win 9x!" : "Tie settled."}`);
      } else {
        setBaccaratMsg(`${winSide} Wins with ${winSide === "PLAYER" ? pScore : bScore}! ${won ? "🎉 You Won!" : "❌ Dealer takes bet."}`);
      }
      setBaccaratDealing(false);
    }, 1200);
  };

  // 4. Launch Crash Teaser
  const launchCrashTeaser = () => {
    if (crashActive) return;
    setCrashActive(true);
    setCrashFled(false);
    setCrashCashedOut(false);
    setCrashMultiplier(1.0);
    setCrashMsg("PARABOLIC ASCENT IN PROGRESS...");

    const crashPoint = parseFloat((1.05 + Math.random() * 8.0).toFixed(2));
    let current = 1.0;

    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    
    crashTimerRef.current = setInterval(() => {
      current += 0.05 + (current * 0.05);
      if (current >= crashPoint) {
        clearInterval(crashTimerRef.current!);
        setCrashMultiplier(crashPoint);
        setCrashFled(true);
        setCrashActive(false);
        setCrashMsg(`💥 CRASHED AT ${crashPoint.toFixed(2)}x`);
      } else {
        setCrashMultiplier(current);
      }
    }, 100);
  };

  const cashoutCrashTeaser = () => {
    if (!crashActive || crashCashedOut || crashFled) return;
    setCrashCashedOut(true);
    setCrashActive(false);
    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    setCrashMsg(`🎉 CASHED OUT AT ${crashMultiplier.toFixed(2)}x! (Simulated Win)`);
  };

  // 5. Roll Dice Teaser
  const rollDiceTeaser = () => {
    if (diceRolling) return;
    setDiceRolling(true);
    setDiceResult(null);
    setDiceMsg("ROLLING PRECISION DICE...");

    setTimeout(() => {
      const roll = parseFloat((Math.random() * 100).toFixed(2));
      setDiceResult(roll);
      const isWin = roll < diceTarget;
      setDiceMsg(isWin ? `🎉 WIN! Rolled ${roll} < Target ${diceTarget}` : `❌ LOSS! Rolled ${roll} >= Target ${diceTarget}`);
      setDiceRolling(false);
    }, 1000);
  };

  // 6. Spin Roulette Teaser
  const spinRouletteTeaser = () => {
    if (rouletteSpinning) return;
    setRouletteSpinning(true);
    setRouletteResult(null);
    setRouletteMsg("ROULETTE BALL RELEASED...");

    const colors = ["RED", "BLACK", "ZERO"];
    setTimeout(() => {
      const outcome = colors[Math.random() < 0.48 ? 0 : Math.random() < 0.96 ? 1 : 2];
      setRouletteResult(outcome);
      const won = rouletteBet === outcome;
      setRouletteMsg(won ? `🎉 WIN! Landed on ${outcome}` : `❌ LOSS! Landed on ${outcome}`);
      setRouletteSpinning(false);
    }, 1200);
  };

  // 7. Submit Blackjack Teaser Bets
  const submitBets = () => {
    if (Object.keys(bets).length === 0) return;
    setTeaserDealing(true);
    setTeaserDealt(false);
    setTeaserMsg("BETS SUBMITTED • DEALING HANDS");

    const deck = [
      { val: "A", suit: "♠", color: "text-slate-900", score: 11 },
      { val: "J", suit: "♦️", color: "text-red-600", score: 10 },
      { val: "K", suit: "♥️", color: "text-red-600", score: 10 },
      { val: "Q", suit: "♣️", color: "text-slate-900", score: 10 },
      { val: "10", suit: "♠", color: "text-slate-900", score: 10 },
      { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
      { val: "8", suit: "♦️", color: "text-red-600", score: 8 },
      { val: "7", suit: "♣️", color: "text-slate-900", score: 7 }
    ];

    setTimeout(() => {
      const p1 = deck[Math.floor(Math.random() * deck.length)];
      const d1 = deck[Math.floor(Math.random() * deck.length)];
      const p2 = deck[Math.floor(Math.random() * deck.length)];
      const d2 = deck[Math.floor(Math.random() * deck.length)];

      setTeaserPlayerHand([p1, p2]);
      setTeaserDealerHand([d1, d2]);
      setTeaserDealing(false);
      setTeaserDealt(true);

      const pScore = p1.score + p2.score;
      const dScore = d1.score + d2.score;

      if (pScore === 21) {
        setTeaserMsg("BLACKJACK! YOU WIN!");
      } else if (pScore > dScore || dScore > 21) {
        setTeaserMsg(`PLAYER WINS WITH ${pScore}!`);
      } else if (pScore === dScore) {
        setTeaserMsg("PUSH (TIE ROUND)");
      } else {
        setTeaserMsg(`DEALER WINS WITH ${dScore}`);
      }
    }, 1800);
  };

  // 8. Deal Poker Teaser
  const startPokerTeaser = () => {
    if (pokerDealing) return;
    setPokerDealing(true);
    setPokerState("dealing");
    setPokerMsg("DEALING POCKET CARDS...");
    setPokerHand([]);
    setPokerCommunity([]);

    const cards = ["A♠", "K♥", "Q♣", "J♦", "10♠", "9♣", "8♥", "7♦"];
    setTimeout(() => {
      setPokerHand([cards[Math.floor(Math.random() * cards.length)], cards[Math.floor(Math.random() * cards.length)]]);
      setPokerState("flop");
      setPokerMsg("FLOP COMMITTED");
      setPokerCommunity([cards[0], cards[1], cards[2]]);
      setPokerDealing(false);
    }, 1000);
  };

  const advancePokerTeaser = () => {
    if (pokerDealing) return;
    setPokerDealing(true);

    const cards = ["9♠", "8♣", "J♦", "A♥"];
    setTimeout(() => {
      if (pokerState === "flop") {
        setPokerCommunity(prev => [...prev, cards[0]]);
        setPokerState("turn");
        setPokerMsg("TURN COMMITTED");
      } else if (pokerState === "turn") {
        setPokerCommunity(prev => [...prev, cards[1]]);
        setPokerState("river");
        setPokerMsg("RIVER COMMITTED");
      } else if (pokerState === "river") {
        setPokerState("showdown");
        setPokerMsg("SHOWDOWN! PLAYER WINS 15x WITH FULL HOUSE!");
      }
      setPokerDealing(false);
    }, 800);
  };

  const TokenCarousel = () => (
    <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-3 w-full border border-slate-200/60 rounded-2xl bg-white p-3 shadow-sm">
        {TOKENS.map(token => (
          <button 
            key={token}
            onClick={() => setActiveToken(token)}
            className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs transition-all relative cursor-pointer active:scale-95 ${
              activeToken === token 
                ? "bg-gradient-to-br from-red-500 to-red-600 text-slate-900 shadow-[0_5px_15px_rgba(239,68,68,0.3)] scale-108 border-2 border-red-200" 
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            ₹{token >= 1000 ? `${token/1000}K` : token}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-8 font-black uppercase tracking-wider text-[10px] text-slate-500 mt-1">
        <button onClick={clearBets} className="hover:text-red-500 transition-colors cursor-pointer">Clear</button>
        <button onClick={repeatBets} className="hover:text-slate-900 transition-colors cursor-pointer">Repeat</button>
        <button onClick={submitBets} className="text-emerald-600 hover:text-emerald-700 font-extrabold uppercase tracking-widest text-xs transition-colors cursor-pointer bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">Deal Hand</button>
      </div>
    </div>
  );

  const mappedCategory = categorySlug as CategoryId;
  const categoryGames = useMemo(() => {
    if (categorySlug === "hot") {
      return [...GAMES].sort((a, b) => (b.players || 0) - (a.players || 0));
    }
    return getGamesByCategory(mappedCategory) || [];
  }, [categorySlug, mappedCategory]);
  
  const filteredGames = useMemo(() => {
    return categoryGames.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedProvider === "All" || g.provider === selectedProvider)
    );
  }, [categoryGames, searchQuery, selectedProvider]);

  const displayedGames = useMemo(() => filteredGames.slice(0, visibleCount), [filteredGames, visibleCount]);

  // RENDER SPECIFIC INTERACTIVE SIMULATORS
  const renderCategoryShowcase = () => {
    switch(categorySlug) {
      case "hot":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              HOT TEASER WHEEL
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Hot Bonus Wheel</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Spin the wheel to unlock simulated VIP reward boosts</p>
            
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-[10px] border-slate-800 flex items-center justify-center bg-gradient-to-br from-red-950 via-[#3a0606] to-[#1a0101] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_10px_25px_rgba(0,0,0,0.2)]">
              <motion.div 
                animate={hotSpinning ? { rotate: 1800 } : { rotate: 0 }}
                transition={{ duration: 2.0, ease: "easeOut" }}
                className="absolute inset-2 rounded-full border-4 border-dashed border-red-500/40 flex items-center justify-center"
              >
                <div className="w-full h-full relative rounded-full flex items-center justify-center text-slate-900/20 font-black text-[9px]">
                  <div className="absolute rotate-[0deg] translate-y-[-40%]">₹5,000</div>
                  <div className="absolute rotate-[72deg] translate-y-[-40%]">250% Match</div>
                  <div className="absolute rotate-[144deg] translate-y-[-40%]">50 Spins</div>
                  <div className="absolute rotate-[216deg] translate-y-[-40%]">Safety Shield</div>
                  <div className="absolute rotate-[288deg] translate-y-[-40%]">VIP Level Up</div>
                </div>
              </motion.div>
              <button 
                onClick={spinHotWheel} 
                disabled={hotSpinning}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 hover:bg-red-700 text-slate-900 font-black uppercase text-xs sm:text-sm shadow-lg border-2 border-red-300 flex items-center justify-center cursor-pointer active:scale-95 relative z-10"
              >
                SPIN
              </button>
            </div>
            {hotMsg && (
              <div className="mt-6 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow animate-pulse">
                {hotMsg}
              </div>
            )}
          </div>
        );

      case "slots":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              SLOTS TEASER REELS
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Mini 3-Reel Slots</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Test the slot machine simulator logic before entering live lobbies</p>
            
            <div className="flex gap-4 p-6 bg-white border-4 border-slate-800 rounded-3xl shadow-inner max-w-md w-full justify-center">
              {slotsReels.map((symbol, idx) => (
                <div key={idx} className="w-16 h-24 sm:w-20 sm:h-28 bg-white border border-slate-350 rounded-xl flex items-center justify-center text-4xl shadow-md font-black">
                  {symbol}
                </div>
              ))}
            </div>
            <button
              onClick={spinSlotsTeaser}
              disabled={slotsSpinning}
              className="mt-6 px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {slotsSpinning ? "SPINNING REELS..." : "SPIN TEASER SLOT"}
            </button>
            {slotsWinMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow">
                {slotsWinMsg}
              </div>
            )}
          </div>
        );

      case "live":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              LIVE BACCARAT TEASER
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Baccarat Teaser</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Select a betting zone and deal community cards</p>
            
            <div className="w-full max-w-2xl bg-gradient-to-b from-red-950 via-[#3a0606] to-[#1a0101] border-[12px] border-slate-800 rounded-3xl p-6 flex flex-col items-center shadow-lg relative min-h-[220px] justify-center">
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => setBaccaratSide("PLAYER")}
                  className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${baccaratSide === "PLAYER" ? "bg-blue-600 text-slate-900 border-blue-400" : "bg-white/40 text-slate-400 border border-white/10"}`}
                >
                  Player
                </button>
                <button 
                  onClick={() => setBaccaratSide("TIE")}
                  className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${baccaratSide === "TIE" ? "bg-emerald-600 text-slate-900 border-emerald-400" : "bg-white/40 text-slate-400 border border-white/10"}`}
                >
                  Tie
                </button>
                <button 
                  onClick={() => setBaccaratSide("BANKER")}
                  className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${baccaratSide === "BANKER" ? "bg-red-600 text-slate-900 border-red-400" : "bg-white/40 text-slate-400 border border-white/10"}`}
                >
                  Banker
                </button>
              </div>

              {baccaratDealing && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center rounded-2xl z-20">
                  <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="flex gap-16 justify-center w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-900/50 font-black uppercase mb-1">Player</span>
                  <div className="flex gap-1">
                    {baccaratPlayer.map((c, i) => (
                      <div key={i} className="w-10 h-15 bg-white rounded border flex flex-col justify-between p-1 text-slate-900 font-mono text-[9px] font-black">{c.val}{c.suit}</div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-900/50 font-black uppercase mb-1">Banker</span>
                  <div className="flex gap-1">
                    {baccaratBanker.map((c, i) => (
                      <div key={i} className="w-10 h-15 bg-white rounded border flex flex-col justify-between p-1 text-slate-900 font-mono text-[9px] font-black">{c.val}{c.suit}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={dealBaccaratTeaser} 
              disabled={baccaratDealing}
              className="mt-6 px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              DEAL CARDS
            </button>
            {baccaratMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow animate-pulse">
                {baccaratMsg}
              </div>
            )}
          </div>
        );

      case "crash":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              CRASH SIMULATOR
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Mini Crash Multiplier</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Launch the airplane and cash out before the crash occurs</p>
            
            <div className="w-full max-w-md bg-white border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[180px] shadow-lg relative">
              <h1 className={`text-6xl font-black font-mono tracking-tighter ${crashFled ? "text-red-500" : "text-slate-900"}`}>
                {crashMultiplier.toFixed(2)}x
              </h1>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={launchCrashTeaser}
                disabled={crashActive}
                className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                LAUNCH INSTANCE
              </button>
              <button
                onClick={cashoutCrashTeaser}
                disabled={!crashActive || crashCashedOut}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40"
              >
                CASHOUT
              </button>
            </div>
            {crashMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow">
                {crashMsg}
              </div>
            )}
          </div>
        );

      case "originals":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              DICE SIMULATOR
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Mini Dice Roller</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Select a target roll and roll under to win</p>
            
            <div className="w-full max-w-md bg-white border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[160px] shadow-lg relative gap-4">
              {diceResult !== null ? (
                <h1 className="text-5xl font-black font-mono text-emerald-400">{diceResult.toFixed(2)}</h1>
              ) : (
                <span className="text-slate-500 font-mono text-sm">SET TARGET AND ROLL</span>
              )}
              <input 
                type="range" 
                min="2" 
                max="98" 
                step="0.5" 
                value={diceTarget}
                onChange={(e) => setDiceTarget(parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between items-center w-full px-2 text-[10px] text-slate-400 font-bold uppercase font-mono">
                <span>Roll Under: {diceTarget.toFixed(1)}</span>
                <span>Win Chance: {diceTarget.toFixed(1)}%</span>
              </div>
            </div>

            <button 
              onClick={rollDiceTeaser} 
              disabled={diceRolling}
              className="mt-6 px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {diceRolling ? "ROLLING..." : "ROLL DICE"}
            </button>
            {diceMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow">
                {diceMsg}
              </div>
            )}
          </div>
        );

      case "roulette":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              ROULETTE WHEEL TEASER
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Mini Roulette</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Bet on a color layout and spin the wheel cylinder</p>
            
            <div className="w-full max-w-md bg-white border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[180px] shadow-lg relative gap-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => setRouletteBet("RED")}
                  className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${rouletteBet === "RED" ? "bg-red-600 text-slate-900 border-red-400 shadow-md" : "bg-white/45 text-slate-400 border border-white/10"}`}
                >
                  Red
                </button>
                <button 
                  onClick={() => setRouletteBet("BLACK")}
                  className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${rouletteBet === "BLACK" ? "bg-white text-slate-900 border-slate-800 shadow-md" : "bg-white/45 text-slate-400 border border-white/10"}`}
                >
                  Black
                </button>
                <button 
                  onClick={() => setRouletteBet("ZERO")}
                  className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${rouletteBet === "ZERO" ? "bg-emerald-600 text-slate-900 border-emerald-400 shadow-md" : "bg-white/45 text-slate-400 border border-white/10"}`}
                >
                  Zero (0)
                </button>
              </div>

              {rouletteResult ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ball Landed on:</span>
                  <span className={`px-4 py-1.5 rounded-full font-black text-sm text-slate-900 ${rouletteResult === "RED" ? "bg-red-600" : rouletteResult === "BLACK" ? "bg-white" : "bg-emerald-600"}`}>
                    {rouletteResult}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">PLACE BET ON COLOR</span>
              )}
            </div>

            <button 
              onClick={spinRouletteTeaser} 
              disabled={rouletteSpinning}
              className="mt-6 px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              SPIN WHEEL
            </button>
            {rouletteMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow animate-pulse">
                {rouletteMsg}
              </div>
            )}
          </div>
        );

      case "blackjack":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-red-600 text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-red-500 shadow animate-pulse">
              VIP Teaser Table
            </div>
            <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest mt-2">Blackjack Teaser</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Test your luck below before starting premium tables</p>

            <div className="relative w-full aspect-[2/1] max-w-2xl bg-gradient-to-b from-red-950 via-[#3a0606] to-[#1a0101] border-[12px] border-slate-800 rounded-t-full flex flex-col items-center justify-end pb-8 shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_15px_30px_rgba(0,0,0,0.2)]">
              <div className="absolute top-1/4 text-center text-red-550/30 font-black text-xs sm:text-lg uppercase tracking-[0.4em] select-none pointer-events-none">
                Dealer Stands on Soft 17
              </div>

              {teaserDealt && (
                <div className="absolute inset-0 flex items-center justify-center gap-12 sm:gap-24 z-10">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[8px] font-black text-slate-900/50 uppercase tracking-widest">Dealer</span>
                    <div className="flex gap-[-10px]">
                      {teaserDealerHand.map((c, i) => (
                        <motion.div 
                          key={`d-${i}`}
                          initial={{ y: -100, rotate: 30, scale: 0.8 }}
                          animate={{ y: 0, rotate: 0, scale: 1 }}
                          className="w-12 h-18 bg-white border border-slate-200 rounded shadow-md flex flex-col justify-between p-1 text-slate-900 font-mono text-[9px] font-black"
                          style={{ marginLeft: i > 0 ? "-15px" : "0px" }}
                        >
                          <span>{c.val}{c.suit}</span>
                          <span className="text-center text-base">{c.suit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[8px] font-black text-slate-900/50 uppercase tracking-widest">Player</span>
                    <div className="flex gap-[-10px]">
                      {teaserPlayerHand.map((c, i) => (
                        <motion.div 
                          key={`p-${i}`}
                          initial={{ y: 100, rotate: -30, scale: 0.8 }}
                          animate={{ y: 0, rotate: 0, scale: 1 }}
                          className="w-12 h-18 bg-white border border-slate-200 rounded shadow-md flex flex-col justify-between p-1 text-slate-900 font-mono text-[9px] font-black"
                          style={{ marginLeft: i > 0 ? "-15px" : "0px" }}
                        >
                          <span>{c.val}{c.suit}</span>
                          <span className="text-center text-base">{c.suit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {teaserDealing && (
                <div className="absolute inset-0 flex items-center justify-center z-15 bg-white/40 backdrop-blur-xs">
                  <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="flex gap-6 sm:gap-12 relative z-10">
                <button 
                  onClick={() => handleBetDrop("perfect-pairs")}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-dashed border-red-500/40 flex flex-col items-center justify-center bg-white/40 hover:bg-white/5 transition-all relative cursor-pointer"
                >
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Pairs</span>
                  {bets["perfect-pairs"] && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-slate-900 font-black text-[9px] flex items-center justify-center shadow">
                      ₹{bets["perfect-pairs"]}
                    </div>
                  )}
                </button>

                <button 
                  onClick={() => handleBetDrop("main")}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-red-500/80 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-all relative shadow-lg cursor-pointer"
                >
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Bet Main</span>
                  {bets["main"] && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-600 text-slate-900 font-black text-xs flex items-center justify-center shadow-md">
                      ₹{bets["main"]}
                    </div>
                  )}
                </button>

                <button 
                  onClick={() => handleBetDrop("bonus")}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-dashed border-red-500/40 flex flex-col items-center justify-center bg-white/40 hover:bg-white/5 transition-all relative cursor-pointer"
                >
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Bonus</span>
                  {bets["bonus"] && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-slate-900 font-black text-[9px] flex items-center justify-center shadow">
                      ₹{bets["bonus"]}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {teaserMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow animate-pulse">
                {teaserMsg}
              </div>
            )}

            <TokenCarousel />
          </div>
        );

      case "poker":
        return (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-slate-800 font-black text-lg sm:text-xl uppercase tracking-widest">Heads Up Poker Teaser</h2>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black tracking-widest uppercase">Live Deal Engine</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-red-950 via-[#3a0606] to-[#1a0101] border-[12px] border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] shadow-lg relative">
                <span className="absolute top-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-900/30">Community Cards</span>
                
                {pokerCommunity.length > 0 && (
                  <div className="flex gap-2.5 sm:gap-4 mb-12 mt-4">
                    {pokerCommunity.map((card, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-12 h-18 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center text-sm font-black text-slate-800"
                      >
                        {card}
                      </motion.div>
                    ))}
                  </div>
                )}

                {pokerHand.length > 0 && (
                  <div className="flex gap-4 relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase whitespace-nowrap shadow-md">
                      Pocket Cards
                    </div>
                    <div className="w-14 h-20 bg-white border border-slate-300 rounded-lg shadow-lg flex items-center justify-center text-base font-black text-slate-800 rotate-[-5deg]">
                      {pokerHand[0]}
                    </div>
                    <div className="w-14 h-20 bg-white border border-slate-300 rounded-lg shadow-lg flex items-center justify-center text-base font-black text-red-650 rotate-[5deg]">
                      {pokerHand[1]}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-center gap-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block mb-2">Simulated Live Action</span>
                {pokerState === "idle" ? (
                  <button onClick={startPokerTeaser} className="text-center bg-red-600 hover:bg-red-700 text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                    DEAL HOLE CARDS
                  </button>
                ) : (
                  <button onClick={advancePokerTeaser} className="text-center bg-emerald-500 hover:bg-emerald-600 text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                    {pokerState === "flop" ? "DEAL TURN" : pokerState === "turn" ? "DEAL RIVER" : "SHOWDOWN"}
                  </button>
                )}
              </div>
            </div>
            {pokerMsg && (
              <div className="mt-4 px-6 py-2 rounded-full bg-white border border-slate-800 text-yellow-400 text-xs font-black uppercase tracking-widest shadow animate-pulse text-center">
                {pokerMsg}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-slate-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* Category horizontal scroll navigation sub-header */}
        <div className="w-full shrink-0">
          <div className="flex flex-wrap gap-2">
            {LOBBY_CATEGORIES.map((cat) => {
              const isActive = categorySlug === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/casino/${cat.slug}`}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-br from-red-550 to-red-650 text-slate-900 border-red-500 shadow-md scale-102"
                      : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Category Hero / Stats Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Gamepad2 className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100/50 w-max px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-pulse" /> Verified Provably Fair
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight">
              {categorySlug === "hot" ? "HOT ARENA" : `${categorySlug.replace(/-/g, " ")} Arena`}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
              Experience the absolute top 1% payout loops and interactive gaming feedback. Seamless balance adjustments and real-time multiplayer feeds.
            </p>
          </div>

          {/* Quick statistics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-slate-50 border border-slate-150 p-4 rounded-2xl relative z-10 shrink-0">
            <div className="text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Players</span>
              <span className="text-sm sm:text-base font-black text-slate-800 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {(categoryGames.length * 1.5 + 12).toFixed(1)}K
              </span>
            </div>
            <div className="text-center border-x border-slate-200 px-3 sm:px-6">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Games</span>
              <span className="text-sm sm:text-base font-black text-slate-800">
                {categoryGames.length} Node{categoryGames.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Max RTP</span>
              <span className="text-sm sm:text-base font-black text-emerald-600 flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                99.5%
              </span>
            </div>
          </div>
        </div>

        {/* Live Bets Feed & Top Showcases Wrapper Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Showcase (Interactive Nodes or Banners) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Dynamic Category Showcase Component */}
            {renderCategoryShowcase()}

            {/* Games grid header */}
            <div className="flex justify-between items-center pt-2">
              <h3 className="text-slate-800 font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-red-500" />
                Lobby games
              </h3>
              <div className="flex items-center gap-3">
                {/* Search query input */}
                <div className="relative w-44 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search games..." 
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-[11px] font-bold text-slate-750 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Provider Dropdown filter */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                    className="bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:border-slate-350"
                  >
                    {selectedProvider}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {showProviderDropdown && (
                    <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden font-black text-[10px] uppercase tracking-wider text-slate-600 animate-in fade-in slide-in-from-top-1 duration-150">
                      {PROVIDERS.map(prov => (
                        <button
                          key={prov}
                          onClick={() => {
                            setSelectedProvider(prov);
                            setShowProviderDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${selectedProvider === prov ? "text-red-500 bg-red-50/20" : ""}`}
                        >
                          {prov}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
              {displayedGames.map((game) => (
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
              {displayedGames.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider bg-white rounded-3xl border border-slate-200">
                  No games found matching your search.
                </div>
              )}
            </div>

            {/* Load more button */}
            {visibleCount < filteredGames.length && (
              <div className="w-full flex justify-center pb-12">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-full transition-all border border-slate-200 shadow-sm hover:shadow active:scale-95 cursor-pointer"
                >
                  Load More Games
                </button>
              </div>
            )}

          </div>

          {/* SIDE PANEL: REAL-TIME CASINO ACTIVITY AND HYPE TICKER */}
          <div className="space-y-6">
            
            {/* Live activity ticker */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> Live Bets
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Scrolling List */}
              <div className="flex flex-col gap-3 min-h-[360px]">
                <AnimatePresence mode="popLayout">
                  {liveBets.map((bet) => (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -15, y: -5 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, x: 15, y: 5 }}
                      className="bg-slate-50 border border-slate-150 p-3 rounded-2xl flex justify-between items-center transition-all select-none hover:shadow-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-800">{bet.user}</span>
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{bet.game}</span>
                      </div>
                      
                      <div className="text-right flex flex-col gap-0.5">
                        <span className="text-[9.5px] font-black text-slate-650 font-mono">₹{bet.amount}</span>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider ${bet.won ? "text-emerald-600" : "text-slate-400"}`}>
                          {bet.won ? `+₹${bet.payout} (${bet.mult}x)` : "Loss"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Trending Hot RTP games list */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Hot Streaks
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">RTP %</span>
              </div>

              <div className="flex flex-col gap-3.5">
                {[
                  { title: "Sweet Bonanza", rtp: 112.4, change: "+3.2%", status: "hot" },
                  { title: "Gates of Olympus", rtp: 108.7, change: "+1.9%", status: "hot" },
                  { title: "Andar Bahar Traditional", rtp: 104.2, change: "+0.8%", status: "hot" },
                  { title: "Aviator", rtp: 96.0, change: "-0.5%", status: "normal" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-slate-800 leading-none">{item.title}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">24h dynamic</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black font-mono text-emerald-600 block leading-none">{item.rtp}%</span>
                      <span className="text-[8px] font-bold text-emerald-500 leading-none">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
