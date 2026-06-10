"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Crosshair } from "lucide-react";

interface CrashEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function CrashEngine({ isPlaying, onComplete }: CrashEngineProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const [yPos, setYPos] = useState(0); // For rocket trajectory mapping
  const graphRef = useRef<HTMLDivElement>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setMultiplier(1.0);
      setCrashed(false);
      setYPos(0);
      return;
    }

    const willWin = Math.random() < 0.02;
    const target = willWin ? (Math.random() * 5 + 2.0) : (Math.random() * 0.9 + 1.0);

    let current = 1.0;
    const interval = setInterval(() => {
      current += 0.01 + (current * 0.015);
      
      // Calculate Y position for graph (logarithmic curve simulation)
      // Max height approx 60vh
      const maxHeight = (graphRef.current?.clientHeight || 400) * 0.7;
      const height = Math.min(maxHeight, Math.log10(current) * maxHeight * 1.5);
      setYPos(height);
      
      if (current >= target) {
        clearInterval(interval);
        setMultiplier(target);
        setCrashed(true);
        // User wins if target >= 2.0 (simulating auto cashout at 2x)
        const won = target >= 2.0; 
        onCompleteRef.current(target, won);
      } else {
        setMultiplier(current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] bg-[#020205] rounded-3xl border border-slate-800 relative flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_150px_rgba(0,0,0,1)]">
      
      {/* Photorealistic Deep Space Nebula Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: "url('/images/space_background.png')" }}
      />
      
      {/* Tactical Radar Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-30 mix-blend-screen"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Sweeping Radar Scanline */}
      <motion.div 
        animate={{ top: ["-10%", "110%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-emerald-500/10 to-emerald-500/30 border-b border-emerald-500/50 z-0 pointer-events-none"
      />

      {/* Axis Labels */}
      <div className="absolute left-4 top-4 bottom-4 w-12 border-r border-emerald-900/50 flex flex-col justify-between py-10 z-0 opacity-50 font-mono text-[10px] text-emerald-500">
        <span>100x</span>
        <span>50x</span>
        <span>10x</span>
        <span>2x</span>
        <span>1x</span>
      </div>

      {/* Main Multiplier Display */}
      <motion.div 
        animate={crashed ? { scale: [1, 1.1, 1], filter: ["blur(0px)", "blur(10px)", "blur(0px)"] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="z-20 relative flex flex-col items-center"
      >
        <motion.h1 
          className={`text-8xl md:text-[120px] font-black font-mono tracking-tighter drop-shadow-2xl ${crashed ? "text-red-500" : "text-white"}`}
          style={{ textShadow: crashed ? "0 0 40px rgba(239, 68, 68, 0.8)" : "0 0 40px rgba(255, 255, 255, 0.5)" }}
        >
          {multiplier.toFixed(2)}<span className="text-4xl md:text-6xl text-emerald-500 ml-2">x</span>
        </motion.h1>
        
        <div className={`mt-2 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2 ${crashed ? "bg-red-950/50 text-red-500" : "bg-emerald-950/50 text-emerald-400"}`}>
          {crashed ? <AlertTriangle className="w-5 h-5" /> : <Crosshair className="w-5 h-5 animate-spin-slow" />}
          <span className="font-mono text-sm tracking-widest uppercase font-bold">
            {crashed ? "COMMS LOST - CRASHED" : "ORBITAL CLIMB ACTIVE"}
          </span>
        </div>
      </motion.div>

      {/* The Rocket & Trajectory Graph */}
      <div ref={graphRef} className="absolute inset-x-16 inset-y-10 z-10 pointer-events-none">
        
        {/* Trajectory Line (SVG) */}
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <motion.path 
            d={`M 0,${graphRef.current?.clientHeight || 400} Q ${isPlaying ? 200 : 0},${(graphRef.current?.clientHeight || 400) - yPos} ${isPlaying ? 400 : 0},${(graphRef.current?.clientHeight || 400) - yPos}`}
            fill="none" 
            stroke={crashed ? "#ef4444" : "#10b981"} 
            strokeWidth="4" 
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${crashed ? '#ef4444' : '#10b981'})` }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isPlaying ? 1 : 0 }}
            transition={{ duration: 0.1 }}
          />
        </svg>

        {/* The Rocket (SpaceX Style Heavy) */}
        <AnimatePresence>
          {!crashed && isPlaying && (
            <motion.div 
              className="absolute w-20 h-40 -ml-10 -mt-20"
              initial={{ left: 0, bottom: 0 }}
              animate={{ left: "400px", bottom: `${yPos}px`, rotate: 45 }}
              transition={{ ease: "linear", duration: 0.1 }}
            >
              <motion.div animate={{ y: [-2, 2, -2], x: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 0.05 }} className="w-full h-full relative">
                {/* Heavy Booster SVG */}
                <svg viewBox="0 0 100 200" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  <path d="M50,10 C50,10 70,50 70,120 L30,120 C30,50 50,10 50,10 Z" fill="#e2e8f0" />
                  <path d="M50,10 C50,10 60,50 60,120 L40,120 C40,50 50,10 50,10 Z" fill="#cbd5e1" />
                  {/* Fins */}
                  <path d="M70,100 L90,140 L70,120 Z" fill="#94a3b8" />
                  <path d="M30,100 L10,140 L30,120 Z" fill="#94a3b8" />
                  {/* Engine Nozzle */}
                  <rect x="40" y="120" width="20" height="10" fill="#334155" />
                  <rect x="35" y="130" width="30" height="15" fill="#1e293b" />
                </svg>

                {/* Fire Plume Particle Emitters */}
                <motion.div 
                  className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-8 h-24 bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 rounded-full blur-md opacity-80"
                  animate={{ scaleY: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.1 }}
                />
                <motion.div 
                  className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-4 h-12 bg-white rounded-full blur-sm"
                  animate={{ scaleY: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.05 }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Explosion on Crash */}
        <AnimatePresence>
          {crashed && (
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 3, 4], opacity: [1, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute w-64 h-64 -ml-32 -mb-32 rounded-full mix-blend-screen"
              style={{ left: "400px", bottom: `${yPos}px`, background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(239,68,68,1) 30%, rgba(0,0,0,0) 70%)" }}
            />
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
