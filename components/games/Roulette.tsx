"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Roulette() {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

  const handleSpin = () => {
    if (isSpinning || !selectedBet) return;
    setIsSpinning(true);
    setResult(null);

    setTimeout(() => {
      const willWin = Math.random() < 0.02;
      let outcome = 0;
      let attempts = 0;
      
      do {
        outcome = Math.floor(Math.random() * 37);
        attempts++;
        
        let isHit = false;
        if (selectedBet === "red") isHit = RED_NUMBERS.includes(outcome);
        else if (selectedBet === "black") isHit = BLACK_NUMBERS.includes(outcome);
        else if (selectedBet === "even") isHit = (outcome !== 0 && outcome % 2 === 0);
        else if (selectedBet === "odd") isHit = (outcome !== 0 && outcome % 2 !== 0);
        else if (selectedBet === "1-18") isHit = (outcome >= 1 && outcome <= 18);
        else if (selectedBet === "19-36") isHit = (outcome >= 19 && outcome <= 36);
        else if (selectedBet !== null) isHit = (parseInt(selectedBet) === outcome);
        
        if (willWin === isHit) break;
      } while (attempts < 200);

      setResult(outcome);
      setIsSpinning(false);
    }, 3000);
  };

  const getMultiplier = () => {
    if (result === null || !selectedBet) return 0;
    
    if (selectedBet === "red") return RED_NUMBERS.includes(result) ? 2 : 0;
    if (selectedBet === "black") return BLACK_NUMBERS.includes(result) ? 2 : 0;
    if (selectedBet === "even") return (result !== 0 && result % 2 === 0) ? 2 : 0;
    if (selectedBet === "odd") return (result !== 0 && result % 2 !== 0) ? 2 : 0;
    if (selectedBet === "1-18") return (result >= 1 && result <= 18) ? 2 : 0;
    if (selectedBet === "19-36") return (result >= 19 && result <= 36) ? 2 : 0;
    
    // Straight up number
    if (parseInt(selectedBet) === result) return 36;
    
    return 0;
  };

  const multiplier = getMultiplier();
  const payout = (betAmount * multiplier).toFixed(2);

  const getNumberColor = (num: number) => {
    if (num === 0) return "bg-green-500";
    if (RED_NUMBERS.includes(num)) return "bg-red-500";
    return "bg-slate-900";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[600px] bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-900/50 p-6 flex flex-col gap-6 border-r border-slate-800 shrink-0 overflow-y-auto custom-scrollbar">
        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1">
            <input 
              type="number" 
              value={betAmount} 
              disabled={isSpinning}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={isSpinning} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-800 mx-1"></div>
            <button disabled={isSpinning} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 block">Outside Bets (2x)</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => setSelectedBet("red")} disabled={isSpinning} className={`py-2 rounded bg-red-500/20 text-red-500 font-bold border ${selectedBet === "red" ? "border-red-500" : "border-transparent"}`}>Red</button>
            <button onClick={() => setSelectedBet("black")} disabled={isSpinning} className={`py-2 rounded bg-slate-800 text-slate-300 font-bold border ${selectedBet === "black" ? "border-slate-400" : "border-transparent"}`}>Black</button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => setSelectedBet("even")} disabled={isSpinning} className={`py-2 rounded bg-slate-950 text-slate-300 font-bold border ${selectedBet === "even" ? "border-slate-500" : "border-slate-800"}`}>Even</button>
            <button onClick={() => setSelectedBet("odd")} disabled={isSpinning} className={`py-2 rounded bg-slate-950 text-slate-300 font-bold border ${selectedBet === "odd" ? "border-slate-500" : "border-slate-800"}`}>Odd</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSelectedBet("1-18")} disabled={isSpinning} className={`py-2 rounded bg-slate-950 text-slate-300 font-bold border ${selectedBet === "1-18" ? "border-slate-500" : "border-slate-800"}`}>1 to 18</button>
            <button onClick={() => setSelectedBet("19-36")} disabled={isSpinning} className={`py-2 rounded bg-slate-950 text-slate-300 font-bold border ${selectedBet === "19-36" ? "border-slate-500" : "border-slate-800"}`}>19 to 36</button>
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleSpin}
            disabled={isSpinning || !selectedBet}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg ${
              isSpinning ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
              !selectedBet ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
              "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {isSpinning ? "Spinning..." : "Spin Wheel"}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-slate-950 overflow-hidden">
        
        {/* Simple Roulette Wheel Animation */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-4 h-6 bg-white" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}></div>
          <motion.div
            animate={{ rotate: isSpinning ? 360 * 5 : 0 }}
            transition={{ duration: 3, ease: "circOut" }}
            className="w-full h-full rounded-full border-[12px] border-slate-800 bg-[conic-gradient(red_0deg,red_180deg,black_180deg,black_360deg)] relative shadow-2xl"
          >
            {/* Inner Hub */}
            <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="font-black text-4xl text-slate-700">R</span>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {result !== null && !isSpinning && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`absolute top-10 px-8 py-3 rounded-full font-black text-xl z-20 border shadow-2xl flex items-center gap-4 ${
                multiplier > 0 ? "bg-green-500/20 text-neon-green border-green-500/50" : "bg-red-500/20 text-red-500 border-red-500/50"
              }`}
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center text-white ${getNumberColor(result)}`}>
                {result}
              </div>
              {multiplier > 0 ? `${multiplier}x Win! (₹${payout})` : "Lost"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board */}
        <div className="w-full max-w-lg mt-4 flex select-none">
          {/* Zero */}
          <div 
            onClick={() => { if(!isSpinning) setSelectedBet("0"); }}
            className={`w-12 border border-slate-800 flex items-center justify-center font-bold cursor-pointer transition-colors ${
              selectedBet === "0" ? "border-green-400 bg-green-500/50 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] z-10" : "bg-green-600 text-white hover:bg-green-500"
            }`}
          >
            0
          </div>
          
          <div className="flex-1 grid grid-cols-12 gap-[1px] bg-slate-800 p-[1px]">
            {Array.from({ length: 36 }).map((_, i) => {
              const num = i + 1;
              const isSelected = selectedBet === num.toString();
              return (
                <div 
                  key={num}
                  onClick={() => { if(!isSpinning) setSelectedBet(num.toString()); }}
                  className={`h-10 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10 scale-110 rounded" :
                    RED_NUMBERS.includes(num) ? "bg-red-600 text-white hover:bg-red-500" : "bg-slate-900 text-white hover:bg-slate-700"
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
