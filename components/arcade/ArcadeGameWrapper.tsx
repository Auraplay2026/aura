"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, ArrowLeft, Loader2 } from "lucide-react";
import { ArcadeGame } from "@/lib/arcade-games";

interface ArcadeGameWrapperProps {
  game: ArcadeGame;
}

export function ArcadeGameWrapper({ game }: ArcadeGameWrapperProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const iframeSrc = game.url;

  // Lock parent body scrolling when the game is in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isFullscreen]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              {game.title}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">By {game.provider}</p>
          </div>
        </div>

        {/* Fullscreen control available for both desktop and cellphones */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Game Canvas Container */}
      <div
        className={`relative w-full bg-black border border-slate-200 overflow-hidden select-none touch-none ${
          isFullscreen
            ? "fixed inset-0 z-50 rounded-none border-none h-full w-full"
            : "h-[50vh] sm:h-[600px] md:h-[650px] rounded-xl"
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest">Initializing Engine...</h3>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-0 absolute inset-0"
          onLoad={() => setIsLoading(false)}
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; xr-spatial-tracking; clipboard-write"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
        />

        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-2.5 bg-white/90 backdrop-blur border border-slate-200 text-slate-900 rounded-xl hover:bg-white transition-colors z-50 shadow-xl"
            aria-label="Exit Fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
