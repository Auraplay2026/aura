"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Trophy, Banknote, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface HypeMessage {
  id: string;
  type: "TRANSACTION" | "AFFILIATE" | "TRUST";
  icon: any;
  title: string;
  message: React.ReactNode;
  color: string;
}

const generateHypeMessage = (): HypeMessage => {
  const rand = Math.random();
  const id = Math.random().toString(36).substr(2, 9);
  
  if (rand < 0.4) {
    // 40% chance of Fake Transaction
    const amounts = ["$1,250", "$3,400", "$8,500", "$14,200", "$22,000", "$540", "$890", "$4,100"];
    const users = ["CryptoWhale99", "AlphaTrader", "VIP_Hustler", "LuckyStrike", "DiamondHands", "MoonBoy"];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    return {
      id,
      type: "TRANSACTION",
      icon: Banknote,
      title: "Massive Withdrawal",
      message: <span><strong className="text-emerald-400">{user}</strong> just cashed out <strong className="text-white">{amount}</strong></span>,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    };
  } else if (rand < 0.8) {
    // 40% chance of Affiliate Promo
    const amounts = ["$340", "$850", "$1,200", "$450", "$2,100", "$60"];
    const users = ["ReferralKing", "PassiveIncomeGen", "HustleMode", "TopEarner22", "Agent_007"];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    return {
      id,
      type: "AFFILIATE",
      icon: Users,
      title: "Affiliate Earnings",
      message: <span><strong className="text-blue-400">{user}</strong> earned <strong className="text-white">{amount}</strong> in commissions today!</span>,
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10"
    };
  } else {
    // 20% chance of Trust Badge
    const messages = [
      "AuraPlay is officially certified Provably Fair.",
      "Over 2.4 Million active players worldwide.",
      "Instant crypto withdrawals processed in < 2 mins.",
      "Tier-1 Security: 100% cold storage for user funds."
    ];
    return {
      id,
      type: "TRUST",
      icon: ShieldCheck,
      title: "Platform Trust",
      message: <span>{messages[Math.floor(Math.random() * messages.length)]}</span>,
      color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
    };
  }
};

export function GlobalHypeFeed() {
  const [currentMessage, setCurrentMessage] = useState<HypeMessage | null>(null);

  useEffect(() => {
    // Start interval
    const triggerNext = () => {
      // Show for 5 seconds
      setCurrentMessage(generateHypeMessage());
      
      setTimeout(() => {
        setCurrentMessage(null);
      }, 5000);
      
      // Wait randomly between 15 and 45 seconds before next
      const nextDelay = 15000 + Math.random() * 30000;
      setTimeout(triggerNext, nextDelay);
    };

    // Initial trigger after 5 seconds
    const initialTimer = setTimeout(triggerNext, 5000);

    return () => clearTimeout(initialTimer);
  }, []);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 pointer-events-none flex flex-col justify-end">
      <AnimatePresence mode="popLayout">
        {currentMessage && (
          <motion.div
            key={currentMessage.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`pointer-events-auto backdrop-blur-xl border rounded-2xl p-4 shadow-2xl max-w-sm w-full mb-3 cursor-pointer hover:scale-105 transition-transform ${currentMessage.color}`}
          >
            {/* If it's an affiliate message, wrap in Link */}
            {currentMessage.type === "AFFILIATE" ? (
              <Link href="/affiliate" className="block">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center shrink-0 border border-inherit">
                    <currentMessage.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-black opacity-80 mb-1">{currentMessage.title}</h4>
                    <p className="text-sm text-slate-300 leading-tight">
                      {currentMessage.message}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                      Refer & Earn <BadgeCheck className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center shrink-0 border border-inherit">
                  <currentMessage.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black opacity-80 mb-1">{currentMessage.title}</h4>
                  <p className="text-sm text-slate-300 leading-tight">
                    {currentMessage.message}
                  </p>
                  {currentMessage.type === "TRUST" && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                      Verified <ShieldCheck className="w-3 h-3" />
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
