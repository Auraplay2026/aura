"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <div className="w-full flex flex-col gap-4">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {game.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">By {game.provider}</p>
          </div>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors hidden sm:block"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Game Canvas Container */}
      <div
        className={`relative w-full bg-black border border-slate-200 overflow-hidden ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "h-[600px] rounded-xl"
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Initializing Engine...</h3>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; xr-spatial-tracking; clipboard-write"
          allowFullScreen
          referrerPolicy="no-referrer"
        />

        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur border border-slate-200 text-slate-900 rounded-xl hover:bg-white transition-colors z-50 shadow-xl"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
