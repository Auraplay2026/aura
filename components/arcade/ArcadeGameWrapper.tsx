"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Maximize2, 
  Minimize2, 
  ArrowLeft, 
  Loader2, 
  Play, 
  RotateCcw, 
  Gamepad2, 
  Monitor, 
  Smartphone, 
  Keyboard, 
  MousePointer, 
  Sparkles, 
  X, 
  RefreshCw 
} from "lucide-react";
import { ArcadeGame } from "@/lib/arcade-games";
import Link from "next/link";
import { ARCADE_GAMES } from "@/lib/arcade-games";

interface ArcadeGameWrapperProps {
  game: ArcadeGame;
}

export function ArcadeGameWrapper({ game }: ArcadeGameWrapperProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Sync native fullscreen changes (e.g. Esc key pressed)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const nativeActive = !!document.fullscreenElement;
      setIsNativeFullscreen(nativeActive);
      // Sync isFullscreen with native fullscreen state if native was entered
      if (nativeActive) {
        setIsFullscreen(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Lock body scroll and handle layout adjustments when fullscreen state is active
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
      };
    }
  }, [isFullscreen]);

  const handleRestart = () => {
    setIsLoading(true);
    setReloadKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
      setIsFullscreen(false);
    }
  };

  const toggleNativeFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.error("Native fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  // Filter out the current game for the recommendations section
  const recommendedGames = ARCADE_GAMES.filter(g => g.id !== game.id).slice(0, 3);

  // Helper to determine controls based on categories
  const isRunner = game.categories.includes("runner") || game.categories.includes("racing");

  return (
    <div ref={containerRef} className={`w-full flex flex-col gap-6 select-none ${
      isFullscreen ? "fixed inset-0 z-[9999] bg-white h-[100dvh] w-full p-0 gap-0" : ""
    }`}>
      {/* HUD Header */}
      <div className={`flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 ${
        isFullscreen 
          ? "bg-white border-slate-800 rounded-none border-t-0 border-x-0 py-3 px-4 sm:px-6 text-slate-900 z-50 shrink-0" 
          : "p-4 sm:p-5"
      }`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (isFullscreen) {
                toggleFullscreen();
              } else {
                router.back();
              }
            }}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isFullscreen 
                ? "text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100" 
                : "text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100"
            }`}
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-base sm:text-xl font-black tracking-tight leading-tight ${
                isFullscreen ? "text-slate-900" : "text-slate-900"
              }`}>
                {game.title}
              </h1>
              {game.isNew && !isFullscreen && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-wider rounded">
                  New
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              By <span className={isFullscreen ? "text-red-400" : "text-red-600"}>{game.provider}</span>
            </p>
          </div>
        </div>

        {/* Dashboard Actions */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={handleRestart}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isFullscreen 
                  ? "text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100" 
                  : "text-slate-500 hover:text-slate-955 bg-slate-50 hover:bg-slate-100"
              }`}
              title="Restart Game"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Standard Fullscreen Trigger */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isFullscreen 
                ? "text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100" 
                : "text-slate-500 hover:text-slate-955 bg-slate-50 hover:bg-slate-100"
            }`}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Immersive Mode"}
            title={isFullscreen ? "Exit Immersive Mode" : "Play in Immersive Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Native Browser Fullscreen (Only in Immersive Mode on screens that support it) */}
          {isFullscreen && typeof document !== "undefined" && document.fullscreenEnabled && (
            <button
              onClick={toggleNativeFullscreen}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-all duration-200"
              title={isNativeFullscreen ? "Exit Native Fullscreen" : "Enter Native Fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Game Play Frame / Canvas Container */}
      <div className={`relative w-full bg-white border overflow-hidden select-none touch-none transition-all duration-500 ${
        isFullscreen
          ? "flex-1 border-none rounded-none w-full h-full bg-white flex items-center justify-center"
          : game.orientation === "portrait"
            ? "w-full max-w-[400px] mx-auto h-[500px] sm:h-[650px] rounded-3xl border-slate-200 shadow-xl"
            : "w-full max-w-5xl mx-auto h-[450px] sm:h-[550px] lg:h-[650px] rounded-3xl border-slate-200 shadow-xl"
      }`}>
        
        {/* Splash Start Page */}
        {!isPlaying ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center select-text">
            {/* Blurred background cover */}
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110 opacity-20 pointer-events-none"
              style={{ backgroundImage: `url(${game.thumbnail})` }}
            />
            
            {/* Dark tint gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950 z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-sm px-4">
              {/* Game Thumbnail */}
              <div className="relative group w-24 h-24 sm:w-28 sm:h-28 mb-5 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80">
                <img 
                  src={game.thumbnail} 
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              </div>

              {/* Title & Provider */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
                {game.title}
              </h2>
              <p className="text-[10px] sm:text-xs font-black text-red-500 uppercase tracking-widest mb-4">
                By {game.provider}
              </p>

              {/* Game Description */}
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                {game.description}
              </p>

              {/* Big Start Button */}
              <button
                onClick={() => {
                  setIsPlaying(true);
                  // Automatically go immersive fullscreen on mobile for perfect screen fitting
                  if (window.innerWidth < 640) {
                    setIsFullscreen(true);
                  }
                }}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Now
              </button>

              {/* Controls guide details */}
              <div className="mt-8 border border-slate-800/80 bg-white/50 backdrop-blur rounded-xl p-3 w-full flex items-center justify-center gap-4 text-slate-500 text-xs">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Mobile Touch</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-50" />
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Desktop Web</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Actual Game Viewport */
          <div className={`relative w-full h-full flex items-center justify-center ${
            isFullscreen && game.orientation === "portrait" ? "w-full max-w-[500px] mx-auto h-full" : "w-full h-full"
          }`}>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest">Initializing Core Engine...</h3>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Loading assets from server</p>
              </div>
            )}

            <iframe
              key={reloadKey}
              ref={iframeRef}
              src={game.url}
              className="w-full h-full border-0 absolute inset-0 bg-white"
              onLoad={() => setIsLoading(false)}
              allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; xr-spatial-tracking; clipboard-write"
              allowFullScreen
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
            />
            
            {/* Mobile Translucent Float Close Overlay */}
            {isFullscreen && (
              <div className="absolute top-4 right-4 sm:hidden z-50 flex items-center gap-2">
                <button
                  onClick={handleRestart}
                  className="p-2.5 bg-white/60 backdrop-blur border border-slate-800 text-slate-900 rounded-full hover:bg-white transition-colors shadow-lg active:scale-90"
                  aria-label="Reload game"
                  title="Reload game"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2.5 bg-white/60 backdrop-blur border border-slate-800 text-slate-900 rounded-full hover:bg-white transition-colors shadow-lg active:scale-90"
                  aria-label="Exit Immersive"
                  title="Exit Immersive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info & Recommended Games (Only shown when inline, not fullscreen) */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 select-text">
          {/* Instructions and tips */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 mb-3">
                <Gamepad2 className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-base uppercase tracking-wider">Gameplay & Controls</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                This WebGL instance is optimized for instant execution without installs. For the absolute best performance and screen fitting, click the **Immersive Mode** icon in the dashboard toolbar to expand the canvas.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">Desktop Controls</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {isRunner 
                        ? "Use [Arrow Keys] or [WASD] to jump, slide, and turn lanes. Press [Space] to act." 
                        : "Use your [Mouse Click] or [Drag & Drop] to select and align blocks or trigger actions."
                      }
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">Mobile Controls</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {isRunner 
                        ? "Swipe [Left/Right/Up/Down] on the touchscreen screen to jump, slide, and steer." 
                        : "Tap and drag pieces directly on the touchscreen to align matches or place shapes."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Recommendation list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2 text-slate-900 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-sm uppercase tracking-wider">Other Popular Arcade</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {recommendedGames.map(rec => (
                <Link 
                  key={rec.id} 
                  href={`/arcade/game/${rec.id}`}
                  onClick={() => setIsPlaying(false)} /* reset playing state of current before navigation */
                  className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200"
                >
                  <img 
                    src={rec.thumbnail} 
                    alt={rec.title} 
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition-transform duration-200" 
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                      {rec.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {rec.provider}
                    </p>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 fill-transparent group-hover:fill-current transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
