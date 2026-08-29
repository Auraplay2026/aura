"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, ChevronRight, Copy, Check } from "lucide-react";
import { usePathname } from "next/navigation";

export function WhatsAppFloatButton() {
  const pathname = usePathname();
  const isBettingOrGameScreen = 
    !pathname || 
    pathname.startsWith("/casino") || 
    pathname.startsWith("/arcade") || 
    pathname.startsWith("/game") || 
    pathname.startsWith("/sportsbook/match") || 
    pathname.startsWith("/admin");

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  // Hide on all casino game viewports and betting cockpits to guarantee zero interception of bet/cashout actions
  if (isBettingOrGameScreen) {
    return null;
  }

  // Official VIP Customer Support WhatsApp Number
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER || "+91 6290482750";
  const cleanNumber = rawNumber.replace(/[^0-9]/g, "") || "916290482750";

  const quickActions = [
    {
      id: "create_id",
      icon: "👑",
      title: "Get Official Betting ID",
      desc: "Manual player ID creation & instant verification",
      text: "👑 *AuraPlay VIP Desk:* Hello, I want ID. Please create and activate my official betting exchange ID."
    },
    {
      id: "deposit",
      icon: "💸",
      title: "Instant UPI Deposit & UTR",
      desc: "Fast balance top-up help & receipt approval",
      text: "💳 *AuraPlay Cashier:* Hello, I want ID & deposit coordination for instant 15-sec UPI balance top-up."
    },
    {
      id: "cricket",
      icon: "🏏",
      title: "Live Cricket Bhav & Match ID",
      desc: "Pitch-side 0.2s cricket market queries",
      text: "🏏 *AuraPlay Cricket:* Hello, I want ID for pitch-side 0.2s radar live cricket exchange betting."
    },
    {
      id: "withdrawal",
      icon: "🏦",
      title: "15-Sec Fast Withdrawal",
      desc: "Check payout & bank IMPS dispatch",
      text: "🏦 *AuraPlay Payouts:* Hello, I want ID withdrawal support for 15-second IMPS dispatch."
    },
    {
      id: "bonus",
      icon: "🎁",
      title: "Claim ₹10,000 Welcome Bonus",
      desc: "100% First Deposit Match & VIP Cashback",
      text: "🎁 *AuraPlay VIP Bonus:* Hello, I want ID to claim my ₹10,000 first deposit welcome bonus."
    }
  ];

  const defaultVipMsg = "👑 *AuraPlay VIP Exchange Concierge*\n\nHello, I want ID.\n\n✨ *Request:* Official Betting & Casino ID Setup\n⚡ *Access:* 0% Commission Live Cricket Bhav & 15-Sec Instant UPI Payouts\n🎁 *Bonus:* ₹10,000 First Deposit Match\n\nPlease create and activate my official ID.";

  const handleLaunchWhatsApp = (messageText: string) => {
    const textToSend = messageText.trim() === "I want ID" || !messageText.trim() ? defaultVipMsg : messageText;
    const encodedText = encodeURIComponent(textToSend);
    const url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className={`fixed ${isCasinoGame ? "bottom-24 right-4" : "bottom-[140px] right-4 md:bottom-6 md:right-20"} z-40 flex items-center gap-3 pointer-events-auto transition-all duration-300`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {/* Pulsing Green Aura Rings */}
          <span className="absolute -inset-2 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-75 blur-xs pointer-events-none" />

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black p-3 sm:px-4 sm:py-3.5 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition-all duration-300 transform hover:scale-105 active:scale-95 border border-emerald-300/40 cursor-pointer group"
            aria-label="Contact VIP WhatsApp Support"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-emerald-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-600 animate-pulse" />
            </div>
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-extrabold pr-1">
              WhatsApp VIP Help
            </span>
          </button>
        </motion.div>
      </div>

      {/* Expandable WhatsApp Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`fixed ${isCasinoGame ? "bottom-28" : "bottom-24 md:bottom-20"} right-4 sm:right-6 z-50 w-[92vw] max-w-[380px] bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.18)] border border-emerald-200/80 overflow-hidden flex flex-col backdrop-blur-xl`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                    <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                      AuraPlay VIP WhatsApp <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    </h3>
                    <p className="text-[10px] text-emerald-100 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      Online • Avg Response &lt; 30 sec
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Number Card */}
              <div className="mt-4 bg-white/10 border border-white/15 rounded-xl p-2.5 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold">VIP Desk:</span>
                  <span className="font-mono text-xs font-bold text-white">{rawNumber}</span>
                </div>
                <button
                  onClick={handleCopyNumber}
                  className="text-[9px] font-black uppercase tracking-wider bg-white/20 hover:bg-white text-white hover:text-emerald-900 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Quick Action Options */}
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar bg-slate-50/50">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Choose Instant Topic:
              </span>

              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleLaunchWhatsApp(action.text)}
                  className="w-full text-left p-3 bg-white hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition-all duration-200 shadow-xs hover:shadow-md flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{action.icon}</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            {/* Custom Query Box & Direct Launch */}
            <div className="p-4 bg-white border-t border-slate-100 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Or type a custom message..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customMsg.trim()) {
                      handleLaunchWhatsApp(customMsg);
                      setCustomMsg("");
                    }
                  }}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium pr-10"
                />
                <button
                  onClick={() => {
                    if (customMsg.trim()) {
                      handleLaunchWhatsApp(customMsg);
                      setCustomMsg("");
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleLaunchWhatsApp(customMsg.trim() || "I want ID")}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4 fill-white" /> Open Direct WhatsApp Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
