"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface BlackjackVIPEngineProps {
  isPlaying: boolean;
  onComplete: (won: boolean) => void;
}

const DECK = [
  { val: "A", suit: "♠", color: "text-slate-900", score: 11 },
  { val: "10", suit: "♦️", color: "text-red-600", score: 10 },
  { val: "J", suit: "♥️", color: "text-red-600", score: 10 },
  { val: "Q", suit: "♣️", color: "text-slate-900", score: 10 },
  { val: "K", suit: "♠", color: "text-slate-900", score: 10 },
  { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
  { val: "8", suit: "♦️", color: "text-red-600", score: 8 }
];

export function BlackjackVIPEngine({ isPlaying, onComplete }: BlackjackVIPEngineProps) {
  const [playerHand, setPlayerHand] = useState<typeof DECK>([]);
  const [dealerHand, setDealerHand] = useState<typeof DECK>([]);
  const [dealt, setDealt] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [betCountdown, setBetCountdown] = useState(15);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Betting countdown loop when game is idle
  useEffect(() => {
    if (isPlaying) {
      setBetCountdown(15);
      return;
    }
    const timer = setInterval(() => {
      setBetCountdown(prev => {
        if (prev <= 1) return 15;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setDealerHand([]);
      setDealt(false);
      setResultMsg("");
      return;
    }

    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;
    
    // Deal sequence
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count === 1) {
        setPlayerHand(p => [...p, DECK[Math.floor(Math.random() * DECK.length)]]);
      } else if (count === 2) {
        setDealerHand(d => [...d, DECK[Math.floor(Math.random() * DECK.length)]]);
      } else if (count === 3) {
        setPlayerHand(p => [...p, DECK[Math.floor(Math.random() * DECK.length)]]);
      } else if (count === 4) {
        setDealerHand(d => [...d, DECK[Math.floor(Math.random() * DECK.length)]]);
        clearInterval(interval);
        
        setTimeout(() => {
          setDealt(true);
          const pScore = playerHand.reduce((acc, c) => acc + c.score, 0);
          const dScore = dealerHand.reduce((acc, c) => acc + c.score, 0);
          
          if (won) setResultMsg("Player Wins!");
          else if (pScore > 21) setResultMsg("Player Busts");
          else if (dScore > pScore && dScore <= 21) setResultMsg("Dealer Wins");
          else setResultMsg("Push");
          
          onCompleteRef.current(won);
        }, 1200);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const playerScore = playerHand.reduce((acc, c) => acc + c.score, 0);
  const dealerScore = dealerHand.reduce((acc, c) => acc + c.score, 0);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-[#111115] via-[#1a1a24] to-[#070709] rounded-3xl border border-[#27272a] shadow-2xl relative flex flex-col items-center justify-center overflow-hidden perspective-[1000px]">
      
      {/* Carbon fiber grid effect / Table Felt */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0),
            radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 8px 8px'
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_60%)] pointer-events-none" />

      {/* Table Border illusion */}
      <div className="absolute inset-4 rounded-[2.5rem] border-2 border-slate-800/50 pointer-events-none" />

      <div className="absolute top-8 text-center opacity-40 select-none">
        <h2 className="text-slate-300 font-black text-2xl md:text-4xl tracking-[0.4em] uppercase drop-shadow-md">VIP BLACKJACK PLATINUM</h2>
        <span className="text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.5em] mt-1 block">BLACKJACK PAYS 3 TO 2</span>
      </div>

      {/* 15s Betting Countdown Ring */}
      {!isPlaying && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md z-30 select-none">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="16" cy="16" r="13" 
                className="stroke-slate-800 fill-none" 
                strokeWidth="2.5" 
              />
              <circle 
                cx="16" cy="16" r="13" 
                className="stroke-red-500 fill-none transition-all duration-1000" 
                strokeWidth="2.5" 
                strokeDasharray="81.68" 
                strokeDashoffset={(81.68 - (81.68 * betCountdown) / 15).toFixed(2)}
              />
            </svg>
            <span className="absolute text-[10px] font-black text-white font-mono">{betCountdown}s</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider pr-1">Bet window</span>
        </div>
      )}

      <div className="relative z-10 w-full flex flex-col md:flex-row gap-8 md:gap-20 justify-center mt-12 px-6 transform-style-3d rotate-x-[15deg]">
        
        {/* Dealer Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-1 rounded-full border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm shadow-inner">
            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">Dealer</span>
          </div>
          <div className="flex gap-[-20px] min-h-[140px] perspective-[800px]">
            {dealerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ y: -300, x: -200, rotateY: 180, rotateZ: -45, scale: 0.5 }}
                animate={{ y: 0, x: 0, rotateY: 0, rotateZ: idx === 0 ? -5 : 5, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`w-24 h-36 bg-gradient-to-br from-white to-slate-100 border-2 border-slate-200 rounded-xl shadow-[0_20px_30px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(0,0,0,0.1)] relative flex flex-col justify-between p-2 transform-style-3d z-${10 + idx}`}
                style={{ marginLeft: idx > 0 ? "-30px" : "0px" }}
              >
                <span className={`font-black text-lg leading-none ${card.color}`}>{card.val}</span>
                <span className={`text-4xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${card.color}`}>{card.suit}</span>
                <span className={`font-black text-lg leading-none self-end rotate-180 ${card.color}`}>{card.val}</span>
              </motion.div>
            ))}
          </div>
          {dealerHand.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white font-mono font-black text-xl bg-slate-900/80 border border-slate-700 px-6 py-2 rounded-full shadow-lg backdrop-blur-md">
              {dealerScore}
            </motion.div>
          )}
        </div>

        {/* Player Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <span className="text-xs text-blue-400 font-black uppercase tracking-widest">Player</span>
          </div>
          <div className="flex gap-[-20px] min-h-[140px] perspective-[800px]">
            {playerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ y: -300, x: 200, rotateY: 180, rotateZ: 45, scale: 0.5 }}
                animate={{ y: 0, x: 0, rotateY: 0, rotateZ: idx === 0 ? -5 : 5, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`w-24 h-36 bg-gradient-to-br from-white to-slate-100 border-2 border-slate-200 rounded-xl shadow-[0_20px_30px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(0,0,0,0.1)] relative flex flex-col justify-between p-2 transform-style-3d z-${10 + idx}`}
                style={{ marginLeft: idx > 0 ? "-30px" : "0px" }}
              >
                <span className={`font-black text-lg leading-none ${card.color}`}>{card.val}</span>
                <span className={`text-4xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${card.color}`}>{card.suit}</span>
                <span className={`font-black text-lg leading-none self-end rotate-180 ${card.color}`}>{card.val}</span>
              </motion.div>
            ))}
          </div>
          {playerHand.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white font-mono font-black text-xl bg-slate-900/80 border border-slate-700 px-6 py-2 rounded-full shadow-lg backdrop-blur-md">
              {playerScore}
            </motion.div>
          )}
        </div>
      </div>

      {/* Results HUD Overlay */}
      <AnimatePresence>
        {dealt && resultMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="absolute bottom-10 z-50 px-12 py-4 bg-slate-900/90 border border-slate-600 shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-2xl backdrop-blur-lg"
          >
            <span className={`font-black uppercase tracking-widest text-3xl drop-shadow-md ${
              resultMsg.includes("Player") ? "text-blue-400" :
              resultMsg.includes("Dealer") || resultMsg.includes("Busts") ? "text-red-400" : "text-slate-300"
            }`}>
              {resultMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
