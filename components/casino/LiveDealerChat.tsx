"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Heart, Sparkles, Trophy, Gift, ChevronRight, ChevronLeft, Volume2 } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { playDealerVoice, playGameSound } from "@/lib/audio";

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  vipLevel: string;
  text: string;
  isTip?: boolean;
  tipAmount?: number;
  time: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "m1", user: "VIP_Kunal", avatar: "👑", vipLevel: "Diamond", text: "Big bets on Red 32 today! 🔥", time: "18:42" },
  { id: "m2", user: "Aegis_Alpha", avatar: "🛡️", vipLevel: "Platinum", text: "Dealer Elena, good luck! 🍀", time: "18:43" },
  { id: "m3", user: "CyberQueen", avatar: "💎", vipLevel: "Gold", text: "Nice spin on the previous round!", time: "18:43" },
  { id: "m4", user: "ViperStrike", avatar: "⚡", vipLevel: "Silver", text: "Tipped ₹500 to dealer Elena", isTip: true, tipAmount: 500, time: "18:44" }
];

const QUICK_EMOJIS = ["🔥", "🚀", "💰", "👑", "👏", "🍀", "💎", "❤️"];

export function LiveDealerChat({ 
  dealerName = "Elena", 
  dealerTitle = "VIP Table Master",
  tableId = "LIVE-ROULETTE-01"
}: { 
  dealerName?: string;
  dealerTitle?: string;
  tableId?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = useTradingStore(state => state.currentUser);
  const userIdentifier = currentUser?.username || currentUser?.email?.split("@")[0] || "You";
  const userVip = currentUser?.vipLevel || "Bronze";

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Periodic incoming simulated player chat
  useEffect(() => {
    const randomUsers = [
      { name: "Rohit_VIP", vip: "Gold", avatar: "🦁" },
      { name: "ApexTrader", vip: "Platinum", avatar: "🚀" },
      { name: "LuckyRahul", vip: "Silver", avatar: "🎲" },
      { name: "Danish_Ace", vip: "Diamond", avatar: "👑" },
      { name: "MumbaiRoller", vip: "Gold", avatar: "💰" }
    ];

    const cannedMessages = [
      "Let's go Red 14! 🔥",
      "Who is playing Player side?",
      "Great dealer, very fast pace! 👏",
      "50x incoming on this round!",
      "Nice round everyone!",
      "Black 26 please!",
      "Going heavy on Third Dozen!"
    ];

    const timer = setInterval(() => {
      const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
      const randomText = cannedMessages[Math.floor(Math.random() * cannedMessages.length)];
      
      const newMsg: ChatMessage = {
        id: `sim-${Date.now()}-${Math.random()}`,
        user: randomUser.name,
        avatar: randomUser.avatar,
        vipLevel: randomUser.vip,
        text: randomText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev.slice(-30), newMsg]);
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    try { playGameSound("click"); } catch {}

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      user: userIdentifier,
      avatar: "👤",
      vipLevel: userVip,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev.slice(-30), newMsg]);
    setInputText("");
  };

  const handleSendEmoji = (emoji: string) => {
    try { playGameSound("click"); } catch {}

    // Add floating emoji
    const emojiId = `flt-${Date.now()}-${Math.random()}`;
    setFloatingEmojis(prev => [...prev, { id: emojiId, emoji, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(f => f.id !== emojiId));
    }, 2000);

    // Also send in chat
    const newMsg: ChatMessage = {
      id: `usr-emj-${Date.now()}`,
      user: userIdentifier,
      avatar: "👤",
      vipLevel: userVip,
      text: emoji,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev.slice(-30), newMsg]);
  };

  const handleTipDealer = (amount: number = 100) => {
    try { 
      playGameSound("chip"); 
      playDealerVoice(`Thank you for the tip, ${userIdentifier}! Good luck on this round!`);
    } catch {}

    const tipMsg: ChatMessage = {
      id: `tip-${Date.now()}`,
      user: userIdentifier,
      avatar: "💎",
      vipLevel: userVip,
      text: `Tipped ₹${amount} to Dealer ${dealerName}! 🎁`,
      isTip: true,
      tipAmount: amount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev.slice(-30), tipMsg]);
  };

  return (
    <div className="relative">
      {/* Floating Animated Emojis */}
      <AnimatePresence>
        {floatingEmojis.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -120, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            style={{ left: `${f.x}%` }}
            className="absolute bottom-24 pointer-events-none text-2xl z-50 select-none drop-shadow-md"
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Chat Collapse Toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="absolute -top-9 right-0 bg-slate-900/90 border border-slate-700 text-yellow-400 px-3 py-1 rounded-t-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:bg-slate-800 transition-colors z-20 cursor-pointer"
      >
        <MessageSquare className="w-3 h-3 text-yellow-400" />
        Live Chat & Table ({messages.length})
        {isOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 280 }}
          exit={{ opacity: 0, width: 0 }}
          className="w-[280px] bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-2xl flex flex-col h-[480px] shadow-2xl overflow-hidden"
        >
          {/* Dealer Header Bar */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs">
                    👩‍💼
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-xs font-black tracking-wide">{dealerName}</span>
                  <span className="text-[8px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-black uppercase">Dealer</span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">{dealerTitle}</div>
              </div>
            </div>
            
            {/* Tip Dealer Button */}
            <button
              onClick={() => handleTipDealer(100)}
              title="Tip ₹100 to Dealer"
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow active:scale-95 transition-all cursor-pointer"
            >
              <Gift className="w-3 h-3" />
              Tip ₹100
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map(m => (
              <div 
                key={m.id} 
                className={`p-2 rounded-xl border ${
                  m.isTip 
                    ? "bg-amber-950/30 border-yellow-500/40 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                    : m.user === userIdentifier
                    ? "bg-slate-900/80 border-slate-700 text-slate-200"
                    : "bg-slate-900/40 border-slate-800/60 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{m.avatar}</span>
                    <span className="font-bold text-[11px] text-slate-200">{m.user}</span>
                    <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                      m.vipLevel === "Diamond" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                      m.vipLevel === "Platinum" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                      m.vipLevel === "Gold" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {m.vipLevel}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400">{m.time}</span>
                </div>
                <div className={`text-[11px] leading-relaxed break-words ${m.isTip ? "font-bold text-yellow-300 flex items-center gap-1" : "text-slate-300"}`}>
                  {m.isTip && <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />}
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Emoji Bar */}
          <div className="px-2 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between gap-1 shrink-0">
            {QUICK_EMOJIS.map(em => (
              <button
                key={em}
                onClick={() => handleSendEmoji(em)}
                className="hover:scale-125 transition-transform text-sm p-1 cursor-pointer active:scale-95"
              >
                {em}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Chat with table..."
              maxLength={120}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-yellow-500/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-30 text-slate-950 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
