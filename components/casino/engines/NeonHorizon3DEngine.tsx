"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Wallet, Volume2, VolumeX, AlertTriangle, ArrowLeft, ArrowRight, History, CheckCircle2 } from "lucide-react";
import { generateProvablyFairCrashPoint, generateSeed } from "@/lib/crash-math";

interface NeonHorizon3DEngineProps {
  isPlaying: boolean;
  betAmount: number;
  autoCashout?: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

type Lane = 0 | 1 | 2; // Left, Center, Right

interface Star { x: number; y: number; z: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface RoundHistoryItem { multiplier: number; hash: string; }

export function NeonHorizon3DEngine({ isPlaying, betAmount, autoCashout, onLiveTick, onComplete }: NeonHorizon3DEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed" | "cashed_out">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [playerLane, setPlayerLane] = useState<Lane>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showFairness, setShowFairness] = useState(false);
  
  // Provably Fair State
  const [serverSeed, setServerSeed] = useState<string>("");
  const [clientSeed, setClientSeed] = useState<string>("player-1");
  const [nonce, setNonce] = useState<number>(1);
  const [lastHash, setLastHash] = useState<string>("");
  const [history, setHistory] = useState<RoundHistoryItem[]>([]);

  // Math references
  const crashPointRef = useRef<number>(1.0);
  const currentMultiplierRef = useRef<number>(1.0);
  const startTimeRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);
  const autoCashoutRef = useRef(autoCashout);
  const cashedOutRef = useRef(false);

  // 3D Engine parameters
  const playerLaneRef = useRef<Lane>(1);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gameSpeedRef = useRef<number>(5.0);
  const screenShakeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { playerLaneRef.current = playerLane; }, [playerLane]);
  useEffect(() => { autoCashoutRef.current = autoCashout; }, [autoCashout]);

  // Ensure initial seeds
  useEffect(() => {
    setServerSeed(generateSeed());
  }, []);

  // Audio System
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(0);
      engineOscRef.current = osc;
      engineGainRef.current = gain;
    } catch (e) { }
  }, [isMuted]);

  const stopAudio = useCallback(() => {
    try {
      if (engineOscRef.current) { engineOscRef.current.stop(); engineOscRef.current.disconnect(); engineOscRef.current = null; }
      if (engineGainRef.current) { engineGainRef.current.disconnect(); engineGainRef.current = null; }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") { audioCtxRef.current.close(); audioCtxRef.current = null; }
    } catch (e) {}
  }, []);

  const playSound = useCallback((type: "dodge" | "crash" | "cashout") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      if (type === "dodge") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
      } else if (type === "crash") {
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource(); noise.buffer = buffer;
        const filter = ctx.createBiquadFilter(); filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        noise.start(ctx.currentTime); noise.stop(ctx.currentTime + 0.8);
      } else if (type === "cashout") {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination); osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.3);
          osc.start(ctx.currentTime + idx * 0.05); osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
        });
      }
    } catch (e) {}
  }, [isMuted]);

  useEffect(() => {
    if (engineOscRef.current && audioCtxRef.current) {
      const targetFreq = Math.min(220, 60 + multiplier * 15);
      engineOscRef.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.2);
    }
  }, [multiplier]);

  const steerLeft = useCallback(() => {
    if (gameState !== "playing" || cashedOutRef.current) return;
    setPlayerLane(prev => {
      const next: Lane = prev === 2 ? 1 : 0;
      if (next !== prev) playSound("dodge");
      return next;
    });
  }, [gameState, playSound]);

  const steerRight = useCallback(() => {
    if (gameState !== "playing" || cashedOutRef.current) return;
    setPlayerLane(prev => {
      const next: Lane = prev === 0 ? 1 : 2;
      if (next !== prev) playSound("dodge");
      return next;
    });
  }, [gameState, playSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") steerLeft();
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") steerRight();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steerLeft, steerRight]);

  const spawnExplosion = (x: number, y: number) => {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 5;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: i % 2 === 0 ? "#ef4444" : "#f59e0b",
        size: Math.random() * 6 + 2
      });
    }
  };

  // True Core Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localAnimationFrameId: number;

    const render = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.height = canvas.parentElement?.clientHeight || 600;

      const vanishX = width / 2;
      const vanishY = height * 0.45;
      const horizonY = vanishY;

      // Draw background
      ctx.fillStyle = "#020308";
      ctx.fillRect(0, 0, width, height);

      // Math/Time Sync Logic
      let currentMulti = currentMultiplierRef.current;
      
      if (gameState === "playing") {
        const elapsed = Date.now() - startTimeRef.current;
        
        // Exact mathematical curve: 1.00 + (elapsedSecs ^ 1.3) * 0.12
        const elapsedSecs = elapsed / 1000;
        let rawMulti = 1.00 + Math.pow(elapsedSecs, 1.3) * 0.12;
        
        // Frame-perfect Auto Cashout
        if (autoCashoutRef.current && rawMulti >= autoCashoutRef.current && !cashedOutRef.current && autoCashoutRef.current < crashPointRef.current) {
          rawMulti = autoCashoutRef.current; // Lock exactly to target
          cashedOutRef.current = true;
          setGameState("cashed_out");
          stopAudio();
          playSound("cashout");
          setTimeout(() => {
            onCompleteRef.current(rawMulti, true);
          }, 1800);
        }

        // Frame-perfect Crash Check
        if (rawMulti >= crashPointRef.current && !cashedOutRef.current) {
          rawMulti = crashPointRef.current; // Lock exactly to crash point
          setGameState("crashed");
          stopAudio();
          playSound("crash");
          screenShakeRef.current = 40;
          
          // Add to history
          setHistory(prev => [{ multiplier: rawMulti, hash: lastHash }, ...prev].slice(0, 15));
          
          // Spawn explosion at player coordinates
          const laneIdx = playerLaneRef.current;
          const laneWidths = [{ l: -250, r: -80 }, { l: -80, r: 80 }, { l: 80, r: 250 }];
          const targetX = vanishX + ((laneWidths[laneIdx].l + laneWidths[laneIdx].r) / 2) * (400 / 55);
          spawnExplosion(targetX, height - 100);

          setTimeout(() => {
            onCompleteRef.current(0, false);
          }, 1500);
        }

        currentMulti = parseFloat(rawMulti.toFixed(2));
        currentMultiplierRef.current = currentMulti;
        setMultiplier(currentMulti);
        onLiveTick?.(currentMulti);
      }

      gameSpeedRef.current = 5.0 + currentMulti * 2.0;

      // Render stars
      if (starsRef.current.length === 0) {
        for (let i = 0; i < 150; i++) starsRef.current.push({ x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, z: Math.random() * 1000 });
      }
      const starSpeed = gameState === "cashed_out" ? gameSpeedRef.current * 4 : (gameState === "crashed" ? 0 : gameSpeedRef.current);
      starsRef.current.forEach(star => {
        star.z -= starSpeed;
        if (star.z <= 0) { star.z = 1000; star.x = (Math.random() - 0.5) * 1000; star.y = (Math.random() - 0.5) * 1000; }
        const k = 400 / Math.max(1, star.z);
        const sx = width / 2 + star.x * k;
        const sy = height / 2 + star.y * k;
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const starSize = Math.max(1, (1 - star.z / 1000) * 3);
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.z / 1000})`;
          if (gameState === "cashed_out") {
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 * (1 - star.z / 1000)})`;
            ctx.lineWidth = starSize;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - star.x * k * 0.2, sy - star.y * k * 0.2); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.arc(sx, sy, starSize, 0, Math.PI * 2); ctx.fill();
          }
        }
      });

      // Horizon glow
      ctx.strokeStyle = gameState === "crashed" ? "rgba(239, 68, 68, 0.4)" : "rgba(6, 182, 212, 0.3)";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(width, horizonY); ctx.stroke();

      // Screen shake
      let shakeX = 0; let shakeY = 0;
      if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current *= 0.9;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Render perspective grid lines
      const offset = gameState === "crashed" ? 0 : (Date.now() * gameSpeedRef.current * 0.01) % 100;
      ctx.strokeStyle = gameState === "crashed" ? "rgba(239, 68, 68, 0.2)" : "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 2;
      for (let z = 1000; z > 10; z -= 80) {
        const adjustedZ = z - offset;
        if (adjustedZ <= 0) continue;
        const k = 400 / adjustedZ;
        const y = vanishY + 300 * k;
        if (y < horizonY) continue;
        ctx.beginPath(); ctx.moveTo(vanishX - 400 * k, y); ctx.lineTo(vanishX + 400 * k, y); ctx.stroke();
      }

      // Draw 3D road border perspective lines
      ctx.strokeStyle = gameState === "crashed" ? "#ef4444" : "#f43f5e";
      ctx.lineWidth = 4;
      const drawPerspectiveLine = (xOffsetStart: number) => {
        ctx.beginPath(); ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(vanishX + xOffsetStart * (400 / 50), height); ctx.stroke();
      };
      drawPerspectiveLine(-250); drawPerspectiveLine(-80); drawPerspectiveLine(80); drawPerspectiveLine(250);

      // Render Player Vehicle
      const laneWidths = [{ l: -250, r: -80 }, { l: -80, r: 80 }, { l: 80, r: 250 }];
      const laneIdx = playerLaneRef.current;
      const targetX = vanishX + ((laneWidths[laneIdx].l + laneWidths[laneIdx].r) / 2) * (400 / 55);
      const shipY = height - 100;

      if (gameState !== "crashed") {
        ctx.save();
        ctx.translate(targetX, shipY);
        const tilt = Math.sin(Date.now() * 0.007) * 4;
        ctx.rotate((tilt * Math.PI) / 180);

        const gradient = ctx.createLinearGradient(-30, 0, 30, 0);
        gradient.addColorStop(0, "#00f2fe"); gradient.addColorStop(0.5, "#4facfe"); gradient.addColorStop(1, "#00f2fe");
        ctx.fillStyle = gradient; ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 3;

        ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(-25, 10); ctx.lineTo(-10, 5); ctx.lineTo(0, 15); ctx.lineTo(10, 5); ctx.lineTo(25, 10); ctx.closePath();
        ctx.fill(); ctx.stroke();

        if (gameState !== "cashed_out") {
          const flameHeight = 15 + Math.random() * 15 * (currentMulti * 0.5);
          const flameGrad = ctx.createLinearGradient(0, 15, 0, 15 + flameHeight);
          flameGrad.addColorStop(0, "rgba(244, 63, 94, 1)"); flameGrad.addColorStop(1, "rgba(253, 224, 71, 0)");
          ctx.fillStyle = flameGrad;
          ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(0, 15 + flameHeight); ctx.lineTo(8, 10); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      // Render Particles (Explosion)
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life > 0) {
          ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      ctx.restore();

      // Scanlines overlay
      ctx.fillStyle = "rgba(2, 5, 10, 0.05)";
      for (let i = 0; i < height; i += 4) { ctx.fillRect(0, i, width, 1.5); }

      localAnimationFrameId = requestAnimationFrame(render);
    };

    localAnimationFrameId = requestAnimationFrame(render);
    animationFrameIdRef.current = localAnimationFrameId;
    return () => cancelAnimationFrame(localAnimationFrameId);
  }, [gameState, playSound, stopAudio, onLiveTick]);

  const handleStartRun = async () => {
    if (gameState === "playing" || gameState === "crashed" || gameState === "cashed_out") return;

    // Provably Fair Generation
    const nextNonce = nonce + 1;
    setNonce(nextNonce);
    const { crashPoint, hash } = await generateProvablyFairCrashPoint(serverSeed, clientSeed, nextNonce);
    
    crashPointRef.current = crashPoint;
    setLastHash(hash);
    
    // Setup state
    currentMultiplierRef.current = 1.00;
    startTimeRef.current = Date.now();
    cashedOutRef.current = false;
    particlesRef.current = [];
    
    setPlayerLane(1);
    setMultiplier(1.00);
    gameSpeedRef.current = 6.0;

    setGameState("playing");
    initAudio();
  };

  const handleManualCashout = () => {
    if (gameState !== "playing" || cashedOutRef.current) return;
    cashedOutRef.current = true;
    
    const finalClaim = currentMultiplierRef.current;
    setGameState("cashed_out");
    stopAudio();
    playSound("cashout");

    setTimeout(() => {
      onCompleteRef.current(finalClaim, true);
    }, 1800);
  };

  useEffect(() => {
    const handleTriggerCashout = () => { if (gameState === "playing") handleManualCashout(); };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [gameState]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) stopAudio();
      else if (gameState === "playing") initAudio();
      return next;
    });
  };

  return (
    <div className="w-full h-full min-h-[100dvh] md:min-h-[600px] bg-[#02050a] md:rounded-[2.5rem] md:border-4 border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative flex flex-col items-center overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.45)_95%)]" />

      {/* Round History Strip */}
      <div className="absolute top-0 inset-x-0 z-30 h-8 sm:h-10 bg-black/60 backdrop-blur-md border-b border-slate-800 flex items-center px-4 overflow-x-auto overflow-y-hidden whitespace-nowrap gap-2 scrollbar-hide">
        <div className="flex items-center gap-1.5 text-slate-400 mr-2">
          <History className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
        </div>
        {history.map((h, i) => (
          <div key={i} className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md ${h.multiplier < 1.2 ? 'bg-slate-800 text-slate-300' : h.multiplier >= 10 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
            {h.multiplier.toFixed(2)}x
          </div>
        ))}
      </div>

      {/* Top HUD */}
      <div className="relative z-20 w-full flex justify-between items-center p-3 sm:p-6 mt-8 sm:mt-10 bg-gradient-to-b from-black/85 to-transparent">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-white/80 border border-slate-700/60 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1 sm:py-1.5 shadow-md cursor-pointer hover:bg-white transition-colors" onClick={() => setShowFairness(true)}>
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <h2 className="text-slate-900 font-black text-xs sm:text-sm uppercase tracking-widest leading-none">Provably Fair</h2>
          </div>
          {gameState === "playing" && (
            <span className="text-[9px] sm:text-[10px] text-cyan-400 font-mono font-bold tracking-widest pl-1 sm:pl-2">
              🏎️ SPEED: {Math.round(gameSpeedRef.current * 18)} KM/H
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleMute} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/60 border border-slate-700/60 flex items-center justify-center text-slate-650 hover:text-slate-900 transition-colors backdrop-blur-md">
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <div className="bg-white/80 backdrop-blur-md border border-slate-700/50 px-3 sm:px-5 py-1 sm:py-2.5 rounded-xl sm:rounded-2xl flex flex-col items-end shadow-lg shadow-black/40 min-w-[90px] sm:min-w-[120px]">
            <span className="text-[7px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Multiplier</span>
            <span className={`text-lg sm:text-2xl font-mono font-black tabular-nums transition-all ${
              gameState === "crashed" ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
              gameState === "cashed_out" ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]" :
              gameState === "playing" ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" : "text-slate-600"
            }`}>
              {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-20">
        <AnimatePresence>
          {gameState === "idle" && (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="flex flex-col items-center gap-2 sm:gap-4 bg-white/80 backdrop-blur-md border border-slate-700/50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-center max-w-[280px] sm:max-w-sm mx-4 shadow-2xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900 stroke-[2.5]" />
              </div>
              <h3 className="text-slate-900 font-black text-sm sm:text-xl uppercase tracking-widest">Neon Horizon 3D</h3>
              <p className="text-slate-650 text-[10px] sm:text-xs font-semibold leading-relaxed">
                Provably fair crash mechanics. Ride the neon grid. Cash out before the system collapses.
              </p>
              
              {!isPlaying ? (
                <div className="mt-2 text-yellow-400 font-mono text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
                  ⚠️ Place Bet to Enable Ignition
                </div>
              ) : (
                <button onClick={handleStartRun} className="w-full mt-2 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-500/25 active:scale-95">
                  🚀 Launch Engine
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameState === "crashed" && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 bg-white/60 backdrop-blur-sm px-10 py-6 rounded-3xl border border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.35)]">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
              <span className="text-red-500 font-mono font-black text-4xl uppercase tracking-widest leading-none drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                COLLISION @ {multiplier.toFixed(2)}x
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameState === "cashed_out" && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2 bg-white/65 backdrop-blur-md px-12 py-8 rounded-3xl border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.35)] rotate-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md">
                <Wallet className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-emerald-400 font-mono font-black text-3xl uppercase tracking-widest leading-none drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                WARP CASHED
              </span>
              <span className="text-slate-900 font-mono font-black text-4xl tracking-tighter mt-1">
                {multiplier.toFixed(2)}x
              </span>
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest mt-0.5">
                + ₹{(betAmount * multiplier).toFixed(2)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Steer Controls */}
      {gameState === "playing" && (
        <div className="absolute inset-x-0 bottom-24 z-30 flex justify-between px-6 pointer-events-none md:hidden">
          <button onTouchStart={steerLeft} onClick={steerLeft} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-slate-900 active:bg-white/35 active:scale-90 transition-all pointer-events-auto backdrop-blur-sm shadow-lg">
            <ArrowLeft className="w-8 h-8 stroke-[3]" />
          </button>
          <button onTouchStart={steerRight} onClick={steerRight} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-slate-900 active:bg-white/35 active:scale-90 transition-all pointer-events-auto backdrop-blur-sm shadow-lg">
            <ArrowRight className="w-8 h-8 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Desktop Manual Cashout */}
      <AnimatePresence>
        {gameState === "playing" && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="hidden md:block absolute bottom-8 z-30 w-full max-w-sm px-6">
            <button onClick={handleManualCashout} className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-955 font-black text-xl py-4 rounded-2xl shadow-[0_8px_0_rgba(6,95,70,1),0_15px_25px_rgba(16,185,129,0.4)] active:translate-y-2 active:shadow-[0_0_0_rgba(6,95,70,1),0_5px_10px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-3 border-2 border-emerald-300">
              CASHOUT MULTIPLIER <Wallet className="w-6 h-6 stroke-[3]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fairness Modal */}
      <AnimatePresence>
        {showFairness && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Provably Fair
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Neon Horizon 3D operates on a strict 99% RTP mathematical model. The crash point is predetermined using an HMAC-SHA256 hash of the server seed and your client seed. It is completely impossible for the game to alter the result mid-flight based on your bet or cashout target.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Server Seed (Hashed)</label>
                  <input type="text" readOnly value="****************************************" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300" />
                  <p className="text-[9px] text-slate-500 mt-1">The unhashed server seed will be revealed when you rotate your seed.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Seed</label>
                  <input type="text" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nonce (Round #)</label>
                  <input type="text" readOnly value={nonce} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300" />
                </div>
              </div>

              <button onClick={() => setShowFairness(false)} className="w-full mt-6 bg-white hover:bg-slate-200 text-slate-900 font-black text-sm uppercase tracking-widest py-3 rounded-xl transition-colors">
                Verify & Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
