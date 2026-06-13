"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const DUMMY_MESSAGES = [
  { id: 1, user: "CryptoKing", type: "chat", text: "Who's playing Crash right now?" },
  { id: 2, user: "System", type: "win", text: "Player777 just won ₹ 1,50,000 on Sweet Bonanza!" },
  { id: 3, user: "LuckyStrike", type: "chat", text: "That was crazy lol" },
  { id: 4, user: "BetMax", type: "chat", text: "Sending it on red." },
];

export function RightSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [...prev.slice(-49), { id: Date.now(), user: "You", type: "chat", text: inputValue }]);
    setInputValue("");
  };

  // Simulate incoming live messages
  useEffect(() => {
    const interval = setInterval(() => {
      const isWin = Math.random() > 0.7;
      const newMessage = isWin
        ? { id: Date.now(), user: "System", type: "win", text: `Highroller${Math.floor(Math.random() * 100)} just won ₹ ${(Math.random() * 50000 + 10000).toFixed(0)} on Gates of Olympus!` }
        : { id: Date.now(), user: `User${Math.floor(Math.random() * 1000)}`, type: "chat", text: ["LFG!!!", "Rigged tbh", "Nice hit", "Anyone betting on the Arsenal match?"][Math.floor(Math.random() * 4)] };
      
      setMessages((prev) => [...prev.slice(-49), newMessage]); // Keep last 50
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Toggle Button for mobile/when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 bg-white hover:bg-slate-50 text-blue-600 rounded-full shadow-lg border border-slate-200"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden xl:flex flex-col bg-white border-l border-slate-200 sticky top-0 h-screen z-40 relative"
        style={{ width: 0 }} // Initial state before animation
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-slate-900 tracking-wide">Global Chat</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-sm p-3 rounded-2xl",
                  msg.type === "win" 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-slate-50 border border-slate-100"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.type === "win" && <Coins className="w-3 h-3 text-green-600" />}
                  <span className={cn(
                    "font-bold text-xs",
                    msg.type === "win" ? "text-green-600" : "text-slate-600"
                  )}>
                    {msg.user}
                  </span>
                </div>
                <p className={cn(
                  "leading-relaxed",
                  msg.type === "win" ? "text-slate-900 font-medium" : "text-slate-700"
                )}>
                  {msg.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Say something..." 
              className="w-full bg-white border border-slate-300 rounded-full pl-4 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Floating Panel for Mobile/Tablet (Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-3xl border-l border-slate-200 shadow-2xl z-50 flex flex-col xl:hidden"
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-slate-900 tracking-wide">Global Chat</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth"
            >
              {/* Duplicate mapping for mobile panel */}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "text-sm p-3 rounded-2xl",
                      msg.type === "win" 
                        ? "bg-green-50 border border-green-200" 
                        : "bg-slate-50 border border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.type === "win" && <Coins className="w-3 h-3 text-green-600" />}
                      <span className={cn(
                        "font-bold text-xs",
                        msg.type === "win" ? "text-green-600" : "text-slate-600"
                      )}>
                        {msg.user}
                      </span>
                    </div>
                    <p className={cn(
                      "leading-relaxed",
                      msg.type === "win" ? "text-slate-900 font-medium" : "text-slate-700"
                    )}>
                      {msg.text}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 pb-8">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Say something..." 
                  className="w-full bg-white border border-slate-300 rounded-full pl-4 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-full"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-50/40 z-40 xl:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}
