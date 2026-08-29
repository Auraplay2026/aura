"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Trophy, Banknote, Users, ShieldCheck, Flame, Zap, X } from "lucide-react";
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
    const amounts = ["₹1,25,000", "₹3,40,000", "₹85,000", "₹1,42,000", "₹54,000", "₹89,000", "₹4,10,000"];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    return {
      id,
      type: "TRANSACTION",
      icon: Banknote,
      title: "Massive Withdrawal",
      message: <span><strong className="text-emerald-400">{user}</strong> just cashed out <strong className="text-slate-900">{amount}</strong></span>,
      color: "text-emerald-400 border-emerald-500/30 bg-white/95 shadow-emerald-500/5",
      avatarColor,
      userInitials,
    };
  } else if (rand < 0.5) {
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
      color: "text-yellow-400 border-yellow-500/30 bg-white/95 shadow-yellow-500/10",
      avatarColor: "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black",
      userInitials: "💰",
    };
  } else if (rand < 0.7) {
    const commissions = ["₹34,000", "₹85,000", "₹1,20,000", "₹45,000", "₹2,10,000"];
    const comm = commissions[Math.floor(Math.random() * commissions.length)];
    return {
      id,
      type: "AFFILIATE",
      icon: Users,
      title: "Affiliate Earnings",
      message: <span><strong className="text-purple-400">{user}</strong> earned <strong className="text-slate-900">{comm}</strong> in referral commissions!</span>,
      color: "text-purple-400 border-purple-500/30 bg-white/95 shadow-purple-500/5",
      avatarColor,
      userInitials,
    };
  } else if (rand < 0.85) {
    return {
      id,
      type: "TOURNAMENT",
      icon: Trophy,
      title: "🏆 Tournament Winner 🏆",
      message: <span><strong className="text-pink-400">{user}</strong> claimed 1st place in the Weekly Speed Racer Tournament!</span>,
      color: "text-pink-400 border-pink-500/30 bg-white/95 shadow-pink-500/5",
      avatarColor,
      userInitials,
    };
  } else {
    const messages = [
      "256-Bit SSL Encrypted Escrow Vault Active",
      "Instant 0% Fee IMPS/UPI Cashouts Live",
      "Official Certified RNG & Fair Odds Online"
    ];
    return {
      id,
      type: "TRUST",
      icon: ShieldCheck,
      title: "Platform Trust",
      message: <span>{messages[Math.floor(Math.random() * messages.length)]}</span>,
      color: "text-blue-400 border-blue-500/30 bg-white/95 shadow-blue-500/5",
      avatarColor: "bg-blue-600 text-slate-900 font-bold",
      userInitials: "🛡️",
    };
  }
};

export function GlobalHypeFeed() {
  const [currentMessage, setCurrentMessage] = useState<HypeMessage | null>(null);
  const pathname = usePathname();
  const { currentUser } = useTradingStore();

  const isBettingOrGameRoute = 
    !pathname || 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/casino") || 
    pathname.startsWith("/sportsbook") || 
    pathname.startsWith("/game") || 
    currentUser?.role === 'admin';

  useEffect(() => {
    if (isBettingOrGameRoute) {
      setCurrentMessage(null);
      return;
    }

    const triggerNext = () => {
      setCurrentMessage(generateHypeMessage());
      
      const clearTimer = setTimeout(() => {
        setCurrentMessage(null);
      }, 5500);
      
      const nextDelay = 22000 + Math.random() * 20000;
      const loopTimer = setTimeout(triggerNext, nextDelay);

      return () => {
        clearTimeout(clearTimer);
        clearTimeout(loopTimer);
      };
    };

    const initialTimer = setTimeout(triggerNext, 8000);
    return () => clearTimeout(initialTimer);
  }, [isBettingOrGameRoute]);

  if (isBettingOrGameRoute) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-[80] pointer-events-none flex flex-col justify-end">
      <AnimatePresence mode="popLayout">
        {currentMessage && (
          <motion.div
            key={currentMessage.id}
            drag="x"
            dragDirectionLock
            dragElastic={0.7}
            dragConstraints={{ left: -200, right: 200 }}
            onDragEnd={(event, info) => {
              if (Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 300) {
                setCurrentMessage(null);
              }
            }}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: -100, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className={`pointer-events-auto backdrop-blur-xl border rounded-[20px] p-3.5 pr-8 shadow-2xl max-w-sm w-full mb-3 cursor-grab active:cursor-grabbing touch-pan-y relative select-none group ${currentMessage.color}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMessage(null);
              }}
              aria-label="Dismiss hype notification"
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {currentMessage.type === "AFFILIATE" ? (
              <Link href="/affiliate" className="block">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 font-extrabold text-xs shadow-md ${currentMessage.avatarColor}`}>
                    {currentMessage.userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] uppercase tracking-widest font-black opacity-80 mb-0.5 flex items-center gap-1.5">
                      <currentMessage.icon className="w-3.5 h-3.5" />
                      {currentMessage.title}
                    </h4>
                    <p className="text-xs text-slate-700 leading-normal line-clamp-2">
                      {currentMessage.message}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                      Refer & Earn <BadgeCheck className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 font-extrabold text-xs shadow-md ${currentMessage.avatarColor}`}>
                  {currentMessage.userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] uppercase tracking-widest font-black opacity-80 mb-0.5 flex items-center gap-1.5">
                    <currentMessage.icon className="w-3.5 h-3.5" />
                    {currentMessage.title}
                  </h4>
                  <p className="text-xs text-slate-700 leading-normal line-clamp-2">
                    {currentMessage.message}
                  </p>
                  {currentMessage.type === "TRUST" && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                      Verified Provably Fair <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}
                  {currentMessage.type === "JACKPOT" && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20 animate-pulse">
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
