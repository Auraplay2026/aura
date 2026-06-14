"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Maximize2, Minimize2, Info, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ArcadeGame } from "@/lib/arcade-games";
import { useTradingStore } from "@/lib/store";

interface ArcadeGameWrapperProps {
  game: ArcadeGame;
}

export function ArcadeGameWrapper({ game }: ArcadeGameWrapperProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playMode, setPlayMode] = useState<'demo' | 'real'>('demo');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(10);
  const [hasTransferred, setHasTransferred] = useState(false);

  const rawBalance = useTradingStore(state => state.balance);
  const balance = typeof rawBalance === 'number' ? rawBalance : (parseFloat(String(rawBalance)) || 0);
  const playCasino = useTradingStore(state => state.playCasino);

  const [referrerUrl, setReferrerUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setReferrerUrl(window.location.href);
    }
  }, []);

  const iframeSrc = game.url;

  // Enter Real mode
  const handleSwitchToReal = () => {
    if (!hasTransferred) {
      setIsTransferModalOpen(true);
    } else {
      setPlayMode('real');
    }
  };

  const handleTransferSubmit = () => {
    if (balance < transferAmount) return;
    playCasino(transferAmount, 0, `Arcade Context: ${game.title}`);
    setHasTransferred(true);
    setIsTransferModalOpen(false);
    setPlayMode('real');
  };

  const activeBalance = playMode === 'demo' ? 1000.00 : transferAmount;

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
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {game.title}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-widest">
                {playMode}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">By {game.provider}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Play Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setPlayMode('demo')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                playMode === 'demo' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Demo
            </button>
            <button
              onClick={handleSwitchToReal}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                playMode === 'real' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Real
            </button>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session Balance</span>
            <span className={`text-lg font-black font-mono tracking-tighter ${playMode === 'demo' ? 'text-slate-900' : 'text-blue-600'}`}>
              ${activeBalance.toFixed(2)}
            </span>
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div 
        className={`relative w-full bg-white border border-slate-200 overflow-hidden ${
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
          allow="autoplay; fullscreen; gamepad"
          allowFullScreen
          sandbox="allow-scripts allow-forms allow-pointer-lock"
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

      {/* Absolute Transfer Modal (Real Mode) */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/90 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 shadow-2xl w-full max-w-sm rounded-2xl overflow-hidden"
            >
              <div className="p-6 text-center border-b border-slate-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Play Real Money</h2>
                <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
                  Transfer funds from your Main Balance to the {game.title} session context.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available</span>
                    <span className="text-sm font-black text-slate-900 font-mono">${balance.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transfer</span>
                    <span className="text-2xl font-black text-blue-600 font-mono tracking-tighter">${transferAmount.toFixed(2)}</span>
                  </div>
                </div>

                {balance < 10 ? (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">Insufficient funds. You need at least $10.00 to play in Real mode.</p>
                  </div>
                ) : (
                  <input 
                    type="range" 
                    min="10" 
                    max={Math.max(10, Math.floor(balance))} 
                    step="10" 
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  disabled={balance < transferAmount}
                  onClick={handleTransferSubmit}
                  className="flex-[2] py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:shadow-none"
                >
                  Confirm Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
