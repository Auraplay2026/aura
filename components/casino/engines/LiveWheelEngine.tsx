"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface LiveWheelEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

const WHEEL_SECTORS = [
  { val: "1x", mult: 1, color: "bg-gradient-to-b from-blue-400 to-blue-600 text-white", label: "Blue Sector" },
  { val: "2x", mult: 2, color: "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white", label: "Green Sector" },
  { val: "1x", mult: 1, color: "bg-gradient-to-b from-blue-400 to-blue-600 text-white", label: "Blue Sector" },
  { val: "5x", mult: 5, color: "bg-gradient-to-b from-purple-400 to-purple-600 text-white", label: "Purple Sector" },
  { val: "1x", mult: 1, color: "bg-gradient-to-b from-blue-400 to-blue-600 text-white", label: "Blue Sector" },
  { val: "2x", mult: 2, color: "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white", label: "Green Sector" },
  { val: "10x", mult: 10, color: "bg-gradient-to-b from-yellow-300 to-yellow-500 text-slate-900", label: "Gold Sector" },
  { val: "CRAZY", mult: 25, color: "bg-gradient-to-b from-red-500 to-rose-700 text-white font-black", label: "CRAZY TIME" },
  { val: "1x", mult: 1, color: "bg-gradient-to-b from-blue-400 to-blue-600 text-white", label: "Blue Sector" },
  { val: "2x", mult: 2, color: "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white", label: "Green Sector" },
  { val: "5x", mult: 5, color: "bg-gradient-to-b from-purple-400 to-purple-600 text-white", label: "Purple Sector" },
  { val: "2x", mult: 2, color: "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white", label: "Green Sector" }
];

export function LiveWheelEngine({ isPlaying, onComplete }: LiveWheelEngineProps) {
  const [rotation, setRotation] = useState(0);
  const [winningSector, setWinningSector] = useState<typeof WHEEL_SECTORS[0] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerTick, setPointerTick] = useState(0);

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
    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;
    const targetMult = outcome.multiplier;
    
    // Find sectors matching the outcome multiplier
    let matchingSectors = WHEEL_SECTORS.map((s, idx) => ({ s, idx })).filter(x => x.s.mult === targetMult);
    if (matchingSectors.length === 0) {
      matchingSectors = WHEEL_SECTORS.map((s, idx) => ({ s, idx })).sort((a,b) => Math.abs(a.s.mult - targetMult) - Math.abs(b.s.mult - targetMult)).slice(0, 1);
    }
    
    const sectorIdx = won 
      ? matchingSectors[Math.floor(Math.random() * matchingSectors.length)].idx
      : WHEEL_SECTORS.map((s, idx) => ({ s, idx })).filter(x => x.s.mult === 0 || x.s.mult === 1)[Math.floor(Math.random() * 2)].idx;

    const result = WHEEL_SECTORS[sectorIdx];
    const segmentAngle = 360 / WHEEL_SECTORS.length;
    // Rotate wheel with heavy realistic spin (10 spins + exact sector)
    const finalRotation = 3600 + (360 - (sectorIdx * segmentAngle));
    
    setRotation(prev => prev + finalRotation);

    // Simulate pointer ticking physically
    let ticks = 0;
    const tickInterval = setInterval(() => {
      setPointerTick(prev => (prev === 0 ? -15 : 0));
      ticks++;
      if (ticks > 40) clearInterval(tickInterval);
    }, 150); // fast ticking initially

    const timer = setTimeout(() => {
      clearInterval(tickInterval);
      setPointerTick(0);
      setWinningSector(result);
      setIsSpinning(false);
      onCompleteRef.current(result.mult, won);
    }, 6000); // 6 second heavy spin

    return () => {
      clearTimeout(timer);
      clearInterval(tickInterval);
    };
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-[#09090b] rounded-3xl border border-[#27272a] p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl perspective-[1200px]">
      
      {/* Studio Lighting Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.15),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(139,92,246,0.15),_transparent_40%)] pointer-events-none" />
      <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

      <div className="text-center mb-8 z-20">
        <h3 className="text-white font-black text-2xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Live Game Show</h3>
        <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mt-1">Spin the Massive Multiplier Wheel</p>
      </div>

      {/* The Giant 3D Wheel Container */}
      <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center select-none transform-style-3d rotate-x-[15deg]">
        
        {/* Glow behind wheel */}
        <div className="absolute inset-10 bg-yellow-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Thick Outer Rim */}
        <div className="absolute inset-0 rounded-full border-[16px] border-[#fbbf24] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_5px_15px_rgba(0,0,0,0.5)] bg-[#b45309] flex items-center justify-center transform-style-3d">
          <div className="absolute inset-2 rounded-full border-4 border-yellow-300/40 shadow-inner" />
        </div>

        {/* 3D Flapping Pointer */}
        <motion.div 
          animate={{ rotate: pointerTick }}
          transition={{ type: "spring", stiffness: 500, damping: 10 }}
          className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-10 h-14 bg-gradient-to-b from-red-500 to-red-700 border-2 border-white/50 rounded-b-xl shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-40 flex items-center justify-center origin-top"
        >
          <div className="w-3 h-3 bg-white rounded-full shadow-inner" />
        </motion.div>

        {/* Rotating Wheel Base */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 6, ease: [0.1, 0.9, 0.2, 1] }}
          className="absolute inset-[16px] rounded-full overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border-4 border-yellow-600 bg-slate-900"
        >
          {WHEEL_SECTORS.map((sec, i) => {
            const angle = (360 / WHEEL_SECTORS.length) * i;
            return (
              <div
                key={i}
                className="absolute top-0 left-1/2 w-16 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-2 md:pt-4"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                {/* Sector Background color span */}
                <div className={`absolute inset-0 ${sec.color} opacity-90 clip-sector`} style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                
                {/* Label */}
                <div className="relative z-10 flex flex-col items-center justify-start pt-2">
                  <span className={`text-sm md:text-xl font-black font-mono drop-shadow-md ${sec.val === 'CRAZY' ? 'text-[10px] md:text-sm tracking-tighter' : ''}`}>
                    {sec.val}
                  </span>
                </div>

                {/* Pegs on the edge */}
                <div className="absolute top-1 right-0 w-3 h-3 bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.5)] translate-x-1/2 z-20 border border-slate-300" />
              </div>
            );
          })}
        </motion.div>

        {/* Heavy Inner Center Hub */}
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 border-8 border-yellow-200 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center z-30 transform-style-3d">
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-yellow-500/50 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-yellow-500 text-[10px] font-black tracking-widest uppercase drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">LIVE</span>
            <span className="text-white text-sm font-black tracking-tight mt-0.5">WHEEL</span>
          </div>
        </div>
      </div>

      {/* Cinematic Results Overlay */}
      <AnimatePresence>
        {winningSector && !isSpinning && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <span className="text-slate-400 text-sm font-black uppercase tracking-widest mb-4">Winning Segment</span>
            <motion.div 
              initial={{ y: 50 }} animate={{ y: 0 }} transition={{ type: "spring", bounce: 0.5 }}
              className={`px-12 py-8 rounded-3xl ${winningSector.color} border-4 border-white/20 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.5)]`}
            >
              <span className="text-6xl md:text-8xl font-black font-mono drop-shadow-xl">{winningSector.val}</span>
            </motion.div>
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-white font-black text-xl mt-6 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            >
              {winningSector.label} Hit!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
