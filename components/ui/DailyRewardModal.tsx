"use client";

import { useState, useEffect, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift, Sparkles, CheckCircle2, RotateCw, Clock, Trophy, AlertCircle } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { usePathname } from "next/navigation";
import { playGameSound } from "@/lib/audio";

export function DailyRewardModal() {
  const pathname = usePathname();
  const {
    isLoggedIn,
    currentUser,
    streakCount,
    claimedToday,
    spinWheelClaimedToday,
    fetchStreakStatus,
    claimDailyReward,
    spinWheelClaimed,
    unlockAchievement,
    dailyModalLastDismissedDate,
    dismissDailyModal,
    soundEnabled
  } = useTradingStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"streak" | "wheel">("streak");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [timeToNextReset, setTimeToNextReset] = useState("");

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live countdown to next midnight IST (00:00:00 Asia/Kolkata)
  useEffect(() => {
    const updateCountdown = () => {
      try {
        const now = new Date();
        const istFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false
        });
        const parts = istFormatter.formatToParts(now);
        const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
        const seconds = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);

        const secondsPassedToday = (hours % 24) * 3600 + minutes * 60 + seconds;
        const secondsUntilMidnight = (24 * 3600) - secondsPassedToday;

        const h = Math.floor(secondsUntilMidnight / 3600);
        const m = Math.floor((secondsUntilMidnight % 3600) / 60);
        const s = secondsUntilMidnight % 60;

        setTimeToNextReset(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
      } catch (e) {
        setTimeToNextReset("Midnight IST");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchStreakStatus();
    }
  }, [isLoggedIn, currentUser, fetchStreakStatus]);

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  // Trigger modal display automatically once daily login is detected (only in lobby/home, never during live betting games)
  useEffect(() => {
    if (
      currentUser?.role === 'admin' || 
      pathname?.startsWith('/admin') || 
      pathname?.startsWith('/casino/game') || 
      pathname?.startsWith('/casino/crash') ||
      pathname?.startsWith('/sportsbook/match')
    ) return;

    if (isLoggedIn) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dailyModalLastDismissedDate === todayStr) return;

      if (!claimedToday || !spinWheelClaimedToday) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          if (claimedToday && !spinWheelClaimedToday) {
            setActiveTab("wheel");
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, claimedToday, spinWheelClaimedToday, dailyModalLastDismissedDate, currentUser, pathname]);

  // Listen to open-daily-reward custom event for manual triggers
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setFeedbackNotice(null);
      if (isLoggedIn && currentUser) {
        fetchStreakStatus();
      }
    };
    window.addEventListener("open-daily-reward", handleOpen);
    return () => window.removeEventListener("open-daily-reward", handleOpen);
  }, [isLoggedIn, currentUser, fetchStreakStatus]);

  const DAILY_REWARDS = [10, 20, 30, 50, 75, 100, 200];
  const WHEEL_SECTORS = [
    { label: "₹10", prize: 10, weight: 45, color: "#1e1b4b", glow: false }, // Indigo 950 (45% common win)
    { label: "₹10,000", prize: 10, weight: 0, color: "#b45309", glow: true }, // Gold Mega Jackpot Teaser (0% real probability)
    { label: "₹25", prize: 25, weight: 30, color: "#312e81", glow: false }, // Indigo 900 (30% common win)
    { label: "₹5,000", prize: 25, weight: 0, color: "#6d28d9", glow: true }, // Purple VIP Teaser (0% real probability)
    { label: "₹50", prize: 50, weight: 18, color: "#3730a3", glow: false }, // Indigo 800 (18% common win)
    { label: "₹2,500", prize: 50, weight: 0, color: "#047857", glow: true }, // Emerald Vault Teaser (0% real probability)
    { label: "₹75", prize: 75, weight: 5, color: "#4f46e5", glow: false }, // Indigo 600 (5% win)
    { label: "₹100", prize: 100, weight: 2, color: "#4338ca", glow: false } // Indigo 700 (2% max cap win)
  ];

  const sectorAngle = 360 / WHEEL_SECTORS.length;

  const getSectorPath = (index: number) => {
    const angle = sectorAngle;
    const startAngle = index * angle;
    const endAngle = (index + 1) * angle;
    const radStart = ((startAngle - 90) * Math.PI) / 180;
    const radEnd = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 150 + 150 * Math.cos(radStart);
    const y1 = 150 + 150 * Math.sin(radStart);
    const x2 = 150 + 150 * Math.cos(radEnd);
    const y2 = 150 + 150 * Math.sin(radEnd);

    return `M 150 150 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`;
  };

  const getSectorTextCoords = (index: number) => {
    const angle = index * sectorAngle + sectorAngle / 2 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 150 + 105 * Math.cos(rad);
    const y = 150 + 105 * Math.sin(rad);
    return { x, y, angle: angle + 90 };
  };

  const getSectorPegCoords = (index: number) => {
    const angle = (index * sectorAngle - 90) * (Math.PI / 180);
    return {
      x: 150 + 142 * Math.cos(angle),
      y: 150 + 142 * Math.sin(angle)
    };
  };

  const spinWheel = () => {
    if (isSpinning) return;
    if (spinWheelClaimedToday) {
      setFeedbackNotice(`You already spun today! Next Lucky Spin unlocks in ${timeToNextReset} (Midnight IST).`);
      return;
    }
    
    setIsSpinning(true);
    setPrizeWon(null);
    setFeedbackNotice(null);

    // Realistic Decelerating Mechanical Audio Engine
    if (soundEnabled !== false) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const playClick = (freq = 900, duration = 0.035, vol = 0.04) => {
            try {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
              gain.gain.setValueAtTime(vol, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
              osc.start();
              osc.stop(audioCtx.currentTime + duration);
            } catch (e) {}
          };

          // Program realistic physical intervals that slow down exponentially
          const intervals = [
            40, 40, 45, 45, 50, 50, 55, 60, 65, 75, 85, 95, 110, 130, 155, 185, 220, 270, 330, 410, 510, 640, 800, 1020
          ];
          let accumulatedTime = 0;
          intervals.forEach((delay, idx) => {
            accumulatedTime += delay;
            setTimeout(() => {
              const pitch = 950 - idx * 18;
              playClick(pitch, 0.04, idx > 18 ? 0.07 : 0.035);
            }, accumulatedTime);
          });
        }
      } catch (e) {}
    }

    // Controlled low-ball weighted RNG (Always rewards small amounts ₹10-₹50)
    const totalWeight = WHEEL_SECTORS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    let prizeIndex = 0;
    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
      if (rand < WHEEL_SECTORS[i].weight) {
        prizeIndex = i;
        break;
      }
      rand -= WHEEL_SECTORS[i].weight;
    }

    const sector = WHEEL_SECTORS[prizeIndex];

    // Near-Miss Illusion: Pointer lands right on the thrilling edge of the ₹10,000 Mega slice
    const nearMissOffset = (prizeIndex === 0) ? 12 : (prizeIndex === 2) ? -12 : 0;
    const newRotation = wheelRotation + 360 * 6 - prizeIndex * sectorAngle - sectorAngle / 2 + nearMissOffset;
    setWheelRotation(newRotation);

    spinTimeoutRef.current = setTimeout(async () => {
      setIsSpinning(false);
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

      // Claim prize on server
      await spinWheelClaimed(sector.prize, `Won ${sector.label} on Spin Wheel`, prizeIndex);
      if (sector.prize === 0) {
        useTradingStore.setState((s) => ({ xp: (s.xp || 0) + 100 }));
      }

      setPrizeWon(sector.label);
      setShowConfetti(true);
      playGameSound('win');

      if (sector.prize >= 100) {
        unlockAchievement("jackpot_hunter");
      }
    }, 5200);
  };

  const handleClaimDaily = async () => {
    if (isClaiming) return;
    if (claimedToday) {
      setFeedbackNotice(`Day ${streakCount} reward is already claimed! Next streak reward unlocks in ${timeToNextReset}.`);
      return;
    }
    setIsClaiming(true);
    setFeedbackNotice(null);
    try {
      await claimDailyReward();
      setShowConfetti(true);
      playGameSound('win');
      setTimeout(() => {
        setIsClaiming(false);
        if (!spinWheelClaimedToday) {
          setActiveTab("wheel");
        }
      }, 2000);
    } catch (err) {
      console.error("Daily reward claim failed", err);
      setIsClaiming(false);
    }
  };

  if (currentUser?.role === 'admin' || pathname?.startsWith('/admin') || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <ConfettiCanvas active={showConfetti} onComplete={() => setShowConfetti(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 22 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-[0_15px_60px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[92vh] text-white font-sans"
        >
          {/* Close button */}
          <button
            onClick={() => {
              setIsOpen(false);
              dismissDailyModal();
            }}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors z-20 cursor-pointer border border-slate-700"
            aria-label="Close daily rewards"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/70 p-3.5 gap-2 shrink-0">
            <button
              onClick={() => { setActiveTab("streak"); setFeedbackNotice(null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "streak"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Daily Streak {claimedToday && "✓"}
            </button>
            <button
              onClick={() => { setActiveTab("wheel"); setFeedbackNotice(null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "wheel"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Spin The Wheel {spinWheelClaimedToday && "✓"}
            </button>
          </div>

          {/* Live Reset Status Strip */}
          <div className="bg-slate-950/90 border-b border-slate-800/60 px-5 py-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Rewards Hub</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Next Reset: <strong className="text-white">{timeToNextReset}</strong></span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center">
            
            {/* Feedback Alert Notice */}
            {feedbackNotice && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{feedbackNotice}</span>
              </motion.div>
            )}

            {activeTab === "streak" ? (
              <div className="w-full text-center space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                    Daily Login Streak
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Log in every day to claim cash rewards and build your streak power!
                  </p>
                </div>

                {/* Streak Calendar Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {DAILY_REWARDS.map((reward, idx) => {
                    const day = idx + 1;
                    const isClaimed = day < streakCount || (day === streakCount && claimedToday);
                    const isCurrent = day === streakCount && !claimedToday;

                    return (
                      <div
                        key={idx}
                        className={`relative rounded-2xl p-2.5 border flex flex-col items-center justify-between min-h-[90px] transition-all duration-300 ${
                          isClaimed
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                            : isCurrent
                            ? "bg-indigo-950/50 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400 animate-pulse"
                            : "bg-slate-800/40 border-slate-700/60 text-slate-400"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                          Day {day}
                        </span>
                        <div className="my-1.5">
                          <Gift
                            className={`w-5 h-5 mx-auto ${
                              isClaimed ? "text-emerald-400" : isCurrent ? "text-indigo-400 animate-bounce" : "text-slate-500"
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-black font-mono ${isClaimed ? "text-emerald-300" : isCurrent ? "text-amber-300" : "text-slate-300"}`}>
                          ₹{reward.toLocaleString()}
                        </span>
                        {isClaimed && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-950" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleClaimDaily}
                    disabled={isClaiming}
                    className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      claimedToday
                        ? "bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30"
                    }`}
                  >
                    {isClaiming ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : claimedToday ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Day {streakCount} Claimed Today (Next in {timeToNextReset})
                      </span>
                    ) : (
                      <span>Claim Day {streakCount} Reward (₹{DAILY_REWARDS[streakCount - 1] || 50})</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4 text-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    <RotateCw className="w-6 h-6 text-purple-400" />
                    Lucky Spin Wheel
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Spin once every day — Mega ₹10,000 Jackpot is in play today!
                  </p>
                </div>

                {/* Spinning Wheel SVG */}
                <div 
                  onClick={spinWheel}
                  className={`relative w-[280px] h-[280px] my-2 flex items-center justify-center select-none ${
                    !spinWheelClaimedToday && !isSpinning ? "cursor-pointer active:scale-95 transition-transform" : ""
                  }`}
                >
                  {/* Outer glow rings */}
                  <div className="absolute inset-0 rounded-full border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] pointer-events-none animate-pulse" />
                  
                  {/* Physical Pointer Ticker */}
                  <div className={`absolute -top-3 left-[130px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[22px] border-t-amber-400 z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] transition-transform ${
                    isSpinning ? "animate-bounce scale-110" : ""
                  }`} />

                  {/* SVG Wheel */}
                  <svg
                    width="280"
                    height="280"
                    viewBox="0 0 300 300"
                    className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] will-change-transform"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isSpinning ? "transform 5.2s cubic-bezier(0.12, 0.98, 0.22, 1)" : "none",
                    }}
                  >
                    <defs>
                      <radialGradient id="wheelCenterGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1e1b4b" />
                        <stop offset="100%" stopColor="#090d16" />
                      </radialGradient>
                    </defs>

                    {/* Sectors */}
                    <g>
                      {WHEEL_SECTORS.map((sector, idx) => (
                        <g key={idx}>
                          <path
                            d={getSectorPath(idx)}
                            fill={sector.color}
                            stroke="#0f172a"
                            strokeWidth="2.5"
                          />
                          {/* Highlight Gold Teaser Slices */}
                          {sector.glow && (
                            <path
                              d={getSectorPath(idx)}
                              fill="none"
                              stroke="#facc15"
                              strokeWidth="1.5"
                              opacity="0.6"
                            />
                          )}
                          {(() => {
                            const { x, y, angle } = getSectorTextCoords(idx);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill={sector.glow ? "#fde047" : "#ffffff"}
                                fontSize={sector.label.length > 5 ? "9.5" : "11.5"}
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${angle}, ${x}, ${y})`}
                                className="tracking-tight"
                              >
                                {sector.label}
                              </text>
                            );
                          })()}
                        </g>
                      ))}
                    </g>

                    {/* Perimeter Metallic Pegs */}
                    <g>
                      {WHEEL_SECTORS.map((_, idx) => {
                        const peg = getSectorPegCoords(idx);
                        return (
                          <circle
                            key={`peg-${idx}`}
                            cx={peg.x}
                            cy={peg.y}
                            r="3.5"
                            fill="#facc15"
                            stroke="#713f12"
                            strokeWidth="1"
                            className="drop-shadow-sm"
                          />
                        );
                      })}
                    </g>

                    {/* Inner Center Hub */}
                    <circle cx="150" cy="150" r="34" fill="url(#wheelCenterGrad)" stroke="#a855f7" strokeWidth="3" />
                  </svg>

                  {/* Spin button center overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      spinWheel();
                    }}
                    disabled={isSpinning}
                    className={`absolute w-14 h-14 rounded-full flex items-center justify-center font-black text-[11px] uppercase tracking-wider z-20 transition-all cursor-pointer shadow-2xl ${
                      spinWheelClaimedToday
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        : "bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white hover:scale-105 shadow-purple-600/50 border-2 border-amber-300/60"
                    }`}
                  >
                    {isSpinning ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : spinWheelClaimedToday ? (
                      "Done"
                    ) : (
                      "SPIN"
                    )}
                  </button>
                </div>

                {/* Prize Notification */}
                {prizeWon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-black text-sm text-center"
                  >
                    🎉 Congratulations! You won {prizeWon}!
                  </motion.div>
                )}

                {spinWheelClaimedToday && !prizeWon && (
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Lucky spin claimed today! Next spin available in <strong>{timeToNextReset}</strong>.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
