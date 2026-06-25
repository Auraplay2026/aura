"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Wallet, Play } from "lucide-react";
import { calculateGameOutcome } from "@/lib/fair-casino-math";

interface HiLoEngineProps {
  isPlaying: boolean;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

const DECK = [
  { val: "2", suit: "♠", color: "text-slate-900", rank: 2 },
  { val: "3", suit: "♦️", color: "text-red-600", rank: 3 },
  { val: "4", suit: "♥️", color: "text-red-600", rank: 4 },
  { val: "5", suit: "♣️", color: "text-slate-900", rank: 5 },
  { val: "6", suit: "♠", color: "text-slate-900", rank: 6 },
  { val: "7", suit: "♦️", color: "text-red-600", rank: 7 },
  { val: "8", suit: "♥️", color: "text-red-600", rank: 8 },
  { val: "9", suit: "♣️", color: "text-slate-900", rank: 9 },
  { val: "10", suit: "♠", color: "text-slate-900", rank: 10 },
  { val: "J", suit: "♦️", color: "text-red-600", rank: 11 },
  { val: "Q", suit: "♥️", color: "text-red-600", rank: 12 },
  { val: "K", suit: "♣️", color: "text-slate-900", rank: 13 },
  { val: "A", suit: "♠", color: "text-slate-900", rank: 14 }
];

export function HiLoEngine({ isPlaying, onLiveTick, onComplete }: HiLoEngineProps) {
  const [currentCard, setCurrentCard] = useState<typeof DECK[0] | null>(null);
  const [prevCards, setPrevCards] = useState<typeof DECK[0][]>([]);
  const [gameState, setGameState] = useState<"idle" | "playing" | "busted" | "cashed_out">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [targetWinLength, setTargetWinLength] = useState(0);
  
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (isPlaying && gameState === "idle") {
      setGameState("playing");
      setMultiplier(1.0);
      setPrevCards([]);
      // Draw first card
      setCurrentCard(DECK[Math.floor(Math.random() * DECK.length)]);
      
      // We determine how many correct guesses they are ALLOWED to have before forced bust
      const mathOutcome = calculateGameOutcome("ORIGINAL");
      if (mathOutcome.isWin) {
        setTargetWinLength(Math.floor(Math.random() * 5) + 3); // Let them win 3 to 7 guesses
      } else {
        setTargetWinLength(mathOutcome.isNearMiss ? 2 : 0); // Bust quickly
      }
    } else if (!isPlaying) {
      setGameState("idle");
      setCurrentCard(null);
      setPrevCards([]);
    }
  }, [isPlaying, gameState]);

  const handleGuess = (guess: "HIGHER" | "LOWER") => {
    if (gameState !== "playing" || !currentCard) return;

    const currentRank = currentCard.rank;
    const winsSoFar = prevCards.length + 1;
    
    // Determine the next card based on our pre-determined win length target
    let nextCard;
    if (winsSoFar <= targetWinLength) {
      // Force Win
      let validCards = DECK.filter(c => guess === "HIGHER" ? c.rank > currentRank : c.rank < currentRank);
      if (validCards.length === 0) validCards = [currentCard]; // fallback if rank is 14 and guessed higher (unlikely in real play but safe)
      nextCard = validCards[Math.floor(Math.random() * validCards.length)];
      
      setPrevCards(prev => [...prev, currentCard]);
      setCurrentCard(nextCard);
      setMultiplier(prev => +(prev * 1.5).toFixed(2));
    } else {
      // Force Loss
      let invalidCards = DECK.filter(c => guess === "HIGHER" ? c.rank <= currentRank : c.rank >= currentRank);
      if (invalidCards.length === 0) invalidCards = DECK; // fallback
      nextCard = invalidCards[Math.floor(Math.random() * invalidCards.length)];
      
      setPrevCards(prev => [...prev, currentCard]);
      setCurrentCard(nextCard);
      setGameState("busted");
      setTimeout(() => {
        onCompleteRef.current(0, false);
      }, 1500);
    }
  };

  const handleCashout = () => {
    if (gameState !== "playing") return;
    setGameState("cashed_out");
    setTimeout(() => {
      onCompleteRef.current(multiplier, true);
    }, 1500);
  };

  useEffect(() => {
    if (gameState === "playing") {
      onLiveTick?.(multiplier);
    } else {
      onLiveTick?.(1.0);
    }
  }, [multiplier, gameState, onLiveTick]);

  useEffect(() => {
    const handleTriggerCashout = () => {
      if (gameState === "playing" && multiplier > 1.0) {
        handleCashout();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [gameState, multiplier]);

  return (
    <div className="w-full h-full min-h-[300px] h-[340px] md:min-h-[600px] md:h-full bg-gradient-to-br from-violet-50 via-white to-indigo-50 rounded-3xl border border-violet-200/60 shadow-[0_8px_40px_rgba(109,40,217,0.08),inset_0_1px_0_rgba(255,255,255,1)] relative flex flex-col items-center p-2 md:p-6 overflow-hidden perspective-[1000px]">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.12),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(196,181,253,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(196,181,253,0.08)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="relative z-10 w-full flex justify-between items-center mb-1.5 md:mb-12 bg-white/80 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-violet-200/60 shadow-sm md:shadow-md">
        <div className="hidden md:block">
          <h2 className="text-violet-600 font-black text-base md:text-xl tracking-widest uppercase">Aura HiLo</h2>
          <span className="text-slate-500 text-[8px] md:text-[10px] font-bold tracking-[0.2em] block">PREDICT THE NEXT CARD</span>
        </div>
        <div className="flex md:flex-col justify-between items-center md:items-end w-full md:w-auto gap-2">
          <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest md:mb-1">Current Multiplier</span>
          <span className={`text-sm md:text-2xl font-mono font-black ${multiplier > 1.0 ? "text-emerald-600" : "text-slate-800"}`}>
            {multiplier.toFixed(2)}x
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full transform-style-3d rotate-x-[10deg]">
        
        <div className="absolute top-0 flex gap-[-30px] opacity-60 scale-75 blur-[2px] pointer-events-none">
          {prevCards.slice(-3).map((card, idx) => (
            <div key={idx} className={`w-11 h-15 md:w-20 md:h-28 bg-slate-200 rounded-lg border border-slate-400 shadow-md relative flex items-center justify-center ${card.color} -ml-8 first:ml-0 rotate-[-5deg]`}>
              <span className="absolute top-1 left-2 font-black text-[10px]">{card.val}</span>
              <span className="text-lg md:text-2xl">{card.suit}</span>
            </div>
          ))}
        </div>

        <div className="relative flex items-center justify-center mt-6 md:mt-12 w-full">
          <AnimatePresence mode="popLayout">
            {currentCard ? (
              <motion.div
                key={`${currentCard.val}-${currentCard.suit}`}
                initial={{ y: 150, rotateY: 180, scale: 0.8, opacity: 0 }}
                animate={{ y: 0, rotateY: 0, scale: 1, opacity: 1 }}
                exit={{ x: -200, opacity: 0, rotateZ: -20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`w-24 md:w-56 h-34 md:h-80 bg-gradient-to-br from-white to-slate-100 border-[3px] md:border-4 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.1)] relative flex flex-col justify-between p-2.5 md:p-4 transform-style-3d z-30`}
              >
                <span className={`font-black text-base md:text-4xl leading-none ${currentCard.color}`}>{currentCard.val}</span>
                <span className={`text-4xl md:text-9xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentCard.color} drop-shadow-lg`}>{currentCard.suit}</span>
                <span className={`font-black text-base md:text-4xl leading-none self-end rotate-180 ${currentCard.color}`}>{currentCard.val}</span>
              </motion.div>
            ) : (
              <div className="w-24 md:w-56 h-34 md:h-80 bg-slate-50/50 border-4 border-dashed border-slate-700 rounded-2xl flex items-center justify-center backdrop-blur-sm z-30">
                <span className="text-slate-600 font-black uppercase tracking-widest text-[10px] md:text-sm">Place Bet</span>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameState === "busted" && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 z-40 flex items-center justify-center">
                <div className="bg-rose-600 text-slate-900 font-black text-4xl px-8 py-4 rounded-xl border-4 border-rose-400 shadow-[0_0_50px_rgba(225,29,72,0.8)] -rotate-12">
                  BUSTED!
                </div>
              </motion.div>
            )}
            {gameState === "cashed_out" && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 z-40 flex items-center justify-center">
                <div className="bg-emerald-500 text-slate-900 font-black text-3xl px-8 py-4 rounded-xl border-4 border-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.8)] rotate-12 flex flex-col items-center">
                  <span>CASHED OUT</span>
                  <span className="text-xl">{multiplier.toFixed(2)}x</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Manual Controls */}
      <AnimatePresence>
        {gameState === "playing" && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full relative z-20 flex flex-col sm:flex-row gap-4 mt-8"
          >
            <button 
              onClick={() => handleGuess("HIGHER")}
              disabled={currentCard?.rank === 14}
              className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-slate-900 font-black text-xl py-5 rounded-2xl shadow-[0_8px_0_rgba(30,58,138,1),0_15px_20px_rgba(59,130,246,0.5)] active:translate-y-2 active:shadow-[0_0_0_rgba(30,58,138,1),0_5px_10px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              HIGHER <ArrowUp className="w-6 h-6 stroke-[3]" />
            </button>
            <button 
              onClick={() => handleGuess("LOWER")}
              disabled={currentCard?.rank === 2}
              className="flex-1 bg-gradient-to-t from-rose-600 to-rose-400 hover:from-rose-500 hover:to-rose-300 text-slate-900 font-black text-xl py-5 rounded-2xl shadow-[0_8px_0_rgba(159,18,57,1),0_15px_20px_rgba(244,63,94,0.5)] active:translate-y-2 active:shadow-[0_0_0_rgba(159,18,57,1),0_5px_10px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              LOWER <ArrowDown className="w-6 h-6 stroke-[3]" />
            </button>
            <button 
              onClick={handleCashout}
              disabled={multiplier <= 1.0}
              className="hidden md:flex flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-900 font-black text-xl py-5 rounded-2xl shadow-[0_8px_0_rgba(6,95,70,1),0_15px_20px_rgba(16,185,129,0.5)] active:translate-y-2 active:shadow-[0_0_0_rgba(6,95,70,1),0_5px_10px_rgba(16,185,129,0.5)] transition-all items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none border-2 border-emerald-300"
            >
              CASHOUT <Wallet className="w-6 h-6 stroke-[3]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
