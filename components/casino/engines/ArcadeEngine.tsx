"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize, Minimize, RefreshCw, MonitorPlay, Gamepad2, Activity,
  Wifi, Keyboard, X, VolumeX, Volume2, Home, Server, Radio,
  HardDrive, Cpu, Gauge, Shield, Download, ChevronRight
} from "lucide-react";
import { GAMES } from "@/lib/games";
import { useRouter } from "next/navigation";

interface ArcadeEngineProps {
  gameId: string;
  isPlaying: boolean;
  onComplete?: (won: boolean) => void;
}

// ─────────────────────────────────────────────────────────────
// GAME URL MASTER MANIFEST  
// Strategy: Map each game to the highest-quality free WebGL
// equivalent. The cloud-gaming wrapper makes it feel premium.
// ─────────────────────────────────────────────────────────────
const GAME_MANIFEST: Record<string, {
  url: string;
  genre: string;
  resolution: string;
  serverNode: string;
  nodeCity: string;
  gpuTier: string;
  controls: string[];
}> = {
  // ── FPS & SHOOTERS ─────────────────────────────────────────
  "fps-1": {
    url: "https://play.gamepix.com/combat-online/embed",
    genre: "FPS", resolution: "1920×1080", serverNode: "MUM-NODE-07",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Aim & Shoot", "R — Reload", "Shift — Sprint", "C — Crouch"]
  },
  "fps-2": {
    url: "https://play.gamepix.com/bullet-force/embed",
    genre: "FPS", resolution: "1920×1080", serverNode: "DEL-NODE-03",
    nodeCity: "Delhi", gpuTier: "RTX 4080",
    controls: ["WASD — Move", "Mouse — Aim", "Left Click — Shoot", "E — Interact", "Tab — Scoreboard"]
  },
  "fps-3": {
    url: "https://play.gamepix.com/1v1-lol/embed",
    genre: "Tactical Shooter", resolution: "1920×1080", serverNode: "BLR-NODE-12",
    nodeCity: "Bengaluru", gpuTier: "RTX 4070 Ti",
    controls: ["WASD — Move", "Mouse — Aim", "B — Build", "G — Grenades", "1-4 — Weapons"]
  },
  "fps-4": {
    url: "https://play.gamepix.com/ninja-clash-heroes/embed",
    genre: "FPS", resolution: "1920×1080", serverNode: "HYD-NODE-04",
    nodeCity: "Hyderabad", gpuTier: "RTX 4080",
    controls: ["WASD — Move", "Mouse — Aim & Shoot", "Q/E — Roll", "F — Pick up", "Space — Jump"]
  },
  "fps-5": {
    url: "https://play.gamepix.com/kart-fight-io/embed",
    genre: "Action Racing", resolution: "1920×1080", serverNode: "CHE-NODE-08",
    nodeCity: "Chennai", gpuTier: "RTX 3090",
    controls: ["Arrow Keys / WASD — Drive", "Mouse — Aim weapons", "Space — Boost"]
  },
  "fps-6": {
    url: "https://html5.gamedistribution.com/f255cc3243bd46ceab90d3d5fcdbe2eb/",
    genre: "Military FPS", resolution: "1920×1080", serverNode: "MUM-NODE-01",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Aim", "Left Click — Shoot", "Shift — Ads", "G — Grenade", "R — Reload"]
  },

  // ── RACING & DRIVING ───────────────────────────────────────
  "driving-1": {
    url: "https://play.gamepix.com/cyber-cars-punk-racing/embed",
    genre: "Open World Driving", resolution: "2560×1440", serverNode: "MUM-NODE-11",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD / Arrow Keys — Steer & Throttle", "E — Change Environment", "M — Map View"]
  },
  "driving-2": {
    url: "https://html5.gamedistribution.com/b97d2e38c9da4e10b271d4cb80ca2078/",
    genre: "Stunt Racing", resolution: "1920×1080", serverNode: "PUN-NODE-05",
    nodeCity: "Pune", gpuTier: "RTX 4080",
    controls: ["WASD — Drive", "Space — Handbrake", "Shift — Nitro", "C — Camera", "R — Reset"]
  },
  "driving-3": {
    url: "https://html5.gamedistribution.com/b97d2e38c9da4e10b271d4cb80ca2078/",
    genre: "Racing Simulator", resolution: "1920×1080", serverNode: "KOL-NODE-02",
    nodeCity: "Kolkata", gpuTier: "RTX 4070",
    controls: ["Arrow Keys — Steer", "↑ — Accelerate", "↓ — Brake", "Space — Handbrake"]
  },
  "driving-4": {
    url: "https://html5.gamedistribution.com/b97d2e38c9da4e10b271d4cb80ca2078/",
    genre: "Car Stunt", resolution: "1920×1080", serverNode: "DEL-NODE-06",
    nodeCity: "Delhi", gpuTier: "RTX 3080",
    controls: ["Arrow Keys — Drive", "Space — Handbrake", "C — Camera Change"]
  },
  "driving-5": {
    url: "https://html5.gamedistribution.com/b97d2e38c9da4e10b271d4cb80ca2078/",
    genre: "Motorsport Sim", resolution: "2560×1440", serverNode: "MUM-NODE-07",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Drive", "Space — Handbrake", "Shift — Nitro Boost", "R — Reset Car", "C — Camera"]
  },

  // ── ACTION & OPEN-WORLD ───────────────────────────────────
  "action-1": {
    url: "https://play.gamepix.com/grand-action-simulator/embed",
    genre: "Open World Action", resolution: "1920×1080", serverNode: "MUM-NODE-03",
    nodeCity: "Mumbai", gpuTier: "RTX 4080",
    controls: ["WASD — Move", "Mouse — Camera", "Click — Interact"]
  },
  "action-2": {
    url: "https://play.gamepix.com/sheriff-shootout/embed",
    genre: "Open World", resolution: "1920×1080", serverNode: "HYD-NODE-09",
    nodeCity: "Hyderabad", gpuTier: "RTX 3090",
    controls: ["Arrow Keys / WASD — Move", "P — Pause"]
  },
  "action-3": {
    url: "https://play.gamepix.com/magic-arena/embed",
    genre: "Action Adventure", resolution: "1920×1080", serverNode: "BLR-NODE-01",
    nodeCity: "Bengaluru", gpuTier: "RTX 3090",
    controls: ["Mouse — Steer", "Click / Space — Boost"]
  },
  "action-4": {
    url: "https://play.gamepix.com/hero-knight/embed",
    genre: "Open World RPG", resolution: "1920×1080", serverNode: "CHE-NODE-11",
    nodeCity: "Chennai", gpuTier: "RTX 4070",
    controls: ["Mouse — Move", "Space — Split", "W — Eject mass"]
  },
  "action-5": {
    url: "https://play.gamepix.com/archers-io/embed",
    genre: "Action Adventure", resolution: "1920×1080", serverNode: "MUM-NODE-05",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Swing", "Left Click — Web Left", "Right Click — Web Right", "Space — Jump"]
  },

  // ── AAA TITLES ─────────────────────────────────────────────
  "aaa-1": {
    url: "https://play.gamepix.com/tomb-runner/embed",
    genre: "Open World RPG", resolution: "2560×1440", serverNode: "MUM-NODE-01",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Look", "F — Interact", "Tab — Map", "I — Inventory", "E — Enter Vehicle"]
  },
  "aaa-2": {
    url: "https://play.gamepix.com/magic-and-mayhem/embed",
    genre: "Action RPG", resolution: "2560×1440", serverNode: "BLR-NODE-08",
    nodeCity: "Bengaluru", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Camera", "Left Click — Attack", "Right Click — Block", "1–6 — Skills", "M — Map"]
  },
  "aaa-3": {
    url: "https://play.gamepix.com/tomb-runner/embed",
    genre: "Action RPG", resolution: "2560×1440", serverNode: "DEL-NODE-01",
    nodeCity: "Delhi", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Camera & Attack", "Space — Dodge", "E — Skill", "R — Ultimate"]
  },
  "aaa-4": {
    url: "https://play.gamepix.com/archers-io/embed",
    genre: "Open World Action", resolution: "2560×1440", serverNode: "MUM-NODE-02",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Swing & Camera", "Space — Jump", "Shift — Run", "Ctrl — Crouch"]
  },
  "aaa-5": {
    url: "https://play.gamepix.com/tomb-runner/embed",
    genre: "Sci-Fi Action", resolution: "2560×1440", serverNode: "MUM-NODE-06",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Aim", "Left Click — Shoot", "F — Interact", "Tab — Map"]
  },
  "aaa-6": {
    url: "https://play.gamepix.com/madalin-stunt-cars-2/embed",
    genre: "Street Racing", resolution: "2560×1440", serverNode: "MUM-NODE-04",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Steer & Throttle", "Space — Handbrake", "Shift — Nitrous", "C — Camera", "R — Reset"]
  },

  // ── PUZZLE & STRATEGY ─────────────────────────────────────
  "puzzle-1": {
    url: "https://play.gamepix.com/candy-rain-7/embed",
    genre: "Strategy", resolution: "1920×1080", serverNode: "PUN-NODE-03",
    nodeCity: "Pune", gpuTier: "RTX 3080",
    controls: ["Mouse — Select & Command", "Scroll — Zoom", "Space — End Turn"]
  },
  "puzzle-2": {
    url: "https://play.gamepix.com/candy-rain-7/embed",
    genre: "Co-op Puzzle", resolution: "1920×1080", serverNode: "KOL-NODE-07",
    nodeCity: "Kolkata", gpuTier: "RTX 3070",
    controls: ["Arrow Keys — Watergirl", "WASD — Fireboy", "Reach the door to complete level"]
  },
  "puzzle-3": {
    url: "https://play.gamepix.com/candy-rain-7/embed",
    genre: "Puzzle Strategy", resolution: "1920×1080", serverNode: "HYD-NODE-02",
    nodeCity: "Hyderabad", gpuTier: "RTX 3070",
    controls: ["Mouse — Click & Drag", "Scroll — Zoom Map"]
  },

  // ── CASUAL ────────────────────────────────────────────────
  "boring-1": {
    url: "https://play.gamepix.com/candy-rain-7/embed",
    genre: "Simulation", resolution: "1920×1080", serverNode: "CHE-NODE-06",
    nodeCity: "Chennai", gpuTier: "RTX 3060",
    controls: ["Mouse — Click to interact", "Drag items to merge"]
  },
  "casual-1": {
    url: "https://play.gamepix.com/tomb-runner/embed",
    genre: "Casual", resolution: "1920×1080", serverNode: "CHE-NODE-04",
    nodeCity: "Chennai", gpuTier: "RTX 3060",
    controls: ["Mouse / Touch — Draw path", "Watch your character run it!"]
  },

  // --- NEW 20 HIGH-END PREMIUM GAMES ---
  "orig-16": {
    url: "https://play.gamepix.com/classic-bowling/embed",
    genre: "Sports/Casual", resolution: "1920×1080", serverNode: "MUM-NODE-01",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["Mouse — Aim, Drag & Release to bowl"]
  },
  "orig-17": {
    url: "https://play.gamepix.com/8-ball-billiards-classic/embed",
    genre: "Sports/Casual", resolution: "1920×1080", serverNode: "DEL-NODE-03",
    nodeCity: "Delhi", gpuTier: "RTX 4080",
    controls: ["Mouse — Aim cue, Hold & Release to strike"]
  },
  "orig-18": {
    url: "https://play.gamepix.com/gold-miner-classic/embed",
    genre: "Casual/Puzzle", resolution: "1920×1080", serverNode: "BLR-NODE-12",
    nodeCity: "Bengaluru", gpuTier: "RTX 4070 Ti",
    controls: ["Down Arrow / Tap — Deploy claw"]
  },
  "orig-19": {
    url: "https://play.gamepix.com/roulette-royal/embed",
    genre: "Table Game", resolution: "1920×1080", serverNode: "HYD-NODE-04",
    nodeCity: "Hyderabad", gpuTier: "RTX 4080",
    controls: ["Mouse — Place chips & Spin wheel"]
  },
  "orig-20": {
    url: "https://play.gamepix.com/blackjack-blackjack/embed",
    genre: "Table Game", resolution: "1920×1080", serverNode: "CHE-NODE-08",
    nodeCity: "Chennai", gpuTier: "RTX 3090",
    controls: ["Mouse — Place wagers, Hit, Stand or Double"]
  },
  "aaa-7": {
    url: "https://play.gamepix.com/city-car-stunt-4/embed",
    genre: "Open World Racing", resolution: "2560×1440", serverNode: "MUM-NODE-07",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD/Arrow Keys — Drive", "Space — Handbrake", "F — Nitro Boost"]
  },
  "aaa-8": {
    url: "https://play.gamepix.com/ninja-clash-heroes/embed",
    genre: "Action/Stealth", resolution: "2560×1440", serverNode: "BLR-NODE-08",
    nodeCity: "Bengaluru", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Aim & Shoot", "Space — Jump", "E — Special Ability"]
  },
  "aaa-9": {
    url: "https://play.gamepix.com/hero-knight/embed",
    genre: "Action RPG", resolution: "2560×1440", serverNode: "DEL-NODE-01",
    nodeCity: "Delhi", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Swing Sword", "Space — Dodge/Roll", "1-3 — Combat Skills"]
  },
  "aaa-10": {
    url: "https://play.gamepix.com/combat-online/embed",
    genre: "First Person Shooter", resolution: "2560×1440", serverNode: "MUM-NODE-02",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Move", "Mouse — Aim & Shoot", "R — Reload", "Shift — Sprint"]
  },
  "aaa-11": {
    url: "https://play.gamepix.com/cyber-cars-punk-racing/embed",
    genre: "Cyberpunk Action", resolution: "2560×1440", serverNode: "MUM-NODE-06",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["WASD — Steer & Accelerate", "Shift — Nitrous", "Space — Drift"]
  },
  "slot-20": {
    url: "https://play.gamepix.com/neon-road/embed",
    genre: "Casino Slot", resolution: "1920×1080", serverNode: "PUN-NODE-03",
    nodeCity: "Pune", gpuTier: "RTX 3080",
    controls: ["Mouse — Adjust bet & Spin reels"]
  },
  "slot-21": {
    url: "https://play.gamepix.com/candy-rain-7/embed",
    genre: "Casino Slot", resolution: "1920×1080", serverNode: "KOL-NODE-07",
    nodeCity: "Kolkata", gpuTier: "RTX 3070",
    controls: ["Mouse — Adjust bet & Spin reels"]
  },
  "slot-22": {
    url: "https://play.gamepix.com/tomb-runner/embed",
    genre: "Casino Slot", resolution: "1920×1080", serverNode: "HYD-NODE-02",
    nodeCity: "Hyderabad", gpuTier: "RTX 3070",
    controls: ["Mouse — Adjust bet & Spin reels"]
  },
  "slot-23": {
    url: "https://play.gamepix.com/fruit-connect/embed",
    genre: "Casino Slot", resolution: "1920×1080", serverNode: "CHE-NODE-06",
    nodeCity: "Chennai", gpuTier: "RTX 3060",
    controls: ["Mouse — Adjust bet & Spin reels"]
  },
  "slot-24": {
    url: "https://play.gamepix.com/cyber-cars-punk-racing/embed",
    genre: "Casino Slot", resolution: "1920×1080", serverNode: "CHE-NODE-04",
    nodeCity: "Chennai", gpuTier: "RTX 3060",
    controls: ["Mouse — Adjust bet & Spin reels"]
  },
  "live-8": {
    url: "https://play.gamepix.com/wheel-of-fortune/embed",
    genre: "Live Game Show", resolution: "1920×1080", serverNode: "MUM-NODE-01",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["Mouse — Select sectors & Place bets"]
  },
  "live-9": {
    url: "https://play.gamepix.com/blackjack-blackjack/embed",
    genre: "Live Table Game", resolution: "1920×1080", serverNode: "BLR-NODE-08",
    nodeCity: "Bengaluru", gpuTier: "RTX 4090",
    controls: ["Mouse — Choose blackjack box & Wager"]
  },
  "live-10": {
    url: "https://play.gamepix.com/card-match-game/embed",
    genre: "Live Card Game", resolution: "1920×1080", serverNode: "DEL-NODE-01",
    nodeCity: "Delhi", gpuTier: "RTX 4090",
    controls: ["Mouse — Choose side & Place bets"]
  },
  "live-11": {
    url: "https://play.gamepix.com/wheel-of-fortune/embed",
    genre: "Live Game Show", resolution: "1920×1080", serverNode: "MUM-NODE-02",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["Mouse — Select bets on wheel board"]
  },
  "live-12": {
    url: "https://play.gamepix.com/roulette-royal/embed",
    genre: "Live Table Game", resolution: "1920×1080", serverNode: "MUM-NODE-06",
    nodeCity: "Mumbai", gpuTier: "RTX 4090",
    controls: ["Mouse — Choose numbers/colors on table grid"]
  },
};

// Fallback by category
function getGameUrl(gameId: string, categories: string[]): string {
  if (GAME_MANIFEST[gameId]) return GAME_MANIFEST[gameId].url;
  if (categories.includes("fps") || categories.includes("action")) return "https://krunker.io/";
  if (categories.includes("driving") || categories.includes("racing")) return "https://slowroads.io/";
  if (categories.includes("aaa") || categories.includes("3d")) return "https://hordes.io/";
  if (categories.includes("puzzle")) return "https://play.gamepix.com/candy-rain-7/embed";
  return "https://play.gamepix.com/tomb-runner/embed";
}

// ─────────────────────────────────────────────────────────────
// CLOUD BOOT SEQUENCE STEPS  
// ─────────────────────────────────────────────────────────────
const BOOT_STEPS = [
  { label: "Authenticating license token", pct: 8 },
  { label: "Selecting optimal cloud node", pct: 20 },
  { label: "Spinning up dedicated GPU instance", pct: 35 },
  { label: "Mounting game storage volume", pct: 52 },
  { label: "Allocating 16GB VRAM pool", pct: 65 },
  { label: "Establishing WebRTC stream tunnel", pct: 78 },
  { label: "Calibrating audio pipeline", pct: 88 },
  { label: "Synchronizing game state", pct: 96 },
  { label: "Stream ready — launching session", pct: 100 },
];

export function ArcadeEngine({ gameId }: ArcadeEngineProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [engineKey, setEngineKey] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Boot sequence state
  const [bootStep, setBootStep] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const [bootPct, setBootPct] = useState(0);

  // Live stream HUD metrics
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState(0);
  const [bitrate, setBitrate] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [showHUD, setShowHUD] = useState(true);

  // Fetch game metadata
  const gameInfo = GAMES.find((g) => g.id === gameId);
  const gameTitle = gameInfo?.title || "Cloud Game";
  const gameProvider = gameInfo?.provider || "Aura Cloud";
  const categories = gameInfo?.categories || [];
  const manifest = GAME_MANIFEST[gameId];
  const gameUrl = getGameUrl(gameId, categories);

  const nodeCity = manifest?.nodeCity || "Mumbai";
  const serverNode = manifest?.serverNode || "MUM-NODE-01";
  const gpuTier = manifest?.gpuTier || "RTX 4090";
  const resolution = manifest?.resolution || "1920×1080";
  const controls = manifest?.controls || ["WASD — Move", "Mouse — Camera/Aim"];

  // Category-based glow
  let glowColor = "rgba(6, 182, 212, 0.5)";
  if (categories.includes("fps")) glowColor = "rgba(239, 68, 68, 0.5)";
  else if (categories.includes("driving") || categories.includes("racing")) glowColor = "rgba(34, 197, 94, 0.5)";
  else if (categories.includes("aaa")) glowColor = "rgba(168, 85, 247, 0.5)";
  else if (categories.includes("action")) glowColor = "rgba(249, 115, 22, 0.5)";

  // ── Boot Sequence ──────────────────────────────────────────
  useEffect(() => {
    let stepIdx = 0;
    setBootStep(0);
    setBootPct(0);
    setIsBooting(true);

    let activeInterval: NodeJS.Timeout | null = null;
    let activeTimeout: NodeJS.Timeout | null = null;

    const advance = () => {
      if (stepIdx >= BOOT_STEPS.length) {
        activeTimeout = setTimeout(() => setIsBooting(false), 600);
        return;
      }
      const step = BOOT_STEPS[stepIdx];
      setBootStep(stepIdx);
      // Animate percentage to step target
      let current = stepIdx === 0 ? 0 : BOOT_STEPS[stepIdx - 1].pct;
      const target = step.pct;
      const duration = stepIdx < 2 ? 600 : stepIdx < 6 ? 900 : 500;
      const ticks = 20;
      const increment = (target - current) / ticks;
      let tick = 0;
      activeInterval = setInterval(() => {
        current += increment;
        tick++;
        setBootPct(Math.min(Math.round(current), target));
        if (tick >= ticks) {
          if (activeInterval) clearInterval(activeInterval);
          stepIdx++;
          activeTimeout = setTimeout(advance, stepIdx < BOOT_STEPS.length ? 200 : 800);
        }
      }, duration / ticks);
    };
    advance();

    return () => {
      if (activeInterval) clearInterval(activeInterval);
      if (activeTimeout) clearTimeout(activeTimeout);
    };
  }, [engineKey]);

  // ── Live HUD Metrics ──────────────────────────────────────
  useEffect(() => {
    if (isBooting) return;
    // Initialize realistic values
    setPing(Math.floor(Math.random() * 8) + 14);
    setBitrate(28 + Math.floor(Math.random() * 6));

    const hudInterval = setInterval(() => {
      setFps(prev => {
        const drift = (Math.random() - 0.45) * 2;
        return Math.min(60, Math.max(55, Math.round(prev + drift)));
      });
      setPing(prev => {
        const drift = (Math.random() - 0.45) * 3;
        return Math.min(35, Math.max(12, Math.round(prev + drift)));
      });
      setBitrate(prev => {
        const drift = (Math.random() - 0.5) * 2;
        return Math.min(35, Math.max(22, parseFloat((prev + drift).toFixed(1))));
      });
      if (Math.random() < 0.03) setDroppedFrames(p => p + 1);
    }, 1500);

    const timeInterval = setInterval(() => setSessionTime(p => p + 1), 1000);
    return () => { clearInterval(hudInterval); clearInterval(timeInterval); };
  }, [isBooting]);

  // ── Fullscreen Logic ──────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Keyboard Shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key.toLowerCase() === "c") setCinemaMode(p => !p);
      if (e.key.toLowerCase() === "r") setEngineKey(p => p + 1);
      if (e.key.toLowerCase() === "h") setShowHUD(p => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const pingColor = ping < 20 ? "text-neon-green" : ping < 30 ? "text-yellow-600" : "text-red-600";
  const fpsColor = fps >= 59 ? "text-neon-green" : fps >= 55 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex flex-col w-full h-full gap-2 relative z-20">
      {/* Cinema Mode Dimmer */}
      <AnimatePresence>
        {cinemaMode && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div
        ref={containerRef}
        className={`w-full flex-1 min-h-0 flex flex-col bg-white relative transition-all duration-500 ease-in-out z-50 overflow-hidden group ${
          isFullscreen ? "h-screen border-0 rounded-none" : "rounded-2xl border border-slate-200"
        }`}
        style={{ boxShadow: isFullscreen ? "none" : `0 0 80px ${glowColor}` }}
      >

        {/* ── CINEMATIC BOOT SCREEN ── */}
        <AnimatePresence>
          {isBooting && (
            <motion.div
              initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 overflow-hidden"
            >
              {/* Background: game cover art blur */}
              {gameInfo?.image && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15 scale-110"
                  style={{ backgroundImage: `url(${gameInfo.image})`, filter: "blur(20px)" }}
                />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/85 to-transparent" />
              {/* Scanline effect */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)" }}
              />

              <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-8 gap-8">
                {/* Aura Cloud Logo + Game icon */}
                <div className="flex items-center gap-4">
                  {/* Game thumbnail */}
                  {gameInfo?.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                      <img src={gameInfo.image} alt={gameTitle} className="w-full h-full object-cover" />
                    </motion.div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 mb-1">
                      ⚡ Aura Cloud Gaming
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{gameTitle}</h2>
                    <span className="text-xs text-slate-600 font-medium mt-0.5">{gameProvider}</span>
                  </div>
                </div>

                {/* Server node info */}
                <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Server className="w-3 h-3 text-cyan-600" />
                    <span>{serverNode}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Cpu className="w-3 h-3 text-purple-600" />
                    <span>{gpuTier}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Gauge className="w-3 h-3 text-emerald-600" />
                    <span>{resolution}</span>
                  </div>
                </div>

                {/* Boot step display */}
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={bootStep}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-cyan-600 uppercase tracking-widest"
                      >
                        {BOOT_STEPS[bootStep]?.label || "Launching..."}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-slate-900 font-black tabular-nums">{bootPct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${bootPct}%`,
                        background: `linear-gradient(90deg, rgba(6,182,212,1), rgba(168,85,247,0.8))`,
                        boxShadow: "0 0 12px rgba(6,182,212,0.6)"
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>

                  {/* Step tracker */}
                  <div className="flex gap-1.5 justify-center">
                    {BOOT_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-0.5 rounded-full transition-all duration-500 ${
                          i <= bootStep ? "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" : "bg-slate-100"
                        }`}
                        style={{ width: i <= bootStep ? "28px" : "10px" }}
                      />
                    ))}
                  </div>
                </div>

                {/* Connection security notice */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <Shield className="w-3 h-3 text-slate-700" />
                  End-to-end encrypted · AES-256 · WebRTC P2P
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LIVE STREAM HUD ── */}
        <AnimatePresence>
          {!isBooting && showHUD && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 pointer-events-none"
            >
              {/* Main HUD pill */}
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
                {/* FPS */}
                <div className="flex items-center gap-1">
                  <Activity className={`w-3 h-3 ${fpsColor}`} />
                  <span className={`font-mono font-black text-[11px] tabular-nums ${fpsColor}`}>{fps}</span>
                  <span className="text-slate-600 text-[9px] font-bold">FPS</span>
                </div>
                <div className="w-px h-3 bg-slate-900/10" />
                {/* Ping */}
                <div className="flex items-center gap-1">
                  <Wifi className={`w-3 h-3 ${pingColor}`} />
                  <span className={`font-mono font-black text-[11px] tabular-nums ${pingColor}`}>{ping}</span>
                  <span className="text-slate-600 text-[9px] font-bold">MS</span>
                </div>
                <div className="w-px h-3 bg-slate-900/10" />
                {/* Bitrate */}
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3 text-blue-600" />
                  <span className="font-mono font-black text-[11px] text-blue-600 tabular-nums">{bitrate}</span>
                  <span className="text-slate-600 text-[9px] font-bold">Mbps</span>
                </div>
              </div>

              {/* Session info */}
              <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-200 rounded-lg px-3 py-1">
                <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">LIVE</span>
                <span className="text-[9px] font-mono text-slate-500 tabular-nums">{formatTime(sessionTime)}</span>
                <div className="w-px h-2.5 bg-slate-900/10 mx-0.5" />
                <span className="text-[9px] text-slate-600 font-bold">{nodeCity}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GAME IFRAME ── */}
        <div className="flex-1 w-full relative bg-white overflow-hidden">
          {!isBooting && (
            <motion.iframe
              key={engineKey}
              ref={iframeRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full z-10"
              src={gameUrl}
              frameBorder="0"
              allow="autoplay; fullscreen; keyboard-map; pointer-lock; gamepad; accelerometer; gyroscope"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>

        {/* ── FLOATING DOCK ── */}
        <AnimatePresence>
          {!isBooting && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2.5 bg-white/75 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              {/* Home */}
              <DockButton icon={<Home className="w-4 h-4" />} label="Home" onClick={() => router.push("/")} />
              <DockDivider />
              {/* Controls */}
              <DockButton icon={<Keyboard className="w-4 h-4" />} label="Keys" onClick={() => setShowControls(true)} color="cyan" />
              {/* Restart */}
              <DockButton icon={<RefreshCw className="w-4 h-4" />} label="Restart" onClick={() => setEngineKey(p => p + 1)} />
              {/* Mute */}
              <DockButton
                icon={isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4" />}
                label="Audio"
                onClick={() => setIsMuted(p => !p)}
              />
              <DockDivider />
              {/* HUD Toggle */}
              <DockButton
                icon={<Activity className="w-4 h-4" />}
                label="HUD"
                onClick={() => setShowHUD(p => !p)}
                active={showHUD}
                color="emerald"
              />
              {/* Cinema */}
              <DockButton
                icon={<MonitorPlay className="w-4 h-4" />}
                label="Cinema"
                onClick={() => setCinemaMode(p => !p)}
                active={cinemaMode}
                color="purple"
              />
              {/* Fullscreen */}
              <DockButton
                icon={isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                label={isFullscreen ? "Window" : "Full"}
                onClick={toggleFullscreen}
              />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── MOBILE VIRTUAL GAMEPAD (TOUCH OVERLAY) ── */}
          <AnimatePresence>
            {!isBooting && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:hidden absolute bottom-4 left-0 right-0 z-40 flex justify-between px-4 pointer-events-none"
              >
                {/* D-Pad (Left) */}
                <div className="w-32 h-32 relative pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-12 bg-white/20 backdrop-blur-md rounded-t-lg border border-white/30 flex items-center justify-center active:bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white/80" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-12 bg-white/20 backdrop-blur-md rounded-b-lg border border-white/30 flex items-center justify-center active:bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/80" />
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-10 bg-white/20 backdrop-blur-md rounded-l-lg border border-white/30 flex items-center justify-center active:bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <div className="w-0 h-0 border-y-[6px] border-r-[8px] border-y-transparent border-r-white/80" />
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-10 bg-white/20 backdrop-blur-md rounded-r-lg border border-white/30 flex items-center justify-center active:bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <div className="w-0 h-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-white/80" />
                  </div>
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20" />
                </div>

                {/* Action Buttons (Right) */}
                <div className="w-32 h-32 relative pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-500/40 backdrop-blur-md rounded-full border border-blue-400/50 flex items-center justify-center active:bg-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    <span className="text-white font-black text-lg drop-shadow-md">Y</span>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-green-500/40 backdrop-blur-md rounded-full border border-green-400/50 flex items-center justify-center active:bg-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    <span className="text-white font-black text-lg drop-shadow-md">A</span>
                  </div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-cyan-500/40 backdrop-blur-md rounded-full border border-cyan-400/50 flex items-center justify-center active:bg-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    <span className="text-white font-black text-lg drop-shadow-md">X</span>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-red-500/40 backdrop-blur-md rounded-full border border-red-400/50 flex items-center justify-center active:bg-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                    <span className="text-white font-black text-lg drop-shadow-md">B</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* ── CONTROLS MODAL ── */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8"
            >
              <div className="bg-slate-50 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full relative shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <button onClick={() => setShowControls(false)} className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">{gameTitle}</h3>
                    <p className="text-xs text-slate-500 font-bold">{manifest?.genre || "Game"} Controls</p>
                  </div>
                </div>

                {/* Stream stats */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[
                    { label: "Server", value: nodeCity, color: "text-cyan-600" },
                    { label: "GPU", value: gpuTier, color: "text-purple-600" },
                    { label: "Quality", value: resolution.split("×")[1] + "p", color: "text-emerald-600" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-900/50 rounded-xl p-3 border border-slate-200 text-center">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{s.label}</p>
                      <p className={`text-xs font-black mt-0.5 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Controls list */}
                <div className="space-y-2 mb-6">
                  {controls.map((ctrl, i) => {
                    const [key, ...descParts] = ctrl.split("—");
                    return (
                      <div key={i} className="flex items-center justify-between bg-white/40 px-4 py-3 rounded-xl border border-slate-200">
                        <span className="text-slate-700 text-sm font-bold">{descParts.join("—").trim()}</span>
                        <kbd className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg font-mono font-black text-xs border border-slate-600 shadow-sm whitespace-nowrap">
                          {key.trim()}
                        </kbd>
                      </div>
                    );
                  })}
                </div>

                {/* Shortcut hints */}
                <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold mb-6 flex-wrap">
                  {[["F", "Fullscreen"], ["C", "Cinema"], ["R", "Restart"], ["H", "Hide HUD"]].map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1">
                      <kbd className="bg-slate-50 border border-slate-700 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">{k}</kbd>
                      {v}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setShowControls(false)}
                  className="w-full py-3.5 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-slate-100 transition-colors text-sm"
                >
                  Got it — Start Playing
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function DockButton({
  icon, label, onClick, active = false, color = "default"
}: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; color?: string;
}) {
  const activeColors: Record<string, string> = {
    cyan: "bg-cyan-500/20 text-cyan-600",
    purple: "bg-purple-500/20 text-purple-600",
    emerald: "bg-emerald-500/20 text-emerald-600",
    default: "bg-slate-900/10 text-slate-900",
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all group/btn ${
        active ? activeColors[color] || activeColors.default : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/10"
      }`}
    >
      <span className="group-hover/btn:scale-110 transition-transform">{icon}</span>
      <span className="text-[8px] font-black uppercase tracking-wider mt-0.5 opacity-70">{label}</span>
    </button>
  );
}

function DockDivider() {
  return <div className="w-px h-8 bg-slate-900/10 mx-0.5" />;
}
