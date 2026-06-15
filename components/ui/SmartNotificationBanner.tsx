"use client";

import { useEffect, useState } from "react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function SmartNotificationBanner() {
  const { balance, transactions, isLoggedIn } = useTradingStore();
  const [visible, setVisible] = useState(false);
  const [bannerType, setBannerType] = useState<"inactivity" | "low_balance" | "loss" | "welcome" | null>(null);
  const [hasTriggeredLoss, setHasTriggeredLoss] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) return;

    // 1. Welcome Banner (new user, 0 transactions)
    if (transactions.length === 0) {
      const welcomeTimer = setTimeout(() => {
        setBannerType("welcome");
        setVisible(true);
      }, 5000); // Trigger after 5 seconds of first login
      return () => clearTimeout(welcomeTimer);
    }

    // 2. Low Balance Banner (< ₹1,000)
    if (balance < 1000 && balance > 0) {
      const lowBalTimer = setTimeout(() => {
        setBannerType("low_balance");
        setVisible(true);
      }, 8000);
      return () => clearTimeout(lowBalTimer);
    }

    // 3. Loss Banner (payout = 0 on last casino spin)
    const lastTx = transactions[0];
    if (
      lastTx &&
      lastTx.type === "casino" &&
      lastTx.details.includes("Payout: ₹0") &&
      !hasTriggeredLoss
    ) {
      setBannerType("loss");
      setVisible(true);
      setHasTriggeredLoss(true);
    }
  }, [balance, transactions, isLoggedIn, hasTriggeredLoss]);

  // 4. Inactivity detection (30s)
  useEffect(() => {
    if (!isLoggedIn || visible) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setBannerType("inactivity");
        setVisible(true);
      }, 30000); // 30 seconds
    };

    // Listen to user interactions
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer(); // Start timer initially

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [isLoggedIn, visible]);

  const handleBannerAction = () => {
    setVisible(false);
    if (bannerType === "low_balance") {
      // Open deposit / cashier modal
      // We can redirect to cashier/deposit page or open modal by dispatching an event
      const event = new CustomEvent("open-cashier-modal");
      window.dispatchEvent(event);
    } else if (bannerType === "welcome" || bannerType === "inactivity" || bannerType === "loss") {
      router.push("/casino");
    }
  };

  const getBannerConfig = () => {
    switch (bannerType) {
      case "welcome":
        return {
          title: "First Bet Bonus Ready! ⚡",
          desc: "Wager now to unlock the 'First Spin' achievement and earn double XP!",
          cta: "Play Casino",
          icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
          color: "border-yellow-500/30 shadow-yellow-500/10",
        };
      case "low_balance":
        return {
          title: "Boost Your Balance! 💰",
          desc: "Low funds detected. Deposit now and get a 5% instant reload bonus!",
          cta: "Reload Now",
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          color: "border-amber-500/30 shadow-amber-500/10",
        };
      case "loss":
        return {
          title: "Luck is Just a Spin Away! 🎁",
          desc: "Tough round! Enjoy 10% instant rebate on your next casino deposit.",
          cta: "Claim Rebate",
          icon: <Gift className="w-5 h-5 text-emerald-400 animate-bounce" />,
          color: "border-emerald-500/30 shadow-emerald-500/10",
        };
      case "inactivity":
      default:
        return {
          title: "Action is Waiting! 🎰",
          desc: "Your hot streak is waiting! Check out our live Neon Surfer slot now.",
          cta: "Spin Now",
          icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
          color: "border-purple-500/30 shadow-purple-500/10",
        };
    }
  };

  if (!visible || !bannerType) return null;
  const config = getBannerConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed top-24 right-4 z-40 w-[92%] max-w-sm bg-slate-900/90 backdrop-blur-md border rounded-2xl p-4 shadow-xl ${config.color} pointer-events-auto`}
      >
        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-extrabold text-sm leading-tight tracking-tight">
              {config.title}
            </h4>
            <p className="text-slate-300 text-xs mt-1 leading-snug">
              {config.desc}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleBannerAction}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {config.cta}
              </button>
              <button
                onClick={() => setVisible(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors self-start"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
