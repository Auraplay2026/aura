"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  RotateCcw, Tv, Wifi, ShieldCheck, AlertCircle, RefreshCw,
  ExternalLink, Layers, Check, Sparkles, Radio, Activity,
  Compass, Eye, Film, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveStreamChannel, getMatchStreams } from "@/lib/liveStreamSources";

interface LiveStreamPlayerProps {
  matchId: string;
  sportType?: string;
  customStreamUrl?: string;
  matchTitle?: string;
  onClose?: () => void;
}

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

  const availableChannels = getMatchStreams(matchId, sportType, customStreamUrl);
  const [selectedChannel, setSelectedChannel] = useState<LiveStreamChannel>(availableChannels[0]);
  const [viewMode, setViewMode] = useState<"video" | "radar">("video");
  
  // Player Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("Auto");
  const [showChannelMenu, setShowChannelMenu] = useState(false);

  // Radar Animation State
  const [radarSpeed, setRadarSpeed] = useState("142.4 km/h");
  const [radarBallState, setRadarBallState] = useState("Good Length • Off Cutter");
  const [radarBatsmanAction, setRadarBatsmanAction] = useState("Cover Drive (4 Runs)");

  // Initialize HLS.js Stream Engine with Proxy Support
  const loadStream = useCallback((channel: LiveStreamChannel) => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setStreamError(null);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Wrap URL through our Next.js high-performance video proxy to guarantee CORS + auto-rewrite
    const proxiedUrl = `/api/sports/video-proxy?url=${encodeURIComponent(channel.url)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        maxBufferLength: 12,
        maxMaxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        backBufferLength: 10,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
      });

      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const levels = data.levels.map(l => `${l.height}p`);
        setQualities(["Auto", ...Array.from(new Set(levels))]);
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try direct fallback if proxy timed out
              hls.loadSource(channel.url);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setStreamError(`Broadcast sync error (${data.details}). Switch server or view Match Radar.`);
              setIsLoading(false);
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple WebKit HLS (iOS Safari / macOS Safari)
      video.src = proxiedUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setStreamError("Native stream playback error on this channel.");
        setIsLoading(false);
      });
    } else {
      setStreamError("HLS live streaming is not supported by your browser engine.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "video") {
      loadStream(selectedChannel);
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel, viewMode, loadStream]);

  // Interactive 3D/2D Match Radar Canvas Loop
  useEffect(() => {
    if (viewMode !== "radar") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let ballX = 60;
    let ballY = 160;
    let speed = 2.4;
    let phase: "bowler" | "flight" | "shot" | "boundary" = "bowler";
    let arcProgress = 0;

    const renderRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw 3D Perspective Cricket Pitch
      ctx.fillStyle = "#1e3a1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pitch Grass texture
      ctx.fillStyle = "#2d5a27";
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2, 280, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pitch Strip (Clay / Batting Track)
      ctx.fillStyle = "#c2a649";
      ctx.fillRect(canvas.width / 2 - 24, 50, 48, 140);

      // Crease lines
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      // Bowling crease
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 35, 60);
      ctx.lineTo(canvas.width / 2 + 35, 60);
      ctx.stroke();
      // Batting crease
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 35, 175);
      ctx.lineTo(canvas.width / 2 + 35, 175);
      ctx.stroke();

      // Stumps
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(canvas.width / 2 - 6, 56, 12, 4);
      ctx.fillRect(canvas.width / 2 - 6, 178, 12, 4);

      // 2. Animate Ball Trajectory
      arcProgress += 0.025;
      if (arcProgress > 1) {
        arcProgress = 0;
        const speeds = ["138.6 km/h", "142.1 km/h", "144.8 km/h", "136.2 km/h", "141.5 km/h"];
        const deliveries = ["Good Length • Seaming In", "Full Toss • Yorker Attempt", "Back of Length • Outswinger", "Slower Ball • Off Cutter"];
        const shots = ["Cover Drive (4 Runs)", "Defended to Mid-Off (Dot)", "Slog Sweep (6 Runs)", "Single to Deep Square Leg (1 Run)"];
        setRadarSpeed(speeds[Math.floor(Math.random() * speeds.length)]);
        setRadarBallState(deliveries[Math.floor(Math.random() * deliveries.length)]);
        setRadarBatsmanAction(shots[Math.floor(Math.random() * shots.length)]);
      }

      const startY = 62;
      const endY = 172;
      const curY = startY + (endY - startY) * arcProgress;
      const curX = canvas.width / 2 + Math.sin(arcProgress * Math.PI) * 12;

      // Ball Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(curX, curY + 4, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cricket Ball (Red leather sphere)
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Ball Trajectory Tail
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

  // Video Actions
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
        setIsPipActive(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
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
      {/* ── TOP BAR / HEADER ── */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            {viewMode === "video" ? "Live Broadcast Feed" : "3D Virtual Match Radar"}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 truncate max-w-[200px]">
            {matchTitle || `${sportType} Match Live`}
          </span>
        </div>

        {/* View Mode Toggle & Server Selector */}
        <div className="flex items-center gap-2">
          {/* Toggle Video vs Match Radar */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
            <button
              onClick={() => setViewMode("video")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "video" ? "bg-emerald-500 text-slate-950 font-black shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              <Film className="w-3 h-3" />
              Live Video
            </button>
            <button
              onClick={() => setViewMode("radar")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                viewMode === "radar" ? "bg-[#ffb800] text-slate-950 font-black shadow-xs" : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-3 h-3" />
              Match Radar
            </button>
          </div>

          {/* Server Switcher Dropdown (in video mode) */}
          {viewMode === "video" && (
            <div className="relative">
              <button
                onClick={() => setShowChannelMenu(!showChannelMenu)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">{selectedChannel.name}</span>
                <span className="sm:hidden">Server</span>
                <Layers className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {showChannelMenu && (
                <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Live Server
                  </div>
                  <div className="py-1 space-y-0.5">
                    {availableChannels.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setSelectedChannel(ch);
                          setShowChannelMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors",
                          selectedChannel.id === ch.id 
                            ? "bg-emerald-500/20 text-emerald-300 font-black" 
                            : "text-slate-300 hover:bg-slate-800"
                        )}
                      >
                        <div className="flex flex-col">
                          <span>{ch.name}</span>
                          <span className="text-[9px] text-slate-400">{ch.serverName} • {ch.quality}</span>
                        </div>
                        {selectedChannel.id === ch.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
              playsInline
              muted={isMuted}
            />

            {/* Loading Spinner */}
            {isLoading && !streamError && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Connecting to {selectedChannel.serverName}...
                </span>
              </div>
            )}

            {/* Error Notification Overlay with Fallback Button */}
            {streamError && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
                <AlertCircle className="w-9 h-9 text-amber-400" />
                <p className="text-xs font-semibold text-slate-300 max-w-md">{streamError}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      const next = availableChannels.find(c => c.id !== selectedChannel.id) || availableChannels[0];
                      setSelectedChannel(next);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase transition-transform active:scale-95 cursor-pointer shadow-lg"
                  >
                    Switch to Backup Server
                  </button>
                  <button
                    onClick={() => setViewMode("radar")}
                    className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
                  >
                    View Match Radar
                  </button>
                </div>
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

      {/* ── BOTTOM CONTROL BAR (In Video Mode) ── */}
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
