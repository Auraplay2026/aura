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

// ─── Particle System ─────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; type: "trail" | "spark" | "star" | "explosion" | "nebula";
}

interface Star { x: number; y: number; size: number; brightness: number; twinkle: number; }

function getMultiplierColor(mult: number): { primary: string; secondary: string; glow: string } {
  if (mult >= 100) return { primary: "#fff", secondary: "#a78bfa", glow: "rgba(167,139,250,0.9)" };
  if (mult >= 50)  return { primary: "#f59e0b", secondary: "#fbbf24", glow: "rgba(251,191,36,0.8)" };
  if (mult >= 25)  return { primary: "#f97316", secondary: "#fb923c", glow: "rgba(249,115,22,0.75)" };
  if (mult >= 10)  return { primary: "#ef4444", secondary: "#f87171", glow: "rgba(239,68,68,0.7)" };
  if (mult >= 5)   return { primary: "#06b6d4", secondary: "#22d3ee", glow: "rgba(6,182,212,0.6)" };
  return { primary: "#10b981", secondary: "#34d399", glow: "rgba(16,185,129,0.5)" };
}

export function CrashEngine({ isPlaying, betAmount = 10, autoCashout, onLiveTick, onComplete }: CrashEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef({
    multiplier: 1.0,
    crashed: false,
    cashedOut: false,
    isPlaying: false,
    sessionId: null as string | null,
    tick: 0,
    shipX: 0, shipY: 0,
    trailPoints: [] as { x: number; y: number; mult: number }[],
    particles: [] as Particle[],
    stars: [] as Star[],
    explosionTime: 0,
    cameraShake: 0,
    lastMultiplier: 1.0,
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
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ─── Init Stars ───────────────────────────────────────────
  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 280; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2.2 + 0.3, brightness: Math.random(), twinkle: Math.random() * Math.PI * 2 });
    }
    stateRef.current.stars = stars;
  }, []);

  // ─── Spawn Particle ───────────────────────────────────────
  const spawnParticle = (x: number, y: number, type: Particle["type"], colors: { primary: string; secondary: string }) => {
    const p = stateRef.current.particles;
    const count = type === "explosion" ? 60 : type === "spark" ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const angle = type === "explosion" ? Math.random() * Math.PI * 2 : Math.PI + (Math.random() - 0.5) * 1.2;
      const speed = type === "explosion" ? Math.random() * 8 + 2 : Math.random() * 3 + 1;
      p.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === "trail" ? 1 : 0),
        life: 1, maxLife: 1,
        size: type === "explosion" ? Math.random() * 8 + 3 : Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? colors.primary : colors.secondary,
        type,
      });
    }
    if (p.length > 500) p.splice(0, p.length - 500);
  };

  // ─── Main Canvas Renderer ─────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const s = stateRef.current;
    const colors = getMultiplierColor(s.multiplier);
    const t = Date.now() * 0.001;

    // Camera shake
    let shakeX = 0, shakeY = 0;
    if (s.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * s.cameraShake;
      shakeY = (Math.random() - 0.5) * s.cameraShake;
      s.cameraShake *= 0.85;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ── Background: Deep Space ──
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
    const intensity = Math.min(1, (s.multiplier - 1) / 50);
    bgGrad.addColorStop(0, `rgba(${8 + intensity * 20},${5 + intensity * 5},${30 + intensity * 20},1)`);
    bgGrad.addColorStop(0.6, `rgba(4,3,20,1)`);
    bgGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // ── Nebula clouds ──
    for (let i = 0; i < 4; i++) {
      const nx = W * (0.1 + i * 0.25) + Math.sin(t * 0.1 + i) * 30;
      const ny = H * (0.2 + Math.sin(i * 1.3) * 0.3) + Math.cos(t * 0.08 + i) * 20;
      const nr = W * (0.25 + i * 0.05);
      const nc = i % 2 === 0 ? `rgba(${80 + i * 10},20,${120 + i * 15},` : `rgba(10,${60 + i * 20},${100 + i * 20},`;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      ng.addColorStop(0, nc + `${0.06 + intensity * 0.06})`);
      ng.addColorStop(1, nc + "0)");
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Stars ──
    s.stars.forEach(star => {
      const twinkle = 0.4 + 0.6 * Math.sin(t * (2 + star.twinkle) + star.twinkle);
      const alpha = star.brightness * twinkle;
      const speed = s.multiplier > 5 ? (s.multiplier - 5) * 0.015 : 0;
      star.y = (star.y + speed) % H;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
      if (star.size > 1.5) {
        ctx.shadowBlur = 6; ctx.shadowColor = "rgba(180,200,255,0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // ── Grid lines (subtle) ──
    ctx.save();
    ctx.strokeStyle = `rgba(${s.multiplier > 10 ? "239,68,68" : "16,185,129"},0.06)`;
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let gx = 0; gx < W; gx += gridSize) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.restore();

    // ── Plasma trail ──
    if (s.trailPoints.length > 1) {
      const trailLen = s.trailPoints.length;
      // Glow outer
      ctx.save();
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = colors.glow.replace("0.5)", "0.15)").replace("0.6)", "0.15)").replace("0.7)", "0.15)").replace("0.8)", "0.15)").replace("0.9)", "0.15)");
      ctx.shadowBlur = 30; ctx.shadowColor = colors.glow;
      ctx.beginPath();
      ctx.moveTo(s.trailPoints[0].x, s.trailPoints[0].y);
      for (let i = 1; i < trailLen; i++) ctx.lineTo(s.trailPoints[i].x, s.trailPoints[i].y);
      ctx.stroke();
      // Core trail with gradient
      const tGrad = ctx.createLinearGradient(s.trailPoints[0].x, s.trailPoints[0].y, s.trailPoints[trailLen - 1].x, s.trailPoints[trailLen - 1].y);
      tGrad.addColorStop(0, "rgba(255,255,255,0.05)");
      tGrad.addColorStop(0.7, colors.secondary + "cc");
      tGrad.addColorStop(1, colors.primary + "ff");
      ctx.strokeStyle = tGrad;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20; ctx.shadowColor = colors.glow;
      ctx.beginPath();
      ctx.moveTo(s.trailPoints[0].x, s.trailPoints[0].y);
      for (let i = 1; i < trailLen; i++) ctx.lineTo(s.trailPoints[i].x, s.trailPoints[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // ── Particles ──
    s.particles = s.particles.filter(p => p.life > 0.02);
    s.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += p.type === "explosion" ? 0.15 : 0.03;
      p.vx *= 0.97; p.vy *= 0.97;
      p.life -= p.type === "explosion" ? 0.025 : 0.04;
      const alpha = p.life;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 8; ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Spacecraft ──
    if (s.isPlaying && !s.crashed) {
      const sx = s.shipX, sy = s.shipY;
      // Dynamic angle based on trail
      let angle = -Math.PI * 0.28;
      if (s.trailPoints.length > 2) {
        const prev = s.trailPoints[s.trailPoints.length - 2];
        const curr = s.trailPoints[s.trailPoints.length - 1];
        angle = Math.atan2(curr.y - prev.y, curr.x - prev.x) - Math.PI / 2;
      }

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);

      // Engine glow
      const engGlow = ctx.createRadialGradient(0, 28, 0, 0, 28, 35 + s.multiplier * 0.3);
      engGlow.addColorStop(0, "rgba(255,200,50,0.9)");
      engGlow.addColorStop(0.3, "rgba(255,100,20,0.6)");
      engGlow.addColorStop(1, "rgba(255,50,0,0)");
      ctx.fillStyle = engGlow;
      ctx.beginPath(); ctx.ellipse(0, 32, 18 + s.multiplier * 0.1, 40 + s.multiplier * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ship body
      ctx.shadowBlur = 20; ctx.shadowColor = colors.glow;
      ctx.fillStyle = ctx.createLinearGradient(-12, -30, 12, 30) as unknown as string;
      const bodyG = ctx.createLinearGradient(-12, -30, 12, 30);
      bodyG.addColorStop(0, "#e2e8f0");
      bodyG.addColorStop(0.5, "#94a3b8");
      bodyG.addColorStop(1, "#334155");
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.bezierCurveTo(14, -10, 14, 10, 10, 30);
      ctx.lineTo(-10, 30); ctx.bezierCurveTo(-14, 10, -14, -10, 0, -30);
      ctx.fill();

      // Cockpit
      const cockG = ctx.createRadialGradient(-3, -16, 0, -3, -16, 9);
      cockG.addColorStop(0, "rgba(100,200,255,0.95)");
      cockG.addColorStop(1, "rgba(0,50,100,0.5)");
      ctx.fillStyle = cockG;
      ctx.beginPath(); ctx.ellipse(0, -16, 6, 9, 0, 0, Math.PI * 2); ctx.fill();

      // Wing fins
      ctx.fillStyle = "#475569";
      ctx.beginPath(); ctx.moveTo(10, 15); ctx.lineTo(26, 32); ctx.lineTo(10, 28); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, 15); ctx.lineTo(-26, 32); ctx.lineTo(-10, 28); ctx.closePath(); ctx.fill();

      // Nozzle
      ctx.fillStyle = "#1e293b";
      ctx.beginPath(); ctx.roundRect(-7, 26, 14, 8, 2); ctx.fill();

      ctx.restore();

      // Spawn trail particles
      if (s.tick % 2 === 0) spawnParticle(sx + Math.sin(angle + Math.PI) * 28, sy + Math.cos(angle + Math.PI) * 28, "trail", colors);
      if (s.tick % 5 === 0) spawnParticle(sx + (Math.random() - 0.5) * 20, sy + (Math.random() - 0.5) * 20, "spark", colors);
    }

    // ── Crash Explosion ──
    if (s.crashed && s.explosionTime < 60) {
      const et = s.explosionTime / 60;
      const ex = s.shipX, ey = s.shipY;
      for (let ring = 0; ring < 3; ring++) {
        const r = et * (W * 0.3) * (ring + 1) * 0.4;
        const alpha = (1 - et) * (0.8 - ring * 0.25);
        ctx.save();
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
        ctx.lineWidth = 4 - ring;
        ctx.shadowBlur = 30; ctx.shadowColor = "rgba(239,68,68,0.8)";
        ctx.stroke();
        ctx.restore();
      }
      // Core flash
      if (et < 0.2) {
        const fg = ctx.createRadialGradient(ex, ey, 0, ex, ey, et * W * 0.5);
        fg.addColorStop(0, `rgba(255,255,255,${(0.2 - et) * 5})`);
        fg.addColorStop(0.4, `rgba(255,100,0,${(0.2 - et) * 3})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, W, H);
      }
      s.explosionTime++;
    }

    // ── Multiplier display on canvas ──
    if (s.isPlaying || s.crashed || s.cashedOut) {
      const multText = s.multiplier.toFixed(2) + "×";
      const fontSize = Math.min(W * 0.16, 120);
      ctx.save();
      ctx.font = `900 ${fontSize}px 'Inter', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const multY = H * 0.38;

      if (s.crashed) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 60; ctx.shadowColor = "rgba(239,68,68,0.9)";
        ctx.fillText(multText, W / 2, multY);
        ctx.font = `800 ${fontSize * 0.28}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(239,68,68,0.85)";
        ctx.shadowBlur = 20;
        ctx.fillText("CRASHED!", W / 2, multY + fontSize * 0.62);
      } else if (s.cashedOut) {
        ctx.fillStyle = "#10b981";
        ctx.shadowBlur = 60; ctx.shadowColor = "rgba(16,185,129,0.9)";
        ctx.fillText(multText, W / 2, multY);
        ctx.font = `800 ${fontSize * 0.26}px 'Inter', sans-serif`;
        ctx.fillStyle = "#34d399";
        ctx.shadowBlur = 20;
        ctx.fillText(`₹${(betAmount * s.multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })} SECURED`, W / 2, multY + fontSize * 0.62);
      } else {
        // Pulsing glow at high multipliers
        const pulse = Math.sin(t * (3 + s.multiplier * 0.05)) * 0.15 + 0.85;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = colors.primary;
        ctx.shadowBlur = 40 + s.multiplier * 0.5; ctx.shadowColor = colors.glow;
        ctx.fillText(multText, W / 2, multY);
        ctx.globalAlpha = 1;

        // Label
        ctx.font = `700 ${fontSize * 0.2}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 0;
        ctx.fillText("CRASH X", W / 2, multY - fontSize * 0.68);
      }
      ctx.restore();

      // ── High multiplier ambient ring ──
      if (s.multiplier >= 5 && !s.crashed) {
        const ring = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
        const a = Math.min(0.35, (s.multiplier - 5) / 100);
        ring.addColorStop(0, "rgba(0,0,0,0)");
        ring.addColorStop(0.7, "rgba(0,0,0,0)");
        ring.addColorStop(1, colors.glow.replace(/[\d.]+\)$/, `${a})`));
        ctx.fillStyle = ring;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // ── Idle screen ──
    if (!s.isPlaying && !s.crashed) {
      ctx.save();
      ctx.font = `700 ${Math.min(W * 0.06, 32)}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillText("PLACE YOUR BET TO LAUNCH", W / 2, H * 0.65);
      // Animated crosshair
      const cr = 28 + Math.sin(t * 2) * 4;
      ctx.strokeStyle = "rgba(16,185,129,0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(W / 2, H * 0.48, cr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2 - cr * 1.5, H * 0.48); ctx.lineTo(W / 2 + cr * 1.5, H * 0.48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2, H * 0.48 - cr * 1.5); ctx.lineTo(W / 2, H * 0.48 + cr * 1.5); ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // camera shake restore
    s.tick++;
    animFrameRef.current = requestAnimationFrame(render);
  }, [betAmount]);

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
    stopCrashAudio(false);
    setUiState(prev => ({ ...prev, cashedOut: true, cashoutAmount: betAmount * targetMult, phase: "cashedout" }));
    spawnParticle(s.shipX, s.shipY, "explosion", getMultiplierColor(targetMult));
    try {
      const res = await fetch("/api/casino/mines/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cashout", email, sessionId: s.sessionId, clientMultiplier: targetMult }),
      });
      const data = await res.json();
      if (res.ok && data.success && !data.isBust) {
        onCompleteRef.current(targetMult, true);
      } else {
        onCompleteRef.current(0, false);
      }
    } catch { onCompleteRef.current(0, false); }
  }, [betAmount, email]);

  const handleCashoutRef = useRef(handleCashout);
  useEffect(() => { handleCashoutRef.current = handleCashout; }, [handleCashout]);

  // ─── Game Loop ────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    if (!isPlaying) {
      s.isPlaying = false;
      s.multiplier = 1.0;
      s.crashed = false;
      s.cashedOut = false;
      s.trailPoints = [];
      s.particles = [];
      s.explosionTime = 0;
      s.sessionId = null;
      s.tick = 0;
      stopCrashAudio(false);
      setUiState({ multiplier: 1.0, crashed: false, cashedOut: false, cashoutAmount: 0, phase: "idle" });
      return;
    }

    s.isPlaying = true;
    s.crashed = false;
    s.cashedOut = false;
    s.trailPoints = [];
    s.particles = [];
    s.explosionTime = 0;
    s.multiplier = 1.0;
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

          interval = setInterval(() => {
            if (!active) return;
            tick++;
            current += 0.01 + current * 0.015;
            updateCrashPitch(current);
            s.multiplier = current;
            s.lastMultiplier = current;

            // Ship flight path (canvas-space)
            const canvas = canvasRef.current;
            if (canvas) {
              const W = canvas.width, H = canvas.height;
              const maxTick = 180;
              const progress = Math.min(1, tick / maxTick);
              // Curved arc: x goes right, y goes up as multiplier grows
              const targetX = W * 0.08 + progress * W * 0.82;
              const heightFactor = Math.min(0.82, Math.log10(Math.max(1.01, current)) * 0.52);
              const targetY = H * 0.88 - heightFactor * H * 0.85;
              s.shipX = targetX;
              s.shipY = targetY;
              s.trailPoints.push({ x: targetX, y: targetY, mult: current });
              if (s.trailPoints.length > 300) s.trailPoints.shift();

              // Camera shake at high multipliers
              if (current > 10) s.cameraShake = Math.min(8, (current - 10) * 0.15);
            }

            onLiveTickRef.current?.(current);
            setUiState(prev => ({ ...prev, multiplier: current }));

            if (current >= target) {
              if (interval) clearInterval(interval);
              s.multiplier = target;
              s.crashed = true;
              s.isPlaying = false;
              s.explosionTime = 0;
              stopCrashAudio(true);
              // Explosion particles
              spawnParticle(s.shipX, s.shipY, "explosion", { primary: "#ef4444", secondary: "#fbbf24" });
              s.cameraShake = 20;
              setUiState({ multiplier: target, crashed: true, cashedOut: false, cashoutAmount: 0, phase: "crashed" });
              if (!s.cashedOut) onCompleteRef.current(target, false);
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

  // ─── Event listeners ──────────────────────────────────────
  useEffect(() => {
    const onCashout = () => {
      if (stateRef.current.isPlaying && !stateRef.current.crashed && !stateRef.current.cashedOut)
        handleCashoutRef.current();
    };
    window.addEventListener("trigger-cashout", onCashout);
    window.addEventListener("sidebar-trigger-cashout", onCashout);
    return () => {
      window.removeEventListener("trigger-cashout", onCashout);
      window.removeEventListener("sidebar-trigger-cashout", onCashout);
    };
  }, []);

  const colors = getMultiplierColor(uiState.multiplier);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[420px] overflow-hidden bg-[#03020f] rounded-xl">
      {/* Canvas arena */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── Live multiplier HUD (top center) ── */}
      <AnimatePresence>
        {uiState.phase === "flying" && (
          <motion.div
            key="live-hud"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div
              className="flex flex-col items-center px-5 py-2 rounded-2xl border backdrop-blur-md"
              style={{
                background: "rgba(0,0,0,0.55)",
                borderColor: colors.glow.replace(/[\d.]+\)$/, "0.35)"),
                boxShadow: `0 0 30px ${colors.glow.replace(/[\d.]+\)$/, "0.2)")}`,
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">LIVE MULTIPLIER</span>
              <span
                className="text-4xl sm:text-5xl font-black font-mono tracking-tighter leading-none tabular-nums"
                style={{ color: colors.primary, textShadow: `0 0 30px ${colors.glow}` }}
              >
                {uiState.multiplier.toFixed(2)}×
              </span>
              {isPlaying && (
                <span className="text-[10px] font-bold mt-1" style={{ color: colors.secondary }}>
                  ₹{(betAmount * uiState.multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Crashed overlay ── */}
      <AnimatePresence>
        {uiState.phase === "crashed" && (
          <motion.div
            key="crashed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400/70">Round Ended</div>
              <div className="text-6xl sm:text-8xl font-black font-mono text-red-500 leading-none"
                style={{ textShadow: "0 0 60px rgba(239,68,68,0.9), 0 0 120px rgba(239,68,68,0.4)" }}>
                {uiState.multiplier.toFixed(2)}×
              </div>
              <div className="text-xl font-black text-red-400 uppercase tracking-widest">CRASHED</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cashed out overlay ── */}
      <AnimatePresence>
        {uiState.phase === "cashedout" && (
          <motion.div
            key="cashedout"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center"
          >
            <div className="px-8 py-5 rounded-3xl border text-center backdrop-blur-xl"
              style={{ background: "rgba(0,0,0,0.75)", borderColor: "rgba(16,185,129,0.4)", boxShadow: "0 0 60px rgba(16,185,129,0.3)" }}>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Secured at</div>
              <div className="text-5xl sm:text-7xl font-black font-mono text-emerald-400 leading-none"
                style={{ textShadow: "0 0 40px rgba(16,185,129,0.8)" }}>
                {uiState.multiplier.toFixed(2)}×
              </div>
              <div className="text-2xl font-black text-white mt-2">
                ₹{uiState.cashoutAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cashout button (floating, in-canvas) ── */}
      <AnimatePresence>
        {isPlaying && !uiState.crashed && !uiState.cashedOut && (
          <motion.div
            key="cashout-btn"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              onClick={() => handleCashout()}
              className="group relative overflow-hidden flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-black transition-all active:scale-95 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, #10b981, #059669)`,
                boxShadow: `0 0 30px rgba(16,185,129,0.5), 0 8px 25px rgba(0,0,0,0.4)`,
              }}
            >
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="absolute inset-0 bg-white/15 rounded-2xl"
              />
              <span className="relative">CASHOUT</span>
              <span className="relative bg-black/25 px-3 py-1 rounded-xl text-sm font-black">
                ₹{(betAmount * uiState.multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating live wins (cosmetic) ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
        {isPlaying && uiState.multiplier > 2 && (
          <motion.div
            key={Math.floor(uiState.multiplier * 2)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="text-[10px] font-black px-2.5 py-1 rounded-lg border backdrop-blur-sm"
            style={{
              background: "rgba(0,0,0,0.6)",
              borderColor: colors.glow.replace(/[\d.]+\)$/, "0.3)"),
              color: colors.primary,
            }}
          >
            🔥 {(Math.random() * 8 + 2).toFixed(0)} players flying
          </motion.div>
        )}
      </div>
    </div>
  );
}
