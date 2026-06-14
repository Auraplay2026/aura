"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Gamepad2, Trophy, User, ArrowRight, Activity, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/games";
import { ARCADE_GAMES } from "@/lib/arcade-games";
import Image from "next/image";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Parent handles opening usually, but we handle closing here.
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Aggregate and filter data
  const searchQuery = query.toLowerCase().trim();

  const filteredCasino = searchQuery 
    ? GAMES.filter(g => g.title.toLowerCase().includes(searchQuery)).slice(0, 5)
    : [];

  const filteredArcade = searchQuery
    ? ARCADE_GAMES.filter(g => g.title.toLowerCase().includes(searchQuery)).slice(0, 5)
    : [];

  const quickLinks = [
    { title: "Sportsbook", icon: Trophy, href: "/sportsbook", keywords: "sports bet matches odds" },
    { title: "Live Casino", icon: Flame, href: "/casino/live", keywords: "live dealer roulette blackjack" },
    { title: "My Profile", icon: User, href: "/account", iconColor: "text-blue-500", keywords: "account settings profile" },
    { title: "Balance & Funds", icon: Activity, href: "/account/balance", iconColor: "text-emerald-500", keywords: "wallet balance deposit withdraw" },
    { title: "Affiliate Dashboard", icon: User, href: "/refer", iconColor: "text-purple-500", keywords: "refer earn affiliate" },
  ];

  const filteredLinks = searchQuery
    ? quickLinks.filter(l => 
        l.title.toLowerCase().includes(searchQuery) || 
        l.keywords.includes(searchQuery)
      )
    : quickLinks;

  const navigateTo = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl z-[100] overflow-hidden"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
              <Search className="w-6 h-6 text-slate-400 ml-2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search games, sports, or settings..."
                className="flex-1 bg-transparent border-none text-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 py-2"
              />
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
              
              {/* Quick Links */}
              {(filteredLinks.length > 0 || !searchQuery) && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Navigation</h3>
                  <div className="space-y-1">
                    {filteredLinks.map(link => (
                      <button
                        key={link.title}
                        onClick={() => navigateTo(link.href)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:border-slate-200 ${link.iconColor || 'text-slate-600'}`}>
                            <link.icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-700 group-hover:text-slate-900">{link.title}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Casino Games */}
              {searchQuery && filteredCasino.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Casino Games</h3>
                  <div className="space-y-1">
                    {filteredCasino.map(game => (
                      <button
                        key={game.id}
                        onClick={() => navigateTo(`/casino/game/${game.id}`)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg relative overflow-hidden bg-slate-100">
                            <Image src={game.image} alt={game.title} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{game.title}</span>
                            <span className="text-xs font-medium text-slate-500">{game.provider}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Casino</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Arcade Games */}
              {searchQuery && filteredArcade.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Web Arcade</h3>
                  <div className="space-y-1">
                    {filteredArcade.map(game => (
                      <button
                        key={game.id}
                        onClick={() => navigateTo(`/arcade/game/${game.id}`)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg relative overflow-hidden bg-slate-100">
                            <Image src={game.thumbnail} alt={game.title} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{game.title}</span>
                            <span className="text-xs font-medium text-slate-500">{game.provider}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">Arcade</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {searchQuery && filteredLinks.length === 0 && filteredCasino.length === 0 && filteredArcade.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Search className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-600 font-medium">No results found for "{query}"</p>
                  <p className="text-sm text-slate-400 mt-1">Try searching for a game, provider, or sport.</p>
                </div>
              )}

            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Press <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-sm">ESC</kbd> to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
