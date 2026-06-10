"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Activity, User, ShieldCheck, X, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { Market } from "@/hooks/useLiveMarkets";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

const CATEGORIES = [
  "Trending", "Featured", "Politics", "Crypto", "Finance", 
  "Geopolitics", "Earnings", "Tech", "Culture", "World", "Economy", "Trump", "Elections"
];

const CATEGORY_IMAGES: Record<string, string> = {
  politics: "/predictions/politics.png",
  crypto: "/predictions/crypto.png",
  finance: "/predictions/finance.png",
  tech: "/predictions/tech.png",
  geopolitics: "/predictions/geopolitics.png",
  earnings: "/predictions/earnings.png",
  culture: "/predictions/culture.png",
  world: "/predictions/world.png",
  economy: "/predictions/economy.png",
  trump: "/predictions/trump.png",
  elections: "/predictions/elections.png",
  trending: "/predictions/crypto.png",
  featured: "/predictions/finance.png",
};

const SORT_OPTIONS = ["24hr Volume", "Newest", "Highest Yes%", "Lowest Yes%", "Alphabetical"];
const STATUS_OPTIONS = ["Active", "All", "Upcoming", "Resolved"];

export function RoobetPredictionsUI({ categoryName, predictions, balance, placeTrade }: { categoryName: string, predictions: Market[], balance: number, placeTrade: any }) {
  const router = useRouter();
  const safeBalance = typeof balance === 'number' ? balance : 0;
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("24hr Volume");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [activeTab, setActiveTab] = useState("All");
  const [holdings, setHoldings] = useState<{ marketId: string; optName: string; side: "yes" | "no"; amount: number; price: number }[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);

  // Trade modal
  const [tradeModal, setTradeModal] = useState<{ market: Market; optionId: string; optionName: string; side: "yes" | "no"; price: number } | null>(null);
  const [tradeAmount, setTradeAmount] = useState("100");
  const [tradeSuccess, setTradeSuccess] = useState(false);

  // Normalize category
  const activeCategory = CATEGORIES.find(c => c.toLowerCase() === categoryName.toLowerCase()) || categoryName;

  // Filter, search, sort predictions
  const filteredPredictions = useMemo(() => {
    let result = [...predictions];

    // Search
    if (searchQuery.trim()) {
      result = result.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort
    switch (sortBy) {
      case "Newest":
        result.reverse();
        break;
      case "Highest Yes%":
        result.sort((a, b) => b.yes - a.yes);
        break;
      case "Lowest Yes%":
        result.sort((a, b) => a.yes - b.yes);
        break;
      case "Alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "24hr Volume":
      default:
        // Already sorted by volume in the data
        break;
    }

    return result;
  }, [predictions, searchQuery, sortBy]);

  const visiblePredictions = filteredPredictions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPredictions.length;

  // Holdings value
  const holdingsValue = holdings.reduce((sum, h) => sum + h.amount, 0);

  // Handle trade
  function openTrade(market: Market, optionId: string, optionName: string, side: "yes" | "no", price: number) {
    setTradeModal({ market, optionId, optionName, side, price });
    setTradeAmount("100");
    setTradeSuccess(false);
  }

  function executeTrade() {
    if (!tradeModal) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0 || amount > safeBalance) return;

    // Place trade using store
    placeTrade(tradeModal.market.id, tradeModal.market.title, tradeModal.side, amount, tradeModal.price);

    // Track local holding
    setHoldings(prev => [...prev, {
      marketId: tradeModal.market.id,
      optName: tradeModal.optionName,
      side: tradeModal.side,
      amount,
      price: tradeModal.price,
    }]);

    // Simulate P&L change
    const pnlChange = tradeModal.side === "yes" 
      ? (tradeModal.price > 50 ? amount * 0.12 : -amount * 0.05)
      : (tradeModal.price < 50 ? amount * 0.15 : -amount * 0.08);
    setTotalPnL(prev => prev + pnlChange);

    setTradeSuccess(true);
    setTimeout(() => setTradeModal(null), 1500);
  }

  // Latest bets (dynamic based on holdings)
  const latestBets = useMemo(() => {
    const myBets = holdings.map((h, i) => ({
      user: "You", avatar: "purple", type: "Bet", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wager: `₹${h.amount.toLocaleString()}`, multiplier: `${(100 / h.price).toFixed(2)}x`,
      payout: `₹${((h.amount * 100) / h.price).toFixed(2)}`, isWin: true, isMine: true,
    }));
    const fakeBets = [
      { user: "Hidden", avatar: "pink", type: "Bet", time: "18:24", wager: "₹4,124.50", multiplier: "2.10x", payout: "₹8,661.45", isWin: true, isMine: false },
      { user: "jksapoaksc", avatar: "orange", type: "Bet", time: "18:24", wager: "₹825.00", multiplier: "-", payout: "₹0.00", isWin: false, isMine: false },
      { user: "Hidden", avatar: "blue", type: "Bet", time: "18:23", wager: "₹12,500.00", multiplier: "-", payout: "₹0.00", isWin: false, isMine: false },
      { user: "Super Roo 9210", avatar: "yellow", type: "Bet", time: "18:23", wager: "₹41,250.00", multiplier: "3.00x", payout: "₹123,750.00", isWin: true, isMine: false },
      { user: "Hidden", avatar: "pink", type: "Bet", time: "18:23", wager: "₹8,250.00", multiplier: "-", payout: "₹0.00", isWin: false, isMine: false },
    ];
    return [...myBets, ...fakeBets];
  }, [holdings]);

  const filteredBets = useMemo(() => {
    if (activeTab === "My Wagers") return latestBets.filter(b => b.isMine);
    if (activeTab === "High Roller") return latestBets.filter(b => parseFloat(b.wager.replace(/[₹,]/g, '')) > 5000);
    if (activeTab === "Lucky Wins") return latestBets.filter(b => b.isWin);
    return latestBets;
  }, [latestBets, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-[#121420] text-slate-200 font-sans p-4 sm:p-6 pb-32">
      
      {/* Top Banner: Holdings & Profit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1d29] border border-[#272b40] rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 mb-1">My Holdings</p>
            <p className="text-3xl font-black text-white">₹{holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <button 
            onClick={() => router.push('/predictions/holdings')}
            className="relative z-10 bg-[#272b40] hover:bg-[#7148ff] border border-white/5 hover:border-[#7148ff] transition-all px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg"
          >
            View Details
          </button>
        </div>
        <div className="bg-[#1a1d29] border border-[#272b40] rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-sm font-bold flex items-center gap-2 mb-1">
              {totalPnL >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-slate-400">Profit/Loss</span>
            </p>
            <p className={cn("text-3xl font-black", totalPnL >= 0 ? "text-green-400" : "text-red-400")}>
              {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="relative z-10 text-right">
            <p className="text-xs text-slate-500 font-bold">Balance</p>
            <p className="text-lg font-black text-white font-mono">₹{safeBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Category Nav */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-4 mb-2">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => {
              setVisibleCount(8);
              setSearchQuery("");
              router.push(`/predictions/${cat.toLowerCase()}`);
            }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeCategory === cat 
                ? "bg-[#7148ff] text-white shadow-[0_0_15px_rgba(113,72,255,0.4)]" 
                : "bg-[#1a1d29] text-slate-400 hover:bg-[#272b40] hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCategory}`}
            className="w-full bg-[#1a1d29] border border-[#272b40] rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-white outline-none focus:border-[#7148ff] transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-4">
          {/* Sort Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowSortDropdown(!showSortDropdown); setShowStatusDropdown(false); }}
              className="bg-[#1a1d29] border border-[#272b40] rounded-xl px-5 py-3 text-sm font-bold text-slate-300 flex items-center justify-between min-w-[180px] hover:border-[#7148ff]/50 transition-colors"
            >
              <span className="text-slate-500 mr-2">Sort:</span> {sortBy} <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showSortDropdown && "rotate-180")} />
            </button>
            {showSortDropdown && (
              <div className="absolute top-full mt-2 left-0 w-full bg-[#1a1d29] border border-[#272b40] rounded-xl overflow-hidden z-50 shadow-2xl">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}
                    className={cn("w-full text-left px-5 py-3 text-sm font-bold transition-colors", 
                      opt === sortBy ? "bg-[#7148ff] text-white" : "text-slate-300 hover:bg-[#272b40]"
                    )}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Status Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowSortDropdown(false); }}
              className="bg-[#1a1d29] border border-[#272b40] rounded-xl px-5 py-3 text-sm font-bold text-slate-300 flex items-center justify-between min-w-[160px] hover:border-[#7148ff]/50 transition-colors"
            >
              <span className="text-slate-500 mr-2">Status:</span> {statusFilter} <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showStatusDropdown && "rotate-180")} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full mt-2 left-0 w-full bg-[#1a1d29] border border-[#272b40] rounded-xl overflow-hidden z-50 shadow-2xl">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setStatusFilter(opt); setShowStatusDropdown(false); }}
                    className={cn("w-full text-left px-5 py-3 text-sm font-bold transition-colors",
                      opt === statusFilter ? "bg-[#7148ff] text-white" : "text-slate-300 hover:bg-[#272b40]"
                    )}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
        {visiblePredictions.map(market => (
          <motion.div 
            key={market.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1d29] border border-[#272b40] rounded-2xl p-4 flex flex-col hover:border-[#7148ff]/50 transition-colors group"
          >
            {/* Header: Image + Title */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-lg bg-[#272b40] flex-shrink-0 overflow-hidden border border-white/5">
                <img 
                  src={CATEGORY_IMAGES[market.category.toLowerCase()] || "/predictions/politics.png"} 
                  alt={market.category} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-sm font-bold text-white leading-tight pr-2">{market.title}</h3>
            </div>

            {/* Options List — fully interactive */}
            <div className="flex flex-col gap-2 flex-1 mb-4">
              {market.options?.map(opt => (
                <div key={opt.id} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300 flex-1 truncate">{opt.name}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openTrade(market, opt.id, opt.name, "yes", opt.yes)}
                      className="bg-green-500/10 hover:bg-green-500/25 text-green-400 hover:text-green-300 text-[10px] font-black px-4 py-2 rounded-lg min-w-[80px] transition-all border border-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                    >
                      Yes {opt.yes}¢
                    </button>
                    <button 
                      onClick={() => openTrade(market, opt.id, opt.name, "no", opt.no)}
                      className="bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-[10px] font-black px-4 py-2 rounded-lg min-w-[80px] transition-all border border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    >
                      No {opt.no}¢
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#272b40] rounded-full overflow-hidden flex mb-3">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${market.yes}%` }} />
              <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${market.no}%` }} />
            </div>

            {/* Bottom Volume */}
            <div className="text-[11px] font-bold text-[#7148ff] mt-auto">
              {market.volume}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center mb-8">
          <button 
            onClick={() => setVisibleCount(prev => prev + 8)}
            className="bg-[#272b40] hover:bg-[#7148ff] text-white text-xs font-bold px-8 py-3 rounded-full transition-all border border-white/5 hover:border-[#7148ff] hover:shadow-[0_0_20px_rgba(113,72,255,0.3)]"
          >
            Load More Markets ({filteredPredictions.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Latest Bets Table */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <div className="w-full bg-[#1a1d29] border border-[#272b40] rounded-2xl overflow-hidden">
          <div className="flex items-center border-b border-[#272b40] px-2 bg-[#121420]/50">
            {["All", "High Roller", "Lucky Wins", "My Wagers"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-4 text-xs font-bold transition-colors border-b-2",
                  activeTab === tab ? "border-[#7148ff] text-white" : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                {tab}
                {tab === "My Wagers" && holdings.length > 0 && (
                  <span className="ml-2 bg-[#7148ff] text-white text-[9px] px-1.5 py-0.5 rounded-full">{holdings.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold">
              <thead>
                <tr className="text-slate-500 border-b border-[#272b40]">
                  <th className="px-6 py-4 uppercase tracking-widest font-bold">Game</th>
                  <th className="px-6 py-4 uppercase tracking-widest font-bold">User</th>
                  <th className="px-6 py-4 uppercase tracking-widest font-bold">Time</th>
                  <th className="px-6 py-4 uppercase tracking-widest font-bold text-right">Wager</th>
                  <th className="px-6 py-4 uppercase tracking-widest font-bold text-right">Multiplier</th>
                  <th className="px-6 py-4 uppercase tracking-widest font-bold text-right">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272b40]/50">
                {filteredBets.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No wagers yet. Place a trade above!</td></tr>
                ) : filteredBets.map((bet, i) => (
                  <tr key={i} className={cn("hover:bg-[#272b40]/30 transition-colors", bet.isMine && "bg-[#7148ff]/5")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded bg-[#7148ff] flex items-center justify-center text-[10px]">🏛️</div>
                        {activeCategory}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 flex items-center gap-2">
                      <div className={cn("w-5 h-5 rounded-full", bet.isMine ? "bg-[#7148ff]" : "bg-slate-600")} />
                      {bet.user}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{bet.time}</td>
                    <td className="px-6 py-4 text-white text-right font-mono">{bet.wager}</td>
                    <td className={cn("px-6 py-4 text-right font-mono", bet.isWin ? "text-green-500" : "text-slate-500")}>{bet.multiplier}</td>
                    <td className={cn("px-6 py-4 text-right font-mono", bet.isWin ? "text-green-500" : "text-slate-500")}>{bet.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== TRADE MODAL ===== */}
      <AnimatePresence>
        {tradeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !tradeSuccess && setTradeModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1d29] border border-[#272b40] rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {tradeSuccess ? (
                <div className="flex flex-col items-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                    <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2">Trade Placed!</h3>
                  <p className="text-slate-400 text-sm text-center">
                    You bought ₹{parseFloat(tradeAmount).toLocaleString()} of <span className="text-white font-bold">{tradeModal.optionName}</span> ({tradeModal.side.toUpperCase()}) at {tradeModal.price}¢
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Place Trade</p>
                      <h3 className="text-lg font-black text-white leading-tight">{tradeModal.market.title}</h3>
                    </div>
                    <button onClick={() => setTradeModal(null)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Option & Side */}
                  <div className="bg-[#121420] rounded-2xl p-5 mb-6 border border-[#272b40]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-slate-300">{tradeModal.optionName}</span>
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                        tradeModal.side === "yes" 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {tradeModal.side}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-white font-mono">{tradeModal.price}¢</span>
                      <span className="text-sm text-slate-500 mb-1">per share</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount (₹)</label>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                      className="w-full bg-[#121420] border border-[#272b40] rounded-xl py-4 px-5 text-2xl font-black text-white outline-none focus:border-[#7148ff] transition-colors font-mono"
                      min="1"
                      max={safeBalance}
                    />
                    <div className="flex gap-2 mt-3">
                      {[100, 500, 1000, 5000].map(amt => (
                        <button 
                          key={amt} 
                          onClick={() => setTradeAmount(String(amt))}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-black transition-all border",
                            tradeAmount === String(amt) 
                              ? "bg-[#7148ff] border-[#7148ff] text-white" 
                              : "bg-[#272b40] border-[#272b40] text-slate-300 hover:border-[#7148ff]/50"
                          )}
                        >
                          ₹{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Potential Return */}
                  <div className="bg-[#121420] rounded-2xl p-4 mb-6 border border-[#272b40] flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Potential Return</span>
                    <span className="text-xl font-black text-green-400 font-mono">
                      ₹{((parseFloat(tradeAmount) || 0) * (100 / tradeModal.price)).toFixed(2)}
                    </span>
                  </div>

                  {/* Execute Button */}
                  <button
                    onClick={executeTrade}
                    disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || parseFloat(tradeAmount) > safeBalance}
                    className={cn(
                      "w-full py-4 rounded-2xl text-lg font-black uppercase tracking-widest transition-all",
                      tradeModal.side === "yes"
                        ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                        : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]",
                      "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    Place {tradeModal.side.toUpperCase()} Trade
                  </button>

                  <p className="text-center text-[10px] text-slate-600 mt-4">
                    Balance: ₹{safeBalance.toLocaleString()} · Max potential return based on current price
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
