"use client";

import { useState, useEffect } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift, Sparkles, CheckCircle2, RotateCw } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { usePathname } from "next/navigation";

export function DailyRewardModal() {
  const pathname = usePathname();
  const {
    isLoggedIn,
    currentUser,
    streakCount,
    claimedToday,
    spinWheelClaimedToday,
    claimDailyReward,
    spinWheelClaimed,
    unlockAchievement
  } = useTradingStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"streak" | "wheel">("streak");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger modal display automatically once daily login is detected
  useEffect(() => {
    if (currentUser?.role === 'admin' || pathname?.startsWith('/admin')) return;
    if (isLoggedIn) {
      if (!claimedToday || !spinWheelClaimedToday) {
        // Delay slightly for premium entrance
        const timer = setTimeout(() => {
          setIsOpen(true);
          if (claimedToday && !spinWheelClaimedToday) {
            setActiveTab("wheel");
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, claimedToday, spinWheelClaimedToday]);

  const DAILY_REWARDS = [50, 100, 200, 350, 500, 1000, 5000];
  const WHEEL_SECTORS = [
    { label: "₹50", prize: 50, color: "#1e1b4b" }, // Indigo 950
    { label: "₹100", prize: 100, color: "#312e81" }, // Indigo 900
    { label: "₹250", prize: 250, color: "#3730a3" }, // Indigo 800
    { label: "₹500", prize: 500, color: "#4f46e5" }, // Indigo 600
    { label: "₹1,000", prize: 1000, color: "#4338ca" }, // Indigo 700
    { label: "₹5,000", prize: 5000, color: "#b45309" }, // Gold
    { label: "500 XP", prize: 0, color: "#6d28d9" }, // Purple
    { label: "₹150", prize: 150, color: "#111827" } // Dark Slate
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

  const spinWheel = () => {
    if (isSpinning || spinWheelClaimedToday) return;
    setIsSpinning(true);
    setPrizeWon(null);

    // Play arcade tick-tick sound via Web Audio API while spinning
    let tickInterval: NodeJS.Timeout;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let ticks = 0;
      tickInterval = setInterval(() => {
        if (ticks > 40) {
          clearInterval(tickInterval);
          return;
        }
        ticks++;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(800 - ticks * 10, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      }, 120);
    } catch (e) {}

    const prizeIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const sector = WHEEL_SECTORS[prizeIndex];

    // Align wheel so that prize points towards top pointer (270 degrees)
    const newRotation = wheelRotation + 360 * 5 - prizeIndex * sectorAngle - sectorAngle / 2;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      clearInterval(tickInterval);

      // Claim prize
      spinWheelClaimed(sector.prize, `Won ${sector.label} on Spin Wheel`);
      if (sector.prize === 0) {
        useTradingStore.setState((s) => ({ xp: (s.xp || 0) + 500 }));
      }

      setPrizeWon(sector.label);
      setShowConfetti(true);

      // Achievements triggers
      if (sector.prize >= 5000) {
        unlockAchievement("jackpot_hunter");
      }
    }, 5000);
  };

  const handleClaimDaily = () => {
    claimDailyReward();
    setShowConfetti(true);
    setTimeout(() => {
      if (!spinWheelClaimedToday) {
        setActiveTab("wheel");
      } else {
        setIsOpen(false);
      }
    }, 2500);
  };

  if (currentUser?.role === 'admin' || pathname?.startsWith('/admin') || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <ConfettiCanvas active={showConfetti} onComplete={() => setShowConfetti(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.15)] relative flex flex-col max-h-[95vh]"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header tabs */}
          <div className="flex border-b border-slate-800 shrink-0 bg-slate-950/40 p-4 gap-2">
            <button
              onClick={() => setActiveTab("streak")}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "streak"
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Daily Streak
            </button>
            <button
              onClick={() => setActiveTab("wheel")}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === "wheel"
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <RotateCw className="w-4 h-4" />
              Spin The Wheel
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[380px]">
            {activeTab === "streak" ? (
              <div className="w-full text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                    Daily Login Streak
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Claim rewards daily to increase your streak power!
                  </p>
                </div>

                {/* Streak Calendar Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {DAILY_REWARDS.map((reward, idx) => {
                    const day = idx + 1;
                    const isClaimed = day < streakCount || (day === streakCount && claimedToday);
                    const isCurrent = day === streakCount && !claimedToday;
                    const isFuture = day > streakCount;

                    return (
                      <div
                        key={idx}
                        className={`relative rounded-2xl p-3 border flex flex-col items-center justify-between min-h-[100px] transition-all duration-300 ${
                          isClaimed
                            ? "bg-slate-950/40 border-emerald-500/30 text-slate-500"
                            : isCurrent
                            ? "bg-purple-950/30 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] animate-pulse"
                            : "bg-slate-900/50 border-slate-800/60 text-slate-400"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          Day {day}
                        </span>
                        <div className="my-2">
                          <Gift
                            className={`w-6 h-6 mx-auto ${
                              isClaimed ? "text-emerald-500" : isCurrent ? "text-purple-400" : "text-slate-500"
                            }`}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-white">
                          ₹{reward.toLocaleString()}
                        </span>
                        {isClaimed && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-slate-950" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <button
                    disabled={claimedToday}
                    onClick={handleClaimDaily}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 ${
                      claimedToday
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]"
                    }`}
                  >
                    {claimedToday ? "Claimed Today!" : `Claim Day ${streakCount} Reward`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    <RotateCw className="w-8 h-8 text-purple-500 animate-spin-slow" />
                    Lucky Spin Wheel
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Spin once per day to win cash prizes or XP boosters!
                  </p>
                </div>

                {/* Spinning Wheel SVG */}
                <div className="relative w-[300px] h-[300px] my-4 flex items-center justify-center">
                  {/* Outer glow rings */}
                  <div className="absolute inset-0 rounded-full border border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.1)] pointer-events-none" />
                  
                  {/* Pointer */}
                  <div className="absolute -top-3 left-[140px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-yellow-400 z-20 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />

                  {/* SVG Wheel */}
                  <svg
                    width="300"
                    height="300"
                    viewBox="0 0 300 300"
                    className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isSpinning ? "transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)" : "none",
                    }}
                  >
                    <g>
                      {WHEEL_SECTORS.map((sector, idx) => (
                        <g key={idx}>
                          <path
                            d={getSectorPath(idx)}
                            fill={sector.color}
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                          {/* Rotated text coordinate */}
                          {(() => {
                            const { x, y, angle } = getSectorTextCoords(idx);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${angle}, ${x}, ${y})`}
                              >
                                {sector.label}
                              </text>
                            );
                          })()}
                        </g>
                      ))}
                    </g>
                    {/* Inner cap */}
                    <circle cx="150" cy="150" r="30" fill="#090d16" stroke="#4f46e5" strokeWidth="3" />
                  </svg>

                  {/* Spin button center overlay */}
                  <button
                    disabled={isSpinning || spinWheelClaimedToday}
                    onClick={spinWheel}
                    className={`absolute w-14 h-14 rounded-full flex items-center justify-center font-black text-[10px] uppercase tracking-wider z-10 transition-all ${
                      spinWheelClaimedToday
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] cursor-pointer"
                    }`}
                  >
                    {spinWheelClaimedToday ? "Done" : "Spin"}
                  </button>
                </div>

                {/* Prize Notification */}
                {prizeWon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm text-center"
                  >
                    🎉 Congratulations! You won {prizeWon}!
                  </motion.div>
                )}

                {spinWheelClaimedToday && !prizeWon && (
                  <p className="text-xs text-slate-500">
                    You have already spun the wheel today. Come back tomorrow!
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
