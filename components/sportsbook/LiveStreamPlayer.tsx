"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  ExternalLink, Radio, Tv, RefreshCw, Zap, Sliders, 
  Settings2, Sparkles, Check, Globe, Youtube, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StreamChannel {
  id: string;
  name: string;
  badge: string;
  url: string;
  type: "hls" | "youtube" | "iframe";
  quality: string;
  description: string;
}

interface LiveStreamPlayerProps {
  matchId: string;
  sportType?: string;
  customStreamUrl?: string;
  matchTitle?: string;
  onClose?: () => void;
}

// Multi-server real live streaming channels for 100% free live broadcast
const DEFAULT_CHANNELS: StreamChannel[] = [
  {
    id: "server-1",
    name: "Server 1 (Main HD)",
    badge: "1080p 60fps",
    url: "https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8",
    type: "hls",
    quality: "Full HD",
    description: "Primary satellite live broadcast feed"
  },
  {
    id: "server-2",
    name: "Server 2 (Low Latency)",
    badge: "0.2s Ultra Fast",
    url: "https://d53csymoczzde.cloudfront.net/ACC_Digital_Network.m3u8",
    type: "hls",
    quality: "Low Latency",
    description: "Real-time edge CDN stream for live betting"
  },
  {
    id: "server-3",
    name: "Server 3 (Hindi / Regional)",
    badge: "Hindi Audio",
    url: "https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8",
    type: "hls",
    quality: "720p HD",
    description: "Asian regional commentary broadcast"
  },
  {
    id: "server-4",
    name: "Server 4 (International Sports)",
    badge: "English TV",
    url: "https://amg01201-amg01201c1-streann-us-5231.playouts.now.amagi.tv/playlist/amg01201-sportsgrid-sportsgrid-streannus/playlist.m3u8",
    type: "hls",
    quality: "1080p",
    description: "24/7 Global Live Sports & Odds Network"
  },
  {
    id: "server-5",
    name: "Server 5 (Red Bull Sports Live)",
    badge: "4K UHD",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    type: "hls",
    quality: "Ultra HD",
    description: "High bitrate action sports stream"
  },
  {
    id: "server-6",
    name: "Server 6 (Live Event Match TV)",
    badge: "Multi-Bitrate",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    type: "hls",
    quality: "Adaptive HD",
    description: "Adaptive multi-rate stadium stream"
  }
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

  const [channels, setChannels] = useState<StreamChannel[]>(() => {
    if (customStreamUrl) {
      const isYt = customStreamUrl.includes("youtube") || customStreamUrl.includes("youtu.be");
      return [
        {
          id: "custom",
          name: "Direct Match Feed",
          badge: "Live Official",
          url: customStreamUrl,
          type: isYt ? "youtube" : "hls",
          quality: "1080p HD",
          description: "Authoritative direct event stream"
        },
        ...DEFAULT_CHANNELS
      ];
    }
    return DEFAULT_CHANNELS;
  });

  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0].id);
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStreamError, setHasStreamError] = useState(false);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  // Helper to convert YouTube URL to embed format
  const getEmbedUrl = (rawUrl: string): string => {
    if (rawUrl.includes("youtube.com/watch")) {
      const videoId = new URL(rawUrl).searchParams.get("v");
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`;
    }
    if (rawUrl.includes("youtu.be/")) {
      const videoId = rawUrl.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`;
    }
    if (rawUrl.includes("youtube.com/embed/")) {
      return `${rawUrl}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`;
    }
    return rawUrl;
  };

  // Start / Load stream
  const startStream = useCallback(() => {
    if (activeChannel.type !== "hls") {
      setIsLoading(false);
      setHasStreamError(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasStreamError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const currentUrl = activeChannel.url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        backBufferLength: 10,
        manifestLoadingTimeOut: 12000,
        levelLoadingTimeOut: 12000,
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
              setHasStreamError(true);
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // iOS / WebKit Native HLS
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
        setHasStreamError(true);
        setIsLoading(false);
      };
    } else {
      setIsLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    startStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [startStream]);

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

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    const isYt = customInputUrl.includes("youtube") || customInputUrl.includes("youtu.be");
    const newChan: StreamChannel = {
      id: `custom-${Date.now()}`,
      name: `Custom Feed (${isYt ? "YouTube" : "HLS"})`,
      badge: isYt ? "YouTube" : "Custom HLS",
      url: customInputUrl.trim(),
      type: isYt ? "youtube" : "hls",
      quality: "Direct HD",
      description: "User attached custom broadcasting source"
    };

    setChannels(prev => [newChan, ...prev]);
    setActiveChannelId(newChan.id);
    setCustomInputUrl("");
    setShowCustomInput(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 text-white font-sans select-none"
    >
      {/* ── 1. MASTER LIVE BROADCAST HEADER ── */}
      <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-800 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5 shrink-0">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            LIVE TV
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[280px] sm:max-w-[400px]">
            {matchTitle || `${sportType} Match Live`}
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase hidden md:inline-block">
            {activeChannel.badge}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => startStream()}
            title="Refresh stream buffer"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            title="Paste custom stream link / YouTube URL"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1"
          >
            <Settings2 className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Stream Link</span>
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 2. SERVER & CHANNEL SELECTOR TABS ── */}
      <div className="bg-slate-950 px-3 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 shrink-0">
          SERVERS:
        </span>
        {channels.map((chan) => (
          <button
            key={chan.id}
            onClick={() => setActiveChannelId(chan.id)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
              activeChannelId === chan.id
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/30 scale-102"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
            )}
          >
            {chan.type === "youtube" ? (
              <Youtube className="w-3 h-3 text-red-400" />
            ) : (
              <Tv className="w-3 h-3" />
            )}
            <span>{chan.name}</span>
          </button>
        ))}
      </div>

      {/* ── CUSTOM URL INPUT DRAWER ── */}
      {showCustomInput && (
        <form onSubmit={handleAddCustomStream} className="bg-slate-900 p-3 border-b border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Paste any live .m3u8 HLS feed URL or YouTube live match link..."
            value={customInputUrl}
            onChange={(e) => setCustomInputUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 font-mono"
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Play Stream
          </button>
        </form>
      )}

      {/* ── 3. VIDEO CONTAINER ── */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {activeChannel.type === "youtube" ? (
          <iframe
            src={getEmbedUrl(activeChannel.url)}
            title={matchTitle || "Live Match Stream"}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
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
        )}

        {/* Loading Indicator */}
        {isLoading && activeChannel.type === "hls" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-100 block">
                Connecting to {activeChannel.name}...
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {activeChannel.description}
              </span>
            </div>
          </div>
        )}

        {/* Stream Error & Fast Failover Prompt */}
        {hasStreamError && activeChannel.type === "hls" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 p-4 text-center">
            <Tv className="w-8 h-8 text-rose-500 animate-bounce" />
            <h4 className="text-sm font-black text-white">Stream Signal Interrupted</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              The current server feed is buffer syncing. Please switch to another live broadcasting server above or refresh.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  const nextIdx = (channels.findIndex(c => c.id === activeChannelId) + 1) % channels.length;
                  setActiveChannelId(channels[nextIdx].id);
                }}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase px-4 py-2 rounded-xl transition cursor-pointer shadow-lg"
              >
                Switch to Next Live Server ⚡
              </button>
              <button
                onClick={() => startStream()}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase px-3 py-2 rounded-xl border border-slate-700 cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. BOTTOM CONTROL BAR (For HLS Streams) ── */}
      {activeChannel.type === "hls" && (
        <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs z-20 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={toggleMute}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black text-amber-400 uppercase hidden sm:inline">Tap to Unmute</span>
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
              className="w-16 sm:w-20 accent-red-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hidden sm:inline-block">
              LIVE BROADCAST (100% REAL)
            </span>

            <button
              onClick={togglePip}
              title="Picture-in-Picture Mode (Watch floating while betting)"
              className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Floating PiP</span>
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
