"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startCrashAudio, updateCrashPitch, stopCrashAudio } from "@/lib/audio";
import { useTradingStore } from "@/lib/store";
import { Rocket, ShieldAlert, Zap, Cpu, Terminal, Radio, Activity, Award, CheckCircle, Flame, Server, AlertTriangle, Compass } from "lucide-react";

interface CrashEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  autoCashout?: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

// ─── Types ───────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; size: number;
  color: string; type: "exhaust" | "spark" | "explosion" | "shockwave" | "cashout" | "smoke";
}
interface Star { x: number; y: number; size: number; speed: number; brightness: number; }
interface TrailPoint { x: number; y: number; mult: number; time: number; }
interface WreckagePiece { x: number; y: number; vx: number; vy: number; angle: number; vAngle: number; size: number; type: string; }

// ─── Multiplier → Tier System ────────────────────────────────
function getTier(m: number): { name: string; color: string; glow: string; secondary: string; intensity: number } {
  if (m >= 100) return { name: "mythic",       color: "#f43f5e", glow: "rgba(244,63,94,0.95)", secondary: "#fda4af", intensity: 1.0 };
  if (m >= 50)  return { name: "legendary",    color: "#fbbf24", glow: "rgba(251,191,36,0.9)",  secondary: "#f59e0b", intensity: 0.88 };
  if (m >= 25)  return { name: "hyperspace",   color: "#a78bfa", glow: "rgba(167,139,250,0.85)", secondary: "#c4b5fd", intensity: 0.75 };
  if (m >= 10)  return { name: "escape",       color: "#3b82f6", glow: "rgba(59,130,246,0.7)",  secondary: "#60a5fa", intensity: 0.6 };
  if (m >= 5)   return { name: "danger",       color: "#ef4444", glow: "rgba(239,68,68,0.7)",   secondary: "#f87171", intensity: 0.45 };
  if (m >= 2)   return { name: "acceleration", color: "#06b6d4", glow: "rgba(6,182,212,0.6)",   secondary: "#22d3ee", intensity: 0.3 };
  return { name: "launch", color: "#10b981", glow: "rgba(16,185,129,0.4)", secondary: "#6ee7b7", intensity: 0.15 };
}

export function CrashEngine({ isPlaying, betAmount = 10, autoCashout, onLiveTick, onComplete }: CrashEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const stateRef = useRef({
    multiplier: 1.0,
    targetMultiplier: 1.0,
    crashed: false,
    cashedOut: false,
    cashoutMultiplier: 1.0,
    isPlaying: false,
    sessionId: null as string | null,
    tick: 0,
    // Decoupled Virtual Coordinates (physics simulation is fixed on this grid)
    shipWorldX: 120,
    shipWorldY: 800,
    trailPoints: [] as TrailPoint[],
    particles: [] as Particle[],
    stars: [] as Star[],
    wreckagePieces: [] as WreckagePiece[],
    explosionTime: 0,
    cameraShake: 0,
    // Camera Virtual Coordinates
    cameraX: 120, cameraY: 800, cameraZoom: 1.1,
    shipScreenX: 120,
    shipScreenY: 800,
    lastAngle: -Math.PI * 0.25,
  });

  const [uiState, setUiState] = useState({
    multiplier: 1.0, crashed: false, cashedOut: false,
    cashoutAmount: 0, phase: "idle" as "idle" | "flying" | "crashed" | "cashedout",
  });
  const [history, setHistory] = useState<number[]>([1.45, 2.12, 1.05, 18.42, 3.11, 1.95]);
  const [bootStep, setBootStep] = useState(0);

  const currentUser = useTradingStore(s => s.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => { onLiveTickRef.current = onLiveTick; }, [onLiveTick]);

  // Direct state Ref synchronization
  stateRef.current.isPlaying = isPlaying;

  // Cockpit boot diagnostics log animation loop
  useEffect(() => {
    if (uiState.phase !== "idle") return;
    const interval = setInterval(() => {
      setBootStep(prev => (prev + 1) % 5);
    }, 750);
    return () => clearInterval(interval);
  }, [uiState.phase]);

  // ─── Init Stars ───────────────────────────────────────────
  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * w * 3 - w,
        y: Math.random() * h * 3 - h,
        size: Math.random() * 1.5 + 0.4,
        speed: 0.2 + Math.random() * 1.2,
        brightness: 0.2 + Math.random() * 0.6,
      });
    }
    stateRef.current.stars = stars;
  }, []);

  // ─── Spawn Particles ──────────────────────────────────────
  const spawnParticles = (x: number, y: number, type: Particle["type"], color: string, count: number, spread = 1) => {
    const p = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = type === "exhaust"
        ? Math.PI * 0.75 + (Math.random() - 0.5) * 0.4  // clean exhaust trail angle
        : Math.random() * Math.PI * 2;
      const speed = type === "explosion" ? 2 + Math.random() * 9 * spread
        : type === "shockwave" ? 6 + Math.random() * 3
        : type === "cashout" ? 1.5 + Math.random() * 5
        : type === "smoke" ? 0.3 + Math.random() * 1.2
        : 0.4 + Math.random() * 2 * spread;
      p.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, size: type === "explosion" ? 3 + Math.random() * 6 : type === "shockwave" ? 2 : type === "smoke" ? 4 + Math.random() * 8 : 1.2 + Math.random() * 2,
        color, type,
      });
    }
    if (p.length > 500) p.splice(0, p.length - 500);
  };

  // ─── Draw Ship Wreckage Piece ──────────────────────────────
  const drawWreckagePiece = (ctx: CanvasRenderingContext2D, piece: WreckagePiece) => {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (piece.type === "nose") {
      ctx.moveTo(0, -9); ctx.lineTo(5, 5); ctx.lineTo(-5, 5);
    } else if (piece.type === "wingLeft" || piece.type === "wingRight") {
      ctx.moveTo(-8, 0); ctx.lineTo(8, 6); ctx.lineTo(0, -6);
    } else {
      ctx.rect(-piece.size/2, -piece.size/2, piece.size, piece.size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // ─── Draw Ship ────────────────────────────────────────────
  const drawShip = (ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, mult: number, tier: ReturnType<typeof getTier>) => {
    try {
      const safeMult = isNaN(mult) || !isFinite(mult) ? 1.0 : mult;
      const safeAngle = isNaN(angle) || !isFinite(angle) ? -Math.PI * 0.25 : angle;
      const scale = 1 + Math.min(0.2, safeMult * 0.0015);
      const safeScale = isNaN(scale) || !isFinite(scale) ? 1.0 : scale;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(safeAngle);
      ctx.scale(safeScale, safeScale);

      // ── Engine exhaust flame ──
      const flameLen = 18 + safeMult * 1.8 + Math.sin(stateRef.current.tick * 0.4) * 6;
      const flameWidth = 10 + safeMult * 0.3;
      
      try {
        // 1. Outer Flame glow
        const outerFlame = ctx.createRadialGradient(0, 28, 2, 0, 28 + flameLen * 0.6, flameLen);
        outerFlame.addColorStop(0, "rgba(255,180,30,0.95)");
        outerFlame.addColorStop(0.35, "rgba(255,80,10,0.7)");
        outerFlame.addColorStop(0.7, tier.glow.replace(/[\d.]+\)$/, "0.15)"));
        outerFlame.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = outerFlame;
        ctx.beginPath();
        ctx.ellipse(0, 28 + flameLen * 0.4, flameWidth, flameLen, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Inner Hot Core
        const innerFlame = ctx.createRadialGradient(0, 28, 1, 0, 28 + flameLen * 0.3, flameLen * 0.5);
        innerFlame.addColorStop(0, "#ffffff");
        innerFlame.addColorStop(0.4, "rgba(255,255,200,0.95)");
        innerFlame.addColorStop(0.8, "rgba(255,120,10,0.4)");
        innerFlame.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = innerFlame;
        ctx.beginPath();
        ctx.ellipse(0, 28 + flameLen * 0.2, flameWidth * 0.5, flameLen * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } catch (err) {
        // Fallback simple circle for flame
        ctx.fillStyle = tier.color;
        ctx.beginPath();
        ctx.arc(0, 28 + flameLen * 0.4, Math.max(flameWidth, 8), 0, Math.PI * 2);
        ctx.fill();

        // Fallback hot core circle
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 28 + flameLen * 0.2, Math.max(flameWidth * 0.4, 4), 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Ship Body ──
      ctx.shadowBlur = 15 + safeMult * 0.3;
      ctx.shadowColor = tier.glow;
      
      let bodyStyle: string | CanvasGradient = "#f8fafc";
      try {
        const bodyG = ctx.createLinearGradient(-12, -28, 12, 28);
        bodyG.addColorStop(0, "#ffffff");
        bodyG.addColorStop(0.3, "#f1f5f9");
        bodyG.addColorStop(0.7, "#cbd5e1");
        bodyG.addColorStop(1, "#94a3b8");
        bodyStyle = bodyG;
      } catch (e) {}
      
      ctx.fillStyle = bodyStyle;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.bezierCurveTo(14, -10, 12, 10, 8, 26);
      ctx.lineTo(-8, 26);
      ctx.bezierCurveTo(-14, 10, -12, -10, 0, -28);
      ctx.closePath();
      ctx.fill();

      // Fuselage neon stroke outline
      ctx.strokeStyle = tier.color;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Cockpit window
      ctx.fillStyle = "#38bdf8";
      try {
        ctx.beginPath();
        ctx.ellipse(0, -12, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      } catch (err) {
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // Wings
      ctx.fillStyle = "#475569";
      
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.lineTo(-24, 26);
      ctx.lineTo(-8, 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tier.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(24, 26);
      ctx.lineTo(8, 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tier.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    } catch (err) {
      console.error("Error drawing ship:", err);
      try { ctx.restore(); } catch (e) {}
    }
  };

  // ─── Main Canvas Renderer ─────────────────────────────────
  const render = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      const W = canvas.width || 300;
      const H = canvas.height || 150;
      if (W < 10 || H < 10) return; // Skip drawing if canvas is not yet laid out/resized

      const s = stateRef.current;
      const safeMultiplier = isNaN(s.multiplier) || s.multiplier <= 0 ? 1.0 : s.multiplier;
      const tier = getTier(safeMultiplier);

      // ── Bounded Screen-Relative Flight Path (Aviator-style) ──
      const launchX = W * 0.08;
      const launchY = H * 0.85;

      // Custom motion profile: takeoff -> middle pause/glide -> top-right crash
      const targetVal = s.targetMultiplier || 10.0;
      const ratio = targetVal > 1.001 ? (safeMultiplier - 1) / (targetVal - 1) : 0;
      
      // Piecewise progress interpolation
      const getFlightProgress = (r: number) => {
        const safeR = Math.max(0, Math.min(1, r));
        let px = 0;
        let py = 0;
        
        if (safeR < 0.25) {
          // Phase 1: Takeoff to middle
          const t = safeR / 0.25;
          const ease = t * (2 - t); // Ease out quad
          px = ease * 0.45;
          py = ease * 0.45;
        } else if (safeR < 0.75) {
          // Phase 2: Middle pause/glide/hover
          const t = (safeR - 0.25) / 0.50;
          const floatOffset = Math.sin(t * Math.PI * 2) * 0.015;
          px = 0.45 + t * 0.15;
          py = 0.45 + t * 0.15 + floatOffset;
        } else {
          // Phase 3: Surge to top-right
          const t = (safeR - 0.75) / 0.25;
          const ease = t * t * t; // Ease in cubic
          px = 0.60 + ease * 0.40;
          py = 0.60 + ease * 0.40;
        }
        return { px, py };
      };

      const { px, py } = getFlightProgress(ratio);

      const xPos = s.isPlaying && !s.crashed
        ? launchX + px * (W * 0.82 - launchX)
        : s.crashed
          ? s.shipScreenX
          : launchX;

      const yPos = s.isPlaying && !s.crashed
        ? launchY - py * (launchY - H * 0.16)
        : s.crashed
          ? s.shipScreenY
          : launchY;

      // Angle calculation based on coordinate delta
      const lastX = s.shipScreenX || launchX;
      const lastY = s.shipScreenY || launchY;
      const dx = xPos - lastX;
      const dy = yPos - lastY;

      let angle = s.lastAngle || -Math.PI * 0.25;
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        angle = Math.atan2(dy, dx) + Math.PI / 2;
        s.lastAngle = angle;
      }

      s.shipScreenX = xPos;
      s.shipScreenY = yPos;

      // Infinite scroll values for stars/grid
      const scrollSpeedX = s.isPlaying && !s.crashed ? 2.5 : 0;
      const scrollSpeedY = s.isPlaying && !s.crashed ? -1.25 : 0;

      s.cameraX += scrollSpeedX;
      s.cameraY += scrollSpeedY;

      // Final camera sanitization
      if (isNaN(s.cameraX) || !isFinite(s.cameraX)) s.cameraX = 0;
      if (isNaN(s.cameraY) || !isFinite(s.cameraY)) s.cameraY = 0;

      // Apply viewport camera shake only during explosion impact
      let shakeX = 0, shakeY = 0;
      if (s.cameraShake > 0) {
        shakeX = (Math.random() - 0.5) * s.cameraShake;
        shakeY = (Math.random() - 0.5) * s.cameraShake;
        s.cameraShake *= 0.85;
      }
      if (isNaN(shakeX)) shakeX = 0;
      if (isNaN(shakeY)) shakeY = 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // ── Background: Clean, Dark Sky (Supports Motion) ──
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, W, H);

      // Subtle moving sky stars for simple velocity feedback (mapped to virtual camera coords)
      s.stars.forEach(star => {
        let drawX = star.x - s.cameraX * star.speed * 0.025;
        let drawY = star.y - s.cameraY * star.speed * 0.025;
        drawX = ((drawX % (W * 3)) + W * 3) % (W * 3) - W;
        drawY = ((drawY % (H * 3)) + H * 3) % (H * 3) - H;

        ctx.fillStyle = `rgba(255,255,255,${star.brightness * 0.4})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Coordinate Grid (Higher = More Risk, Further = More Reward) ──
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      const gridSpacing = 90;
      
      // Draw horizontal grid lines (Altitude / Risk indicator)
      const startGridY = Math.floor(s.cameraY / gridSpacing) * gridSpacing;
      for (let gy = startGridY - H; gy < startGridY + H * 2; gy += gridSpacing) {
        const screenY = gy - s.cameraY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(W, screenY);
        ctx.stroke();
      }
      
      // Draw vertical grid lines (Distance / Reward indicator)
      const startGridX = Math.floor(s.cameraX / gridSpacing) * gridSpacing;
      for (let gx = startGridX - W; gx < startGridX + W * 2; gx += gridSpacing) {
        const screenX = gx - s.cameraX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, H);
        ctx.stroke();
      }

      // Draw Launch Pad / Ground platform in screen coordinates
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      
      const rx = launchX - 45, ry = launchY + 26, rw = 90, rh = 10, rr = 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(rx, ry, rw, rh, rr);
      } else {
        ctx.rect(rx, ry, rw, rh);
      }
      ctx.fill();
      ctx.stroke();

      // ── Flight Path: Bounded, glowing, multi-layered Bezier curve ──
      if (s.isPlaying || s.crashed) {
        const controlX = launchX + (xPos - launchX) * 0.55;
        const controlY = launchY; // flat takeoff path

        // 1. Shaded gradient area under flight path
        try {
          const pathGrad = ctx.createLinearGradient(launchX, yPos, launchX, launchY);
          const baseColor = tier.color || "#06b6d4";

          const hexToRgbaLocal = (hex: string, alpha: number) => {
            const cleanHex = hex.replace("#", "");
            let r = 0, g = 0, b = 0;
            if (cleanHex.length === 3) {
              r = parseInt(cleanHex.substring(0, 1).repeat(2), 16);
              g = parseInt(cleanHex.substring(1, 2).repeat(2), 16);
              b = parseInt(cleanHex.substring(2, 3).repeat(2), 16);
            } else if (cleanHex.length === 6) {
              r = parseInt(cleanHex.substring(0, 2), 16);
              g = parseInt(cleanHex.substring(2, 4), 16);
              b = parseInt(cleanHex.substring(4, 6), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };

          pathGrad.addColorStop(0, hexToRgbaLocal(baseColor, 0.28));
          pathGrad.addColorStop(0.5, hexToRgbaLocal(baseColor, 0.10));
          pathGrad.addColorStop(1, "rgba(0,0,0,0)");
          
          ctx.fillStyle = pathGrad;
          ctx.beginPath();
          ctx.moveTo(launchX, launchY);
          ctx.quadraticCurveTo(controlX, controlY, xPos, yPos);
          ctx.lineTo(xPos, launchY);
          ctx.closePath();
          ctx.fill();
        } catch (e) {}

        // 2. Glowing Outer neon path
        ctx.save();
        ctx.strokeStyle = tier.color;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = tier.glow;
        ctx.beginPath();
        ctx.moveTo(launchX, launchY);
        ctx.quadraticCurveTo(controlX, controlY, xPos, yPos);
        ctx.stroke();
        ctx.restore();

        // 3. Volumetric White inner core
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(launchX, launchY);
        ctx.quadraticCurveTo(controlX, controlY, xPos, yPos);
        ctx.stroke();
        ctx.restore();
      }

      // ── Particles update ──
      s.particles = s.particles.filter(p => p.life > 0.01);
      s.particles.forEach(p => {
        // Drift with camera scroll speed
        p.x += p.vx - scrollSpeedX;
        p.y += p.vy - scrollSpeedY;

        if (p.type === "exhaust") { p.vy += 0.01; p.vx *= 0.99; }
        else if (p.type === "smoke") { p.vy -= 0.04; p.vx *= 0.98; }
        else { p.vy += 0.03; p.vx *= 0.98; p.vy *= 0.98; }
        p.life -= p.type === "explosion" ? 0.018 : p.type === "shockwave" ? 0.024 : p.type === "smoke" ? 0.015 : 0.035;

        ctx.save();
        ctx.globalAlpha = p.life;
        if (p.type === "shockwave") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (1 - p.life) * 110, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // ── Ship / Wreckage pieces render ──
      if (s.isPlaying || s.crashed || uiState.phase === "idle") {
        if (s.crashed) {
          if (s.wreckagePieces.length > 0) {
            s.wreckagePieces.forEach(piece => {
              // Drift with camera scroll speed
              piece.x += piece.vx - scrollSpeedX;
              piece.y += piece.vy - scrollSpeedY;
              piece.angle += piece.vAngle;
              piece.vy += 0.12;
              piece.vx *= 0.99;
              piece.vy *= 0.99;

              if (s.tick % 4 === 0 && s.explosionTime < 60) {
                spawnParticles(piece.x, piece.y, "smoke", "#1e293b", 1);
                spawnParticles(piece.x, piece.y, "spark", "#f97316", 1, 0.4);
              }
              drawWreckagePiece(ctx, piece);
            });
          }
        } else {
          // Draw dynamic thumping engine flame inside drawShip
          drawShip(ctx, xPos, yPos, angle, safeMultiplier, tier);

          if (s.tick % 2 === 0 && (s.isPlaying || safeMultiplier > 1.01)) {
            const exhaustAngle = angle + Math.PI;
            const ex = xPos + Math.cos(exhaustAngle) * 26;
            const ey = yPos + Math.sin(exhaustAngle) * 26;
            spawnParticles(ex, ey, "exhaust", tier.color, 1);
          }
        }
      }

      // ── Crash Explosion Ring ──
      if (s.crashed && s.explosionTime < 70) {
        const et = s.explosionTime / 70;
        const ex = s.shipScreenX, ey = s.shipScreenY;
        
        ctx.save();
        for (let ring = 0; ring < 2; ring++) {
          const r = et * 180 * (ring + 1) * 0.6;
          const alpha = (1 - et) * (0.8 - ring * 0.3);
          ctx.strokeStyle = `rgba(244,63,94,${alpha})`;
          ctx.lineWidth = 3 - ring;
          ctx.beginPath();
          ctx.arc(ex, ey, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        s.explosionTime++;
      }
      ctx.restore(); // end camera shake
    } catch (e) {
      console.error("CrashEngine render loop error:", e);
    } finally {
      stateRef.current.tick++;
      animFrameRef.current = requestAnimationFrame(render);
    }
  }, [uiState.phase]);

  // ─── Resize Handler ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      initStars(canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    animFrameRef.current = requestAnimationFrame(render);
    return () => { ro.disconnect(); cancelAnimationFrame(animFrameRef.current); };
  }, [render, initStars]);

  // ─── Cashout Handler ─────────────────────────────────────
  const handleCashout = useCallback(async (cashoutMult?: number) => {
    const s = stateRef.current;
    if (s.crashed || s.cashedOut || !s.isPlaying || !s.sessionId) return;
    const targetMult = cashoutMult ?? s.multiplier;
    s.cashedOut = true;
    s.cashoutMultiplier = targetMult;
    stopCrashAudio(false);
    spawnParticles(s.shipScreenX, s.shipScreenY, "cashout", "#fbbf24", 30, 1.2);
    setUiState(prev => ({ ...prev, cashedOut: true, cashoutAmount: betAmount * targetMult, phase: "cashedout" }));
    try {
      await fetch("/api/casino/mines/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cashout", email, sessionId: s.sessionId, clientMultiplier: targetMult }),
      });
    } catch (e) {
      console.warn("Cashout API sync error:", e);
    }
  }, [betAmount, email]);

  const handleCashoutRef = useRef(handleCashout);
  useEffect(() => { handleCashoutRef.current = handleCashout; }, [handleCashout]);

  // Listen to sidebar/external cashout triggers
  useEffect(() => {
    const handleExternalCashout = () => {
      handleCashout();
    };
    window.addEventListener("sidebar-trigger-cashout", handleExternalCashout);
    window.addEventListener("trigger-cashout", handleExternalCashout);
    return () => {
      window.removeEventListener("sidebar-trigger-cashout", handleExternalCashout);
      window.removeEventListener("trigger-cashout", handleExternalCashout);
    };
  }, [handleCashout]);

  // ─── Game Loop ────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    if (!isPlaying) {
      if (uiState.phase === "idle" || (!s.isPlaying && !s.crashed)) {
        s.isPlaying = false;
        s.multiplier = 1.0;
        s.crashed = false;
        s.cashedOut = false;
        s.cashoutMultiplier = 1.0;
        s.trailPoints = [];
        s.particles = [];
        s.wreckagePieces = [];
        s.explosionTime = 0;
        s.sessionId = null;
        s.tick = 0;
        s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1.1;
        s.shipWorldX = 120; s.shipWorldY = 800;
        const idleW = canvasRef.current?.width || 800;
        const idleH = canvasRef.current?.height || 500;
        s.shipScreenX = idleW * 0.08;
        s.shipScreenY = idleH * 0.85;
        stopCrashAudio(false);
        setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "idle" });
      }
      return;
    }

    s.isPlaying = true;
    s.crashed = false;
    s.cashedOut = false;
    s.trailPoints = [{ x: 120, y: 800, mult: 1.0, time: 0 }];
    s.particles = [];
    s.wreckagePieces = [];
    s.explosionTime = 0;
    s.multiplier = 1.0;
    s.targetMultiplier = 1.0;
    s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1.1;
    s.shipWorldX = 120; s.shipWorldY = 800;
    const startW = canvasRef.current?.width || 800;
    const startH = canvasRef.current?.height || 500;
    s.shipScreenX = startW * 0.08;
    s.shipScreenY = startH * 0.85;
    startCrashAudio();
    setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "flying" });

    let active = true;
    let interval: NodeJS.Timeout | null = null;

    const executeBet = async () => {
      try {
        const res = await fetch("/api/casino/bet", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, gameId: "orig-1", gameTitle: "Crash", betAmount }),
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.success) {
          s.sessionId = data.sessionId;
          const target = data.crashPoint;
          s.targetMultiplier = target;
          let current = 1.0;
          let tick = 0;

          s.shipWorldX = 120;
          s.shipWorldY = 800;

          interval = setInterval(() => {
            if (!active) return;
            tick++;
            current += 0.004 + current * 0.0072;
            updateCrashPitch(current);
            s.multiplier = current;

            // Flight path: smooth accelerating upward curve (logarithmic speed cap)
            const speed = 2.0 + Math.min(6.5, Math.log10(current) * 3.0);
            const baseAngle = -0.15 - Math.min(0.55, Math.log10(Math.max(1.01, current)) * 0.28);
            s.shipWorldX += Math.cos(baseAngle) * speed;
            s.shipWorldY += Math.sin(baseAngle) * speed;

            s.trailPoints.push({ x: s.shipWorldX, y: s.shipWorldY, mult: current, time: tick });
            if (s.trailPoints.length > 500) s.trailPoints.shift();

            onLiveTickRef.current?.(current);
            setUiState(prev => ({ ...prev, multiplier: current }));

            if (current >= target) {
              if (interval) clearInterval(interval);
              s.multiplier = target;
              s.crashed = true;
              s.isPlaying = false;
              s.explosionTime = 0;
              stopCrashAudio(true); // Sudden silence

              const crashAngle = -Math.PI * 0.25;
              s.wreckagePieces = [
                { x: s.shipScreenX, y: s.shipScreenY, vx: Math.cos(crashAngle - 0.45) * speed * 0.25, vy: Math.sin(crashAngle - 0.45) * speed * 0.25, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 7, type: "nose" },
                { x: s.shipScreenX, y: s.shipScreenY, vx: Math.cos(crashAngle + 0.45) * speed * 0.25, vy: Math.sin(crashAngle + 0.45) * speed * 0.25, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 5, type: "wingLeft" },
                { x: s.shipScreenX, y: s.shipScreenY, vx: Math.cos(crashAngle + Math.PI - 0.3) * speed * 0.2, vy: Math.sin(crashAngle + Math.PI - 0.3) * speed * 0.2, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 5, type: "wingRight" },
                { x: s.shipScreenX, y: s.shipScreenY, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.3, size: 8, type: "core" }
              ];

              spawnParticles(s.shipScreenX, s.shipScreenY, "explosion", "#f43f5e", 50, 1.4);
              spawnParticles(s.shipScreenX, s.shipScreenY, "shockwave", "rgba(244,63,94,0.65)", 2);
              s.cameraShake = 22;

              setHistory(prev => {
                const next = [target, ...prev];
                if (next.length > 8) next.pop();
                return next;
              });

              setUiState(prev => ({
                ...prev,
                multiplier: target,
                crashed: true,
                phase: "crashed"
              }));

              setTimeout(() => {
                if (active) {
                  onCompleteRef.current(s.cashedOut ? s.cashoutMultiplier : target, s.cashedOut);
                }
              }, 3000);
            } else if (autoCashout && current >= autoCashout && !s.cashedOut) {
              if (interval) clearInterval(interval);
              handleCashoutRef.current(current);
            }
          }, 55);
        } else {
          onCompleteRef.current(0, false);
        }
      } catch { onCompleteRef.current(0, false); }
    };

    executeBet();
    return () => { active = false; if (interval) clearInterval(interval); stopCrashAudio(false); };
  }, [isPlaying, betAmount, autoCashout, email]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] md:min-h-[520px] overflow-hidden bg-black rounded-2xl border border-slate-900 shadow-3xl select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />



      {/* ── Cockpit Targeting Grid & Brackets ── */}
      <div className="absolute inset-3 border border-cyan-500/10 pointer-events-none rounded-xl z-10">
        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-cyan-400/40 rounded-tl" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-cyan-400/40 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-cyan-400/40 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-cyan-400/40 rounded-br" />
        
        {/* Horizontal Laser Sweep */}
        {uiState.phase === "flying" && (
          <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent top-1/2 -translate-y-1/2 animate-pulse" />
        )}
      </div>

      {/* ── Top Ribbon Bar (Status & History) ── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none select-none bg-slate-950/70 backdrop-blur-sm border border-slate-800/40 rounded-xl px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${uiState.phase === "flying" ? "bg-cyan-500 animate-ping" : uiState.phase === "crashed" ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="font-mono tracking-widest text-[9px] text-slate-400 font-bold uppercase">
            {uiState.phase === "idle" && "COM-LINK: STANDBY"}
            {uiState.phase === "flying" && "TELEMETRY: DYNAMIC"}
            {uiState.phase === "cashedout" && "COMMS: ASSETS SECURED"}
            {uiState.phase === "crashed" && "COM-LINK: FAULT"}
          </span>
        </div>

        {/* History Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%] px-2 scrollbar-none pointer-events-auto">
          {history.slice(0, 7).map((h, i) => {
            const tier = getTier(h);
            return (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[9px] font-black px-2 py-0.5 rounded border bg-slate-900/80 shrink-0 font-mono shadow-inner cursor-default"
                style={{ color: tier.color, borderColor: `${tier.color}33` }}
              >
                {h.toFixed(2)}x
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>AV-SYS v9.41</span>
        </div>
      </div>

      {/* ── Left Telemetry Panel (Desktop only) ── */}
      <div className="hidden md:flex flex-col gap-3.5 absolute left-5 top-[20%] z-20 w-44 p-4 bg-slate-950/75 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none pointer-events-none">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 mb-0.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono">HUD TELEMETRY</span>
        </div>

        {/* Altitude */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
            <span>ALTITUDE</span>
            <span className="text-white font-black">{(uiState.multiplier * 1000).toFixed(0)}m</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, (uiState.multiplier - 1) * 12)}%` }}
            />
          </div>
        </div>

        {/* Velocity */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
            <span>VELOCITY</span>
            <span className="text-cyan-400 font-black">{(uiState.multiplier * 350).toFixed(0)} km/s</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, (uiState.multiplier - 1) * 10)}%` }}
            />
          </div>
        </div>

        {/* G-Force */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
            <span>G-FORCE</span>
            <span className="text-white font-black">{(uiState.multiplier * 2.5).toFixed(1)} G</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, (uiState.multiplier - 1) * 15)}%` }}
            />
          </div>
        </div>

        {/* Core Temp */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
            <span>CORE TEMP</span>
            <span className={`font-black ${uiState.multiplier > 5 ? "text-red-400 animate-pulse font-extrabold" : "text-white"}`}>
              {(100 + uiState.multiplier * 180 + Math.sin(stateRef.current.tick * 0.5) * 15).toFixed(0)}°C
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-75 ${uiState.multiplier > 5 ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, uiState.multiplier * 7)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Right Mission Tiers Panel (Desktop only) ── */}
      <div className="hidden md:flex flex-col gap-2 absolute right-5 top-[20%] z-20 w-44 p-4 bg-slate-950/75 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none pointer-events-none">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 mb-1">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono">FLIGHT TIER</span>
        </div>

        <div className="flex flex-col gap-1 font-mono text-[9px] text-slate-500 font-bold">
          {[
            { name: "mythic", label: "MYTHIC (100x+)", color: "text-rose-500", threshold: 100 },
            { name: "legendary", label: "LEGENDARY (50x)", color: "text-amber-500", threshold: 50 },
            { name: "hyperspace", label: "HYPERSPACE (25x)", color: "text-purple-400", threshold: 25 },
            { name: "escape", label: "ESCAPE (10x)", color: "text-blue-500", threshold: 10 },
            { name: "danger", label: "DANGER (5x)", color: "text-red-500", threshold: 5 },
            { name: "acceleration", label: "ACCELERATING (2x)", color: "text-cyan-400", threshold: 2 },
            { name: "launch", label: "LAUNCH (1x)", color: "text-emerald-400", threshold: 0 }
          ].map((tierItem) => {
            const isActive = uiState.multiplier >= tierItem.threshold && 
              (tierItem.threshold === 100 || uiState.multiplier < [100, 50, 25, 10, 5, 2][[100, 50, 25, 10, 5, 2].indexOf(tierItem.threshold) - 1]);
            
            return (
              <div 
                key={tierItem.name} 
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all duration-150 ${isActive ? "bg-slate-900/90 text-white font-black scale-105 border border-slate-800/40" : "opacity-35"}`}
              >
                {isActive && <Rocket className={`w-3 h-3 ${tierItem.color} animate-pulse`} />}
                <span className={isActive ? tierItem.color : ""}>{tierItem.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Central Multiplier Display ── */}
      {(uiState.phase === "flying" || uiState.phase === "crashed" || uiState.phase === "cashedout") && (
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
          <div className="relative flex flex-col items-center p-6 px-10 bg-slate-950/20 backdrop-blur-[1.5px] rounded-3xl border border-white/5 shadow-2xl">
            {/* HUD Target brackets around numbers */}
            <div className="absolute top-0 left-4 w-4 h-2 border-t border-l border-cyan-400/40" />
            <div className="absolute top-0 right-4 w-4 h-2 border-t border-r border-cyan-400/40" />
            <div className="absolute bottom-0 left-4 w-4 h-2 border-b border-l border-cyan-400/40" />
            <div className="absolute bottom-0 right-4 w-4 h-2 border-b border-r border-cyan-400/40" />

            <motion.span 
              key={getTier(uiState.multiplier).name}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 border border-white/10"
              style={{ color: getTier(uiState.multiplier).color }}
            >
              {getTier(uiState.multiplier).name} tier
            </motion.span>

            <motion.h1 
              className="text-4xl md:text-5xl font-black font-mono tracking-tight filter drop-shadow-[0_4px_20px_rgba(255,255,255,0.1)] mt-1"
              style={{ color: getTier(uiState.multiplier).color }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 0.15 }}
            >
              {uiState.multiplier.toFixed(2)}x
            </motion.h1>

            {uiState.phase === "flying" && uiState.multiplier >= 5 && (
              <span className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest flex items-center gap-1 animate-pulse mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL ESCAPE VELOCITY
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Cashout button ── */}
      <AnimatePresence>
        {uiState.phase === "flying" && !uiState.cashedOut && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -10, scale: 0.95, x: "-50%" }}
            className="absolute bottom-6 left-1/2 z-30 w-full max-w-[240px]"
          >
            <button
              onClick={() => handleCashout()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:via-teal-300 hover:to-cyan-400 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_35px_rgba(52,211,153,0.55)] border border-emerald-300/30 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 group pointer-events-auto"
            >
              <span className="flex items-center gap-1 font-black">
                <Zap className="w-3.5 h-3.5 fill-black" /> SECURE CASHOUT
              </span>
              <span className="font-mono text-[13px] font-black bg-black/10 px-2 py-0.5 rounded-md mt-0.5">
                ₹{(betAmount * uiState.multiplier).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cashout Success Victory Card ── */}
      <AnimatePresence>
        {uiState.phase === "cashedout" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[1px] pointer-events-none select-none"
          >
            <div className="bg-slate-950/95 border-2 border-emerald-500/40 px-6 py-5 rounded-2xl text-center shadow-[0_0_40px_rgba(16,185,129,0.3)] max-w-[280px] w-full relative">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
              
              <div className="flex justify-center mb-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  <Award className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
              </div>
              
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest block">MISSION SECURED</span>
              <span className="text-3xl font-black text-white font-mono mt-1 block">
                {stateRef.current.cashoutMultiplier.toFixed(2)}x
              </span>
              
              <div className="w-full flex flex-col font-mono text-[9px] text-slate-500 gap-1.5 mt-3.5 border-t border-slate-900 pt-3">
                <div className="flex justify-between text-emerald-300">
                  <span>EXTRACTED CREDIT:</span>
                  <span className="font-black text-sm">₹{uiState.cashoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>PILOT ESCAPE:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">SUCCESSFUL <CheckCircle className="w-3 h-3" /></span>
                </div>
              </div>

              <div className="text-[8px] text-slate-500 font-bold uppercase mt-3">
                VESSEL ACTIVE MULTIPLIER: {uiState.multiplier.toFixed(2)}x
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Takeoff phase diagnostics boot loader HUD ── */}
      {uiState.phase === "idle" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-transparent pointer-events-none select-none">
          <div className="flex flex-col items-center max-w-[280px] w-full p-5 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl">
            {/* Tech Radar circular sweep loader */}
            <div className="relative w-14 h-14 border border-cyan-500/20 rounded-full flex items-center justify-center mb-3">
              <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin" />
              <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>

            {/* Diagnostics checklist log output */}
            <div className="w-full flex flex-col font-mono text-[9px] text-left text-slate-500 gap-1 border-t border-slate-900 pt-3 mb-3.5">
              <div className="flex justify-between">
                <span>AV-SYS SYSTEM BOOT:</span>
                <span className={bootStep >= 0 ? "text-emerald-400 font-bold" : "animate-pulse"}>
                  {bootStep >= 0 ? "READY" : "LOADING..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AVIONICS DIAGNOSTIC:</span>
                <span className={bootStep >= 1 ? "text-emerald-400 font-bold" : "animate-pulse"}>
                  {bootStep >= 1 ? "PASSED" : bootStep >= 0 ? "CHECKING" : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IONIC PROPULSION DRIVE:</span>
                <span className={bootStep >= 2 ? "text-emerald-400 font-bold" : "animate-pulse"}>
                  {bootStep >= 2 ? "ONLINE" : bootStep >= 1 ? "CHARGING" : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>WARP THRUST IGNITER:</span>
                <span className={bootStep >= 3 ? "text-emerald-400 font-bold animate-pulse" : "animate-pulse"}>
                  {bootStep >= 3 ? "STANDBY" : bootStep >= 2 ? "IGNITING" : "PENDING"}
                </span>
              </div>
            </div>

            <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider text-center animate-pulse">
              IGNITION COILS DEPLOYED
            </span>
            <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">
              PLACE BET TO INITIATE LAUNCH
            </span>
          </div>
        </div>
      )}

      {/* ── Wreckage blackbox overload data HUD ── */}
      {uiState.phase === "crashed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-red-950/20 backdrop-blur-[2px] pointer-events-none select-none"
        >
          <div className="max-w-[280px] w-full p-5 bg-slate-950 border-2 border-red-500/40 rounded-2xl text-center shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden">
            {/* Scan lines glitch background overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-full w-full pointer-events-none bg-[length:100%_4px]" />
            
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-full animate-bounce">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
            </div>
            
            <span className="text-[10px] text-red-500 font-black uppercase tracking-widest block">TELEMETRY LOST</span>
            <span className="text-3xl font-black text-white font-mono mt-1.5 block">
              {uiState.multiplier.toFixed(2)}x
            </span>
            
            <div className="w-full flex flex-col font-mono text-[9px] text-slate-500 gap-1 mt-3.5 border-t border-slate-900 pt-3">
              <div className="flex justify-between">
                <span>ERROR CODE:</span>
                <span className="text-red-400 font-bold">WARP CORE OVERLOAD</span>
              </div>
              <div className="flex justify-between">
                <span>SHIELD STATUS:</span>
                <span className="text-red-400 font-bold">COMPROMISED</span>
              </div>
              <div className="flex justify-between">
                <span>CRASH ALTITUDE:</span>
                <span className="text-white font-bold">{(uiState.multiplier * 1000).toFixed(0)}m</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
