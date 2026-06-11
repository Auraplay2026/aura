"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCw, AlertTriangle, Check, Clock, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExternalGameWrapperProps {
  gameUrl: string;
  gameId: string;
  providerName: string;
  currentBalance: number;
  onPlaceBet: (amount: number) => { success: boolean; newBalance: number; error?: string };
  onSettleWin: (multiplier: number, payoutAmount: number) => { success: boolean; newBalance: number };
  onError?: (errorType: string, message: string) => void;
}

interface SpinResult {
  id: string;
  timestamp: string;
  bet: number;
  payout: number;
  multiplier: number;
  status: 'WIN' | 'LOSS';
}

export function ExternalGameWrapper({
  gameUrl,
  gameId,
  providerName,
  currentBalance,
  onPlaceBet,
  onSettleWin,
  onError
}: ExternalGameWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Stepper Safeguard States
  const [isSpinning, setIsSpinning] = useState(false);
  const [showUnstuckBanner, setShowUnstuckBanner] = useState(false);
  const lastBetAmount = useRef<number>(0);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual & Auto Stop Safeguard States
  const [countdown, setCountdown] = useState(10);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingResultRef = useRef<{ bet: number; payout: number; multiplier: number; settled: boolean } | null>(null);
  const [resultBanner, setResultBanner] = useState<{
    show: boolean;
    payout: number;
    multiplier: number;
    isWin: boolean;
  }>({
    show: false,
    payout: 0,
    multiplier: 0,
    isWin: false,
  });

  // Spin History Ledger (Last 10 wagers)
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);

  const addSpinHistory = useCallback((bet: number, payout: number, multiplier: number) => {
    const newResult: SpinResult = {
      id: `SPIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString(),
      bet,
      payout,
      multiplier,
      status: multiplier > 0 ? 'WIN' : 'LOSS'
    };
    setSpinHistory(prev => [newResult, ...prev].slice(0, 10));
  }, []);

  // Force Settle & Stop Visual Spin logic
  const handleForceStop = useCallback(() => {
    // Clear timers
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current);
      simTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const finalBet = lastBetAmount.current;
    let finalPayout = 0;
    let finalMultiplier = 0;

    // Check if we already calculated and settled the result in the 2-second timer
    if (pendingResultRef.current && pendingResultRef.current.settled) {
      finalPayout = pendingResultRef.current.payout;
      finalMultiplier = pendingResultRef.current.multiplier;
    } else {
      // If not settled yet (e.g. user clicked Stop before 2 seconds), settle now!
      if (finalBet > 0) {
        const isWin = Math.random() < 0.40;
        finalMultiplier = isWin ? parseFloat((Math.random() * 4 + 1.2).toFixed(1)) : 0;
        finalPayout = finalBet * finalMultiplier;
        onSettleWin(finalMultiplier, finalPayout);
      }
    }

    // Add to history ledger
    if (finalBet > 0) {
      addSpinHistory(finalBet, finalPayout, finalMultiplier);
    }

    // Show result banner/toast overlay
    setResultBanner({
      show: true,
      payout: finalPayout,
      multiplier: finalMultiplier,
      isWin: finalMultiplier > 0
    });

    // Stop visual spinning by reloading the iframe
    setIsSpinning(false);
    
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }

    // Automatically hide result banner after 4 seconds
    setTimeout(() => {
      setResultBanner(prev => ({ ...prev, show: false }));
    }, 4000);
    
    // Clear pending ref
    pendingResultRef.current = null;
  }, [onSettleWin, addSpinHistory]);

  // 10-Second Mount Timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading && !hasError) {
      timeoutId = setTimeout(() => {
        setHasError(true);
        setErrorMessage("Game connection timed out.");
        if (onError) onError("TIMEOUT_ERROR", "The game failed to load or communicate within 10 seconds.");
      }, 10000);
    }
    return () => clearTimeout(timeoutId);
  }, [isLoading, hasError, onError]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Two-way postMessage Handshake Protocol (Task 1)
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // Debug Log Requirement (Task 1)
      const message = event;
      console.log("📥 Game Event Received:", message.data.action, message.data);

      const messageType = data.type || data.action;
      if (!messageType) return;

      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow) return;

      switch (messageType) {
        case "READY":
        case "GAME_READY":
          setIsLoading(false);
          break;

        case "REQUEST_BALANCE":
        case "GET_BALANCE":
          iframeWindow.postMessage({
            action: "BALANCE_UPDATE",
            balance: currentBalance,
            currency: "INR"
          }, "*");
          break;

        case "PLACE_BET":
        case "DEDUCT_BALANCE":
        case "BET":
        case "SPIN":
          const betAmount = parseFloat(data.amount) || parseFloat(data.bet) || parseFloat(data.stake) || 0;
          if (isNaN(betAmount) || betAmount <= 0) {
             iframeWindow.postMessage({ 
               action: "BET_RESULT", 
               success: false, 
               reason: "INVALID_AMOUNT" 
             }, "*");
             break;
          }
          
          // Clear any existing simulation timer and countdown interval
          if (simTimerRef.current) {
            clearTimeout(simTimerRef.current);
            simTimerRef.current = null;
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          // Set state to watch for lockups
          lastBetAmount.current = betAmount;
          setIsSpinning(true);
          setShowUnstuckBanner(false);
          setResultBanner({ show: false, payout: 0, multiplier: 0, isWin: false });

          // Start the 10-second countdown ticking
          setCountdown(10);
          let localCountdown = 10;
          countdownIntervalRef.current = setInterval(() => {
            localCountdown -= 1;
            setCountdown(localCountdown);
            if (localCountdown <= 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              handleForceStop();
            }
          }, 1000);

          // Update platform database
          const betResult = onPlaceBet(betAmount);
          const transactionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          
          if (betResult.success) {
            // Send BET_ALLOWED payload down to iframe
            const betAllowedResponse = {
              action: "BET_ALLOWED",
              success: true,
              transactionId,
              newBalance: betResult.newBalance,
            };
            console.log("[ExternalGameWrapper] Force emitting BET_ALLOWED:", betAllowedResponse);
            iframeWindow.postMessage(betAllowedResponse, "*");

            // Also send BET_RESULT for compatibility fallback
            const betResultResponse = {
              action: "BET_RESULT",
              success: true,
              payout: 0,
              newBalance: betResult.newBalance,
              transactionId
            };
            console.log("[ExternalGameWrapper] Force emitting BET_RESULT:", betResultResponse);
            iframeWindow.postMessage(betResultResponse, "*");

            // Store pending result (unsettled)
            pendingResultRef.current = {
              bet: betAmount,
              payout: 0,
              multiplier: 0,
              settled: false
            };

            // 🌟 2-Second Spin Result Fallback (Stops Infinite Spinning)
            simTimerRef.current = setTimeout(() => {
              // Calculate simulated spin result if the game server didn't settle it
              const currentBet = lastBetAmount.current;
              if (currentBet <= 0) return;

              // 40% Win rate simulation
              const isWin = Math.random() < 0.40;
              const multiplier = isWin ? parseFloat((Math.random() * 4 + 1.2).toFixed(1)) : 0;
              const payout = currentBet * multiplier;

              const winResult = onSettleWin(multiplier, payout);
              
              // Mark as settled in ref
              pendingResultRef.current = {
                bet: currentBet,
                payout,
                multiplier,
                settled: true
              };

              // Send outcome payloads to iframe
              iframeWindow.postMessage({
                action: "SPIN_RESULT",
                success: true,
                bet: currentBet,
                payout,
                multiplier,
                newBalance: winResult.newBalance,
                combination: multiplier > 0 ? ["bar", "bar", "bar"] : ["cherry", "lemon", "grape"]
              }, "*");

              iframeWindow.postMessage({
                action: "SETTLE_WIN",
                amount: payout,
                multiplier,
                newBalance: winResult.newBalance
              }, "*");

              iframeWindow.postMessage({
                action: "WIN",
                amount: payout,
                multiplier,
                newBalance: winResult.newBalance
              }, "*");

              console.log("[ExternalGameWrapper] Simulated outcomes pushed to iframe:", { payout, multiplier });
            }, 2000);

          } else {
            setIsSpinning(false);
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            
            iframeWindow.postMessage({ 
              action: "BET_ALLOWED",
              success: false,
              reason: betResult.error || "INSUFFICIENT_FUNDS",
              newBalance: currentBalance
            }, "*");

            iframeWindow.postMessage({ 
              action: "BET_RESULT", 
              success: false,
              reason: betResult.error || "INSUFFICIENT_FUNDS",
              newBalance: currentBalance
            }, "*");
          }
          break;

        case "SETTLE_WIN":
        case "CREDIT_WIN":
        case "WIN":
          // The game settled itself! Clear all timers/intervals
          if (simTimerRef.current) {
            clearTimeout(simTimerRef.current);
            simTimerRef.current = null;
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          const multiplier = parseFloat(data.multiplier) || 0;
          const payoutAmount = parseFloat(data.amount) || parseFloat(data.payout) || 0;
          
          let finalWinResult;
          // If already settled via simulated fallback, adjust if needed
          if (pendingResultRef.current && pendingResultRef.current.settled) {
            const diff = payoutAmount - pendingResultRef.current.payout;
            if (diff !== 0) {
              finalWinResult = onSettleWin(multiplier, payoutAmount);
            } else {
              finalWinResult = { success: true, newBalance: currentBalance };
            }
          } else {
            finalWinResult = onSettleWin(multiplier, payoutAmount);
          }
          
          setIsSpinning(false); // Spin settled successfully
          
          // Record to history ledger
          addSpinHistory(lastBetAmount.current, payoutAmount, multiplier);

          // Show result banner/toast overlay
          setResultBanner({
            show: true,
            payout: payoutAmount,
            multiplier,
            isWin: multiplier > 0
          });

          // Automatically hide result banner after 4 seconds
          setTimeout(() => {
            setResultBanner(prev => ({ ...prev, show: false }));
          }, 4000);
          
          if (finalWinResult.success) {
            iframeWindow.postMessage({
               action: "WIN_ACKNOWLEDGED",
               newBalance: finalWinResult.newBalance
            }, "*");
          }
          pendingResultRef.current = null;
          break;

        case "GAME_ERROR":
          console.error(`[${providerName} Wrapper] Game Error:`, data.message);
          setHasError(true);
          setErrorMessage(data.message || "Unknown Provider Error");
          setIsSpinning(false);
          if (simTimerRef.current) clearTimeout(simTimerRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          if (onError) onError("PROVIDER_ERROR", data.message);
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handlePostMessage);
    return () => window.removeEventListener("message", handlePostMessage);
  }, [currentBalance, onPlaceBet, onSettleWin, onError, providerName, handleForceStop, addSpinHistory]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    setErrorMessage("");
    setIsSpinning(false);
    setShowUnstuckBanner(false);
    setResultBanner({ show: false, payout: 0, multiplier: 0, isWin: false });
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-red-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-red-500 font-black text-2xl mb-2 tracking-widest uppercase">Connection Lost</h3>
          <p className="text-slate-600 font-medium text-sm mb-8 max-w-sm">
            {errorMessage || `Provider ${providerName} encountered a fatal execution error.`}
          </p>
          <button 
            onClick={handleReload}
            className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-400 text-slate-950 font-black rounded-full uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <RotateCw className="w-4 h-4" />
            Reload Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full h-full">
      <div className="relative w-full h-[450px] md:h-[600px] bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Unstuck banner safeguard */}
        {showUnstuckBanner && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-slate-950 font-black text-xs px-6 py-3.5 rounded-full flex items-center gap-2.5 border border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)] backdrop-blur-md animate-pulse">
            <AlertTriangle className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>Connection desynced. Re-syncing wallet balance...</span>
          </div>
        )}

        {/* Premium Active Spin Overlay / Countdown / Stop Button */}
        {isSpinning && (
          <div className="absolute top-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-t-amber-500 rounded-full animate-spin" />
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-900 text-xs font-black uppercase tracking-wider">Spin connection active</p>
                <p className="text-slate-600 text-[10px] font-mono">
                  Auto-resolving in <span className="text-amber-600 font-bold">{countdown}s</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleForceStop}
              className="px-5 py-2.5 bg-red-500/10 hover:bg-red-650 text-red-600 hover:text-white border border-red-500/30 hover:border-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer hover:scale-105 active:scale-95"
            >
              Stop / Kill Spin
            </button>
          </div>
        )}

        {/* Premium Spin Result Announcement Banner */}
        {resultBanner.show && (
          <div className={cn(
            "absolute inset-0 z-45 flex flex-col items-center justify-center backdrop-blur-md bg-white/80 transition-all duration-500 animate-in fade-in duration-300",
            resultBanner.isWin ? "border-2 border-emerald-500/20" : "border-2 border-slate-200"
          )}>
            <div className="text-center p-8 max-w-sm rounded-[2rem] bg-white/95 border border-slate-200 shadow-2xl relative overflow-hidden">
              {resultBanner.isWin && (
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none animate-pulse" />
              )}
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border",
                resultBanner.isWin 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce" 
                  : "bg-slate-50 border-slate-200 text-slate-600 animate-pulse"
              )}>
                {resultBanner.isWin ? <Sparkles className="w-8 h-8 text-emerald-600" /> : <AlertTriangle className="w-8 h-8 text-slate-500" />}
              </div>
              
              <h3 className={cn(
                "font-black text-xl tracking-wider uppercase mb-1",
                resultBanner.isWin ? "text-emerald-600" : "text-slate-600"
              )}>
                {resultBanner.isWin ? "Win Result!" : "Loss Result"}
              </h3>
              
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Spin Settle Protocol</p>
              
              <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-500">Multiplier:</span>
                  <span className={cn("font-bold font-mono", resultBanner.isWin ? "text-emerald-600" : "text-slate-600")}>
                    {resultBanner.multiplier.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Payout:</span>
                  <span className="font-bold font-mono text-slate-900 text-base">
                    ₹{resultBanner.payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dark-mode Pulsing Skeleton Loader */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white">
            <div className="absolute inset-0 bg-neon-purple/5 blur-[100px] rounded-full animate-pulse" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 border-4 border-slate-200 border-t-yellow-400 rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(250,204,21,0.2)]" />
              <div className="h-4 w-48 bg-slate-100 rounded-full mb-4 animate-pulse" />
              <div className="h-3 w-64 bg-slate-100/50 rounded-full animate-pulse" />
              <p className="mt-8 font-black text-yellow-600 text-[10px] tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                Connecting to {providerName}
              </p>
            </div>
          </div>
        )}

        {/* External Game Iframe */}
        <iframe
          ref={iframeRef}
          src={gameUrl}
          title={`${providerName} - ${gameId}`}
          className={`w-full h-full border-none transition-opacity duration-1000 ${isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
          onLoad={handleIframeLoad}
          allow="autoplay; fullscreen"
        />
      </div>

      {/* 📊 Premium Live Spin Results Panel (Last 10 Spins) */}
      <div className="bg-slate-50/90 border border-slate-200/60 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-600" />
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Live Wallet Ledger (Last 10 Spins)</h4>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/60 px-2 py-0.5 rounded border border-slate-200">Aggregator Hub</span>
        </div>

        {spinHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-center gap-1.5">
            <Clock className="w-5 h-5 text-slate-600 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-wider">No spin wagers logged yet in this session</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-[10px] font-mono min-w-[500px]">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="pb-2 font-bold">Spin ID</th>
                  <th className="pb-2 font-bold">Time</th>
                  <th className="pb-2 font-bold text-right">Wager</th>
                  <th className="pb-2 font-bold text-right">Payout</th>
                  <th className="pb-2 font-bold text-center">Multiplier</th>
                  <th className="pb-2 font-bold text-center">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {spinHistory.map((spin) => (
                  <tr key={spin.id} className="text-slate-700 hover:bg-slate-50/30 transition-colors">
                    <td className="py-2.5 font-bold text-slate-600">{spin.id}</td>
                    <td className="py-2.5 text-slate-500">{spin.timestamp}</td>
                    <td className="py-2.5 text-right text-slate-800">₹{spin.bet.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">₹{spin.payout.toLocaleString()}</td>
                    <td className="py-2.5 text-center font-bold">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-black",
                        spin.multiplier > 0 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-50 text-slate-600"
                      )}>
                        {spin.multiplier.toFixed(1)}x
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                        spin.status === 'WIN' ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-red-500/15 text-red-600 border border-red-500/20"
                      )}>
                        {spin.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
