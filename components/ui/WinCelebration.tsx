"use client";

import { useEffect, useState, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { usePathname } from "next/navigation";

import confetti from "canvas-confetti";

export function WinCelebration() {
  const pathname = usePathname();
  const { latestWinCelebration, clearLatestWinCelebration, currentUser, soundEnabled } = useTradingStore();
  const [active, setActive] = useState(false);
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'admin' || pathname?.startsWith('/admin')) return;
    if (!latestWinCelebration) {
      setActive(false);
      return;
    }

    const amount = latestWinCelebration.amount;
    let currentTier: 1 | 2 | 3 = 1;
    if (amount >= 50000) {
      currentTier = 3;
    } else if (amount >= 5000) {
      currentTier = 2;
    } else {
      currentTier = 1;
    }
    setTier(currentTier);
    setActive(true);

    // Fire canvas-confetti burst
    try {
      confetti({
        particleCount: currentTier === 3 ? 150 : currentTier === 2 ? 80 : 40,
        spread: currentTier === 3 ? 100 : 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#22C55E', '#A855F7', '#3B82F6']
      });
    } catch {}

    // Audio context sounds based on tier
    if (soundEnabled !== false) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (currentTier === 1) {
          // Gold flash chime
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.4);
        } else if (currentTier === 2) {
          // Fanfare chord
          const freqs = [261.63, 329.63, 392.00, 523.25]; // C major chord
          freqs.forEach((f) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, audioCtx.currentTime);
            osc.frequency.setValueAtTime(f * 1.5, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          });
        } else {
          // Epic fireworks synth and pops!
          const duration = 2.5;
          const freqs = [196.00, 293.66, 392.00, 587.33, 783.99]; // G chord
          freqs.forEach((f) => {
            const osc = audioCtx.createOscillator();
            const actualGain = audioCtx.createGain();
            osc.connect(actualGain);
            actualGain.connect(audioCtx.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(f, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(f * 2, audioCtx.currentTime + 1.5);
            actualGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            actualGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
          });

          // Add firework pop noises at random intervals
          for (let j = 0; j < 6; j++) {
            const delay = j * 0.3 + Math.random() * 0.2;
            setTimeout(() => {
              try {
                const popOsc = audioCtx.createOscillator();
                const popGain = audioCtx.createGain();
                popOsc.connect(popGain);
                popGain.connect(audioCtx.destination);
                popOsc.type = "sine";
                popOsc.frequency.setValueAtTime(150 + Math.random() * 100, audioCtx.currentTime);
                popOsc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
                popGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                popGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                popOsc.start();
                popOsc.stop(audioCtx.currentTime + 0.15);
              } catch (e) {}
            }, delay * 1000);
          }

          // Vibrate mobile device
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 300]);
          }
        }
      } catch (e) {}
    }

    // Auto clear win celebration after 4.5 seconds
    const dismissTimer = setTimeout(() => {
      clearLatestWinCelebration();
    }, 4500);

    return () => clearTimeout(dismissTimer);
  }, [latestWinCelebration, clearLatestWinCelebration]);

  // Coin shower simulation for Canvas
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animId: number;
    const coins: Coin[] = [];
    const maxCoins = tier === 3 ? 120 : tier === 2 ? 60 : 30;

    class Coin {
      x: number;
      y: number;
      r: number;
      speedY: number;
      speedX: number;
      rotationX: number;
      spinSpeed: number;

      constructor() {
        const width = canvasRef.current?.width || window.innerWidth;
        this.x = Math.random() * width;
        this.y = -20 - Math.random() * 100;
        this.r = Math.random() * 10 + 8;
        this.speedY = Math.random() * 6 + 4;
        this.speedX = Math.random() * 4 - 2;
        this.rotationX = Math.random() * Math.PI;
        this.spinSpeed = Math.random() * 0.2 + 0.05;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotationX += this.spinSpeed;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(Math.cos(this.rotationX), 1);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        
        // Gold gradient
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.r);
        grad.addColorStop(0, "#ffe066");
        grad.addColorStop(0.8, "#f59e0b");
        grad.addColorStop(1, "#d97706");
        
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Inner detail
        ctx.beginPath();
        ctx.arc(0, 0, this.r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    for (let i = 0; i < maxCoins; i++) {
      coins.push(new Coin());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      coins.forEach(c => {
        c.update();
        c.draw();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, tier]);

  if (currentUser?.role === 'admin' || pathname?.startsWith('/admin') || !active || !latestWinCelebration) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={clearLatestWinCelebration}
        className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] select-none cursor-pointer"
      >
        {/* Render full screen canvas for coins */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Confetti overlay for Tier 2 and 3 */}
        {tier >= 2 && <ConfettiCanvas active={true} />}

        {/* Full-Screen text animation wrapper */}
        <motion.div
          drag="y"
          dragDirectionLock
          dragElastic={0.6}
          dragConstraints={{ top: -200, bottom: 200 }}
          onDragEnd={(event, info) => {
            if (Math.abs(info.offset.y) > 50 || Math.abs(info.velocity.y) > 300) {
              clearLatestWinCelebration();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: tier === 3 ? [0, -10, 10, -10, 10, 0] : 0, // Screen shake effect for Tier 3!
            transition: { x: { repeat: 5, duration: 0.15 }, scale: { type: "spring", damping: 12 } }
          }}
          exit={{ opacity: 0, scale: 0.7, y: 100 }}
          className="text-center relative pointer-events-auto flex flex-col items-center px-4 cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {/* Sparkly Background Light */}
          <div className={`absolute w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full blur-[100px] -z-10 animate-pulse-slow ${
            tier === 3 ? "bg-red-500/20" : tier === 2 ? "bg-purple-500/20" : "bg-yellow-500/20"
          }`} />

          {/* Trophy Icon */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-2xl border ${
            tier === 3
              ? "bg-red-600 border-red-400 text-slate-900 shadow-red-500/50 animate-pulse-fast"
              : tier === 2
              ? "bg-purple-600 border-purple-400 text-slate-900 shadow-purple-500/50"
              : "bg-yellow-500 border-yellow-400 text-slate-950 shadow-yellow-500/50"
          }`}>
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          {/* Celebration Text */}
          <h1 className={`text-3xl sm:text-6xl font-black uppercase tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
            tier === 3
              ? "bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
              : tier === 2
              ? "bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
          }`}>
            {tier === 3 ? "🔥 EPIC WIN! 🔥" : tier === 2 ? "✨ MEGA WIN! ✨" : "🏆 NICE WIN! 🏆"}
          </h1>

          <p className="text-slate-900 text-sm sm:text-lg font-black tracking-widest mt-1 sm:mt-2 uppercase">
            Played {latestWinCelebration.gameTitle}
          </p>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-4xl sm:text-7xl font-black text-slate-900 tracking-tight mt-3 sm:mt-4"
          >
            ₹{latestWinCelebration.amount.toLocaleString()}
          </motion.div>

          <button
            onClick={clearLatestWinCelebration}
            className="mt-6 sm:mt-8 px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg transition-colors cursor-pointer"
          >
            Collect (Swipe to Dismiss)
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
