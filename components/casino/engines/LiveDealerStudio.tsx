"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Volume2, VolumeX, Users, Eye, Sparkles, Shield, Clock, CircleDot, Radio, Film, Check } from "lucide-react";
import { playDealerVoice, playGameSound } from "@/lib/audio";

interface LiveDealerStudioProps {
  dealerName?: string;
  gameTitle?: string;
  roundTimeLeft: number;
  maxRoundTime?: number;
  isSpinning?: boolean;
  activePlayersCount?: number;
  lastOutcome?: string | number | null;
  onPhaseChange?: (phase: "betting" | "closing" | "spinning" | "result") => void;
}

// High-speed CDN video feeds for authentic casino ambiance
const STREAM_PRESETS = [
  {
    id: "monte-carlo",
    name: "VIP Monte Carlo Studio",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-roulette-wheel-spinning-close-up-42407-large.mp4",
    spinUrl: "https://assets.mixkit.co/videos/preview/mixkit-roulette-wheel-spinning-close-up-42407-large.mp4",
    badge: "4K 60FPS"
  },
  {
    id: "las-vegas",
    name: "Las Vegas High Roller",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-casino-roulette-wheel-spinning-42406-large.mp4",
    spinUrl: "https://assets.mixkit.co/videos/preview/mixkit-casino-roulette-wheel-spinning-42406-large.mp4",
    badge: "HD LIVE"
  },
  {
    id: "prestige",
    name: "Prestige Luxury Felt",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-croupier-dealing-cards-at-a-casino-42410-large.mp4",
    spinUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-croupier-dealing-cards-at-a-casino-42410-large.mp4",
    badge: "VIP STUDIO"
  }
];

export function LiveDealerStudio({
  dealerName = "Elena",
  gameTitle = "VIP Live Roulette",
  roundTimeLeft,
  maxRoundTime = 15,
  isSpinning = false,
  activePlayersCount = 142,
  lastOutcome = null
}: LiveDealerStudioProps) {
  const [cameraMode, setCameraMode] = useState<"standard" | "closeup" | "studio">("standard");
  const [soundMuted, setSoundMuted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("monte-carlo");
  const [customStreamUrl, setCustomStreamUrl] = useState<string>("");
  const [showStreamConfig, setShowStreamConfig] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPhaseRef = useRef<string>("");

  // Determine active video source
  const activePreset = STREAM_PRESETS.find(p => p.id === selectedPreset) || STREAM_PRESETS[0];
  const activeVideoSrc = customStreamUrl || (isSpinning ? activePreset.spinUrl : activePreset.videoUrl);

  // Round phase state
  const isBettingOpen = roundTimeLeft > 0 && !isSpinning;
  const isClosingSoon = roundTimeLeft <= 4 && roundTimeLeft > 0 && !isSpinning;
  const isNoMoreBets = roundTimeLeft === 0 || isSpinning;

  // Trigger dealer voice lines automatically on phase changes
  useEffect(() => {
    let currentPhase = "betting";
    if (isSpinning) currentPhase = "spinning";
    else if (isClosingSoon) currentPhase = "closing";
    else if (isNoMoreBets) currentPhase = "nomorebets";

    if (lastPhaseRef.current !== currentPhase) {
      lastPhaseRef.current = currentPhase;
      if (!soundMuted) {
        if (currentPhase === "betting" && roundTimeLeft === maxRoundTime) {
          playDealerVoice("place_bets");
        } else if (currentPhase === "closing") {
          playDealerVoice("closing_bets");
        } else if (currentPhase === "spinning") {
          playDealerVoice("no_more_bets");
        }
      }
    }
  }, [roundTimeLeft, isSpinning, isClosingSoon, isNoMoreBets, maxRoundTime, soundMuted]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* ── 1. STUDIO VIDEO BACKGROUND LAYER ── */}
      <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[340px] overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-[#0a0505]">
        
        {/* Real Live Casino Video Stream */}
        {videoLoaded && activeVideoSrc ? (
          <video
            ref={videoRef}
            key={activeVideoSrc}
            src={activeVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoLoaded(false)}
            className={`w-full h-full object-cover transition-all duration-700 ${
              cameraMode === "closeup" ? "scale-125" : "scale-100"
            }`}
          />
        ) : (
          /* High-Definition 1080p Fallback Live Studio Dealer Rendering */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-red-950/30 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

            <div className="relative flex flex-col items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-gradient-to-b from-yellow-400/20 via-amber-500/10 to-transparent blur-3xl absolute -top-20 pointer-events-none" />

              <motion.div 
                animate={isSpinning ? { scale: 1.05, y: -6 } : { scale: cameraMode === "closeup" ? 1.15 : 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative flex flex-col items-center"
              >
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-slate-800 via-slate-900 to-black border-2 border-yellow-500/40 p-1 shadow-[0_0_50px_rgba(234,179,8,0.2)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-900/30 via-slate-950/80 to-amber-900/40" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-6xl sm:text-7xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-pulse">
                      👩‍💼
                    </div>
                    <div className="absolute -bottom-2 bg-slate-950/90 border border-yellow-500/50 px-2.5 py-0.5 rounded-full text-[9px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Dealer {dealerName}
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />
                </div>

                <div className="w-[320px] sm:w-[480px] h-12 bg-gradient-to-t from-emerald-950 via-green-900 to-emerald-800 rounded-t-full border-t-2 border-yellow-500/60 shadow-[0_-10px_30px_rgba(16,185,129,0.3)] mt-2 flex items-center justify-center">
                  <span className="text-[9px] font-black tracking-[0.4em] text-yellow-300/40 uppercase">
                    AURA VIP LIVE STUDIO • TABLE 01
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Ambient Darkening Gradient on top of video */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 pointer-events-none" />

        {/* ── 2. LIVE STUDIO HUD OVERLAYS ── */}
        
        {/* Top-Left: Live Broadcasting Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
          <div className="flex items-center gap-1.5 bg-red-600/90 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-red-400">
            <Radio className="w-3 h-3 animate-pulse text-white" />
            <span>LIVE {activePreset.badge}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
            <Users className="w-3 h-3 text-yellow-400" />
            <span>{activePlayersCount} In House</span>
          </div>
        </div>

        {/* Top-Right: Camera, Preset Feeds & Sound Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
          <button
            onClick={() => setCameraMode(m => m === "standard" ? "closeup" : "standard")}
            title="Switch Studio Camera Angle"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors shadow cursor-pointer active:scale-95 flex items-center gap-1 text-[10px] font-bold"
          >
            <Camera className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Cam {cameraMode === "standard" ? "1" : "2"}</span>
          </button>
          
          <button
            onClick={() => setSoundMuted(v => !v)}
            title={soundMuted ? "Unmute Studio Sound" : "Mute Studio Sound"}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors shadow cursor-pointer active:scale-95"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-yellow-400" />}
          </button>

          <button
            onClick={() => setShowStreamConfig(v => !v)}
            title="Switch Video Stream Feed"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-yellow-400 border border-slate-700 transition-colors shadow cursor-pointer active:scale-95 text-[10px] font-bold flex items-center gap-1"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Feeds</span>
          </button>
        </div>

        {/* Stream Feeds Preset Drawer */}
        {showStreamConfig && (
          <div className="absolute top-14 right-4 z-30 bg-slate-950/95 border border-yellow-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md w-72">
            <div className="text-[10px] font-black text-yellow-400 uppercase mb-2">Live Studio Broadcast Feeds</div>
            
            <div className="space-y-1.5 mb-3">
              {STREAM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setCustomStreamUrl("");
                    setVideoLoaded(true);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    selectedPreset === preset.id && !customStreamUrl
                      ? "bg-yellow-500/15 border-yellow-500 text-yellow-300"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{preset.name}</span>
                  </div>
                  <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{preset.badge}</span>
                </button>
              ))}
            </div>

            <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Custom Stream (OBS / WebRTC)</div>
            <input
              type="text"
              value={customStreamUrl}
              onChange={e => {
                setCustomStreamUrl(e.target.value);
                setVideoLoaded(true);
              }}
              placeholder="https://... (mp4 / m3u8)"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 mb-2"
            />
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowStreamConfig(false)}
                className="bg-yellow-500 text-slate-950 px-3 py-1 rounded-md text-[10px] font-black cursor-pointer shadow hover:bg-yellow-400"
              >
                Apply Feed
              </button>
            </div>
          </div>
        )}

        {/* Center: Synchronized 15-Second Round Status Banner */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
          <AnimatePresence mode="wait">
            {isBettingOpen && (
              <motion.div
                key="betting-open"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`px-5 py-1.5 rounded-full border shadow-xl flex items-center gap-2 ${
                  isClosingSoon
                    ? "bg-amber-500 text-slate-950 border-yellow-300 font-black animate-pulse"
                    : "bg-emerald-600 text-white border-emerald-400 font-black"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs uppercase tracking-widest">
                  {isClosingSoon ? `BETS CLOSING (${roundTimeLeft}s)` : `PLACE YOUR BETS (${roundTimeLeft}s)`}
                </span>
              </motion.div>
            )}

            {isNoMoreBets && (
              <motion.div
                key="no-more-bets"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="px-5 py-1.5 rounded-full bg-rose-600 text-white border border-red-400 shadow-xl flex items-center gap-2 font-black"
              >
                <CircleDot className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs uppercase tracking-widest">
                  {isSpinning ? "SPINNING WHEEL • NO MORE BETS" : "ROUND IN PROGRESS"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Last Round Outcome Indicator */}
          {lastOutcome !== null && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-slate-950/80 border border-slate-800 px-3 py-0.5 rounded-full shadow">
              <span className="text-slate-400">Previous:</span>
              <span className="text-yellow-400 font-black">{lastOutcome}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

