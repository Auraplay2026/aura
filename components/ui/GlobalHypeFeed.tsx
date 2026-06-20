"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Trophy, Banknote, Users, ShieldCheck, Flame, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTradingStore } from "@/lib/store";

interface HypeMessage {
  id: string;
  type: "TRANSACTION" | "AFFILIATE" | "TRUST" | "JACKPOT" | "TOURNAMENT" | "STREAK";
  icon: any;
  title: string;
  message: React.ReactNode;
  color: string;
  avatarColor: string;
  userInitials: string;
  gameIcon?: string;
}

const AVATAR_COLORS = [
  "bg-red-500/80 border-red-500/40 text-slate-900",
  "bg-purple-500/80 border-purple-500/40 text-slate-900",
  "bg-emerald-500/80 border-emerald-500/40 text-slate-900",
  "bg-blue-500/80 border-blue-500/40 text-slate-900",
  "bg-pink-500/80 border-pink-500/40 text-slate-900",
  "bg-yellow-500/80 border-yellow-500/40 text-slate-950",
  "bg-indigo-500/80 border-indigo-500/40 text-slate-900",
];

const generateHypeMessage = (): HypeMessage => {
  const rand = Math.random();
  const id = Math.random().toString(36).substring(2, 11);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  
  const users = ["CryptoWhale99", "AlphaTrader", "VIP_Hustler", "LuckyStrike", "DiamondHands", "MoonBoy", "GoldenAce", "NeonSurfer"];
  const user = users[Math.floor(Math.random() * users.length)];
  const userInitials = user.substring(0, 2).toUpperCase();

  if (rand < 0.25) {
    // 25% chance of Cash Withdrawal
    const amounts = ["₹1,25,000", "₹3,40,000", "₹85,000", "₹1,42,000", "₹54,000", "₹89,000", "₹4,10,000"];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    return {
      id,
      type: "TRANSACTION",
      icon: Banknote,
      title: "Massive Withdrawal",
      message: <span><strong className="text-emerald-400">{user}</strong> just cashed out <strong className="text-slate-900">{amount}</strong></span>,
      color: "text-emerald-400 border-emerald-500/30 bg-white/90 shadow-emerald-500/5",
      avatarColor,
      userInitials,
    };
  } else if (rand < 0.5) {
    // 25% chance of Jackpot Alert
    const jackpots = ["₹2,50,000", "₹5,00,000", "₹12,00,000", "₹9,50,000"];
    const jackpot = jackpots[Math.floor(Math.random() * jackpots.length)];
    const games = ["🎰 Neon Surfer Slot", "🎲 Roulette Pro", "🃏 Blackjack VIP"];
    const game = games[Math.floor(Math.random() * games.length)];
    return {
      id,
      type: "JACKPOT",
      icon: Zap,
      title: "🔥 JACKPOT ALERT! 🔥",
      message: <span><strong className="text-yellow-400">{user}</strong> hit a mega jackpot of <strong className="text-slate-900">{jackpot}</strong> on <span className="italic">{game}</span>!</span>,
      color: "text-yellow-400 border-yellow-500/30 bg-white/90 shadow-yellow-500/10 animate-pulse-glow",
      avatarColor: "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black",
      userInitials: "💰",
    };
  } else if (rand < 0.7) {
    // 20% chance of Affiliate Promo
    const commissions = ["₹34,000", "₹85,000", "₹1,20,000", "₹45,000", "₹2,10,000"];
    const comm = commissions[Math.floor(Math.random() * commissions.length)];
    return {
      id,
      type: "AFFILIATE",
      icon: Users,
      title: "Affiliate Earnings",
      message: <span><strong className="text-purple-400">{user}</strong> earned <strong className="text-slate-900">{comm}</strong> in referral commissions today!</span>,
      color: "text-purple-400 border-purple-500/30 bg-white/90 shadow-purple-500/5",
      avatarColor,
      userInitials,
    };
  } else if (rand < 0.85) {
    // 15% chance of Tournament Victory / Streak Bonus
    const eventRand = Math.random();
    if (eventRand < 0.5) {
      return {
        id,
        type: "TOURNAMENT",
        icon: Trophy,
        title: "🏆 Tournament Winner 🏆",
        message: <span><strong className="text-pink-400">{user}</strong> claimed 1st place in the Weekly Speed Racer Tournament!</span>,
        color: "text-pink-400 border-pink-500/30 bg-white/90 shadow-pink-500/5",
        avatarColor,
        userInitials,
      };
    } else {
      return {
        id,
        type: "STREAK",
        icon: Flame,
        title: "Streak Ascension",
        message: <span><strong className="text-red-400">{user}</strong> unlocked Day 7 streak bonus of <strong className="text-slate-900">₹5,000</strong>!</span>,
        color: "text-red-400 border-red-500/30 bg-white/90 shadow-red-500/5",
        avatarColor: "bg-red-600 text-slate-900 font-bold",
        userInitials: "🔥",
      };
    }
  } else {
    // 15% chance of Trust Badge
    const messages = [
      "AuraPlay is officially certified Provably Fair.",
      "Over 2.4 Million active players worldwide.",
      "Instant UPI withdrawals processed in < 2 mins.",
      "Tier-1 Security: 100% cold storage for user funds."
    ];
    return {
      id,
      type: "TRUST",
      icon: ShieldCheck,
      title: "Platform Trust",
      message: <span>{messages[Math.floor(Math.random() * messages.length)]}</span>,
      color: "text-blue-400 border-blue-500/30 bg-white/90 shadow-blue-500/5",
      avatarColor: "bg-blue-600 text-slate-900 font-bold",
      userInitials: "🛡️",
    };
  }
};

export function GlobalHypeFeed() {
  const [currentMessage, setCurrentMessage] = useState<HypeMessage | null>(null);
  const pathname = usePathname();
  const { currentUser } = useTradingStore();

  useEffect(() => {
    const triggerNext = () => {
      // Show for 6 seconds
      setCurrentMessage(generateHypeMessage());
      
      const clearTimer = setTimeout(() => {
        setCurrentMessage(null);
      }, 6000);
      
      // Staggered timing: wait randomly between 18 and 35 seconds before next
      const nextDelay = 18000 + Math.random() * 17000;
      const loopTimer = setTimeout(triggerNext, nextDelay);

      return () => {
        clearTimeout(clearTimer);
        clearTimeout(loopTimer);
      };
    };

    // Initial trigger after 4 seconds
    const initialTimer = setTimeout(triggerNext, 4000);

    return () => clearTimeout(initialTimer);
  }, []);

  if (currentUser?.role === 'admin' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-[100] pointer-events-none flex flex-col justify-end">
      <AnimatePresence mode="popLayout">
        {currentMessage && (
          <motion.div
            key={currentMessage.id}
            drag="x"
            dragConstraints={{ left: -150, right: 150 }}
            onDragEnd={(event, info) => {
              if (Math.abs(info.offset.x) > 100) {
                setCurrentMessage(null);
              }
            }}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className={`pointer-events-auto backdrop-blur-xl border rounded-[20px] p-4 shadow-2xl max-w-sm w-full mb-3 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform duration-300 relative select-none ${currentMessage.color}`}
          >
            {/* If it's an affiliate message, wrap in Link */}
            {currentMessage.type === "AFFILIATE" ? (
              <Link href="/affiliate" className="block pr-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 font-extrabold text-xs shadow-md ${currentMessage.avatarColor}`}>
                    {currentMessage.userInitials}
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-black opacity-80 mb-1 flex items-center gap-1.5">
                      <currentMessage.icon className="w-3.5 h-3.5" />
                      {currentMessage.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-normal">
                      {currentMessage.message}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30">
                      Refer & Earn <BadgeCheck className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 font-extrabold text-xs shadow-md ${currentMessage.avatarColor}`}>
                  {currentMessage.userInitials}
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black opacity-80 mb-1 flex items-center gap-1.5">
                    <currentMessage.icon className="w-3.5 h-3.5" />
                    {currentMessage.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-normal">
                    {currentMessage.message}
                  </p>
                  {currentMessage.type === "TRUST" && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-500/30">
                      Verified Provably Fair <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}
                  {currentMessage.type === "JACKPOT" && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-lg border border-yellow-500/30 animate-pulse">
                      Mega Win <BadgeCheck className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
