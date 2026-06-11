"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Bot, 
  User, 
  Send, 
  Settings, 
  Clock, 
  Check, 
  X, 
  Search, 
  ShieldAlert, 
  RefreshCw,
  Sparkles,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

interface ChatMessage {
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: number;
}

interface ChatSession {
  email: string;
  username: string;
  status: 'bot' | 'waiting' | 'active' | 'closed';
  updatedAt: number;
  messages: ChatMessage[];
}

interface SupportConfig {
  openRouterApiKey: string;
  aiModel: string;
  systemPrompt: string;
}

interface ClientSupportDashboardProps {
  initialSessions: ChatSession[];
  initialConfig: SupportConfig;
}

export default function ClientSupportDashboard({ initialSessions, initialConfig }: ClientSupportDashboardProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [config, setConfig] = useState<SupportConfig>(initialConfig);
  const [selectedChatEmail, setSelectedChatEmail] = useState<string | null>(
    initialSessions.length > 0 ? initialSessions[0].email : null
  );
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'active' | 'bot'>('all');
  
  // Messaging input
  const [replyText, setReplyText] = useState("");
  
  // Config states
  const [apiKeyInput, setApiKeyInput] = useState(initialConfig.openRouterApiKey);
  const [modelInput, setModelInput] = useState(initialConfig.aiModel);
  const [promptInput, setPromptInput] = useState(initialConfig.systemPrompt);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Loading/Polling states
  const [isPolling, setIsPolling] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll chats every 3 seconds
  useEffect(() => {
    if (!isPolling) return;
    
    const fetchUpdates = async () => {
      try {
        const res = await fetch("/api/admin/support");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSessions(data.sessions);
          }
        }
      } catch (err) {
        console.error("Failed to poll chat sessions", err);
      }
    };

    const interval = setInterval(fetchUpdates, 3000);
    return () => clearInterval(interval);
  }, [isPolling]);

  // Scroll to bottom on chat change or new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatEmail, sessions]);

  const activeChat = sessions.find(s => s.email === selectedChatEmail);

  // Send message as Admin
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedChatEmail || !activeChat) return;

    const currentText = replyText;
    setReplyText("");

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedChatEmail,
          username: activeChat.username,
          sender: "admin",
          text: currentText
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Instantly update the local state with the returned session
          setSessions(prev => prev.map(s => s.email === selectedChatEmail ? data.session : s));
        }
      }
    } catch (err) {
      console.error("Failed to send admin reply", err);
    }
  };

  // Admin Chat takeover (switches status from 'bot' or 'waiting' to 'active')
  const handleTakeOver = async () => {
    if (!selectedChatEmail || !activeChat) return;

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedChatEmail,
          username: activeChat.username,
          sender: "admin",
          text: "Concierge Alert: Support Specialist has joined the session to assist you."
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(prev => prev.map(s => s.email === selectedChatEmail ? data.session : s));
        }
      }
    } catch (err) {
      console.error("Failed to take over chat", err);
    }
  };

  // Close session
  const handleCloseSession = async () => {
    if (!selectedChatEmail || !activeChat) return;

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedChatEmail,
          username: activeChat.username,
          sender: "bot",
          text: "",
          action: "close"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(prev => prev.map(s => s.email === selectedChatEmail ? data.session : s));
        }
      }
    } catch (err) {
      console.error("Failed to close session", err);
    }
  };

  // Save support settings
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setConfigSuccessMsg("");
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openRouterApiKey: apiKeyInput,
          aiModel: modelInput,
          systemPrompt: promptInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfigSuccessMsg("Configuration saved successfully!");
          // Refresh configuration masked keys
          const confRes = await fetch("/api/admin/support");
          if (confRes.ok) {
            const confData = await confRes.json();
            setConfig(confData.config);
          }
          setTimeout(() => setConfigSuccessMsg(""), 3000);
        }
      }
    } catch (err) {
      console.error("Failed to save config", err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Stats computation
  const stats = {
    totalActive: sessions.filter(s => s.status !== 'closed').length,
    waiting: sessions.filter(s => s.status === 'waiting').length,
    inConversation: sessions.filter(s => s.status === 'active').length,
    botHandled: sessions.filter(s => s.status === 'bot').length,
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return session.status === statusFilter && matchesSearch;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 min-h-[85vh]">
      
      {/* Top dashboard summary header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-600" /> Support Desk Admin Center
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">Monitor, configure, and takeover chat threads for premium luxury concierge help.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border ${
              isConfigOpen 
                ? "bg-slate-50 border-yellow-500 text-yellow-500" 
                : "bg-white border-slate-200 text-slate-700 hover:border-slate-700"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            AI Config Settings
          </button>
          <button 
            onClick={() => setIsPolling(!isPolling)}
            className={`p-2 rounded-xl border text-xs transition-all flex items-center justify-center ${
              isPolling 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title={isPolling ? "Auto Refreshing Live" : "Auto Refresh Paused"}
          >
            <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/85 border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Awaiting Agent</span>
          <span className="text-3xl font-black text-yellow-500 mt-2 font-mono flex items-baseline gap-1.5">
            {stats.waiting}
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping inline-block" />
          </span>
        </div>
        <div className="bg-white/85 border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Active Chats</span>
          <span className="text-3xl font-black text-cyan-600 mt-2 font-mono">{stats.inConversation}</span>
        </div>
        <div className="bg-white/85 border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">AI Concierge</span>
          <span className="text-3xl font-black text-purple-600 mt-2 font-mono">{stats.botHandled}</span>
        </div>
        <div className="bg-white/85 border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Active Channels</span>
          <span className="text-3xl font-black text-emerald-600 mt-2 font-mono">{stats.totalActive}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Session lists & queues */}
        <div className="w-full lg:w-[380px] bg-white/85 border border-slate-200 rounded-3xl p-5 flex flex-col gap-4.5 shadow-2xl shrink-0 h-[650px]">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/60 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="grid grid-cols-4 bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold text-center">
              {(['all', 'waiting', 'active', 'bot'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`py-1.5 rounded-lg capitalize transition-colors ${
                    statusFilter === tab 
                      ? "bg-slate-100 text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-700"
                  }`}
                >
                  {tab === 'waiting' ? 'Queued' : tab === 'active' ? 'Live' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Session scroll feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
            {filteredSessions.length > 0 ? (
              filteredSessions.map(session => {
                const isSelected = selectedChatEmail === session.email;
                const lastMsg = session.messages[session.messages.length - 1];
                
                return (
                  <button
                    key={session.email}
                    onClick={() => setSelectedChatEmail(session.email)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-slate-50 border-yellow-500/50 shadow-md"
                        : "bg-white/40 border-slate-200 hover:border-slate-200 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">{session.username}</span>
                        <span className="text-[10px] text-slate-600 truncate mt-0.5">{session.email}</span>
                      </div>
                      
                      {/* Status Badges */}
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                        session.status === 'waiting'
                          ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse"
                          : session.status === 'active'
                          ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"
                          : session.status === 'bot'
                          ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                          : "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}>
                        {session.status === 'waiting' ? 'Awaiting' : session.status}
                      </span>
                    </div>

                    {lastMsg && (
                      <p className="text-[10px] text-slate-600 font-medium truncate italic pl-0.5">
                        {lastMsg.sender === 'user' ? '👤 ' : lastMsg.sender === 'admin' ? '💼 ' : '🤖 '}
                        {lastMsg.text}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-slate-600 font-medium pl-0.5 mt-0.5 border-t border-slate-200 pt-1.5">
                      <span>{session.messages.length} messages</span>
                      <span>{formatRelativeTime(session.updatedAt)}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 border border-dashed border-slate-200 rounded-2xl">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-bold">No sessions found</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat interaction pane & AI configuration overlay */}
        <div className="flex-1 bg-white/85 border border-slate-200 rounded-3xl p-5 flex flex-col shadow-2xl h-[650px] relative overflow-hidden">
          
          <AnimatePresence>
            {isConfigOpen && (
              /* AI SETTINGS DROPDOWN DRAWER */
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-x-0 top-0 bg-white/95 backdrop-blur-2xl z-30 border-b border-slate-200 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> OpenRouter LLM AI Engine Config
                  </h3>
                  <button 
                    onClick={() => setIsConfigOpen(false)}
                    className="w-7 h-7 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider pl-0.5">OpenRouter API Key</label>
                    <input 
                      type="password"
                      placeholder={config.openRouterApiKey ? "••••••••••••••••••••••••" : "sk-or-v1-..."}
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  {/* AI Model */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider pl-0.5">Model Slug</label>
                    <input 
                      type="text"
                      placeholder="e.g. google/gemini-2.5-flash"
                      value={modelInput}
                      onChange={e => setModelInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider pl-0.5">System Prompt / Brand Rules</label>
                    <textarea 
                      rows={3}
                      value={promptInput}
                      onChange={e => setPromptInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {configSuccessMsg && (
                  <div className="text-xs text-emerald-600 font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4" /> {configSuccessMsg}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button 
                    onClick={() => setIsConfigOpen(false)}
                    className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md"
                  >
                    {isSavingConfig ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeChat ? (
            /* CONVERSATION INTERACTION VIEW */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Active Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-700 border border-slate-200">
                    {activeChat.username.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{activeChat.username}</h3>
                    <p className="text-[10px] text-slate-600 font-medium">{activeChat.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Indicator */}
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    activeChat.status === 'waiting'
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : activeChat.status === 'active'
                      ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"
                      : activeChat.status === 'bot'
                      ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}>
                    {activeChat.status === 'waiting' ? 'Queued' : activeChat.status}
                  </span>

                  {/* Actions */}
                  {activeChat.status !== 'closed' && (
                    <button
                      onClick={handleCloseSession}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase text-red-600 transition-colors"
                    >
                      Resolve & Close
                    </button>
                  )}
                </div>
              </div>

              {/* Takeover CTA alert if bot/waiting */}
              {activeChat.status !== 'active' && activeChat.status !== 'closed' && (
                <div className="my-3 p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                  <div className="flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[11px] text-slate-700 font-medium">
                      {activeChat.status === 'waiting' 
                        ? "User has explicitly requested to speak with a human support agent." 
                        : "AI chatbot is currently handling the user's queries."}
                    </p>
                  </div>
                  <button
                    onClick={handleTakeOver}
                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Take Over Chat
                  </button>
                </div>
              )}

              {/* Chat Message Logs */}
              <div className="flex-1 overflow-y-auto py-5 pr-1.5 space-y-4 custom-scrollbar">
                {activeChat.messages.length > 0 ? (
                  activeChat.messages.map((msg, i) => {
                    const isUser = msg.sender === 'user';
                    const isBot = msg.sender === 'bot';
                    const isSystemAlert = isBot && msg.text.startsWith("System Alert:");
                    
                    if (isSystemAlert) {
                      return (
                        <div key={i} className="flex justify-center my-2">
                          <span className="bg-white border border-slate-200 text-slate-600 text-[10px] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
                            {msg.text.replace("System Alert:", "").trim()}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={i}
                        className={`flex gap-3 max-w-[80%] ${
                          isUser ? 'mr-auto' : 'ml-auto flex-row-reverse'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold ${
                          isUser 
                            ? 'bg-white border-slate-200 text-slate-600' 
                            : isBot 
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-600' 
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                          {isUser ? <User className="w-3.5 h-3.5" /> : isBot ? <Bot className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className={`flex items-baseline gap-2 ${isUser ? '' : 'justify-end'}`}>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">
                              {isUser ? activeChat.username : isBot ? 'AI Concierge' : 'Support Specialist'}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`p-3.5 rounded-3xl text-xs font-medium leading-relaxed ${
                            isUser 
                              ? 'bg-white/60 border border-slate-200 rounded-tl-none text-slate-800' 
                              : isBot
                              ? 'bg-purple-100 border border-purple-300 rounded-tr-none text-purple-700'
                              : 'bg-yellow-500/10 border border-yellow-500/20 rounded-tr-none text-yellow-100 shadow-[0_4px_15px_rgba(234,179,8,0.05)]'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    No messages in this chat.
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-slate-200 pt-4 shrink-0">
                {activeChat.status === 'closed' ? (
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center text-xs text-slate-600 font-bold">
                    This chat session is closed. Select another chat or wait for the user to reopen it.
                  </div>
                ) : (
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-yellow-500/50 transition-colors">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendReply()}
                      placeholder={
                        activeChat.status !== 'active'
                          ? "Click 'Take Over Chat' to start messaging..."
                          : "Type a response as customer support..."
                      }
                      disabled={activeChat.status !== 'active'}
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-0 px-2 py-2 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={handleSendReply}
                      disabled={activeChat.status !== 'active' || !replyText.trim()}
                      className="p-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-50 disabled:text-slate-600 text-slate-950 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:scale-100"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* EMPTY VIEW */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
              <div className="w-16 h-16 bg-white/80 rounded-full border border-slate-200 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 opacity-50" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">No Chat Selected</h3>
                <p className="text-xs text-slate-600 mt-1">Select an active user chat from the queue queue to view messages or configure LLM parameters.</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
