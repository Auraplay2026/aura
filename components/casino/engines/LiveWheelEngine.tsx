"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveWheelEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

const WHEEL_SECTORS = [
  { val: "1x", mult: 1, color: "bg-blue-500", label: "Blue Sector" },
  { val: "2x", mult: 2, color: "bg-green-500", label: "Green Sector" },
  { val: "1x", mult: 1, color: "bg-blue-500", label: "Blue Sector" },
  { val: "5x", mult: 5, color: "bg-purple-500", label: "Purple Sector" },
  { val: "1x", mult: 1, color: "bg-blue-500", label: "Blue Sector" },
  { val: "2x", mult: 2, color: "bg-green-500", label: "Green Sector" },
  { val: "10x", mult: 10, color: "bg-yellow-500", label: "Gold Sector" },
  { val: "CRAZY", mult: 25, color: "bg-red-500 animate-pulse", label: "CRAZY TIME" },
  { val: "1x", mult: 1, color: "bg-blue-500", label: "Blue Sector" },
  { val: "2x", mult: 2, color: "bg-green-500", label: "Green Sector" },
  { val: "5x", mult: 5, color: "bg-purple-500", label: "Purple Sector" },
  { val: "2x", mult: 2, color: "bg-green-500", label: "Green Sector" }
];

export function LiveWheelEngine({ isPlaying, onComplete }: LiveWheelEngineProps) {
  const [rotation, setRotation] = useState(0);
  const [winningSector, setWinningSector] = useState<typeof WHEEL_SECTORS[0] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setIsSpinning(false);
      setWinningSector(null);
      return;
    }

    setIsSpinning(true);
    const won = Math.random() < 0.40; // 40% win rate
    const sectorIdx = won
      ? Math.floor(Math.random() * (WHEEL_SECTORS.length - 1)) // Win most sectors
      : Math.floor(Math.random() * WHEEL_SECTORS.length);

    const result = WHEEL_SECTORS[sectorIdx];
    const segmentAngle = 360 / WHEEL_SECTORS.length;
    // Rotate wheel
    const finalRotation = 1800 + (360 - (sectorIdx * segmentAngle));
    setRotation(finalRotation);

    const timer = setTimeout(() => {
      setWinningSector(result);
      setIsSpinning(false);
      onCompleteRef.current(result.mult, won);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-purple-950 via-slate-900 to-black rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      
      <div className="text-center mb-6 z-10">
        <h3 className="text-slate-900 font-black text-xl uppercase tracking-widest animate-pulse">Aura Live Game Show</h3>
        <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mt-1">Spin the Giant Multiplier Wheel</p>
      </div>

      {/* The Giant Wheel Container */}
      <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-yellow-500 bg-white flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.4)] select-none">
        
        {/* Pointer indicator */}
        <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-6 h-8 bg-red-500 border-2 border-white rounded-b-lg shadow-lg z-30 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>

        {/* Rotating sectors */}
        <motion.div
          animate={isSpinning ? { rotate: rotation } : { rotate: rotation % 360 }}
          transition={{ duration: 4, ease: "easeOut" }}
          className="w-full h-full rounded-full relative overflow-hidden"
        >
          {WHEEL_SECTORS.map((sec, i) => {
            const angle = (360 / WHEEL_SECTORS.length) * i;
            return (
              <div
                key={i}
                className="absolute top-0 left-1/2 w-12 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-4 text-slate-900 text-[10px] font-black font-mono"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div className={`w-8 h-8 rounded-full ${sec.color} flex items-center justify-center shadow-lg border border-white/20`}>
                  {sec.val}
                </div>
                <div className="w-0.5 h-12 bg-slate-900/10 mt-2" />
              </div>
            );
          })}
        </motion.div>

        {/* Inner Hub */}
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-amber-600 to-yellow-500 border-4 border-yellow-300 shadow-2xl flex items-center justify-center z-20">
          <div className="w-20 h-20 rounded-full bg-white border border-yellow-600/30 flex flex-col items-center justify-center text-center">
            <span className="text-yellow-500 text-[9px] font-black tracking-widest uppercase">LIVE</span>
            <span className="text-slate-900 text-xs font-black tracking-tight mt-0.5">WHEEL</span>
          </div>
        </div>
      </div>

      {/* Results overlay */}
      <AnimatePresence>
        {winningSector && !isSpinning && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 bg-white/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center"
          >
            <span className="text-slate-600 text-xs font-black uppercase tracking-widest mb-2">Winning Segment</span>
            <div className={`px-8 py-6 rounded-3xl ${winningSector.color} border-4 border-white/20 flex flex-col items-center justify-center shadow-2xl`}>
              <span className="text-slate-900 text-5xl font-black font-mono">{winningSector.val}</span>
            </div>
            <span className="text-slate-900 font-bold text-sm mt-3 uppercase tracking-wider">{winningSector.label} Hit!</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
