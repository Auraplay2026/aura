"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  RotateCcw, Tv, Wifi, ShieldCheck, AlertCircle, RefreshCw,
  ExternalLink, Layers, Check, Sparkles
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

  const availableChannels = getMatchStreams(matchId, sportType, customStreamUrl);
  const [selectedChannel, setSelectedChannel] = useState<LiveStreamChannel>(availableChannels[0]);
  
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

  // Initialize HLS.js Stream Engine
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

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const levels = data.levels.map(l => `${l.height}p`);
        setQualities(["Auto", ...Array.from(new Set(levels))]);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          // Autoplay blocked by browser policy until user interacts or is muted
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setStreamError(`Stream server error: ${data.details}. Switching to backup...`);
              setIsLoading(false);
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple WebKit HLS (iOS Safari / macOS Safari)
      video.src = channel.url;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
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
    loadStream(selectedChannel);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel, loadStream]);

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
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
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
      console.warn("PiP not supported or rejected", e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl transition-all duration-300 group"
    >
      {/* Top Overlay Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent p-3 sm:p-4 flex items-center justify-between pointer-events-auto">
        
        {/* Stream Status & Info */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-red-600/90 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-white font-black text-xs tracking-wide truncate max-w-[280px]">
              {matchTitle || `${selectedChannel.name}`}
            </span>
            <span className="text-emerald-400 font-mono text-[9px] font-bold">
              {selectedChannel.serverName} • {selectedChannel.latencyRating}
            </span>
          </div>
        </div>

        {/* Server & Channel Selector Pills */}
        <div className="flex items-center gap-2">
          
          <div className="relative">
            <button
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Server:</span>
              <span className="text-amber-300 font-black">{selectedChannel.name.split(" ")[0]}</span>
            </button>

            {showChannelMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden font-sans py-1">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Select Fast Stream Server
                </div>
                {availableChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChannel(ch);
                      setShowChannelMenu(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer",
                      selectedChannel.id === ch.id ? "bg-emerald-950/60 text-emerald-300 font-black" : "text-slate-200"
                    )}
                  >
                    <div>
                      <div className="font-bold">{ch.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{ch.serverName}</div>
                    </div>
                    {selectedChannel.id === ch.id && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Picture in Picture Button */}
          <button
            onClick={togglePip}
            title="Picture in Picture (Pop out player to bet while watching)"
            className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
          </button>

          {/* Close Video Bar */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-red-500/30 border border-white/20 hover:border-red-400 rounded-lg text-white text-xs transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

      </div>

      {/* Main Video Screen Container */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-black">
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs gap-2 text-white">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-300">
              Connecting Ultra-Low Latency Broadcast...
            </span>
          </div>
        )}

        {/* Error Fallback Banner */}
        {streamError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center gap-3 text-white">
            <AlertCircle className="w-10 h-10 text-amber-400 animate-bounce" />
            <p className="text-xs text-slate-300 max-w-md font-medium">{streamError}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => loadStream(selectedChannel)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Server
              </button>
              <button
                onClick={() => {
                  const nextIndex = (availableChannels.findIndex(c => c.id === selectedChannel.id) + 1) % availableChannels.length;
                  setSelectedChannel(availableChannels[nextIndex]);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Next Stream Source
              </button>
            </div>
          </div>
        )}

        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

      </div>

      {/* Bottom Floating Controls Ribbon */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-3 flex items-center justify-between text-white pointer-events-auto opacity-95 group-hover:opacity-100 transition-opacity">
        
        {/* Play/Pause & Mute */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-md"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Fullscreen & Quality */}
        <div className="flex items-center gap-2">
          
          <span className="hidden sm:inline-block bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 font-bold">
            {selectedChannel.quality}
          </span>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>

      </div>

    </div>
  );
}
