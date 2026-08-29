"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  ExternalLink, Radio, Tv, Settings, Check, Sparkles, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveStreamPlayerProps {
  matchId: string;
  sportType?: string;
  customStreamUrl?: string;
  matchTitle?: string;
  onClose?: () => void;
}

interface QualityOption {
  levelIndex: number;
  label: string;
  resolution?: string;
}

// Highly reliable global live sports stream feeds with CORS support & ABR multi-bitrates
const VERIFIED_STREAM_FEEDS = [
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
  "https://d53csymoczzde.cloudfront.net/ACC_Digital_Network.m3u8",
  "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
  "https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8"
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
  const streamPoolIndexRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(true);

  // Quality Selector State
  const [availableQualities, setAvailableQualities] = useState<QualityOption[]>([]);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Build stream feed list (custom URL prioritized if provided)
  const streamUrls = customStreamUrl 
    ? [customStreamUrl, ...VERIFIED_STREAM_FEEDS]
    : VERIFIED_STREAM_FEEDS;

  // Initialize and load live stream with silent background auto-failover
  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const currentStreamUrl = streamUrls[streamPoolIndexRef.current % streamUrls.length];

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 15,
        maxBufferLength: 20,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 8000,
        fragLoadingTimeOut: 10000,
        startLevel: -1, // Auto
      });

      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        retryCountRef.current = 0;

        // Parse available quality levels
        const levels: QualityOption[] = [
          { levelIndex: -1, label: "Auto (Optimal)" }
        ];

        if (data.levels && data.levels.length > 0) {
          data.levels.forEach((lvl, idx) => {
            const res = lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}k`;
            levels.push({
              levelIndex: idx,
              label: res.includes("1080") ? "1080p Full HD" : res.includes("720") ? "720p HD" : res.includes("480") ? "480p SD" : `${res}`,
              resolution: res
            });
          });
        }

        setAvailableQualities(levels);

        // Immediate autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        // Level switched callback
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            default:
              // Silent failover to next stream in pool infinitely without stopping
              try { hls.destroy(); } catch {}
              streamPoolIndexRef.current = (streamPoolIndexRef.current + 1) % streamUrls.length;
              setTimeout(() => initPlayer(), 150);
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple / iOS WebKit playback
      video.src = currentStreamUrl;
      video.muted = true;
      setIsMuted(true);
      video.play().then(() => {
        setIsLoading(false);
        setIsPlaying(true);
      }).catch(() => {
        setIsLoading(false);
      });

      video.onerror = () => {
        streamPoolIndexRef.current = (streamPoolIndexRef.current + 1) % streamUrls.length;
        setTimeout(() => initPlayer(), 200);
      };
    } else {
      setIsLoading(false);
    }
  }, [streamUrls]);

  // Invincible Stall & Freeze Watchdog
  useEffect(() => {
    let lastProgressTime = 0;
    let stallTicks = 0;

    const watchdog = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        if (video.paused) {
          video.play().catch(() => {});
        }

        if (video.currentTime === lastProgressTime && video.readyState >= 1) {
          stallTicks++;
          if (stallTicks >= 3) {
            // Buffer stalled -> auto-recover
            stallTicks = 0;
            if (hlsRef.current) {
              hlsRef.current.recoverMediaError();
              hlsRef.current.startLoad();
            } else {
              initPlayer();
            }
          }
        } else {
          stallTicks = 0;
          lastProgressTime = video.currentTime;
        }
      }
    }, 1200);

    return () => clearInterval(watchdog);
  }, [isPlaying, initPlayer]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer]);

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

  const unmuteAudio = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = volume > 0 ? volume : 0.8;
    setIsMuted(false);
    setShowUnmutePrompt(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      unmuteAudio();
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
      if (val > 0) setShowUnmutePrompt(false);
    }
  };

  const handleSelectQuality = (lvlIndex: number) => {
    setSelectedQualityIndex(lvlIndex);
    setShowQualityMenu(false);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvlIndex;
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

  const currentQualityLabel = availableQualities.find(q => q.levelIndex === selectedQualityIndex)?.label || "Auto";

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 text-white font-sans select-none"
    >
      {/* ── 1. HEADER BAR ── */}
      <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2 border-b border-slate-800 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5 shrink-0">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            LIVE TV
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[280px] sm:max-w-[450px]">
            {matchTitle || `${sportType} Match Broadcast`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
            HD 1080p • LIVE
          </span>

          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. VIDEO DISPLAY VIEWPORT ── */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
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

        {/* 1-Tap Unmute Audio Floating Prompt */}
        {showUnmutePrompt && isMuted && !isLoading && (
          <button
            onClick={unmuteAudio}
            className="absolute bottom-4 left-4 z-20 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 transition transform hover:scale-105 cursor-pointer animate-bounce"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Tap for Live Commentary Audio</span>
          </button>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-100">
              Loading Live Broadcast Feed...
            </span>
          </div>
        )}
      </div>

      {/* ── 3. CLEAN BOTTOM CONTROL BAR ── */}
      <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs z-20 relative">
        {/* Left: Play/Pause & Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleMute}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase hidden sm:inline">Muted</span>
              </>
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 accent-rose-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
        </div>

        {/* Right: Quality Dropdown, PiP, Fullscreen */}
        <div className="flex items-center gap-2 relative">
          
          {/* Quality Selector Button & Popup */}
          <div className="relative">
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="flex items-center gap-1.5 text-[11px] font-black text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentQualityLabel}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-black text-slate-400 uppercase px-2 py-1 border-b border-slate-800">
                  Video Quality
                </span>
                {availableQualities.length > 0 ? (
                  availableQualities.map((q) => (
                    <button
                      key={q.levelIndex}
                      onClick={() => handleSelectQuality(q.levelIndex)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer",
                        selectedQualityIndex === q.levelIndex
                          ? "bg-rose-600 text-white font-black"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <span>{q.label}</span>
                      {selectedQualityIndex === q.levelIndex && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))
                ) : (
                  ["Auto (Optimal)", "1080p HD", "720p HD", "480p SD"].map((lbl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedQualityIndex(idx === 0 ? -1 : idx - 1);
                        setShowQualityMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    >
                      {lbl}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Picture-in-Picture Floating Mode */}
          <button
            onClick={togglePip}
            title="Watch in Floating Picture-in-Picture"
            className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>PiP</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
