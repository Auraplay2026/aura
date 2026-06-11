"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Activity, Trophy, X, PlayCircle, Coins } from "lucide-react";
import { useTradingStore } from "@/lib/store";

const TABS = ["All Activity", "Cloud Rentals", "Live Bets", "My History"];

const CLOUD_GAMES = [
  "Cyberpunk 2077", "Elden Ring", "Black Myth: Wukong", 
  "Spider-Man 2", "Grand Theft Auto V", "Red Dead Redemption 2", 
  "Hogwarts Legacy", "Baldur's Gate 3", "Forza Horizon 5", 
  "Civilization VI"
];

const CASINO_GAMES = [
  "Crash", "Limbo", "Plinko", "Mines", "Dice", "Keno", 
  "Chicken Game", "Sweet Bonanza", "Gates of Olympus", "Crazy Time"
];

const USERS = ["CryptoWhale", "Hidden**", "RahulK**", "Priya99", "VikramS", "Anjali_B", "DiamondHands", "LuckyStrike", "HighRoller99"];

interface FeedData {
  id: string;
  type: 'rental' | 'bet';
  game: string;
  user: string;
  time: string;
  amount: number; // hourly rate or bet wager
  multi: number;  // duration (hours) or bet multiplier
  payout: number; // total cost or win payout
  won?: boolean;
}

export function LiveActionFeed() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [feedItems, setFeedItems] = useState<FeedData[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const transactions = useTradingStore(s => s.transactions);

  // Fetch mixed rentals and bets activity from API every 60 seconds
  useEffect(() => {
    if (activeTab === "My History") return;

    const fetchFeed = async () => {
      try {
        const res = await fetch("/api/casino/high-rollers");
        if (res.ok) {
          const json = await res.json();
          const mapped: FeedData[] = json.bets.map((b: any, index: number) => ({
            id: `${b.user}-${index}-${Date.now()}`,
            type: b.type,
            game: b.game,
            user: b.user,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: b.raw_bet,
            multi: b.raw_mult,
            payout: b.raw_payout,
            won: b.type === 'bet' ? b.raw_payout > 0 : undefined
          }));
          setFeedItems(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch feed:", err);
      }
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 60000); // Update every minute (60 seconds)
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="w-full space-y-4 relative">
      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative pb-2 text-sm md:text-base font-bold transition-colors whitespace-nowrap",
              activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabFeed"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 shadow-sm"
              />
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto custom-scrollbar overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[850px] bg-white">
          <thead className="bg-slate-50">
            <tr className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <th className="py-4 font-semibold px-4">Type</th>
              <th className="py-4 font-semibold px-4">Game / Session</th>
              <th className="py-4 font-semibold px-4">User</th>
              <th className="py-4 font-semibold px-4">Time</th>
              <th className="py-4 font-semibold px-4 text-right">Rate / Wager</th>
              <th className="py-4 font-semibold px-4 text-right">Duration / Multiplier</th>
              <th className="py-4 font-semibold px-4 text-right">Total Cost / Payout</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {activeTab === "My History" ? (
                transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-bold text-sm uppercase tracking-widest">
                      No transactions found. Start playing or renting to build history!
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 15).map((tx) => {
                    const isRental = tx.details.includes('Played') && (tx.details.includes('Wager') && !tx.details.includes('Payout: ₹0') ? false : true); 
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: -20, backgroundColor: "rgba(234, 179, 8, 0.1)" }}
                        animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors group text-sm sm:text-base"
                      >
                        <td className="py-3 px-4 font-bold text-xs uppercase tracking-widest">
                          {tx.type === 'casino' ? (isRental ? (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Rental</span>
                          ) : (
                            <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">Bet</span>
                          )) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{tx.type}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate" title={tx.details}>
                          {tx.details.split('(')[0].replace('Played ', '')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 flex items-center gap-2 text-sm font-semibold">
                            <User className="w-3 h-3" /> You
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs font-mono">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td className="py-3 px-4 text-right text-slate-800 font-medium font-mono">
                          ₹{tx.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-500 font-mono">
                          {tx.details.includes('Wager:') ? '-' : '-'}
                        </td>
                        <td className={cn(
                          "py-3 px-4 text-right font-black font-mono",
                          tx.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                        )}>
                          {tx.type === 'casino' ? `₹${tx.amount.toLocaleString()}` : tx.status}
                        </td>
                      </motion.tr>
                    );
                  })
                )
              ) : (
                // Filtered feed item rendering
                feedItems
                  .filter(item => {
                    if (activeTab === "Cloud Rentals") return item.type === "rental";
                    if (activeTab === "Live Bets") return item.type === "bet";
                    return true;
                  })
                  .map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: -20, backgroundColor: row.type === 'rental' ? "rgba(59, 130, 246, 0.05)" : "rgba(234, 179, 8, 0.05)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors group text-sm sm:text-base"
                    >
                      {/* Column 1: Type Badge */}
                      <td className="py-3 px-4 font-bold text-xs uppercase tracking-widest font-mono">
                        {row.type === 'rental' ? (
                          <span className="flex items-center gap-1 w-max text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <PlayCircle className="w-3.5 h-3.5" /> Rent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 w-max text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                            <Coins className="w-3.5 h-3.5" /> Bet
                          </span>
                        )}
                      </td>
                      {/* Column 2: Game */}
                      <td className="py-3 px-4 font-medium text-slate-800">{row.game}</td>
                      {/* Column 3: User */}
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => setSelectedUser(row.user)}
                          className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 group-hover:text-blue-600 font-medium"
                        >
                          <User className="w-3 h-3" />
                          {row.user}
                        </button>
                      </td>
                      {/* Column 4: Time */}
                      <td className="py-3 px-4 text-slate-500 text-xs font-mono">{row.time}</td>
                      {/* Column 5: Rate or Wager */}
                      <td className="py-3 px-4 text-right text-slate-800 font-medium font-mono">
                        {row.type === 'rental' ? `₹${row.amount}/hr` : `₹${row.amount.toLocaleString()}`}
                      </td>
                      {/* Column 6: Duration or Multiplier */}
                      <td className={cn(
                        "py-3 px-4 text-right font-black font-mono",
                        row.type === 'rental' 
                          ? (row.multi >= 8 ? 'text-blue-600 animate-pulse' : row.multi >= 4 ? 'text-yellow-600' : 'text-slate-500')
                          : (row.won ? 'text-yellow-600' : 'text-slate-600')
                      )}>
                        {row.type === 'rental' ? `${row.multi} hrs` : (row.won ? `${row.multi}x` : '0.00x')}
                      </td>
                      {/* Column 7: Total Cost or Payout */}
                      <td className={cn(
                        "py-3 px-4 text-right font-black font-mono",
                        row.type === 'rental' 
                          ? 'text-blue-600' 
                          : (row.won ? 'text-green-600' : 'text-slate-600')
                      )}>
                        ₹{row.payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </motion.tr>
                  ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Interactive Player Profile Popover */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header BG */}
            <div className="h-24 bg-gradient-to-br from-blue-100 to-slate-50 relative border-b border-slate-200">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </div>
            
            <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-50/10 hover:bg-slate-50/20 text-slate-900 flex items-center justify-center backdrop-blur-md transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            {/* Profile Content */}
            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-slate-50 absolute -top-10 left-6 flex items-center justify-center shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-cyan-50 opacity-50" />
                <User className="w-10 h-10 text-blue-600 relative z-10" />
              </div>

              <div className="mt-12">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-black text-slate-900">{selectedUser}</h3>
                  <div className="px-2 py-0.5 rounded bg-yellow-100 border border-yellow-200 text-yellow-700 text-[10px] font-black uppercase tracking-widest">Aura VIP</div>
                </div>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> Active in Lobby
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Playtime</p>
                  <p className="text-lg font-black text-slate-900 font-mono">{Math.floor(Math.random() * 120 + 20)} hrs</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Biggest Multiplier</p>
                  <p className="text-lg font-black text-green-600 font-mono flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" /> {Math.floor(Math.random() * 250 + 25)}x
                  </p>
                </div>
              </div>

              <button className="w-full mt-6 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm transition-colors">
                Add Friend
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dim overlay when modal open */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="absolute inset-0 bg-slate-50/20 backdrop-blur-[2px] z-40 rounded-xl"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
