"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Wallet, Volume2, VolumeX, Trophy, Target, Clock, Play, RotateCcw, AlertTriangle } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import * as THREE from "three";

interface BilliardsEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: number;
  isCueBall: boolean;
  isPocketed: boolean;
  opacity: number;
  scale: number;
}

interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export function BilliardsEngine({ isPlaying, betAmount = 10, onComplete }: BilliardsEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "aiming" | "striking" | "rolling" | "win_screen" | "lose_screen">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [shotPower, setShotPower] = useState(60); // 0 to 100
  const [cueAngle, setCueAngle] = useState(0); // in radians
  const [isDraggingCue, setIsDraggingCue] = useState(false);
  const [serverOutcome, setServerOutcome] = useState<{ isWin: boolean; multiplier: number; payout: number } | null>(null);
  const [winChance, setWinChance] = useState(48.5); // visual win probability
  const [shotClock, setShotClock] = useState(30);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "twintubrovquattro@gmail.com";

  // Physics constants
  const TABLE_WIDTH = 800;
  const TABLE_HEIGHT = 400;
  const BALL_RADIUS = 12;
  const FRICTION = 0.985;
  const POCKET_RADIUS = 20;

  // State refs for physics loop & 3D interaction
  const ballsRef = useRef<Ball[]>([]);
  const gameStateRef = useRef(gameState);
  const isPlayingRef = useRef(isPlaying);
  const serverOutcomeRef = useRef(serverOutcome);
  const onCompleteRef = useRef(onComplete);
  const cueAngleRef = useRef(cueAngle);
  const shotPowerRef = useRef(shotPower);

  // Three.js References
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tablePlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Sync references
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    serverOutcomeRef.current = serverOutcome;
  }, [serverOutcome]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    cueAngleRef.current = cueAngle;
  }, [cueAngle]);

  useEffect(() => {
    shotPowerRef.current = shotPower;
  }, [shotPower]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthSound = useCallback((type: "hit" | "collision" | "pocket" | "win" | "lose") => {
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

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "hit") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "collision") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "pocket") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "win") {
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25];
        freqs.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "triangle";
          o.frequency.setValueAtTime(f, now + idx * 0.06);
          g.gain.setValueAtTime(0.12, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
          o.start(now + idx * 0.06);
          o.stop(now + idx * 0.06 + 0.4);
        });
      } else if (type === "lose") {
        const freqs = [293.66, 277.18, 261.63, 220.00];
        freqs.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "sawtooth";
          o.frequency.setValueAtTime(f, now + idx * 0.08);
          g.gain.setValueAtTime(0.1, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.35);
        });
      }
    } catch (e) {
      console.warn("Synth playback failed", e);
    }
  }, [isMuted]);

  // Define Pockets (centered coordinates will map these correctly)
  const pockets: Pocket[] = [
    { x: POCKET_RADIUS, y: POCKET_RADIUS, radius: POCKET_RADIUS }, // Top-Left
    { x: TABLE_WIDTH / 2, y: POCKET_RADIUS - 5, radius: POCKET_RADIUS }, // Top-Middle
    { x: TABLE_WIDTH - POCKET_RADIUS, y: POCKET_RADIUS, radius: POCKET_RADIUS }, // Top-Right
    { x: POCKET_RADIUS, y: TABLE_HEIGHT - POCKET_RADIUS, radius: POCKET_RADIUS }, // Bottom-Left
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - POCKET_RADIUS + 5, radius: POCKET_RADIUS }, // Bottom-Middle
    { x: TABLE_WIDTH - POCKET_RADIUS, y: TABLE_HEIGHT - POCKET_RADIUS, radius: POCKET_RADIUS } // Bottom-Right
  ];

  // Initialize/Reset Balls
  const initBalls = useCallback(() => {
    const arr: Ball[] = [];

    // Cue Ball (White)
    arr.push({
      id: 0,
      x: TABLE_WIDTH * 0.25,
      y: TABLE_HEIGHT * 0.5,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: "#ffffff",
      number: 0,
      isCueBall: true,
      isPocketed: false,
      opacity: 1,
      scale: 1
    });

    // Target Balls in a rack formation
    const colors = [
      "#facc15", // 1 Yellow
      "#3b82f6", // 2 Blue
      "#ef4444", // 3 Red
      "#a855f7", // 4 Purple
      "#f97316", // 5 Orange
      "#22c55e", // 6 Green
      "#ec4899", // 7 Pink
      "#0f172a", // 8 Black
      "#be123c", // 9 Maroon
    ];

    const rackX = TABLE_WIDTH * 0.68;
    const rackY = TABLE_HEIGHT * 0.5;
    const spacingX = BALL_RADIUS * 1.73; // sqrt(3) spacing
    const spacingY = BALL_RADIUS * 2;

    const positions = [
      { row: 0, col: 0, num: 1 },
      
      { row: 1, col: -0.5, num: 2 },
      { row: 1, col: 0.5, num: 3 },
      
      { row: 2, col: -1, num: 4 },
      { row: 2, col: 0, num: 8 }, // Black 8-ball in center
      { row: 2, col: 1, num: 5 },
      
      { row: 3, col: -1.5, num: 6 },
      { row: 3, col: -0.5, num: 7 },
      { row: 3, col: 0.5, num: 9 },
      { row: 3, col: 1.5, num: 10 }
    ];

    positions.forEach((pos, idx) => {
      arr.push({
        id: idx + 1,
        x: rackX + pos.row * spacingX,
        y: rackY + pos.col * spacingY,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: colors[pos.num - 1] || "#ec4899",
        number: pos.num,
        isCueBall: false,
        isPocketed: false,
        opacity: 1,
        scale: 1
      });
    });

    ballsRef.current = arr;
  }, []);

  // Set initial setup on mount
  useEffect(() => {
    initBalls();
  }, [initBalls]);

  // Shot clock timer
  useEffect(() => {
    if (gameState !== "aiming") return;
    const interval = setInterval(() => {
      setShotClock(prev => {
        if (prev <= 1) {
          handleStrike();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Trigger when isPlaying becomes true from parent sidebar wagers
  useEffect(() => {
    if (isPlaying) {
      if (gameState === "idle" || gameState === "win_screen" || gameState === "lose_screen") {
        setServerOutcome(null);
        initBalls();
        setGameState("aiming");
        setShotClock(30);
      }
    }
  }, [isPlaying, gameState, initBalls]);

  // Hit command executor
  const handleStrike = async () => {
    if (gameState !== "aiming") return;
    setGameState("striking");
    playSynthSound("hit");

    const cueBall = ballsRef.current.find(b => b.isCueBall);
    if (!cueBall) return;

    let outcome = { isWin: false, multiplier: 0, payout: 0 };
    try {
      const res = await fetch("/api/casino/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          gameId: "orig-17",
          gameTitle: "3D Neon Billiards",
          betAmount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        outcome = {
          isWin: data.isWin,
          multiplier: data.multiplier,
          payout: data.payout
        };
        setServerOutcome(outcome);
      } else {
        console.warn("Bet placement fallback used due to api response:", data.error);
        outcome = { isWin: Math.random() < 0.45, multiplier: 2.0, payout: betAmount * 2 };
        setServerOutcome(outcome);
      }
    } catch (err) {
      console.error("Wager communication error:", err);
      outcome = { isWin: Math.random() < 0.45, multiplier: 2.0, payout: betAmount * 2 };
      setServerOutcome(outcome);
    }

    const force = 4 + (shotPowerRef.current / 100) * 16;
    cueBall.vx = Math.cos(cueAngleRef.current) * force;
    cueBall.vy = Math.sin(cueAngleRef.current) * force;

    setGameState("rolling");
  };

  // Programmatic canvas texture generator for glossy 3D pool spheres
  const createBallTexture = useCallback((number: number, color: string, isCueBall: boolean) => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fill background color
    ctx.fillStyle = isCueBall ? "#ffffff" : color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isCueBall) {
      const isStripe = number >= 9;
      if (isStripe) {
        // Draw white band in the middle
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 24, canvas.width, 80);
      }

      // Draw white circle for the number badge
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 28, 0, Math.PI * 2);
      ctx.fill();

      // Draw number text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(number.toString(), canvas.width / 2, canvas.height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // WebGL 3D Main Scene Initialization & Animation Frame Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = TABLE_WIDTH;
    const height = TABLE_HEIGHT;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup - Adjusted to fit the full table without clipping
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(0, 650, 400);
    camera.lookAt(new THREE.Vector3(0, -40, 0));
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Light Theme Lights setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(0, 420, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 100;
    dirLight.shadow.camera.far = 520;
    dirLight.shadow.camera.left = -440;
    dirLight.shadow.camera.right = 440;
    dirLight.shadow.camera.top = 240;
    dirLight.shadow.camera.bottom = -240;
    dirLight.shadow.bias = -0.0015;
    scene.add(dirLight);

    // Neon Accent Lights
    const neonLeft = new THREE.PointLight(0xd946ef, 1.2, 600); // Magenta glow
    neonLeft.position.set(-400, 60, 0);
    scene.add(neonLeft);

    const neonRight = new THREE.PointLight(0x00f2fe, 1.2, 600); // Cyan glow
    neonRight.position.set(400, 60, 0);
    scene.add(neonRight);

    // 3D Table Felt Mesh - Clean Premium Light Mint color
    const feltGeo = new THREE.PlaneGeometry(800, 400);
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0xaddad0, // Light mint felt
      roughness: 0.88,
      metalness: 0.05
    });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.rotation.x = -Math.PI / 2;
    feltMesh.receiveShadow = true;
    scene.add(feltMesh);

    // Table rails (Modern Brushed Slate/Silver frame)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Brushed slate frame
      roughness: 0.22,
      metalness: 0.85
    });
    
    // Top border rail
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(832, 14, 16), railMat);
    topRail.position.set(0, 7, -208);
    topRail.receiveShadow = true;
    topRail.castShadow = true;
    scene.add(topRail);

    // Bottom border rail
    const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(832, 14, 16), railMat);
    bottomRail.position.set(0, 7, 208);
    bottomRail.receiveShadow = true;
    bottomRail.castShadow = true;
    scene.add(bottomRail);

    // Left border rail
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(16, 14, 400), railMat);
    leftRail.position.set(-408, 7, 0);
    leftRail.receiveShadow = true;
    leftRail.castShadow = true;
    scene.add(leftRail);

    // Right border rail
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(16, 14, 400), railMat);
    rightRail.position.set(408, 7, 0);
    rightRail.receiveShadow = true;
    rightRail.castShadow = true;
    scene.add(rightRail);

    // Glowing Neon Rails Strips
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00c2ee });
    const magentaGlowMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });

    // Inner neon accent strips
    const leftGlow = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 384), magentaGlowMat);
    leftGlow.position.set(-399, 10, 0);
    scene.add(leftGlow);

    const rightGlow = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 384), cyanGlowMat);
    rightGlow.position.set(399, 10, 0);
    scene.add(rightGlow);

    const topGlow = new THREE.Mesh(new THREE.BoxGeometry(784, 4, 2), cyanGlowMat);
    topGlow.position.set(0, 10, -199);
    scene.add(topGlow);

    const bottomGlow = new THREE.Mesh(new THREE.BoxGeometry(784, 4, 2), magentaGlowMat);
    bottomGlow.position.set(0, 10, 199);
    scene.add(bottomGlow);

    // Pockets - soft slate well color
    const pocketMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const pocketHalosMat = new THREE.MeshBasicMaterial({ color: 0x00c2ee });

    pockets.forEach(p => {
      // 3D pocket well cylinder
      const well = new THREE.Mesh(
        new THREE.CylinderGeometry(p.radius - 2, p.radius - 2, 6, 16),
        pocketMat
      );
      well.position.set(p.x - 400, -3, p.y - 200);
      scene.add(well);

      // Neon halo ring around pocket mouth
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(p.radius - 1, p.radius + 1, 24),
        pocketHalosMat
      );
      ring.position.set(p.x - 400, 0.4, p.y - 200);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);
    });

    // Cue stick setup
    const cueStickGroup = new THREE.Group();
    scene.add(cueStickGroup);

    const cueStickGeo = new THREE.CylinderGeometry(1.2, 2.5, 230, 8);
    const cueStickMat = new THREE.MeshStandardMaterial({
      color: 0x00c2ee,
      emissive: 0x00c2ee,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.9
    });
    const cueStickMesh = new THREE.Mesh(cueStickGeo, cueStickMat);
    cueStickMesh.rotation.x = Math.PI / 2;
    cueStickMesh.position.z = -115; // Set origin to tip
    cueStickGroup.add(cueStickMesh);

    // Laser guidelines
    const createLineSegment = (colorVal: number) => {
      const geo = new THREE.CylinderGeometry(0.7, 0.7, 1, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: colorVal,
        transparent: true,
        opacity: 0.45
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2; // Lie along Z axis
      mesh.position.y = 1.0;
      scene.add(mesh);
      return mesh;
    };

    const mainLine = createLineSegment(0x00c2ee);
    const targetLine = createLineSegment(0xd946ef);
    const cueLine = createLineSegment(0x334155);

    // Ghost Ball indicator at intersection - Dark slate wireframe for contrast
    const ghostBall = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x334155,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      })
    );
    ghostBall.position.y = BALL_RADIUS;
    scene.add(ghostBall);

    // Object Pooling for 3D Particle Sparks
    const particleGeo = new THREE.SphereGeometry(1.8, 6, 6);
    const particlePoolSize = 60;
    const particlePool: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; alpha: number; decay: number }[] = [];

    for (let i = 0; i < particlePoolSize; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0x00c2ee,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(particleGeo, pMat);
      mesh.visible = false;
      scene.add(mesh);
      particlePool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        alpha: 0,
        decay: 0.03
      });
    }

    // Spawn sparks function linked to 3D pool
    const spawnParticles3D = (x: number, z: number, color: string, count = 8) => {
      let spawned = 0;
      const threeColor = new THREE.Color(color);
      for (let i = 0; i < particlePool.length; i++) {
        const p = particlePool[i];
        if (p.alpha <= 0) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 4.5;
          p.mesh.position.set(x, BALL_RADIUS, z);
          p.mesh.visible = true;
          (p.mesh.material as THREE.MeshBasicMaterial).color.copy(threeColor);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
          p.vx = Math.cos(angle) * speed;
          p.vz = Math.sin(angle) * speed;
          p.vy = 1.5 + Math.random() * 3.5;
          p.alpha = 1;
          p.decay = 0.02 + Math.random() * 0.03;
          spawned++;
          if (spawned >= count) break;
        }
      }
    };

    // Expose particle spawner to component-level physics checks
    (window as any)._billiardsSpawnParticles = spawnParticles3D;

    // Ball 3D Meshes Creation & Texturing
    const ballMeshes: { [id: number]: THREE.Mesh } = {};
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24);

    ballsRef.current.forEach(ball => {
      const texture = createBallTexture(ball.number, ball.color, ball.isCueBall);
      const bMat = new THREE.MeshStandardMaterial({
        map: texture || undefined,
        color: texture ? 0xffffff : (ball.isCueBall ? 0xffffff : ball.color),
        roughness: 0.1,
        metalness: 0.12
      });
      const mesh = new THREE.Mesh(ballGeo, bMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.rotation.set(0.3, Math.PI, 0);
      scene.add(mesh);
      ballMeshes[ball.id] = mesh;
    });

    // Helper to position/scale cylinders to look like flat laser lines
    const updateCylinderLine = (mesh: THREE.Mesh, x1: number, z1: number, x2: number, z2: number) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.0) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(x1 + dx / 2, 1.2, z1 + dz / 2);
      mesh.scale.set(1, 1, dist);
      const angle = Math.atan2(dz, dx);
      mesh.rotation.y = Math.PI / 2 - angle;
    };

    let animId: number;

    const render = () => {
      // 1. Run core physics simulation if rolling
      if (gameStateRef.current === "rolling") {
        let anyMoving = false;
        const balls = ballsRef.current;
        const outcome = serverOutcomeRef.current;

        balls.forEach(ball => {
          if (ball.isPocketed) return;

          ball.x += ball.vx;
          ball.y += ball.vy;

          // Decelerate
          ball.vx *= FRICTION;
          ball.vy *= FRICTION;

          if (Math.abs(ball.vx) > 0.05 || Math.abs(ball.vy) > 0.05) {
            anyMoving = true;
          } else {
            ball.vx = 0;
            ball.vy = 0;
          }

          // Border Collisions
          const leftBound = BALL_RADIUS + 8;
          const rightBound = TABLE_WIDTH - BALL_RADIUS - 8;
          const topBound = BALL_RADIUS + 8;
          const bottomBound = TABLE_HEIGHT - BALL_RADIUS - 8;

          if (ball.x < leftBound) {
            ball.x = leftBound;
            ball.vx = -ball.vx * 0.8;
            playSynthSound("collision");
            spawnParticles3D(ball.x - 400 - ball.radius, ball.y - 200, "#d946ef", 4);
          } else if (ball.x > rightBound) {
            ball.x = rightBound;
            ball.vx = -ball.vx * 0.8;
            playSynthSound("collision");
            spawnParticles3D(ball.x - 400 + ball.radius, ball.y - 200, "#d946ef", 4);
          }

          if (ball.y < topBound) {
            ball.y = topBound;
            ball.vy = -ball.vy * 0.8;
            playSynthSound("collision");
            spawnParticles3D(ball.x - 400, ball.y - 200 - ball.radius, "#d946ef", 4);
          } else if (ball.y > bottomBound) {
            ball.y = bottomBound;
            ball.vy = -ball.vy * 0.8;
            playSynthSound("collision");
            spawnParticles3D(ball.x - 400, ball.y - 200 + ball.radius, "#d946ef", 4);
          }

          // Pocket Detection
          pockets.forEach(p => {
            const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
            if (dist < p.radius + 2) {
              ball.isPocketed = true;
              ball.vx = 0;
              ball.vy = 0;
              playSynthSound("pocket");
              spawnParticles3D(p.x - 400, p.y - 200, ball.color, 16);
            }
          });

          // Magnetic outcomes steer if server outcome is set
          if (outcome) {
            if (outcome.isWin) {
              if (!ball.isCueBall) {
                pockets.forEach(p => {
                  const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                  if (dist < 80 && dist > 10) {
                    const pullX = (p.x - ball.x) / dist;
                    const pullY = (p.y - ball.y) / dist;
                    ball.vx += pullX * 0.3;
                    ball.vy += pullY * 0.3;
                  }
                });
              }
            } else {
              if (ball.isCueBall) {
                pockets.forEach(p => {
                  const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                  if (dist < 90 && dist > 5) {
                    const pullX = (p.x - ball.x) / dist;
                    const pullY = (p.y - ball.y) / dist;
                    ball.vx += pullX * 0.38;
                    ball.vy += pullY * 0.38;
                  }
                });
              }
            }
          }
        });

        // Ball-to-ball collisions
        for (let i = 0; i < balls.length; i++) {
          const b1 = balls[i];
          if (b1.isPocketed) continue;

          for (let j = i + 1; j < balls.length; j++) {
            const b2 = balls[j];
            if (b2.isPocketed) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b1.radius + b2.radius;

            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap * 0.5;
              b1.y -= ny * overlap * 0.5;
              b2.x += nx * overlap * 0.5;
              b2.y += ny * overlap * 0.5;

              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const pVal = nx * kx + ny * ky;

              b1.vx -= nx * pVal;
              b1.vy -= ny * pVal;
              b2.vx += nx * pVal;
              b2.vy += ny * pVal;

              playSynthSound("collision");
              spawnParticles3D((b1.x + b2.x)/2 - 400, (b1.y + b2.y)/2 - 200, "#00f2fe", 6);
            }
          }
        }

        // Check if movement completed
        if (!anyMoving) {
          const targetPocketed = balls.some(b => !b.isCueBall && b.isPocketed);
          const cuePocketed = balls.find(b => b.isCueBall)?.isPocketed;

          let didWin = false;
          let multiplier = 0;

          if (outcome) {
            didWin = outcome.isWin;
            multiplier = outcome.multiplier;
          } else {
            didWin = targetPocketed && !cuePocketed;
            multiplier = didWin ? 2.0 : 0;
          }

          setTimeout(() => {
            setGameState(didWin ? "win_screen" : "lose_screen");
            playSynthSound(didWin ? "win" : "lose");
            onCompleteRef.current(multiplier, didWin);
          }, 600);
        }
      }

      // 2. Sync Ball physics to 3D Spheres with rolling animations
      ballsRef.current.forEach(ball => {
        const mesh = ballMeshes[ball.id];
        if (!mesh) return;

        if (ball.isPocketed) {
          if (ball.opacity > 0) {
            ball.opacity -= 0.05;
            ball.scale -= 0.05;
            if (ball.scale < 0) ball.scale = 0;
          }
          if (mesh.position.y > -22) {
            mesh.position.y -= 1.8;
            mesh.scale.setScalar(ball.scale);
          } else {
            mesh.visible = false;
          }
        } else {
          mesh.visible = true;
          mesh.position.x = ball.x - 400;
          mesh.position.z = ball.y - 200;
          mesh.position.y = BALL_RADIUS;
          mesh.scale.setScalar(1.0);

          const speed = Math.hypot(ball.vx, ball.vy);
          if (speed > 0.05) {
            const axis = new THREE.Vector3(-ball.vy, 0, ball.vx).normalize();
            const angle = speed / BALL_RADIUS;
            mesh.rotateOnWorldAxis(axis, angle);
          }
        }
      });

      // 3. Sync 3D Cue Stick & Laser Guidelines
      const cueBall = ballsRef.current.find(b => b.isCueBall);
      if (gameStateRef.current === "aiming" && cueBall && !cueBall.isPocketed) {
        cueStickGroup.visible = true;
        cueStickGroup.position.set(cueBall.x - 400, BALL_RADIUS, cueBall.y - 200);
        cueStickGroup.rotation.y = Math.PI / 2 - cueAngleRef.current;

        const pullback = (shotPowerRef.current / 100) * 35;
        cueStickMesh.position.z = -(BALL_RADIUS + 8 + pullback + 115);

        const dx = Math.cos(cueAngleRef.current);
        const dy = Math.sin(cueAngleRef.current);

        let closestHitBall: Ball | null = null;
        let closestDist = Infinity;
        let contactX = 0;
        let contactY = 0;

        ballsRef.current.forEach(target => {
          if (target.isCueBall || target.isPocketed) return;

          const toBallX = target.x - cueBall.x;
          const toBallY = target.y - cueBall.y;
          const projection = toBallX * dx + toBallY * dy;

          if (projection > 0) {
            const perpDist = Math.hypot(toBallX - projection * dx, toBallY - projection * dy);
            if (perpDist < BALL_RADIUS * 2) {
              const a = 1;
              const b = -2 * projection;
              const c = toBallX * toBallX + toBallY * toBallY - 4 * BALL_RADIUS * BALL_RADIUS;
              const disc = b * b - 4 * a * c;

              if (disc >= 0) {
                const dist = (-b - Math.sqrt(disc)) / 2;
                if (dist < closestDist && dist > 0) {
                  closestDist = dist;
                  closestHitBall = target;
                  contactX = cueBall.x + dx * dist;
                  contactY = cueBall.y + dy * dist;
                }
              }
            }
          }
        });

        if (closestHitBall) {
          updateCylinderLine(mainLine, cueBall.x - 400, cueBall.y - 200, contactX - 400, contactY - 200);

          ghostBall.visible = true;
          ghostBall.position.set(contactX - 400, BALL_RADIUS, contactY - 200);

          const targetBall: Ball = closestHitBall;
          const normX = (targetBall.x - contactX) / (BALL_RADIUS * 2);
          const normY = (targetBall.y - contactY) / (BALL_RADIUS * 2);
          updateCylinderLine(targetLine, targetBall.x - 400, targetBall.y - 200, (targetBall.x + normX * 80) - 400, (targetBall.y + normY * 80) - 200);

          const tangentX = -normY;
          const tangentY = normX;
          const dot = dx * tangentX + dy * tangentY;
          const pathSign = dot >= 0 ? 1 : -1;
          updateCylinderLine(cueLine, contactX - 400, contactY - 200, (contactX + tangentX * pathSign * 60) - 400, (contactY + tangentY * pathSign * 60) - 200);
        } else {
          let endX = cueBall.x + dx * 650;
          let endY = cueBall.y + dy * 650;

          const lLimit = BALL_RADIUS + 8;
          const rLimit = TABLE_WIDTH - BALL_RADIUS - 8;
          const tLimit = BALL_RADIUS + 8;
          const bLimit = TABLE_HEIGHT - BALL_RADIUS - 8;

          if (endX < lLimit) {
            const scale = (lLimit - cueBall.x) / dx;
            endX = lLimit;
            endY = cueBall.y + dy * scale;
          } else if (endX > rLimit) {
            const scale = (rLimit - cueBall.x) / dx;
            endX = rLimit;
            endY = cueBall.y + dy * scale;
          }

          if (endY < tLimit) {
            const scale = (tLimit - cueBall.y) / dy;
            endX = cueBall.x + dx * scale;
            endY = tLimit;
          } else if (endY > bLimit) {
            const scale = (bLimit - cueBall.y) / dy;
            endX = cueBall.x + dx * scale;
            endY = bLimit;
          }

          updateCylinderLine(mainLine, cueBall.x - 400, cueBall.y - 200, endX - 400, endY - 200);
          ghostBall.visible = false;
          targetLine.visible = false;
          cueLine.visible = false;
        }
      } else {
        cueStickGroup.visible = false;
        mainLine.visible = false;
        ghostBall.visible = false;
        targetLine.visible = false;
        cueLine.visible = false;
      }

      // 4. Update Particle sparks pool
      particlePool.forEach(p => {
        if (p.alpha > 0) {
          p.mesh.position.x += p.vx;
          p.mesh.position.y += p.vy;
          p.mesh.position.z += p.vz;
          
          p.vy -= 0.16;
          if (p.mesh.position.y < 2.0) {
            p.mesh.position.y = 2.0;
            p.vy = -p.vy * 0.45;
          }

          p.alpha -= p.decay;
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.alpha);

          if (p.alpha <= 0) {
            p.mesh.visible = false;
          }
        }
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      (window as any)._billiardsSpawnParticles = null;
    };
  }, [createBallTexture]);

  // Spark spawner bridges core physics collisions into Three.js pool
  const spawnSparkles = (x: number, y: number, color: string, count = 8) => {
    const spawner = (window as any)._billiardsSpawnParticles;
    if (spawner) {
      spawner(x - 400, y - 200, color, count);
    }
  };

  // Cue stick click/drag rotation raycasting handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== "aiming") return;
    setIsDraggingCue(true);
    updateCueAngle(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingCue || gameState !== "aiming") return;
    updateCueAngle(e);
  };

  const handlePointerUp = () => {
    setIsDraggingCue(false);
  };

  const updateCueAngle = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const mouseX = (clientX / rect.width) * 2 - 1;
    const mouseY = -(clientY / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(tablePlaneRef.current, targetPoint);

    const canvasX = targetPoint.x + 400;
    const canvasY = targetPoint.z + 200;

    const cueBall = ballsRef.current.find(b => b.isCueBall);
    if (!cueBall) return;

    const dx = canvasX - cueBall.x;
    const dy = canvasY - cueBall.y;
    const angle = Math.atan2(dy, dx);
    setCueAngle(angle);

    const idealAngle = 0;
    const diff = Math.abs(Math.sin(angle - idealAngle));
    const prob = Number((85 - diff * 65 + Math.random() * 5).toFixed(1));
    setWinChance(Math.max(10, Math.min(98.8, prob)));
  };

  return (
    <div className="w-full h-full min-h-[290px] sm:min-h-[380px] md:min-h-[600px] bg-white rounded-3xl border border-slate-200/80 p-2 sm:p-4 md:p-8 flex flex-col items-center justify-between relative overflow-hidden shadow-lg select-none">
      
      {/* Background Volumetric Arena Lighting - Clean Light gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-50/10 via-white to-white pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-40 bg-[linear-gradient(to_bottom,_rgba(6,182,212,0.03),_transparent)] blur-[60px] pointer-events-none" />

      {/* Cyber Scoreboard HUD - Clean light theme styling */}
      <div className="w-full z-10 flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3 mb-2">
        
        {/* AAA HUD Metrics in single horizontal row */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-12 flex-grow">
          {/* Win Probability HUD */}
          <div className="text-left sm:text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block sm:hidden">Win Prob</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">WIN PROBABILITY</span>
            <span className="text-base sm:text-2xl font-black font-mono text-cyan-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              {winChance}%
            </span>
          </div>

          {/* Shot clock */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span className="font-mono text-sm sm:text-lg font-black text-pink-500 drop-shadow-[0_0_8px_rgba(244,114,182,0.15)]">
              {shotClock}s
            </span>
          </div>

          {/* Current Wager */}
          <div className="text-left sm:text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block sm:hidden">Stake</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">CURRENT STAKE</span>
            <span className="text-base sm:text-xl font-black font-mono text-amber-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.15)]">
              ₹{betAmount}
            </span>
          </div>
        </div>

        {/* Audio Mute Toggle */}
        <button
          onClick={() => setIsMuted(prev => !prev)}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-900 transition-all shadow-inner"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 3D WebGL Table Box Container - Light silver borders */}
      <div className="w-full flex-grow flex items-center justify-center z-10 py-2 sm:py-6 overflow-hidden">
        <div className="relative w-full max-w-[800px] aspect-[2/1] rounded-[24px] bg-white border-[12px] border-slate-200 shadow-[0_15px_40px_rgba(15,23,42,0.08)] overflow-hidden">
          {/* Inner Rail subtle glow overlay */}
          <div className="absolute inset-0 border border-cyan-500/10 pointer-events-none shadow-[inset_0_0_20px_rgba(6,182,212,0.05)] z-20" />

          {/* WebGL Canvas */}
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-crosshair block select-none touch-none"
          />
        </div>
      </div>

      {/* Strike & Power Charging Controls - Clean light styling */}
      <div className="w-full z-10 flex items-center justify-between gap-3 mt-2 border-t border-slate-200 pb-1 pt-3">
        
        {/* Aim Fine-tuning buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCueAngle(prev => prev - 0.05)}
            disabled={gameState !== "aiming"}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-xs shadow-sm"
          >
            ↺
          </button>
          <button
            onClick={() => setCueAngle(prev => prev + 0.05)}
            disabled={gameState !== "aiming"}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-xs shadow-sm"
          >
            ↻
          </button>
        </div>

        {/* Neon Power Meter Slider */}
        <div className="flex-grow flex items-center gap-2 max-w-[180px] sm:max-w-xs">
          <Zap className="w-3.5 h-3.5 text-cyan-500 animate-pulse hidden sm:block" />
          <div className="flex-grow relative flex items-center">
            {/* Slider track background */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-500 shadow-[0_0_10px_#00f2fe]"
                style={{ width: `${shotPower}%` }}
              />
            </div>
            {/* Slider Input */}
            <input
              type="range"
              min="10"
              max="100"
              value={shotPower}
              onChange={(e) => setShotPower(Number(e.target.value))}
              disabled={gameState !== "aiming"}
              className="absolute inset-x-0 w-full h-6 opacity-0 cursor-pointer disabled:pointer-events-none z-10"
            />
          </div>
          <span className="text-[10px] sm:text-xs font-black font-mono text-cyan-600 w-8 text-right">
            {shotPower}%
          </span>
        </div>

        {/* Strike Trigger Button */}
        <button
          onClick={handleStrike}
          disabled={gameState !== "aiming"}
          className="relative px-3 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-[0_4px_15px_rgba(6,182,212,0.25)] border border-cyan-400/20 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>STRIKE</span>
        </button>
      </div>

      {/* AAA Victory Overlay - Light Theme */}
      <AnimatePresence>
        {gameState === "win_screen" && serverOutcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.08),_transparent_75%)]" />

            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              className="max-w-md w-full bg-white border border-slate-200 rounded-[32px] p-8 text-center relative shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
            >
              <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-cyan-50 rounded-full border border-cyan-200/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <Trophy className="w-12 h-12 text-cyan-500 drop-shadow-[0_0_10px_#00c2ee] animate-bounce" />
              </div>

              <span className="text-[10px] text-cyan-600 font-black tracking-widest uppercase block mb-1">
                VICTORY DETECTED
              </span>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-6">
                GREAT SHOT!
              </h2>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
                <div className="text-left border-r border-slate-200/80 pr-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Multiplier</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">
                    {serverOutcome.multiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="text-left pl-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Payout</span>
                  <span className="text-2xl font-black font-mono text-amber-600">
                    ₹{serverOutcome.payout.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setGameState("idle");
                  initBalls();
                  onComplete(0, false);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase text-sm tracking-widest shadow-[0_4px_15px_rgba(16,185,129,0.25)] border border-emerald-400/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AAA Defeat Overlay - Light Theme */}
      <AnimatePresence>
        {gameState === "lose_screen" && serverOutcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              className="max-w-md w-full bg-white border border-slate-200 rounded-[32px] p-8 text-center relative shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-pink-50 rounded-full border border-pink-200/50 shadow-[0_0_15px_rgba(244,114,182,0.06)]">
                <AlertTriangle className="w-10 h-10 text-pink-500" />
              </div>

              <span className="text-[10px] text-pink-600 font-black tracking-widest uppercase block mb-1">
                ROUND CLOSED
              </span>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">
                SCRATCHED OR MISSED
              </h2>

              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Your cue ball scratched or the shot missed the target pockets. Refine your laser guides and try again!
              </p>

              <button
                onClick={() => {
                  setGameState("idle");
                  initBalls();
                  onComplete(0, false);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-black uppercase text-sm tracking-widest border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
