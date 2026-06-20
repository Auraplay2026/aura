"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startCrashAudio, updateCrashPitch, stopCrashAudio } from "@/lib/audio";
import { useTradingStore } from "@/lib/store";

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
    crashed: false,
    cashedOut: false,
    cashoutMultiplier: 1.0,
    isPlaying: false,
    sessionId: null as string | null,
    tick: 0,
    // Ship position in WORLD space (camera offsets applied during render)
    shipWorldX: 0,
    shipWorldY: 0,
    trailPoints: [] as TrailPoint[],
    particles: [] as Particle[],
    stars: [] as Star[],
    wreckagePieces: [] as WreckagePiece[],
    explosionTime: 0,
    cameraShake: 0,
    // Camera
    cameraX: 0, cameraY: 0, cameraZoom: 1.1,
  });

  const [uiState, setUiState] = useState({
    multiplier: 1.0, crashed: false, cashedOut: false,
    cashoutAmount: 0, phase: "idle" as "idle" | "flying" | "crashed" | "cashedout",
  });

  const currentUser = useTradingStore(s => s.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => { onLiveTickRef.current = onLiveTick; }, [onLiveTick]);

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
    const scale = 1 + Math.min(0.2, mult * 0.0015);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // ── Engine exhaust flame ──
    const flameLen = 18 + mult * 1.8 + Math.sin(stateRef.current.tick * 0.4) * 6;
    const flameWidth = 10 + mult * 0.3;
    const outerFlame = ctx.createRadialGradient(0, 28, 2, 0, 28 + flameLen * 0.6, flameLen);
    outerFlame.addColorStop(0, "rgba(255,180,30,0.95)");
    outerFlame.addColorStop(0.35, "rgba(255,80,10,0.7)");
    outerFlame.addColorStop(0.7, tier.glow.replace(/[\d.]+\)$/, "0.15)"));
    outerFlame.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = outerFlame;
    ctx.beginPath();
    ctx.ellipse(0, 28 + flameLen * 0.4, flameWidth, flameLen, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ship Body ──
    ctx.shadowBlur = 10 + mult * 0.3;
    ctx.shadowColor = tier.glow;
    const bodyG = ctx.createLinearGradient(-12, -28, 12, 28);
    bodyG.addColorStop(0, "#f8fafc");
    bodyG.addColorStop(0.4, "#cbd5e1");
    bodyG.addColorStop(0.8, "#475569");
    bodyG.addColorStop(1, "#0f172a");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(14, -10, 12, 10, 8, 26);
    ctx.lineTo(-8, 26);
    ctx.bezierCurveTo(-14, 10, -12, -10, 0, -28);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cockpit window
    ctx.fillStyle = "rgba(30,140,225,0.95)";
    ctx.beginPath();
    ctx.ellipse(0, -12, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = "#1e293b";
    ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(24, 26); ctx.lineTo(8, 22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-24, 26); ctx.lineTo(-8, 22); ctx.closePath(); ctx.fill();

    ctx.restore();
  };

  // ─── Main Canvas Renderer ─────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const s = stateRef.current;
    const tier = getTier(s.multiplier);

    // ── Camera: Predictable Follow ──────────────────────────
    let targetCamX = 0, targetCamY = 0, targetZoom = 1.05;
    if (s.isPlaying && !s.crashed) {
      // Pinned offset: Ship always at 35% from left, 60% from top (leads path)
      targetCamX = s.shipWorldX - W * 0.35;
      targetCamY = s.shipWorldY - H * 0.60;
      targetZoom = Math.max(0.65, 1.15 - Math.log10(s.multiplier) * 0.2);
    } else if (s.crashed) {
      targetCamX = s.shipWorldX - W * 0.5;
      targetCamY = s.shipWorldY - H * 0.45;
      targetZoom = 0.85;
    }

    // Direct tracking with zero dynamic lag/vibration on camera coordinates
    s.cameraX += (targetCamX - s.cameraX) * 0.085;
    s.cameraY += (targetCamY - s.cameraY) * 0.085;
    s.cameraZoom += (targetZoom - s.cameraZoom) * 0.085;

    // Apply viewport camera shake only during explosion impact
    let shakeX = 0, shakeY = 0;
    if (s.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * s.cameraShake;
      shakeY = (Math.random() - 0.5) * s.cameraShake;
      s.cameraShake *= 0.85;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ── Background: Clean, Dark Sky (Supports Motion) ──
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, W, H);

    // Subtle moving sky stars for simple velocity feedback
    const starSpeedMult = s.isPlaying && !s.crashed ? Math.min(10, 1 + (s.multiplier - 1) * 0.35) : 0;
    s.stars.forEach(star => {
      let drawX = star.x - s.cameraX * star.speed * 0.02;
      let drawY = star.y - s.cameraY * star.speed * 0.02;
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
    const startY = Math.floor(s.cameraY / gridSpacing) * gridSpacing;
    for (let gy = startY - H; gy < startY + H * 2; gy += gridSpacing) {
      const screenY = gy - s.cameraY;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(W, screenY);
      ctx.stroke();
    }
    
    // Draw vertical grid lines (Distance / Reward indicator)
    const startX = Math.floor(s.cameraX / gridSpacing) * gridSpacing;
    for (let gx = startX - W; gx < startX + W * 2; gx += gridSpacing) {
      const screenX = gx - s.cameraX;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, H);
      ctx.stroke();
    }

    // ══════════════════════════════════════════════════════════
    // WORLD-SPACE LAYER (Warp Trails & Ship)
    // ══════════════════════════════════════════════════════════
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(s.cameraZoom, s.cameraZoom);
    ctx.translate(-W / 2, -H / 2);
    ctx.translate(-s.cameraX, -s.cameraY);

    // ── Flight Path: Clean, Predictable rocket curve ──
    if (s.trailPoints.length > 1) {
      const pts = s.trailPoints;
      ctx.save();
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Solid, elegant neon curve representing flight trajectory
      const tGrad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      tGrad.addColorStop(0, "rgba(16, 185, 129, 0.05)");
      tGrad.addColorStop(0.5, tier.secondary + "77");
      tGrad.addColorStop(1, tier.color);

      ctx.strokeStyle = tGrad;
      ctx.shadowBlur = 10;
      ctx.shadowColor = tier.glow;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── Particles update ──
    s.particles = s.particles.filter(p => p.life > 0.01);
    s.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
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
    if (s.isPlaying || s.crashed) {
      let angle = -Math.PI * 0.25;
      if (s.trailPoints.length > 3) {
        const prev = s.trailPoints[s.trailPoints.length - 3];
        const curr = s.trailPoints[s.trailPoints.length - 1];
        // Mathematical tangent of the flight curve
        angle = Math.atan2(curr.y - prev.y, curr.x - prev.x) + Math.PI / 2;
      }

      if (s.crashed) {
        if (s.wreckagePieces.length > 0) {
          s.wreckagePieces.forEach(piece => {
            piece.x += piece.vx;
            piece.y += piece.vy;
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
        // Ship is always at the leading edge of the curve
        drawShip(ctx, s.shipWorldX, s.shipWorldY, angle, s.multiplier, tier);

        if (s.tick % 2 === 0) {
          const exhaustAngle = angle + Math.PI;
          const ex = s.shipWorldX + Math.cos(exhaustAngle) * 26;
          const ey = s.shipWorldY + Math.sin(exhaustAngle) * 26;
          spawnParticles(ex, ey, "exhaust", tier.color, 1);
        }
      }
    }

    // ── Crash Explosion Ring ──
    if (s.crashed && s.explosionTime < 70) {
      const et = s.explosionTime / 70;
      const ex = s.shipWorldX, ey = s.shipWorldY;
      
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

    ctx.restore(); // end camera projection
    ctx.restore(); // end camera shake

    // ══════════════════════════════════════════════════════════
    // SCREEN SPACE HUD LAYER (Clean Multiplier Placement)
    // ══════════════════════════════════════════════════════════
    if (s.isPlaying || s.crashed || s.cashedOut) {
      const multText = s.multiplier.toFixed(2) + "×";
      const fontSize = Math.min(W * 0.12, 60);

      ctx.save();
      ctx.font = `900 ${fontSize}px 'Outfit', 'Inter', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Positioned at top-center, completely clear of the flight path/ship
      const multX = W / 2;
      const multY = H * 0.18;

      if (s.crashed) {
        ctx.fillStyle = "#ef4444";
        ctx.fillText(multText, multX, multY);
        
        ctx.font = `800 ${fontSize * 0.3}px 'Outfit', sans-serif`;
        ctx.fillStyle = "#fecaca";
        ctx.fillText("CRASHED", multX, multY + fontSize * 0.6);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = tier.glow;
        ctx.fillText(multText, multX, multY);
      }
      ctx.restore();
    }

    s.tick++;
    animFrameRef.current = requestAnimationFrame(render);
  }, []);

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
    spawnParticles(s.shipWorldX, s.shipWorldY, "cashout", "#fbbf24", 30, 1.2);
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
        s.shipWorldX = 0; s.shipWorldY = 0;
        stopCrashAudio(false);
        setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "idle" });
      }
      return;
    }

    s.isPlaying = true;
    s.crashed = false;
    s.cashedOut = false;
    s.trailPoints = [];
    s.particles = [];
    s.wreckagePieces = [];
    s.explosionTime = 0;
    s.multiplier = 1.0;
    s.cameraX = 0; s.cameraY = 0; s.cameraZoom = 1.1;
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
          let current = 1.0;
          let tick = 0;

          const canvas = canvasRef.current;
          const startX = canvas ? canvas.width * 0.12 : 90;
          const startY = canvas ? canvas.height * 0.88 : 500;
          s.shipWorldX = startX;
          s.shipWorldY = startY;

          interval = setInterval(() => {
            if (!active) return;
            tick++;
            current += 0.008 + current * 0.014;
            updateCrashPitch(current);
            s.multiplier = current;

            // Flight path: smooth accelerating upward curve
            const speed = 2.0 + current * 0.65;
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
                { x: s.shipWorldX, y: s.shipWorldY, vx: Math.cos(crashAngle - 0.45) * speed * 0.25, vy: Math.sin(crashAngle - 0.45) * speed * 0.25, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 7, type: "nose" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: Math.cos(crashAngle + 0.45) * speed * 0.25, vy: Math.sin(crashAngle + 0.45) * speed * 0.25, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 5, type: "wingLeft" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: Math.cos(crashAngle + Math.PI - 0.3) * speed * 0.2, vy: Math.sin(crashAngle + Math.PI - 0.3) * speed * 0.2, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.2, size: 5, type: "wingRight" },
                { x: s.shipWorldX, y: s.shipWorldY, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5, angle: crashAngle, vAngle: (Math.random() - 0.5) * 0.3, size: 8, type: "core" }
              ];

              spawnParticles(s.shipWorldX, s.shipWorldY, "explosion", "#f43f5e", 50, 1.4);
              spawnParticles(s.shipWorldX, s.shipWorldY, "shockwave", "rgba(244,63,94,0.65)", 2);
              s.cameraShake = 22;

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
    <div ref={containerRef} className="relative w-full h-full min-h-[420px] overflow-hidden bg-black rounded-2xl border border-slate-900 shadow-3xl select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* ── Floating Cashout button ── */}
      <AnimatePresence>
        {uiState.phase === "flying" && !uiState.cashedOut && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[220px]"
          >
            <button
              onClick={() => handleCashout()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_35px_rgba(52,211,153,0.55)] border border-emerald-300/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>💰 CASHOUT</span>
              <span className="font-mono text-sm font-black bg-black/10 px-2 py-0.5 rounded-md">
                ₹{(betAmount * uiState.multiplier).toFixed(2)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cashout Success banner ── */}
      <AnimatePresence>
        {uiState.phase === "cashedout" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none"
          >
            <div className="bg-slate-950/80 border border-emerald-500/30 px-6 py-5 rounded-2xl text-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">CASHOUT SUCCESSFUL</span>
              <span className="text-3xl font-black text-white font-mono mt-1 block">
                {stateRef.current.cashoutMultiplier.toFixed(2)}x
              </span>
              <span className="text-xs font-black text-emerald-300 mt-2 block">
                Won: ₹{uiState.cashoutAmount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Takeoff phase countdown HUD ── */}
      {uiState.phase === "idle" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-transparent pointer-events-none">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block animate-pulse">SYSTEM ENGINES READY</span>
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mt-1 block">PLACE BET TO INITIATE TAKEOFF</span>
          </div>
        </div>
      )}
    </div>
  );
}
