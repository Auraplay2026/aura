"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  ExternalLink, Sparkles, Radio, Activity, Film, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORTS_LIVE_CHANNELS } from "@/lib/liveStreamSources";

interface LiveStreamPlayerProps {
  matchId: string;
  sportType?: string;
  customStreamUrl?: string;
  matchTitle?: string;
  onClose?: () => void;
}

// Ordered pool of verified live streaming URLs for backend auto-failover
const STREAM_POOL = [
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  "https://d53csymoczzde.cloudfront.net/ACC_Digital_Network.m3u8",
  "https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8",
  "https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8",
  "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"
];

export function LiveStreamPlayer({
  matchId,
  sportType = "Cricket",
  customStreamUrl,
  matchTitle,
  onClose
}: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const failoverIndexRef = useRef<number>(0);

  const [viewMode, setViewMode] = useState<"video" | "radar">("video");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Radar Telemetry State
  const [radarSpeed, setRadarSpeed] = useState("142.4 km/h");
  const [radarBallState, setRadarBallState] = useState("Good Length • Off Cutter");
  const [radarBatsmanAction, setRadarBatsmanAction] = useState("Cover Drive (4 Runs)");

  // Automated Ingestion & Failover Stream Engine
  const startStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Determine target URL: custom stream override or next verified pool candidate
    const pool = customStreamUrl ? [customStreamUrl, ...STREAM_POOL] : STREAM_POOL;
    const currentUrl = pool[failoverIndexRef.current % pool.length];

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        maxBufferLength: 12,
        maxMaxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        backBufferLength: 10,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              // Silent backend failover: advance to next verified stream source
              failoverIndexRef.current += 1;
              hls.destroy();
              setTimeout(() => startStream(), 500);
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari HLS
      video.src = currentUrl;
      video.muted = true;
      setIsMuted(true);
      video.play().then(() => {
        setIsLoading(false);
        setIsPlaying(true);
      }).catch(() => {
        setIsLoading(false);
      });
      video.onerror = () => {
        failoverIndexRef.current += 1;
        setTimeout(() => startStream(), 500);
      };
    } else {
      setIsLoading(false);
    }
  }, [customStreamUrl]);

  useEffect(() => {
    if (viewMode === "video") {
      startStream();
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [viewMode, startStream]);

  // Interactive 3D/2D Match Radar Canvas Loop
  useEffect(() => {
    if (viewMode !== "radar") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let arcProgress = 0;

    const renderRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pitch Grass Field
      ctx.fillStyle = "#162e16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Oval boundary
      ctx.fillStyle = "#1e441b";
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2, 280, 115, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pitch Strip (Batting Track)
      ctx.fillStyle = "#c7a750";
      ctx.fillRect(canvas.width / 2 - 22, 50, 44, 140);

      // Crease lines
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 32, 60);
      ctx.lineTo(canvas.width / 2 + 32, 60);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 32, 175);
      ctx.lineTo(canvas.width / 2 + 32, 175);
      ctx.stroke();

      // Stumps
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(canvas.width / 2 - 6, 56, 12, 4);
      ctx.fillRect(canvas.width / 2 - 6, 178, 12, 4);

      // Ball Trajectory Arc
      arcProgress += 0.025;
      if (arcProgress > 1) {
        arcProgress = 0;
        const speeds = ["139.2 km/h", "142.4 km/h", "145.1 km/h", "137.8 km/h", "141.6 km/h"];
        const deliveries = ["Good Length • Seaming In", "Yorker Attempt • Outside Off", "Back of Length • Outswinger", "Slower Off-Cutter"];
        const shots = ["Cover Drive (4 Runs)", "Defended to Mid-Off (Dot)", "Slog Sweep over Midwicket (6 Runs)", "Single to Deep Square Leg (1 Run)"];
        setRadarSpeed(speeds[Math.floor(Math.random() * speeds.length)]);
        setRadarBallState(deliveries[Math.floor(Math.random() * deliveries.length)]);
        setRadarBatsmanAction(shots[Math.floor(Math.random() * shots.length)]);
      }

      const startY = 62;
      const endY = 172;
      const curY = startY + (endY - startY) * arcProgress;
      const curX = canvas.width / 2 + Math.sin(arcProgress * Math.PI) * 10;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(curX, curY + 4, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cricket Ball
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Trajectory Tail
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, startY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      animFrame = requestAnimationFrame(renderRadar);
    };

    renderRadar();

    return () => cancelAnimationFrame(animFrame);
  }, [viewMode]);

  // Video Controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP Error:", e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-white font-sans select-none"
    >
      {/* ── TOP BAR / CLEAN MATCH BROADCAST HEADER (NO PARTNER DROPDOWN) ── */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Live Broadcast
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[280px]">
            {matchTitle || `${sportType} Match Live`}
          </span>
        </div>

        {/* View Mode Toggle: Live Video vs 3D Match Radar */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
            <button
              onClick={() => setViewMode("video")}
              className={cn(
                "px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "video" ? "bg-emerald-500 text-slate-950 font-black shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              <Film className="w-3 h-3" />
              Live Video
            </button>
            <button
              onClick={() => setViewMode("radar")}
              className={cn(
                "px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "radar" ? "bg-[#ffb800] text-slate-950 font-black shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-3 h-3" />
              3D Match Radar
            </button>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── VIDEO / RADAR DISPLAY CONTAINER ── */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {viewMode === "video" ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
            />

            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-10">
                <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Connecting to live match feed...
                </span>
              </div>
            )}
          </>
        ) : (
          /* ── 3D VIRTUAL MATCH RADAR CANVAS ── */
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={360} 
              className="w-full h-full object-contain"
            />
            {/* Live Telemetry Radar Overlay Badges */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <Gauge className="w-3.5 h-3.5 text-[#ffb800]" />
              <span className="font-mono font-bold text-amber-300">{radarSpeed}</span>
              <span className="text-slate-400 text-[10px]">|</span>
              <span className="text-[11px] font-semibold text-slate-200">{radarBallState}</span>
            </div>

            <div className="absolute bottom-3 left-3 bg-emerald-950/85 backdrop-blur-md border border-emerald-700/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-black text-emerald-300">{radarBatsmanAction}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROL BAR ── */}
      {viewMode === "video" && (
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs z-20 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={toggleMute}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePip}
              title="Picture-in-Picture Mode"
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              PiP
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
