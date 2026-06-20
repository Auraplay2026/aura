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
  const targetMultiplierRef = useRef(targetMultiplier);
  const isWinRef = useRef(false);
  const inTensionRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    liveCounterRef.current = liveCounter;
  }, [liveCounter]);

  useEffect(() => {
    targetMultiplierRef.current = targetMultiplier;
  }, [targetMultiplier]);

  useEffect(() => {
    isWinRef.current = result !== null && result >= targetMultiplier;
  }, [result, targetMultiplier]);

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
        // Low power hum ramping up
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.65);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === "counting") {
        // Proportional pitch ticking sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        
        // Pitch rises as the live counter increases:
        const currentPitch = 300 + Math.min(liveCounterRef.current * 15, 800);
        osc.frequency.setValueAtTime(currentPitch, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "reveal_win") {
        // Celebratory major arpeggio chord + laser sweep
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50]; // C4, E4, G4, C5, E5, C6
        notes.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + idx * 0.05);
          g.gain.setValueAtTime(0.08, now + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
          o.start(now + idx * 0.05);
          o.stop(now + idx * 0.05 + 0.4);
        });
      } else if (type === "reveal_lose") {
        // Deep low pitch sweep drop (sawtooth + pitch bend)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.65);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
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
      inTensionRef.current = false;
      return;
    }

    // Phase 1: Charging Build-up (650ms)
    setPhase("charging");
    setLiveCounter(1.00);
    setResult(null);
    inTensionRef.current = false;
    playSound("charge");

    let active = true;
    let animId: number;

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
          const duration = Math.min(1000 + Math.log(finalResult) * 550, 2600); // Dynamic climb duration
          let startClimbTime = performance.now();
          let tensionDuration = 380; // 380ms tension pause
          let tensionStartTime = 0;
          let inTension = false;
          let tensionDone = false;
          let soundRateLimit = 75; // ms
          let lastSoundTime = 0;

          const tick = (now: number) => {
            if (!active) return;
            let elapsed = now - startClimbTime;
            
            // Proximity check: is current raw value close to the target?
            // Raw progress without tension:
            let rawT = Math.min(1, elapsed / duration);
            let rawVal = 1.0 + (finalResult - 1.0) * Math.pow(rawT, 2.5);

            const proximityStart = targetMultiplier * 0.94;
            const willWin = finalResult >= targetMultiplier;

            if (willWin && rawVal >= proximityStart && !tensionDone) {
              if (!inTension) {
                inTension = true;
                inTensionRef.current = true;
                tensionStartTime = now;
              }
              
              let tensionElapsed = now - tensionStartTime;
              if (tensionElapsed < tensionDuration) {
                const tProgress = tensionElapsed / tensionDuration;
                const crawlVal = proximityStart + (targetMultiplier * 0.99 - proximityStart) * tProgress;
                setLiveCounter(parseFloat(crawlVal.toFixed(2)));
                
                if (now - lastSoundTime > soundRateLimit) {
                  playSound("counting");
                  lastSoundTime = now;
                }
                
                animId = requestAnimationFrame(tick);
                return;
              } else {
                inTension = false;
                inTensionRef.current = false;
                tensionDone = true;
                startClimbTime += tensionDuration;
                elapsed = now - startClimbTime;
              }
            }

            let t = Math.min(1, elapsed / duration);
            let val = 1.0 + (finalResult - 1.0) * Math.pow(t, 2.5);
            setLiveCounter(parseFloat(val.toFixed(2)));

            if (now - lastSoundTime > soundRateLimit) {
              playSound("counting");
              lastSoundTime = now;
            }

            if (t >= 1) {
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
              }, 1500);
            } else {
              animId = requestAnimationFrame(tick);
            }
          };

          animId = requestAnimationFrame(tick);
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
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, targetMultiplier, betAmount, playSound]);

  const isWin = result !== null && result >= targetMultiplier;

  // Canvas Reactor Core Particle Interface
  interface ReactorParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    decay: number;
    type: "plasma" | "spark" | "debris";
  }

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

    // Particle storage
    const particles: ReactorParticle[] = [];

    let ringPulse = 0;
    let shockwaveRad = 0;

    const render = () => {
      // 1. Draw Space Dark Background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Deep center nebula glow depending on phase
      const centerX = width / 2;
      const centerY = height / 2;

      // Screen shake translation during tension moments:
      let offsetX = 0;
      let offsetY = 0;
      if (phaseRef.current === "counting" && inTensionRef.current) {
        offsetX = (Math.random() - 0.5) * 6;
        offsetY = (Math.random() - 0.5) * 6;
      }

      ctx.save();
      ctx.translate(offsetX, offsetY);

      const radialGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width * 0.5);
      if (phaseRef.current === "reveal" && isWinRef.current) {
        radialGrad.addColorStop(0, "rgba(16, 185, 129, 0.25)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      } else if (phaseRef.current === "reveal" && !isWinRef.current) {
        radialGrad.addColorStop(0, "rgba(244, 63, 94, 0.25)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      } else if (phaseRef.current === "counting") {
        radialGrad.addColorStop(0, "rgba(6, 182, 212, 0.18)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      } else {
        radialGrad.addColorStop(0, "rgba(99, 102, 241, 0.08)");
        radialGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      }
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Grid floor projection
      ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo((x - centerX) * 1.5 + centerX, height);
        ctx.stroke();
      }

      // Vertical cylindrical tube measurements
      const tubeWidth = 240;
      const tubeLeft = centerX - tubeWidth / 2;
      const tubeRight = centerX + tubeWidth / 2;
      const tubeTop = 40;
      const tubeBottom = 360;
      const tubeHeight = tubeBottom - tubeTop;

      // Draw glass tube background
      ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tubeLeft, tubeTop + 20);
      ctx.quadraticCurveTo(centerX, tubeTop, tubeRight, tubeTop + 20);
      ctx.lineTo(tubeRight, tubeBottom - 20);
      ctx.quadraticCurveTo(centerX, tubeBottom, tubeLeft, tubeBottom - 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw logarithmic milestones grid lines
      const milestones = [1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 25.0, 50.0, 100.0];
      milestones.forEach(m => {
        const y = tubeBottom - 20 - (tubeHeight - 40) * (Math.log10(m) / 2);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tubeLeft + 8, y);
        ctx.lineTo(tubeRight - 8, y);
        ctx.stroke();

        ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${m.toFixed(1)}x`, tubeLeft - 12, y + 3.5);
      });

      // Target peg indicator line
      const targetY = tubeBottom - 20 - (tubeHeight - 40) * (Math.log10(targetMultiplierRef.current) / 2);
      ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(tubeLeft - 5, targetY);
      ctx.lineTo(tubeRight + 5, targetY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw peg flag label
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(tubeRight + 5, targetY);
      ctx.lineTo(tubeRight + 13, targetY - 6);
      ctx.lineTo(tubeRight + 60, targetY - 6);
      ctx.lineTo(tubeRight + 60, targetY + 6);
      ctx.lineTo(tubeRight + 13, targetY + 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "black 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${targetMultiplierRef.current.toFixed(2)}x`, tubeRight + 34, targetY + 3);

      // Draw plasma particles during count-up or charge
      if (phaseRef.current === "counting" || phaseRef.current === "charging") {
        if (Math.random() < 0.35) {
          particles.push({
            x: centerX + (Math.random() - 0.5) * 50,
            y: tubeBottom - 25,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2.5 - Math.random() * 3.5,
            size: 2.5 + Math.random() * 3.5,
            color: "rgba(34, 211, 238, 0.6)",
            alpha: 1.0,
            decay: 0.012 + Math.random() * 0.015,
            type: "plasma"
          });
        }
      }

      // Draw rising plasma beam
      if (phaseRef.current === "counting" || phaseRef.current === "reveal") {
        const currentY = tubeBottom - 20 - (tubeHeight - 40) * (Math.log10(liveCounterRef.current) / 2);
        const beamGrad = ctx.createLinearGradient(centerX, tubeBottom - 20, centerX, currentY);

        let beamColorStart = "rgba(6, 182, 212, 0.85)";
        let beamColorEnd = "rgba(34, 211, 238, 0.3)";
        let shadowColor = "#06b6d4";

        if (phaseRef.current === "reveal") {
          if (isWinRef.current) {
            beamColorStart = "rgba(16, 185, 129, 0.85)";
            beamColorEnd = "rgba(52, 211, 153, 0.3)";
            shadowColor = "#10b981";
          } else {
            beamColorStart = "rgba(244, 63, 94, 0.4)";
            beamColorEnd = "rgba(244, 63, 94, 0.1)";
            shadowColor = "#f43f5e";
          }
        }

        beamGrad.addColorStop(0, beamColorStart);
        beamGrad.addColorStop(1, beamColorEnd);

        ctx.fillStyle = beamGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = shadowColor;
        
        ctx.beginPath();
        ctx.moveTo(centerX - 15, tubeBottom - 20);
        ctx.lineTo(centerX - 10, currentY);
        ctx.lineTo(centerX + 10, currentY);
        ctx.lineTo(centerX + 15, tubeBottom - 20);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw floating reactor orb core
        const orbRadius = 16;
        ctx.beginPath();
        ctx.arc(centerX, currentY, orbRadius, 0, Math.PI * 2);
        
        const orbGrad = ctx.createRadialGradient(centerX - 4, currentY - 4, 2, centerX, currentY, orbRadius);
        if (phaseRef.current === "reveal") {
          if (isWinRef.current) {
            orbGrad.addColorStop(0, "#ffffff");
            orbGrad.addColorStop(0.3, "#34d399");
            orbGrad.addColorStop(1, "#047857");
          } else {
            orbGrad.addColorStop(0, "#fca5a5");
            orbGrad.addColorStop(0.3, "#ef4444");
            orbGrad.addColorStop(1, "#7f1d1d");
          }
        } else {
          orbGrad.addColorStop(0, "#ffffff");
          orbGrad.addColorStop(0.3, "#22d3ee");
          orbGrad.addColorStop(1, "#0891b2");
        }
        
        ctx.fillStyle = orbGrad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = shadowColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Orbital rings
        const ringTime = Date.now() * 0.005;
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(centerX, currentY);
        ctx.rotate(ringTime);
        ctx.scale(1.8, 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Reveal shockwave trigger
        if (phaseRef.current === "reveal") {
          if (isWinRef.current && particles.filter(p => p.type === "spark").length === 0) {
            for (let i = 0; i < 45; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 2.5 + Math.random() * 8.5;
              particles.push({
                x: centerX,
                y: targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 3,
                color: Math.random() < 0.65 ? "#10b981" : "#fbbf24",
                alpha: 1.0,
                decay: 0.012 + Math.random() * 0.018,
                type: "spark"
              });
            }
          } else if (!isWinRef.current && particles.filter(p => p.type === "debris").length === 0) {
            for (let i = 0; i < 30; i++) {
              const angle = Math.random() * Math.PI + Math.PI;
              const speed = 1.5 + Math.random() * 3.5;
              particles.push({
                x: centerX,
                y: currentY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2.2 + Math.random() * 3,
                color: Math.random() < 0.5 ? "#f43f5e" : "#475569",
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.018,
                type: "debris"
              });
            }
          }
        }
      }

      // Energy ripples/shockwave
      if (phaseRef.current === "reveal") {
        shockwaveRad += 8;
        if (shockwaveRad < width * 0.8) {
          ctx.strokeStyle = isWinRef.current ? `rgba(52, 211, 153, ${1 - shockwaveRad / (width * 0.8)})` : `rgba(244, 63, 94, ${1 - shockwaveRad / (width * 0.8)})`;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 15;
          ctx.shadowColor = isWinRef.current ? "#10b981" : "#ef4444";
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        shockwaveRad = 0;
      }

      // Charging pulse rings
      if (phaseRef.current === "charging") {
        ringPulse += 4;
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (ringPulse % 120) + 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Render/Update particle system
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.type === "debris") {
          p.vy += 0.16; // Gravity
        }

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.type === "spark") {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1.0;

      ctx.restore(); // restores from translate grid offsets

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

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
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="absolute -bottom-6 flex flex-col items-center justify-center gap-1 z-30"
              >
                <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl border bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${
                  isWin 
                    ? "text-emerald-600 border-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.15)]" 
                    : "text-rose-600 border-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                }`}>
                  {isWin ? (
                    <>
                      <Trophy className="w-5 h-5 text-emerald-500 animate-bounce" />
                      <span className="text-sm font-black uppercase tracking-wider">
                        BREACHED AT {result?.toFixed(2)}x (Payout: ₹{(betAmount * targetMultiplier).toFixed(0)})
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                      <span className="text-sm font-black uppercase tracking-wider">
                        MELTDOWN AT {result?.toFixed(2)}x (Below {targetMultiplier.toFixed(2)}x)
                      </span>
                    </>
                  )}
                </div>
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
