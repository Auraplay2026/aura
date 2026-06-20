"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Mail, 
  Headset, 
  Search, 
  HelpCircle, 
  ChevronDown, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useTradingStore } from "@/lib/store";

interface Message {
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: number;
}

const FAQS = [
  {
    q: "How does the cloud game renting work?",
    a: "Select any game in our Cloud Library, choose your rental duration (from 1 to 24 hours), and click Rent. The game runs on our remote hardware and streams at 60 FPS directly to your browser. Your game saves sync automatically."
  },
  {
    q: "Why am I blocked from renting games in Demo mode?",
    a: "Demo accounts receive exactly 3 free trials. After completing 3 rental trials, you must upgrade to a Real Account and deposit funds to continue playing high-graphics games. Practice slot betting remains unlimited."
  },
  {
    q: "How long do manual cashier deposits take?",
    a: "Deposit requests (UPI UTR uploads and bank transfers) are reviewed manually by our verification desk. Approvals typically take between 5 to 15 minutes. Duplicate or fake screenshots will trigger account locks."
  },
  {
    q: "How do I cash out/withdraw my balances?",
    a: "Go to the Cashier, click on the 'Withdraw' tab, choose UPI or Bank Wire, enter your credentials, and submit. Real account withdrawals are processed securely within 1 to 4 hours."
  },
  {
    q: "How do I verify my account KYC?",
    a: "To verify your account, visit Account Settings -> KYC and upload a valid government ID or proof of residence. Approved KYC members gain access to higher VIP tiers and faster withdrawal times."
  }
];

const CATEGORIES = [
  { id: "billing", title: "Cashier & Deposits", desc: "UPI, BTC, bank wire help" },
  { id: "gaming", title: "Cloud Renting", desc: "Hardware streams & trial limits" },
  { id: "account", title: "KYC & Verification", desc: "VIP onboarding & account locks" },
  { id: "betting", title: "Sportsbook & Slots", desc: "Wagers, cashouts & odds" }
];

export default function SupportPage() {
  const currentUser = useTradingStore(state => state.currentUser);
  
  // FAQs filter search
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Chat window state
  const [chatEmail, setChatEmail] = useState("");
  const [chatName, setChatName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState<'bot' | 'waiting' | 'active' | 'closed'>('bot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (currentUser) {
      setChatEmail(currentUser.email);
      setChatName(currentUser.username);
    }
  }, [currentUser]);

  // Handle scrolling in chat box
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Polling for live agent messages when waiting/active
  useEffect(() => {
    if (!isConnected || (chatStatus !== 'waiting' && chatStatus !== 'active')) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/support/chat?email=${encodeURIComponent(chatEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.session) {
            setMessages(data.session.messages);
            setChatStatus(data.session.status);
          }
        }
      } catch (err) {
        console.error("Error polling chat:", err);
      }
    };

    pollingRef.current = setInterval(pollMessages, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isConnected, chatStatus, chatEmail]);

  // Initialize Support Chat
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatEmail.trim() || !chatName.trim()) return;

    setIsConnecting(true);
    try {
      const res = await fetch(`/api/support/chat?email=${encodeURIComponent(chatEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setMessages(data.session.messages);
          setChatStatus(data.session.status);
          setIsConnected(true);
        } else {
          // Send initial greeting
          const initRes = await fetch("/api/support/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: chatEmail,
              username: chatName,
              sender: "bot",
              text: `Welcome to the AuraPlay elite concierge desk, ${chatName}. I am your AI Support Concierge. How can I assist you with your deposit, cloud game rentals, or account verification today?`
            })
          });
          if (initRes.ok) {
            const initData = await initRes.json();
            if (initData.success) {
              setMessages(initData.session.messages);
              setChatStatus(initData.session.status);
              setIsConnected(true);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to connect support chat", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Send message to chatbot
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    setUserInput("");
    setIsTyping(true);

    // Append user message instantly in UI
    const tempUserMsg: Message = { sender: 'user', text: currentInput, timestamp: Date.now() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: chatEmail,
          username: chatName,
          sender: "user",
          text: currentInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setMessages(data.session.messages);
          setChatStatus(data.session.status);
        }
      }
    } catch (err) {
      console.error("Failed to post message", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Explicit transfer to agent
  const handleRequestAgent = async () => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: chatEmail,
          username: chatName,
          sender: "user",
          text: "I want to speak with a human support agent.",
          action: "transfer"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setMessages(data.session.messages);
          setChatStatus(data.session.status);
        }
      }
    } catch (err) {
      console.error("Failed to request transfer", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Filter FAQs based on search
  const filteredFaqs = FAQS.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Top Banner section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white/80 p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-neon-purple/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-neon-cyan/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="w-16 h-16 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 mb-2">
            <Headset className="w-8 h-8 text-neon-purple animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-wider">AuraPlay Concierge Desk</h1>
          <p className="text-slate-600 text-sm md:text-base font-medium">
            Welcome to luxury 24/7 VIP assistance. Browse FAQs or initiate a secure support session with our brand AI and live customer support representatives.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Category search and FAQ list */}
        <div className="flex-1 space-y-6">
          
          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setSearchQuery(cat.title)}
                className="bg-slate-50/30 border border-slate-200/50 rounded-2xl p-5 hover:border-neon-purple/40 hover:bg-slate-50/60 transition-all cursor-pointer group shadow-sm"
              >
                <h3 className="text-slate-900 font-bold text-sm tracking-wide group-hover:text-neon-purple transition-colors">{cat.title}</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium">{cat.desc}</p>
              </div>
            ))}
          </div>

          {/* Search bar & FAQ Accordion */}
          <div className="bg-slate-50/30 border border-slate-200/50 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-neon-cyan" /> Frequently Asked Inquiries
              </h2>
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter FAQs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/60 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-slate-900 focus:outline-none focus:border-neon-cyan"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, i) => {
                  const isExpanded = expandedFaq === i;
                  return (
                    <div 
                      key={i}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white/40 hover:bg-white/70 transition-colors"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : i)}
                        className="w-full p-4 flex justify-between items-center text-left text-xs font-bold text-slate-800"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-slate-200"
                          >
                            <p className="p-4 text-[11px] text-slate-600 leading-relaxed font-medium bg-slate-50/10">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 font-bold uppercase">
                  No match found. Chat with our Concierge for immediate assistance.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Live AI & Agent Concierge chat console */}
        <div className="w-full lg:w-[420px] bg-white/85 border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col h-[520px] relative overflow-hidden shrink-0">
          
          {!isConnected ? (
            /* CONNECT CHAT SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <MessageSquare className="w-12 h-12 text-neon-purple mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse" />
              <div className="text-center mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Start VIP Chat Session</h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[280px] font-medium leading-relaxed">
                  Start an instant concierge thread handled by our AI, ready to connect you with live support if requested.
                </p>
              </div>

              <form onSubmit={handleStartChat} className="w-full space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    placeholder="player@example.com"
                    value={chatEmail}
                    onChange={e => setChatEmail(e.target.value)}
                    disabled={currentUser !== null}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 placeholder:text-slate-700 focus:outline-none focus:border-neon-purple disabled:opacity-60 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Name / Username</label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter name"
                    value={chatName}
                    onChange={e => setChatName(e.target.value)}
                    disabled={currentUser !== null}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 placeholder:text-slate-700 focus:outline-none focus:border-neon-purple disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="w-full py-3 bg-gradient-to-r from-neon-purple to-purple-600 hover:from-purple-500 hover:to-purple-600 text-slate-900 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(168,85,247,0.2)] disabled:opacity-50"
                >
                  {isConnecting ? "Establishing Handshake..." : "Connect Support Channel"}
                </button>
              </form>
            </div>
          ) : (
            /* CHAT INTERACTIVE WINDOW */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Connected Chat Header */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
                      {chatName.substring(0,2).toUpperCase()}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-300 absolute -bottom-0.5 -right-0.5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{chatName}</h4>
                    <p className="text-[9px] text-slate-500 font-mono">Channel active</p>
                  </div>
                </div>

                {/* Status tags */}
                <div className="flex items-center gap-1.5">
                  {chatStatus === 'bot' && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI Chat
                    </span>
                  )}
                  {chatStatus === 'waiting' && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1 animate-pulse">
                      <Clock className="w-2.5 h-2.5" /> Transferring
                    </span>
                  )}
                  {chatStatus === 'active' && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Live Agent
                    </span>
                  )}
                </div>
              </div>

              {/* Chat transfer notice drawer if bot */}
              {chatStatus === 'bot' && (
                <div className="my-2 p-2.5 bg-purple-500/5 border border-purple-500/10 rounded-xl flex justify-between items-center shrink-0">
                  <span className="text-[9px] text-slate-600 font-medium pl-1">Need a human helper instead?</span>
                  <button 
                    onClick={handleRequestAgent}
                    className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 border border-purple-500/20 rounded-lg text-[8px] font-bold uppercase transition-all"
                  >
                    Request Agent
                  </button>
                </div>
              )}

              {/* Chat Message feed logs */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 custom-scrollbar">
                {messages.map((msg, i) => {
                  const isUser = msg.sender === 'user';
                  const isBot = msg.sender === 'bot';
                  const isSystemAlert = isBot && msg.text.startsWith("System Alert:");

                  if (isSystemAlert) {
                    return (
                      <div key={i} className="flex justify-center my-1.5">
                        <span className="bg-white border border-slate-200 text-[9px] text-slate-500 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {msg.text.replace("System Alert:", "").trim()}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={i}
                      className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                        isUser 
                          ? 'bg-white border-slate-200 text-slate-600' 
                          : isBot 
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-600' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      }`}>
                        {isUser ? <User className="w-3 h-3" /> : isBot ? <Bot className="w-3 h-3" /> : <Headset className="w-3 h-3" />}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-[8px] font-bold text-slate-500 uppercase ${isUser ? 'text-right' : ''}`}>
                          {isUser ? 'You' : isBot ? 'Concierge' : 'Live Agent'}
                        </span>
                        <div className={`p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${
                          isUser 
                            ? 'bg-white border border-slate-200 rounded-tr-none text-slate-800' 
                            : isBot
                            ? 'bg-purple-100 border border-purple-300 rounded-tl-none text-purple-700'
                            : 'bg-emerald-100 border border-emerald-300 rounded-tl-none text-emerald-200 shadow-lg shadow-emerald-950/10'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* AI Concierge typing state loader */}
                {isTyping && (
                  <div className="flex gap-2.5 mr-auto max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Concierge</span>
                      <div className="p-3 bg-purple-100 border border-purple-300 rounded-2xl rounded-tl-none text-purple-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1.4s_infinite_0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1.4s_infinite_0.4s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1.4s_infinite_0.6s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Waiting for Human Alert banner */}
              {chatStatus === 'waiting' && (
                <div className="bg-yellow-500/5 border border-yellow-500/10 p-2.5 rounded-xl flex items-center gap-2 mb-2 text-[10px] text-yellow-500 font-medium shrink-0 animate-pulse">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Awaiting agent transfer... response times average &lt; 2 minutes. Please don't close this panel.</span>
                </div>
              )}

              {/* Active human agent warning banner */}
              {chatStatus === 'active' && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex items-center gap-2 mb-2 text-[10px] text-emerald-600 font-medium shrink-0">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Elite Support Representative is connected to this thread.</span>
                </div>
              )}

              {/* Chat Input controls */}
              <div className="border-t border-slate-200 pt-3.5 shrink-0">
                {chatStatus === 'closed' ? (
                  <div className="text-center p-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500">
                    This support session is closed. Click here to <button onClick={() => { setIsConnected(false); setMessages([]); }} className="text-neon-purple underline font-black uppercase tracking-wider">reopen channel</button>.
                  </div>
                ) : (
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-1.5 focus-within:border-neon-purple/50 transition-colors">
                    <input 
                      type="text" 
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                      placeholder={
                        chatStatus === 'waiting' 
                          ? "Queueing... message history is synced." 
                          : "Type your query here..."
                      }
                      className="flex-1 bg-transparent border-none text-[11px] text-slate-900 placeholder:text-slate-650 focus:outline-none focus:ring-0 px-2 py-2"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!userInput.trim()}
                      className="p-1.5 text-neon-purple hover:text-slate-900 hover:bg-neon-purple rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neon-purple cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
