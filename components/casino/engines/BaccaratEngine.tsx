"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface BaccaratEngineProps {
  isPlaying: boolean;
  onComplete: (multiplierOrWon: number | boolean, won?: boolean) => void;
}

const DECK = [
  { val: "A", suit: "♠", color: "text-slate-900", score: 1 },
  { val: "10", suit: "♦️", color: "text-red-600", score: 0 },
  { val: "J", suit: "♥️", color: "text-red-600", score: 0 },
  { val: "Q", suit: "♣️", color: "text-slate-900", score: 0 },
  { val: "K", suit: "♠", color: "text-slate-900", score: 0 },
  { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
  { val: "8", suit: "♦️", color: "text-red-600", score: 8 }
];

export function BaccaratEngine({ isPlaying, onComplete }: BaccaratEngineProps) {
  const [playerHand, setPlayerHand] = useState<typeof DECK>([]);
  const [bankerHand, setBankerHand] = useState<typeof DECK>([]);
  const [dealt, setDealt] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [selectedSide, setSelectedSide] = useState<string>("PLAYER");

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setBankerHand([]);
      setDealt(false);
      setResultMsg("");
      return;
    }

    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;
    
    // Deterministic hands generation based on user's selection & result
    const targetPlayerHand: typeof DECK = [];
    const targetBankerHand: typeof DECK = [];

    const isTie = (selectedSide === "TIE" && won) || (selectedSide !== "TIE" && !won && Math.random() > 0.85);
    const isPlayerWinner = (selectedSide === "PLAYER" && won) || (selectedSide === "BANKER" && !won && !isTie);

    if (isTie) {
      targetPlayerHand.push(
        { val: "4", suit: "♠", color: "text-slate-900", score: 4 },
        { val: "2", suit: "♦️", color: "text-red-600", score: 2 }
      ); // modulo score: 6
      targetBankerHand.push(
        { val: "A", suit: "♥️", color: "text-red-600", score: 1 },
        { val: "5", suit: "♣️", color: "text-slate-900", score: 5 }
      ); // modulo score: 6
    } else if (isPlayerWinner) {
      targetPlayerHand.push(
        { val: "8", suit: "♠", color: "text-slate-900", score: 8 },
        { val: "K", suit: "♦️", color: "text-red-600", score: 0 }
      ); // modulo score: 8
      targetBankerHand.push(
        { val: "2", suit: "♥️", color: "text-red-600", score: 2 },
        { val: "3", suit: "♣️", color: "text-slate-900", score: 3 }
      ); // modulo score: 5
    } else {
      // Banker wins
      targetPlayerHand.push(
        { val: "A", suit: "♠", color: "text-slate-900", score: 1 },
        { val: "2", suit: "♦️", color: "text-red-600", score: 2 }
      ); // modulo score: 3
      targetBankerHand.push(
        { val: "9", suit: "♥️", color: "text-red-600", score: 9 },
        { val: "10", suit: "♣️", color: "text-slate-900", score: 0 }
      ); // modulo score: 9
    }

    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count === 1) {
        setPlayerHand([targetPlayerHand[0]]);
      } else if (count === 2) {
        setBankerHand([targetBankerHand[0]]);
      } else if (count === 3) {
        setPlayerHand([targetPlayerHand[0], targetPlayerHand[1]]);
      } else if (count === 4) {
        setBankerHand([targetBankerHand[0], targetBankerHand[1]]);
        clearInterval(interval);
        
        let odds = 2.0;
        if (selectedSide === "BANKER") odds = 1.95;
        else if (selectedSide === "TIE") odds = 9.0;

        setTimeout(() => {
          setDealt(true);
          if (isTie) {
            setResultMsg("Tie Hand!");
          } else if (isPlayerWinner) {
            setResultMsg("Player Wins!");
          } else {
            setResultMsg("Banker Wins!");
          }
          onCompleteRef.current(won ? odds : 0, won);
        }, 1200);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, selectedSide]);

  const getBaccaratScore = (hand: typeof DECK) => {
    const sum = hand.reduce((acc, c) => {
      const val = c.val;
      if (["10", "J", "Q", "K"].includes(val)) return acc;
      if (val === "A") return acc + 1;
      return acc + (parseInt(val) || 0);
    }, 0);
    return sum % 10;
  };

  const playerScore = getBaccaratScore(playerHand);
  const bankerScore = getBaccaratScore(bankerHand);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 rounded-3xl border border-teal-900 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden perspective-[1000px]">
      
      {/* Hyper-realistic Casino Felt Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_60%)] pointer-events-none" />
      
      {/* Table Border illusion */}
      <div className="absolute inset-4 rounded-[2.5rem] border-2 border-teal-800/50 pointer-events-none" />

      {/* Table Decals */}
      <div className="absolute top-8 text-center opacity-40 select-none">
        <h2 className="text-yellow-500 font-black text-2xl md:text-4xl tracking-[0.3em] uppercase drop-shadow-md">AURA BACCARAT</h2>
        <span className="text-yellow-600 text-[10px] md:text-xs font-bold tracking-[0.5em] mt-1 block">PAYS 9 TO 1 ON TIE</span>
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row gap-8 md:gap-20 justify-center mt-12 px-6 transform-style-3d rotate-x-[15deg]">
        
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

        {/* Banker Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-1 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <span className="text-xs text-red-400 font-black uppercase tracking-widest">Banker</span>
          </div>
          <div className="flex gap-[-20px] min-h-[140px] perspective-[800px]">
            {bankerHand.map((card, idx) => (
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
          {bankerHand.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white font-mono font-black text-xl bg-slate-900/80 border border-slate-700 px-6 py-2 rounded-full shadow-lg backdrop-blur-md">
              {bankerScore}
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected Bet Indicator Overlay during play */}
      {isPlaying && (
        <div className="absolute top-4 left-4 flex items-center bg-black/60 border border-teal-500/30 rounded-full px-4 py-1.5 shadow-lg backdrop-blur-md z-30 select-none">
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">BET ON: {selectedSide}</span>
        </div>
      )}

      {/* Side Selector (Shown when not playing) */}
      {!isPlaying && (
        <div className="mt-8 flex gap-4 z-20">
          <button
            onClick={() => setSelectedSide("PLAYER")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
              selectedSide === "PLAYER"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-blue-500/30"
            }`}
          >
            Player (2x)
          </button>
          <button
            onClick={() => setSelectedSide("BANKER")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
              selectedSide === "BANKER"
                ? "bg-gradient-to-br from-red-550 to-red-650 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-red-500/30"
            }`}
          >
            Banker (1.95x)
          </button>
          <button
            onClick={() => setSelectedSide("TIE")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
              selectedSide === "TIE"
                ? "bg-gradient-to-br from-yellow-500 to-yellow-650 text-yellow-950 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-yellow-500/30"
            }`}
          >
            Tie (9x)
          </button>
        </div>
      )}

      {/* Results HUD Overlay */}
      <AnimatePresence>
        {dealt && resultMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="absolute bottom-10 z-50 px-12 py-4 bg-slate-900/90 border border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] rounded-2xl backdrop-blur-lg"
          >
            <span className={`font-black uppercase tracking-widest text-3xl drop-shadow-md ${
              resultMsg.includes("Player") ? "text-blue-400" :
              resultMsg.includes("Banker") ? "text-red-400" : "text-yellow-400"
            }`}>
              {resultMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
