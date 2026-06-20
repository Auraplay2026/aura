"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, TrendingUp, Volume2, VolumeX, Shield, Award, Sparkles, RefreshCw, Trophy, AlertTriangle, Layers, Calendar, ChevronRight } from "lucide-react";
import { useTradingStore } from "@/lib/store";

interface LimboEngineProps {
  isPlaying: boolean;
  betAmount: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

interface WarpLine {
  x: number;
  y: number;
  z: number; // depth
  color: string;
  speed: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export function LimboEngine({ isPlaying, betAmount, onComplete }: LimboEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [targetMultiplier, setTargetMultiplier] = useState(2.00);
  const [liveCounter, setLiveCounter] = useState(1.00);
  const [result, setResult] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "charging" | "counting" | "reveal">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [winChance, setWinChance] = useState("49.50");

  // VIP & Achievement States (Behavioral Retention System)
  const [winsCount, setWinsCount] = useState(14);
  const [streak, setStreak] = useState(3);
  const [dailyProgress, setDailyProgress] = useState(65); // 65% complete

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";

  const onCompleteRef = useRef(onComplete);
  const phaseRef = useRef(phase);
  const liveCounterRef = useRef(liveCounter);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    liveCounterRef.current = liveCounter;
  }, [liveCounter]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: "charge" | "reveal_win" | "reveal_lose" | "counting") => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === "charge") {
        // Tension generator: Ramping pitch up
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.65);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === "counting") {
        // High click pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
      } else if (type === "reveal_win") {
        // Major Arpeggio Chord
        const freqs = [329.63, 392.00, 523.25, 659.25, 783.99];
        freqs.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + idx * 0.06);
          g.gain.setValueAtTime(0.1, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
          o.start(now + idx * 0.06);
          o.stop(now + idx * 0.06 + 0.35);
        });
      } else if (type === "reveal_lose") {
        // low impact boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Synth playback failed", e);
    }
  }, [isMuted]);

  // Handle Win Chance display
  useEffect(() => {
    const chance = targetMultiplier <= 1 ? "99.00" : (99 / targetMultiplier).toFixed(2);
    setWinChance(chance);
  }, [targetMultiplier]);

  // Play Bet Logic
  useEffect(() => {
    if (!isPlaying) {
      setLiveCounter(1.00);
      setResult(null);
      setPhase("idle");
      return;
    }

    // Phase 1: Charging Build-up (650ms)
    setPhase("charging");
    setLiveCounter(1.00);
    setResult(null);
    playSound("charge");

    let active = true;
    let interval: any = null;

    const executeBet = async () => {
      // Wait for charging animation
      await new Promise(r => setTimeout(r, 650));
      if (!active) return;

      setPhase("counting");

      try {
        const currentUser = useTradingStore.getState().currentUser;
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser?.email || "admin@aurabet.io",
            gameId: "orig-2",
            gameTitle: "Limbo",
            betAmount: betAmount,
            targetMultiplier: targetMultiplier
          })
        });
        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          const finalResult = parseFloat(data.multiplier.toFixed(2));
          let current = 1.00;
          const step = (finalResult - 1.00) / 25; // 25 intervals

          interval = setInterval(() => {
            current = Math.min(current + step + (current * 0.06), finalResult);
            setLiveCounter(parseFloat(current.toFixed(2)));
            playSound("counting");

            if (current >= finalResult) {
              clearInterval(interval);
              setResult(finalResult);
              setPhase("reveal");
              const won = finalResult >= targetMultiplier;
              playSound(won ? "reveal_win" : "reveal_lose");

              if (won) {
                setWinsCount(prev => prev + 1);
                setStreak(prev => prev + 1);
                setDailyProgress(prev => Math.min(100, prev + 5));
              } else {
                setStreak(0);
              }

              setTimeout(() => {
                if (active) {
                  onCompleteRef.current(won ? finalResult : 0, won);
                }
              }, 1200);
            }
          }, 45);
        } else {
          setPhase("idle");
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Limbo bet placement failed", err);
        setPhase("idle");
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, targetMultiplier, betAmount, playSound]);

  const isWin = result !== null && result >= targetMultiplier;

  // Canvas Warp Tunnel & Particle System Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Warp Tunnel parameters
    const warpLines: WarpLine[] = [];
    const maxWarpLines = 65;
    for (let i = 0; i < maxWarpLines; i++) {
      warpLines.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        color: `hsl(${190 + Math.random() * 30}, 80%, 60%)`,
        speed: 8 + Math.random() * 6
      });
    }

    // Spark particles on Win
    const sparks: Spark[] = [];
    const spawnSparks = (x: number, y: number, color: string, count = 20) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          color,
          alpha: 1.0
        });
      }
    };

    let ringPulse = 0;
    let shockwaveRad = 0;

    const render = () => {
      // 1. Draw Space Dark Background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Deep center nebula glow depending on phase
      const centerX = width / 2;
      const centerY = height / 2;

      const radialGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width * 0.5);
      if (phaseRef.current === "reveal" && isWin) {
        radialGrad.addColorStop(0, "rgba(16, 185, 129, 0.25)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      } else if (phaseRef.current === "reveal" && !isWin) {
        radialGrad.addColorStop(0, "rgba(239, 68, 68, 0.25)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      } else if (phaseRef.current === "counting") {
        radialGrad.addColorStop(0, "rgba(59, 130, 246, 0.2)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      } else {
        radialGrad.addColorStop(0, "rgba(99, 102, 241, 0.1)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      }
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Grid floor projection
      ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo((x - centerX) * 1.5 + centerX, height);
        ctx.stroke();
      }

      // 2. Warp Lines logic
      let tunnelSpeed = 2.0;
      if (phaseRef.current === "charging") tunnelSpeed = 8.0;
      else if (phaseRef.current === "counting") tunnelSpeed = 24.0 + (liveCounterRef.current * 1.2);
      else if (phaseRef.current === "reveal") tunnelSpeed = 0.5;

      warpLines.forEach(line => {
        // Move depth closer to screen
        line.z -= line.speed * (tunnelSpeed * 0.12);

        // Reset if lines pass screen viewport
        if (line.z <= 0) {
          line.z = width;
          line.x = Math.random() * width - width / 2;
          line.y = Math.random() * height - height / 2;
        }

        // Project coordinate math to 3D depth perspective
        const k = width / line.z;
        const px = line.x * k + centerX;
        const py = line.y * k + centerY;

        // Tail calculation
        const tailK = width / (line.z + line.speed * 2);
        const tx = line.x * tailK + centerX;
        const ty = line.y * tailK + centerY;

        // Fade based on depth
        const alpha = Math.min(1, (width - line.z) / (width * 0.5));

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = phaseRef.current === "reveal" && isWin ? "#34d399" : 
                          phaseRef.current === "reveal" ? "#f87171" : line.color;
        ctx.lineWidth = Math.max(1, k * 0.8);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;

      // 3. Draw energy ripples/shockwave
      if (phaseRef.current === "reveal") {
        shockwaveRad += 8;
        if (shockwaveRad < width * 0.8) {
          ctx.strokeStyle = isWin ? `rgba(52, 211, 153, ${1 - shockwaveRad / (width * 0.8)})` : `rgba(239, 68, 68, ${1 - shockwaveRad / (width * 0.8)})`;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 15;
          ctx.shadowColor = isWin ? "#10b981" : "#ef4444";
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      } else {
        shockwaveRad = 0;
      }

      // Charging pulse ring animation
      if (phaseRef.current === "charging") {
        ringPulse += 4;
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (ringPulse % 120) + 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Update and Draw spark particles on win screen
      if (phaseRef.current === "reveal" && isWin && sparks.length === 0) {
        spawnSparks(centerX, centerY, "#34d399", 35);
        spawnSparks(centerX, centerY, "#fbbf24", 15);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.02;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isWin]);

  return (
    <div className="w-full h-full min-h-[450px] md:min-h-[600px] flex flex-col md:flex-row gap-6 relative p-4 md:p-6 rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 shadow-[0_4px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
      
      {/* 1. AAA HUD Sidebar Panel (Stats, Live, achievement progression) */}
      <div className="hidden md:flex w-full md:w-80 flex-col gap-4 z-20 shrink-0">
        
        {/* VIP Player Stats Card */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center p-0.5 shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-xs text-cyan-600 font-mono">
                VIP
              </div>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Profile</p>
              <p className="text-xs text-slate-900 font-black truncate max-w-[130px]">{email.split("@")[0]}</p>
            </div>
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-2 py-1 text-center shrink-0">
            <span className="text-[10px] text-cyan-600 font-black font-mono">GOLD III</span>
          </div>
        </div>

        {/* Live Session stats */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200 p-4 rounded-2xl grid grid-cols-2 gap-3 shadow-sm">
          <div className="text-left">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Session Wins</span>
            <span className="text-lg font-black font-mono text-emerald-600">{winsCount}</span>
          </div>
          <div className="text-left border-l border-slate-200 pl-3">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Current Streak</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className={`w-3.5 h-3.5 ${streak > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-lg font-black font-mono text-slate-900">{streak}</span>
            </div>
          </div>
        </div>

        {/* Gamified Achievement/Missions Progression (Psychological Retention Loop) */}
        <div className="bg-white/60 backdrop-blur-md border border-slate-200 p-4 rounded-2xl text-left relative overflow-hidden shadow-sm flex-grow flex flex-col justify-between min-h-[140px] md:min-h-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Daily Missions
              </span>
              <span className="text-[10px] font-mono font-black text-cyan-600">{dailyProgress}%</span>
            </div>
            <p className="text-xs text-slate-600 font-bold mb-3 leading-normal">
              Roll a <span className="text-amber-600">10x+ multiplier</span> or higher today to unlock premium bonus loot!
            </p>
          </div>

          <div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner mb-3">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
            <button className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-98 transition-all shadow-sm">
              Claim Milestone Rewards <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. Main Game Viewport with Canvas tunnel & giant multiplier engine */}
      <div className="flex-grow relative rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between p-4 md:p-6 min-h-[380px] md:min-h-[500px]">
        
        {/* Canvas background rendering */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none block z-0"
        />

        {/* Top bar wagers controls details */}
        <div className="w-full z-10 flex items-center justify-between">
          
          {/* Target input multiplier badge */}
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2.5 shadow-md">
            <Target className="w-4 h-4 text-cyan-500" />
            <div className="text-left">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">TARGET</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                  disabled={isPlaying}
                  className="w-16 bg-transparent border-0 font-black font-mono text-sm text-slate-900 focus:outline-none focus:ring-0 p-0 disabled:opacity-40"
                />
                <span className="text-xs font-bold text-slate-500">x</span>
              </div>
            </div>
          </div>

          {/* Win probability odds indicator */}
          <div className="flex items-center gap-2 bg-white/70 border border-slate-200 rounded-2xl px-4 py-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">CHANCE</span>
            <span className="text-sm font-black font-mono text-emerald-600">{winChance}%</span>
          </div>

          {/* Stake readout */}
          <div className="flex items-center gap-2 bg-white/70 border border-slate-200 rounded-2xl px-4 py-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Wager</span>
            <span className="text-sm font-black font-mono text-amber-600">₹{betAmount}</span>
          </div>

        </div>

        {/* Giant Multiplier Engine (Hero Element) */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center flex-grow py-8 select-none">
          
          {/* Subtle glow behind multiplier */}
          <div className={`absolute w-44 h-44 rounded-full blur-[80px] transition-colors duration-500 pointer-events-none ${
            phase === "reveal" && isWin ? "bg-emerald-500/25" :
            phase === "reveal" ? "bg-red-500/20" :
            phase === "counting" ? "bg-cyan-500/15" : "bg-transparent"
          }`} />

          <motion.div
            key={`${phase}-${result}`}
            animate={
              phase === "reveal"
                ? isWin
                  ? { scale: [1, 1.22, 1], filter: ["blur(0px)", "blur(1px)", "blur(0px)"] }
                  : { scale: [1, 0.94, 1] }
                : phase === "counting"
                  ? { scale: [1, 1.04, 1] }
                  : {}
            }
            transition={{
              scale: { repeat: phase === "counting" ? Infinity : 0, duration: 0.4 },
              default: { duration: 0.5, type: "spring", stiffness: 140 }
            }}
            className={`text-6xl md:text-[7.5rem] lg:text-[9.5rem] font-black font-mono tabular-nums tracking-tighter leading-none transition-colors duration-300 flex items-baseline select-none ${
              phase === "idle" ? "text-slate-800" :
              phase === "charging" ? "text-slate-400 animate-pulse" :
              phase === "counting" ? "text-slate-900 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]" :
              isWin ? "text-emerald-400 drop-shadow-[0_0_35px_rgba(52,211,153,0.7)]" : "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.7)]"
            }`}
          >
            {(phase === "idle" ? 1.00 : liveCounter).toFixed(2)}
            <span className={`text-2xl md:text-5xl ml-1.5 font-black ${
              phase === "idle" ? "text-slate-800" :
              phase === "charging" ? "text-slate-500" :
              phase === "counting" ? "text-cyan-500" :
              isWin ? "text-emerald-500" : "text-red-700"
            }`}>x</span>
          </motion.div>

          {/* Quick Target Multiplier Preset Badges */}
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-6"
            >
              {[1.5, 2.0, 5.0, 10.0, 100.0].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTargetMultiplier(preset)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-black font-mono transition-all ${
                    targetMultiplier === preset
                      ? "bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {preset.toFixed(1)}x
                </button>
              ))}
            </motion.div>
          )}

          {/* Anticipation / Outcome message badges */}
          <AnimatePresence>
            {phase === "reveal" && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.85 }}
                className="absolute -bottom-2 flex items-center justify-center gap-4 w-full"
              >
                <div className={`h-[1px] flex-grow max-w-[80px] bg-gradient-to-r ${isWin ? 'from-transparent to-emerald-500' : 'from-transparent to-red-500'}`} />
                <span className={`text-xs font-black uppercase tracking-widest px-5 py-2 rounded-xl border bg-white backdrop-blur-md shadow-2xl ${
                  isWin ? "text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.25)]" : "text-red-500 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                }`}>
                  {isWin ? `TARGET SMASHED` : `CRASHED BELOW TARGET`}
                </span>
                <div className={`h-[1px] flex-grow max-w-[80px] bg-gradient-to-l ${isWin ? 'from-transparent to-emerald-500' : 'from-transparent to-red-500'}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom controls or sound mute wrapper */}
        <div className="w-full z-10 flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
          
          {/* Quick status message */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {phase === "idle" ? "READY TO CHARGE" : 
               phase === "charging" ? "POWER CHARGING" : 
               phase === "counting" ? "VELOCITY WARP" : "ROUND END"}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </div>
  );
}
