"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Trophy, Flame, Shield, Activity, RefreshCw, 
  Volume2, VolumeX, Eye, Sparkles, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Virtual3DPitchRadarProps {
  sportType?: "cricket" | "football" | "tennis";
  team1Name?: string;
  team2Name?: string;
  team1Score?: string;
  team2Score?: string;
  currentOver?: string;
  matchStatus?: string;
  onBallOutcome?: (outcome: BallOutcome) => void;
}

export interface BallOutcome {
  runs: number;
  type: "dot" | "single" | "double" | "three" | "four" | "six" | "wicket" | "wide" | "noball";
  ballSpeed: number; // km/h
  deliveryType: string;
  shotType: string;
  batsman: string;
  bowler: string;
  commentary: string;
  isBoundary: boolean;
  isWicket: boolean;
}

const BATSMEN = ["V. Kohli", "R. Sharma", "S. Gill", "KL Rahul", "H. Pandya", "S. Yadav", "R. Pant"];
const BOWLERS = ["J. Bumrah", "M. Shami", "M. Siraj", "K. Yadav", "R. Jadeja", "P. Cummins", "M. Starc"];
const SHOT_TYPES = [
  "Cover Drive", "Straight Lofted Drive", "Pull Shot over Mid-Wicket", 
  "Square Cut", "Flick through Mid-Wicket", "Reverse Sweep", 
  "Defensive Block", "Edged past Slip", "Upper Cut over Third Man", "Helicopter Shot"
];
const DELIVERY_TYPES = [
  "In-Swinger", "Out-Swinger", "Yorker", "Short Bouncer", 
  "Slower Cutter", "Googly", "Arm Ball", "Leg Break", "Knuckleball"
];

export function Virtual3DPitchRadar({
  sportType = "cricket",
  team1Name = "India",
  team2Name = "Australia",
  team1Score = "184/3",
  team2Score = "179/7",
  currentOver = "18.4",
  matchStatus = "India need 12 runs in 8 balls",
  onBallOutcome
}: Virtual3DPitchRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // State for current ball and live telemetry
  const [currentBall, setCurrentBall] = useState<BallOutcome>({
    runs: 4,
    type: "four",
    ballSpeed: 144.2,
    deliveryType: "Yorker",
    shotType: "Cover Drive",
    batsman: "V. Kohli (74*)",
    bowler: "M. Starc",
    commentary: "FOUR! Bludgeoned through extra cover with pure elegance and timing!",
    isBoundary: true,
    isWicket: false
  });

  const [overTimeline, setOverTimeline] = useState<string[]>(["1", "0", "4", "2", "6", "W"]);
  const [isSimulating, setIsSimulating] = useState(true);

  // Generate realistic live ball simulation
  const triggerNextDelivery = useCallback(() => {
    const rand = Math.random();
    let runs = 0;
    let type: BallOutcome["type"] = "dot";
    let isBoundary = false;
    let isWicket = false;

    if (rand < 0.30) {
      runs = 1;
      type = "single";
    } else if (rand < 0.50) {
      runs = 0;
      type = "dot";
    } else if (rand < 0.68) {
      runs = 4;
      type = "four";
      isBoundary = true;
    } else if (rand < 0.82) {
      runs = 2;
      type = "double";
    } else if (rand < 0.93) {
      runs = 6;
      type = "six";
      isBoundary = true;
    } else {
      runs = 0;
      type = "wicket";
      isWicket = true;
    }

    const batsman = BATSMEN[Math.floor(Math.random() * BATSMEN.length)];
    const bowler = BOWLERS[Math.floor(Math.random() * BOWLERS.length)];
    const shot = SHOT_TYPES[Math.floor(Math.random() * SHOT_TYPES.length)];
    const delivery = DELIVERY_TYPES[Math.floor(Math.random() * DELIVERY_TYPES.length)];
    const speed = +(130 + Math.random() * 20).toFixed(1);

    let comm = "";
    if (type === "six") comm = `MASSIVE SIX! ${batsman} launches it into the top tier!`;
    else if (type === "four") comm = `FOUR! Rocketed through the field for a sensational boundary!`;
    else if (type === "wicket") comm = `OUT! Stumps shattered! ${bowler} strikes with unplayable pace!`;
    else if (type === "single") comm = `Pushed into the gap for a quick, sharp single.`;
    else if (type === "double") comm = `Great running between the wickets, scampering back for two!`;
    else comm = `Defended solidly back to the bowler. Dot ball.`;

    const outcome: BallOutcome = {
      runs,
      type,
      ballSpeed: speed,
      deliveryType: delivery,
      shotType: shot,
      batsman,
      bowler,
      commentary: comm,
      isBoundary,
      isWicket
    };

    setCurrentBall(outcome);
    setOverTimeline(prev => {
      const mark = type === "wicket" ? "W" : String(runs);
      const updated = [...prev, mark];
      return updated.slice(-6);
    });

    if (onBallOutcome) {
      onBallOutcome(outcome);
    }
  }, [onBallOutcome]);

  // Animation & simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      triggerNextDelivery();
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, triggerNextDelivery]);

  // 60FPS 3D Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 600);
      const h = (canvas.height = 300);

      ctx.clearRect(0, 0, w, h);

      // 1. Perspective Pitch Background (Emerald Green Field)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#064e3b");
      grad.addColorStop(0.5, "#065f46");
      grad.addColorStop(1, "#022c22");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Field Texture Rings & Boundary Glow
      ctx.save();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.lineWidth = 1.5;
      for (let r = 60; r < w; r += 70) {
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.75, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. 3D Perspective Pitch Trapezoid
      const pTopW = 60;
      const pBotW = 140;
      const pTopY = 35;
      const pBotY = h - 25;

      const pitchGrad = ctx.createLinearGradient(w / 2, pTopY, w / 2, pBotY);
      pitchGrad.addColorStop(0, "#b45309"); // Clay Brown Top
      pitchGrad.addColorStop(0.5, "#d97706");
      pitchGrad.addColorStop(1, "#92400e"); // Deep Earth Bottom

      ctx.beginPath();
      ctx.moveTo(w / 2 - pTopW / 2, pTopY);
      ctx.lineTo(w / 2 + pTopW / 2, pTopY);
      ctx.lineTo(w / 2 + pBotW / 2, pBotY);
      ctx.lineTo(w / 2 - pBotW / 2, pBotY);
      ctx.closePath();
      ctx.fillStyle = pitchGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crease lines
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - pTopW * 0.6, pTopY + 15);
      ctx.lineTo(w / 2 + pTopW * 0.6, pTopY + 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2 - pBotW * 0.6, pBotY - 20);
      ctx.lineTo(w / 2 + pBotW * 0.6, pBotY - 20);
      ctx.stroke();

      // 4. Stumps
      ctx.fillStyle = "#fef08a";
      for (let s = -6; s <= 6; s += 6) {
        ctx.fillRect(w / 2 + s - 1, pTopY + 5, 2, 10);
      }
      for (let s = -10; s <= 10; s += 10) {
        ctx.fillRect(w / 2 + s - 1.5, pBotY - 30, 3, 16);
      }

      // 5. Dynamic Ball Trajectory Path
      const progress = (Math.sin(t * 3) + 1) / 2;
      const startX = w / 2;
      const startY = pTopY + 15;
      const impactX = w / 2 + (currentBall.runs === 4 ? 40 : currentBall.runs === 6 ? -30 : 0);
      const impactY = pBotY - 20;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(w / 2 + (Math.sin(t * 2) * 20), (startY + impactY) / 2, impactX, impactY);
      ctx.strokeStyle = currentBall.isWicket ? "rgba(239, 68, 68, 0.8)" : "rgba(250, 204, 21, 0.85)";
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Traveling Ball Particle
      const ballCurrX = startX + (impactX - startX) * progress;
      const ballCurrY = startY + (impactY - startY) * progress;

      const ballGlow = ctx.createRadialGradient(ballCurrX, ballCurrY, 1, ballCurrX, ballCurrY, 12);
      ballGlow.addColorStop(0, currentBall.isBoundary ? "#ef4444" : "#fbbf24");
      ballGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ballGlow;
      ctx.beginPath();
      ctx.arc(ballCurrX, ballCurrY, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ballCurrX, ballCurrY, 4, 0, Math.PI * 2);
      ctx.fill();

      // 7. Shot Direction Trail
      if (currentBall.isBoundary) {
        const shotAngle = currentBall.runs === 6 ? -Math.PI * 0.75 : Math.PI * 0.25;
        const shotEndX = impactX + Math.cos(shotAngle) * 250;
        const shotEndY = impactY - Math.sin(Math.abs(shotAngle)) * 180;

        ctx.beginPath();
        ctx.moveTo(impactX, impactY);
        ctx.lineTo(shotEndX, shotEndY);
        ctx.strokeStyle = currentBall.runs === 6 ? "#ec4899" : "#10b981";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = currentBall.runs === 6 ? "#f43f5e" : "#059669";
        ctx.beginPath();
        ctx.arc(shotEndX, shotEndY, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [currentBall]);

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none">
      {/* ═══ TOP HUD BAR ═══ */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-[11px] font-black tracking-widest text-red-400 uppercase">
            3D Pitch Radar • Live 60FPS
          </span>
        </div>

        {/* Over Timeline */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Over {currentOver}:</span>
          {overTimeline.map((item, idx) => (
            <span
              key={idx}
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono shadow-xs",
                item === "6" ? "bg-purple-600 text-white" :
                item === "4" ? "bg-emerald-600 text-white" :
                item === "W" ? "bg-red-600 text-white" :
                "bg-slate-800 text-slate-300 border border-slate-700"
              )}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ 3D CANVAS VIEWPORT ═══ */}
      <div className="relative w-full h-[260px] sm:h-[300px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Speed Gun HUD (Top Right) */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
          <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Speed Gun</div>
            <div className="text-xs font-black text-white font-mono">{currentBall.ballSpeed} km/h</div>
          </div>
        </div>

        {/* Bowler & Batsman Cards */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl pointer-events-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400">
              🏏
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block">Striker</span>
              <span className="text-xs font-black text-white truncate">{currentBall.batsman}</span>
            </div>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl pointer-events-auto text-right">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block">Bowler</span>
              <span className="text-xs font-black text-white truncate">{currentBall.bowler}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-400">
              🎯
            </div>
          </div>
        </div>

        {/* Big Boundary or Wicket Splash Effect */}
        <AnimatePresence>
          {currentBall.isBoundary && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-950/20 backdrop-blur-[1px]"
            >
              <div className={cn(
                "px-6 py-2 rounded-2xl text-2xl sm:text-4xl font-black uppercase tracking-wider shadow-2xl border flex items-center gap-3",
                currentBall.runs === 6 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-400 animate-pulse" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400"
              )}>
                <Sparkles className="w-6 h-6 text-yellow-300" />
                {currentBall.runs === 6 ? "🔥 MAXIMUM 6! 🔥" : "⚡ FOUR BOUNDARY! ⚡"}
              </div>
            </motion.div>
          )}

          {currentBall.isWicket && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-950/40"
            >
              <div className="bg-red-600 border-2 border-red-400 text-white px-8 py-3 rounded-2xl text-3xl font-black uppercase tracking-widest shadow-2xl animate-bounce">
                🚨 WICKET FALLEN! 🚨
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ LIVE COMMENTARY & DETAILS FOOTER ═══ */}
      <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-yellow-400 text-slate-950 rounded font-mono">
              {currentBall.deliveryType} • {currentBall.shotType}
            </span>
            <span className="text-xs font-bold text-slate-300 truncate">
              {currentBall.commentary}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={triggerNextDelivery}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Next Ball
          </button>
        </div>
      </div>
    </div>
  );
}