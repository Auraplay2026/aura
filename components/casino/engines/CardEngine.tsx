"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface CardEngineProps {
  isPlaying: boolean;
  onComplete: (multiplierOrWon: number | boolean, won?: boolean) => void;
  gameId?: string;
  gameTitle?: string;
}

const CARDS = [
  { val: "A", suit: "♠", color: "text-slate-900", score: 11 },
  { val: "K", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "Q", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "J", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "10", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "A", suit: "♥️", color: "text-red-600", score: 11 },
  { val: "K", suit: "♥️", color: "text-red-600", score: 10 },
  { val: "Q", suit: "♥️", color: "text-red-600", score: 10 },
  { val: "J", suit: "♦️", color: "text-red-600", score: 10 },
  { val: "9", suit: "♣️", color: "text-slate-900", score: 9 }
];

export function CardEngine({ isPlaying, onComplete, gameId, gameTitle }: CardEngineProps) {
  const isBlackjack = !!(gameTitle?.toLowerCase().includes("blackjack") || gameId?.includes("blackjack") || gameId === "orig-8");
  const isBaccarat = !!(gameTitle?.toLowerCase().includes("baccarat") || gameId?.includes("baccarat") || gameId?.includes("table-3"));

  const [playerHand, setPlayerHand] = useState<typeof CARDS>([]);
  const [dealerHand, setDealerHand] = useState<typeof CARDS>([]);
  const [dealt, setDealt] = useState(false);
  const [selectedSide, setSelectedSide] = useState<string>("PLAYER");

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setDealerHand([]);
      setDealt(false);
      return;
    }

    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;
    let interval: NodeJS.Timeout;

    // Pre-calculate deterministic cards based on selection & outcome
    const targetPlayerHand: typeof CARDS = [];
    const targetDealerHand: typeof CARDS = [];

    if (isBaccarat) {
      const isTie = (selectedSide === "TIE" && won) || (selectedSide !== "TIE" && !won && Math.random() > 0.85);
      const isPlayerWinner = (selectedSide === "PLAYER" && won) || (selectedSide === "BANKER" && !won && !isTie);

      if (isTie) {
        targetPlayerHand.push(
          { val: "4", suit: "♠", color: "text-slate-900", score: 4 },
          { val: "2", suit: "♦️", color: "text-red-600", score: 2 }
        ); // Baccarat Score: 6
        targetDealerHand.push(
          { val: "A", suit: "♥️", color: "text-red-600", score: 1 },
          { val: "5", suit: "♣️", color: "text-slate-900", score: 5 }
        ); // Baccarat Score: 6
      } else if (isPlayerWinner) {
        targetPlayerHand.push(
          { val: "8", suit: "♠", color: "text-slate-900", score: 8 },
          { val: "K", suit: "♦️", color: "text-red-600", score: 0 }
        ); // Baccarat Score: 8
        targetDealerHand.push(
          { val: "2", suit: "♥️", color: "text-red-600", score: 2 },
          { val: "3", suit: "♣️", color: "text-slate-900", score: 3 }
        ); // Baccarat Score: 5
      } else {
        // Banker wins
        targetPlayerHand.push(
          { val: "A", suit: "♠", color: "text-slate-900", score: 1 },
          { val: "2", suit: "♦️", color: "text-red-600", score: 2 }
        ); // Baccarat Score: 3
        targetDealerHand.push(
          { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
          { val: "10", suit: "♣️", color: "text-slate-900", score: 0 }
        ); // Baccarat Score: 9
      }
    } else if (isBlackjack) {
      const isPlayerWinner = (selectedSide === "PLAYER" && won) || (selectedSide === "DEALER" && !won);

      if (isPlayerWinner) {
        targetPlayerHand.push(
          { val: "A", suit: "♠", color: "text-slate-900", score: 11 },
          { val: "J", suit: "♦️", color: "text-red-600", score: 10 }
        ); // score: 21 (Natural Blackjack)
        targetDealerHand.push(
          { val: "K", suit: "♥️", color: "text-red-600", score: 10 },
          { val: "8", suit: "♣️", color: "text-slate-900", score: 8 }
        ); // score: 18
      } else {
        targetPlayerHand.push(
          { val: "10", suit: "♠", color: "text-slate-900", score: 10 },
          { val: "7", suit: "♦️", color: "text-red-600", score: 7 }
        ); // score: 17
        targetDealerHand.push(
          { val: "A", suit: "♥️", color: "text-red-600", score: 11 },
          { val: "9", suit: "♣️", color: "text-slate-900", score: 9 }
        ); // score: 20
      }
    } else {
      // General/Poker 5-card outcomes
      const isPlayerWinner = (selectedSide === "PLAYER" && won) || (selectedSide === "DEALER" && !won);

      if (isPlayerWinner) {
        targetPlayerHand.push(
          { val: "10", suit: "♠", color: "text-slate-900", score: 10 },
          { val: "J", suit: "♠", color: "text-slate-900", score: 10 },
          { val: "Q", suit: "♠", color: "text-slate-900", score: 10 },
          { val: "K", suit: "♠", color: "text-slate-900", score: 10 },
          { val: "A", suit: "♠", color: "text-slate-900", score: 11 }
        );
      } else {
        targetPlayerHand.push(
          { val: "9", suit: "♣️", color: "text-slate-900", score: 9 },
          { val: "2", suit: "♦️", color: "text-red-600", score: 2 },
          { val: "5", suit: "♥️", color: "text-red-600", score: 5 },
          { val: "J", suit: "♠", color: "text-slate-900", score: 10 },
          { val: "Q", suit: "♥️", color: "text-red-600", score: 10 }
        );
      }
    }

    // Deal cards in staggered interval
    let step = 0;
    if (isBlackjack || isBaccarat) {
      interval = setInterval(() => {
        if (step === 0) {
          setPlayerHand([targetPlayerHand[0]]);
        } else if (step === 1) {
          setDealerHand([targetDealerHand[0]]);
        } else if (step === 2) {
          setPlayerHand([targetPlayerHand[0], targetPlayerHand[1]]);
        } else if (step === 3) {
          setDealerHand([targetDealerHand[0], targetDealerHand[1]]);
          clearInterval(interval);
        }
        step++;
      }, 450);
    } else {
      interval = setInterval(() => {
        if (step < 5) {
          setPlayerHand(p => [...p, targetPlayerHand[step]]);
        } else {
          clearInterval(interval);
        }
        step++;
      }, 400);
    }

    // Determine correct multiplier odds
    let odds = 2.0;
    if (isBaccarat) {
      if (selectedSide === "BANKER") odds = 1.95;
      else if (selectedSide === "TIE") odds = 9.0;
    }

    // Completion trigger
    const finishTimeout = setTimeout(() => {
      setDealt(true);
      onCompleteRef.current(won ? odds : 0, won);
    }, (isBlackjack || isBaccarat) ? 2200 : 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimeout);
    };
  }, [isPlaying, isBlackjack, isBaccarat, selectedSide]);

  const getHandScore = (hand: typeof CARDS, isBac: boolean) => {
    if (isBac) {
      const sum = hand.reduce((acc, c) => {
        const val = c.val;
        if (["10", "J", "Q", "K"].includes(val)) return acc;
        if (val === "A") return acc + 1;
        return acc + (parseInt(val) || 0);
      }, 0);
      return sum % 10;
    }
    let sum = hand.reduce((acc, c) => {
      const val = c.val;
      if (["J", "Q", "K"].includes(val)) return acc + 10;
      if (val === "A") return acc + 11;
      return acc + (parseInt(val) || 0);
    }, 0);
    let aceCount = hand.filter(c => c.val === "A").length;
    while (sum > 21 && aceCount > 0) {
      sum -= 10;
      aceCount--;
    }
    return sum;
  };

  const playerScore = getHandScore(playerHand, isBaccarat);
  const dealerScore = getHandScore(dealerHand, isBaccarat);

  // Styling based on game type
  let feltColor = "from-emerald-900 via-[#0a2e1c] to-[#04170e]"; // Green felt for Blackjack/General
  let boardLabel = "VIP BLACKJACK TABLE";
  let rulesText = "Dealer stands on Soft 17 • Pays 3 to 2";

  if (isBaccarat) {
    feltColor = "from-blue-950 via-[#0b1f3c] to-[#050e1b]"; // Dark Blue felt for Baccarat
    boardLabel = "HIGH LIMIT BACCARAT";
    rulesText = "Player Pays 1:1 • Banker Pays 0.95:1";
  } else if (!isBlackjack) {
    feltColor = "from-red-950 via-[#3c0b0b] to-[#1b0505]"; // Red felt for Poker
    boardLabel = "AURA CASINO POKER HYPE";
    rulesText = "High Card • Pairs • Full House Specials";
  }

  return (
    <div className={`w-full h-full min-h-[500px] bg-gradient-to-br ${feltColor} rounded-[3rem] border-[24px] border-[#1a1110] shadow-[inset_0_0_150px_rgba(0,0,0,0.9),0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col items-center justify-center overflow-hidden`}>
      
      {/* Spotlight / Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      
      {/* Overhead Spotlight */}
      <div className="absolute top-0 inset-x-0 h-[80%] bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_70%)] pointer-events-none" />
      
      {/* Gold Casino imprint */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-20 text-center">
        <h2 className="text-yellow-600 font-black text-2xl md:text-4xl tracking-[0.4em] uppercase">{boardLabel}</h2>
        <h3 className="text-yellow-600 font-bold tracking-widest text-[10px] mt-2 uppercase">{rulesText}</h3>
      </div>

      {/* Cards Table Rendering */}
      <div className="relative z-10 w-full flex flex-col items-center gap-6 mt-16 px-6">
        
        {isPlaying && (
          <div className="bg-black/50 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-yellow-400 tracking-wider">
            Bet Placed: {selectedSide}
          </div>
        )}

        {/* Deal Side-by-Side hands for BJ/Baccarat */}
        {isBlackjack || isBaccarat ? (
          <div className="flex flex-col md:flex-row gap-12 w-full justify-center">
            {/* Dealer Hand (or Banker) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-200 opacity-60 font-black uppercase tracking-wider">
                {isBaccarat ? "Banker Hand" : "Dealer Hand"}
              </span>
              <div className="flex gap-2">
                {dealerHand.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: -200, rotateY: 180, scale: 0.8 }}
                    animate={{ y: 0, rotateY: 0, scale: 1 }}
                    className={`w-20 h-28 bg-white border border-slate-200 rounded-lg shadow-lg relative flex items-center justify-center ${card.color}`}
                  >
                    <span className="absolute top-1 left-2 font-black text-sm">{card.val}{card.suit}</span>
                    <span className="text-3xl">{card.suit}</span>
                  </motion.div>
                ))}
              </div>
              {dealerHand.length > 0 && (
                <span className="text-white font-mono font-bold text-xs bg-black/45 px-3 py-1 rounded-full border border-white/10">
                  Score: {dealerScore}
                </span>
              )}
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-200 opacity-60 font-black uppercase tracking-wider">Player Hand</span>
              <div className="flex gap-2">
                {playerHand.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: -200, rotateY: 180, scale: 0.8 }}
                    animate={{ y: 0, rotateY: 0, scale: 1 }}
                    className={`w-20 h-28 bg-white border border-slate-200 rounded-lg shadow-lg relative flex items-center justify-center ${card.color}`}
                  >
                    <span className="absolute top-1 left-2 font-black text-sm">{card.val}{card.suit}</span>
                    <span className="text-3xl">{card.suit}</span>
                  </motion.div>
                ))}
              </div>
              {playerHand.length > 0 && (
                <span className="text-white font-mono font-bold text-xs bg-black/45 px-3 py-1 rounded-full border border-white/10">
                  Score: {playerScore}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Poker 5-card layout */
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] text-slate-200 opacity-60 font-black uppercase tracking-wider">Player Poker Hand</span>
            <div className="flex gap-3 justify-center">
              {playerHand.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: -300, rotateZ: 45 }}
                  animate={{ y: 0, rotateZ: 0 }}
                  className={`w-20 h-28 md:w-24 md:h-36 bg-white border border-slate-200 rounded-lg shadow-lg relative flex items-center justify-center ${card.color}`}
                >
                  <span className="absolute top-1 left-2 font-black text-sm">{card.val}{card.suit}</span>
                  <span className="text-4xl">{card.suit}</span>
                </motion.div>
              ))}
              {Array.from({ length: Math.max(0, 5 - playerHand.length) }).map((_, i) => (
                <div key={i} className="w-20 h-28 md:w-24 md:h-36 border border-white/10 bg-black/30 rounded-lg flex items-center justify-center text-slate-200/10 font-bold">
                  ?
                </div>
              ))}
            </div>
            {playerHand.length === 5 && (
              <span className="text-yellow-400 font-black uppercase tracking-widest text-xs mt-2 bg-black/45 px-4 py-1.5 rounded-full border border-yellow-500/20 shadow-lg">
                Hand Rank: {playerScore > 40 ? "Three of a Kind" : "Pair of Kings"}
              </span>
            )}
          </div>
        )}

      </div>

      {/* Side Selector (Shown when not playing) */}
      {!isPlaying && (
        <div className="mt-8 flex flex-wrap gap-4 z-20 justify-center">
          {isBaccarat ? (
            <>
              <button
                disabled={isPlaying}
                onClick={() => setSelectedSide("PLAYER")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
                  selectedSide === "PLAYER"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105"
                    : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-blue-500/30"
                }`}
              >
                Player (2x)
              </button>
              <button
                disabled={isPlaying}
                onClick={() => setSelectedSide("BANKER")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
                  selectedSide === "BANKER"
                    ? "bg-gradient-to-br from-red-500 to-red-650 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105"
                    : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-red-500/30"
                }`}
              >
                Banker (1.95x)
              </button>
              <button
                disabled={isPlaying}
                onClick={() => setSelectedSide("TIE")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
                  selectedSide === "TIE"
                    ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-yellow-950 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105"
                    : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-yellow-500/30"
                }`}
              >
                Tie (9x)
              </button>
            </>
          ) : (
            <>
              <button
                disabled={isPlaying}
                onClick={() => setSelectedSide("PLAYER")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
                  selectedSide === "PLAYER"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                    : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-emerald-500/30"
                }`}
              >
                Player (2x)
              </button>
              <button
                disabled={isPlaying}
                onClick={() => setSelectedSide("DEALER")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
                  selectedSide === "DEALER"
                    ? "bg-gradient-to-br from-red-500 to-red-650 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105"
                    : "bg-slate-900/90 text-slate-400 border-slate-800 hover:border-red-500/30"
                }`}
              >
                Dealer (2x)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
