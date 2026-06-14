"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Smile, Info } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { usePathname } from "next/navigation";

interface Message {
  id: number;
  user: string;
  avatar: string;
  time: string;
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, user: "Ravi_K", avatar: "R", time: "10:42 AM", text: "Anyone playing Aviator right now?" },
  { id: 2, user: "System", avatar: "S", time: "10:43 AM", text: "A user just won ₹ 1,50,000 on Sweet Bonanza!" },
  { id: 3, user: "Priya99", avatar: "P", time: "10:44 AM", text: "That was crazy. I'm waiting for the IPL match to start." },
];

const HYPE_MESSAGES = [
  "Bro Aviator is paying out crazy right now 🚀",
  "Just withdrew 50k, instant payout is real! 💸",
  "Who else is betting on the IPL match tonight??",
  "Crazy win on Sweet Bonanza just now!!",
  "How long do withdrawals take? Oh wait nvm just got it.",
  "That was the closest match ever, I almost lost everything lol",
  "Anyone got promo codes?",
  "Let's goooo 10x multiplier hit!! 🔥",
  "Man this UI is so smooth compared to other sites",
  "Going all in on red next spin 🎰",
  "Need a cricket prediction guys, who's winning?",
  "Customer support resolved my issue in 2 mins, W site",
  "Just joined, what's the best game to start with?",
  "Plinko just dropped a 1000x for me omg!!",
  "I'm up 20k for the week, not bad right?",
  "Where are the live dealers? Oh found them.",
  "Trust me, Mines is the easiest way to grind balance."
];

const HYPE_USERS = [
  "Ravi_K", "Priya99", "GamerX", "Vikas_Bet", "RahulKing", 
  "SniperPro", "CasinoQueen", "Aman88", "Karan_Win", "Neha_Lucky",
  "TraderBoy", "AuraFan", "CricketGuru", "JackpotHunter"
];

interface LiveChatProps {
  isDocked?: boolean;
  onClose?: () => void;
}

export function LiveChat({ isDocked = false, onClose }: LiveChatProps) {
  const { currentUser } = useTradingStore();
  const pathname = usePathname();
  const isSportsbook = pathname?.startsWith("/sportsbook");
  const [isOpen, setIsOpen] = useState(isDocked);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Hype chat bot loop
  useEffect(() => {
    if (!isOpen && !isDocked) return;
    
    let hypeTimer: NodeJS.Timeout;
    
    const sendHypeMessage = () => {
      const randomMsg = HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)];
      const randomUser = HYPE_USERS[Math.floor(Math.random() * HYPE_USERS.length)];
      
      setMessages(prev => {
        const newMsg = {
          id: Date.now(),
          user: randomUser,
          avatar: randomUser.charAt(0).toUpperCase(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: randomMsg
        };
        // Keep only last 50 messages to avoid memory leak
        return [...prev, newMsg].slice(-50);
      });
      
      // Schedule next message between 3s and 10s
      const nextDelay = Math.random() * 7000 + 3000;
      hypeTimer = setTimeout(sendHypeMessage, nextDelay);
    };
    
    hypeTimer = setTimeout(sendHypeMessage, 3000);
    
    return () => clearTimeout(hypeTimer);
  }, [isOpen, isDocked]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [
      ...prev, 
      {
        id: Date.now(),
        user: currentUser?.username || "Guest",
        avatar: (currentUser?.username || "Guest").charAt(0).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: inputValue
      }
    ]);
    setInputValue("");
  };

  const content = (
    <div className={`flex flex-col h-full bg-slate-50 ${!isDocked ? 'w-full sm:w-[350px] shadow-2xl border-l border-slate-200' : 'w-full'}`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
          <h3 className="font-bold text-slate-900 text-sm tracking-wide">English Room</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-slate-600 hover:text-slate-600 transition-colors p-2" title="Chat Rules">
            <Info className="w-4 h-4" />
          </button>
          {(onClose || !isDocked) && (
            <button 
              onClick={onClose || (() => setIsOpen(false))}
              className="text-slate-600 hover:text-slate-600 transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center shrink-0 font-bold text-xs text-slate-700">
              {msg.avatar}
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm text-red-600">{msg.user}</span>
                <span className="text-[10px] text-slate-600">{msg.time}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-lg rounded-tl-none p-2 inline-block">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 shrink-0 bg-white">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:border-red-600 transition-colors">
          <button className="p-2 text-slate-600 hover:text-slate-600 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..." 
            className="flex-1 bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-0 px-2 py-2.5"
          />
          <button 
            onClick={handleSend}
            className="p-2 text-red-600 hover:text-red-500 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isDocked) {
    return content;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 z-50 p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-colors ${isSportsbook ? "right-[96px] lg:right-[430px]" : "right-[96px]"}`}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-50/20 z-[48] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex flex-col"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
