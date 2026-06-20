"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Sword, Target, Flame, Users, Zap, ShieldAlert, 
  Award, Star, Crosshair, ChevronRight, Activity, ArrowUpRight, 
  Sparkles, TrendingUp, Coins
} from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Helper for currency formatting
function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
}

export default function TournamentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "tournaments">("leaderboard");

  // Zustand Store
  const transactions = useTradingStore(state => state.transactions || []);
  const balance = useTradingStore(state => state.balance || 0);

  // Dynamic user league rank calculations
  const playedRounds = transactions.filter(tx => tx.type === 'casino' || tx.type === 'trade').length;
  const placementProgress = Math.min(playedRounds, 5);
  const isRanked = playedRounds >= 5;

  let userScore = Math.floor(balance * 1.5 + playedRounds * 250);
  let userRank = isRanked ? Math.max(12, 856 - Math.floor(userScore / 800)) : 0;
  let userTier = "Unranked";
  let tierColor = "text-slate-500";
  let tierBg = "bg-slate-500/10";
  let tierBorder = "border-slate-200";

  if (isRanked) {
    if (userScore >= 800000) {
      userTier = "Grandmaster 👑";
      tierColor = "text-amber-600";
      tierBg = "bg-amber-400/10";
      tierBorder = "border-amber-400";
    } else if (userScore >= 400000) {
      userTier = "Master ⚔️";
      tierColor = "text-orange-500";
      tierBg = "bg-orange-500/10";
      tierBorder = "border-orange-500";
    } else if (userScore >= 200000) {
      userTier = "Diamond I 💎";
      tierColor = "text-cyan-600";
      tierBg = "bg-cyan-400/10";
      tierBorder = "border-cyan-400/50";
    } else {
      userTier = "Gold III 🌟";
      tierColor = "text-yellow-500";
      tierBg = "bg-yellow-500/10";
      tierBorder = "border-yellow-500/30";
    }
  }

  // Live Counter states (Millions of users spending hype)
  const [onlinePlayers, setOnlinePlayers] = useState(42852);
  const [totalWageredToday, setTotalWageredToday] = useState(84259850);

  // Live Leaderboard state (counting up live)
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "NinjaPlayz", score: 9842100, tier: "Grandmaster 👑", winRate: "78%", avatar: "https://images.unsplash.com/photo-1566492031525-8782986cd23e?w=100&q=80", color: "text-amber-600", bg: "bg-amber-400/10", border: "border-amber-400" },
    { rank: 2, name: "Shroud_X", score: 9102450, tier: "Grandmaster 👑", winRate: "75%", avatar: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80", color: "text-slate-700", bg: "bg-slate-300/10", border: "border-slate-300" },
    { rank: 3, name: "DocDis", score: 8940200, tier: "Master ⚔️", winRate: "71%", avatar: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&q=80", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500" },
    { rank: 4, name: "TimTheTat", score: 8100500, tier: "Diamond I 💎", winRate: "68%", avatar: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=100&q=80", color: "text-cyan-600", bg: "bg-cyan-400/10", border: "border-cyan-400/50" },
    { rank: 5, name: "Summit1", score: 7950000, tier: "Diamond II 💎", winRate: "65%", avatar: "https://images.unsplash.com/photo-1562771242-a02d9096c6d3?w=100&q=80", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/50" },
  ]);

  // Live Activity Feed state
  const [liveFeed, setLiveFeed] = useState([
    { id: 1, user: "shroud_bot", game: "Dice 🎲", action: "wagered 💸", amount: "₹15,000", time: "Just now", isWin: false },
    { id: 2, user: "mortal_99", game: "Mines 💣", action: "won 🏆", amount: "₹45,200", time: "1s ago", isWin: true },
    { id: 3, user: "lucky_girl", game: "Crash 🚀", action: "won 🏆", amount: "₹8,400", time: "3s ago", isWin: true },
    { id: 4, user: "alpha_bet", game: "Sportsbook ⚽", action: "wagered 💸", amount: "₹25,000", time: "4s ago", isWin: false },
    { id: 5, user: "doc_fan_12", game: "Roulette 🎰", action: "won 🏆", amount: "₹120,500", time: "6s ago", isWin: true }
  ]);

  // Timers and simulation tickers
  useEffect(() => {
    // 1. Ticker for online players & total wagered today
    const liveStatsInterval = setInterval(() => {
      setOnlinePlayers(prev => prev + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 15) + 2));
      setTotalWageredToday(prev => prev + (Math.floor(Math.random() * 12500) + 1200));
    }, 1500);

    // 2. Leaderboard score increase
    const leaderboardInterval = setInterval(() => {
      setLeaderboard(prev => prev.map(player => {
        const increment = Math.floor(Math.random() * 1800) + 200;
        return { ...player, score: player.score + increment };
      }));
    }, 5000);

    // 3. Live activity feed updates
    const NAMES = ["shroud", "ninja", "doc", "alpha_bet", "lucky_player", "mortal", "dynamo", "scout", "payal_gaming", "jonathan", "vashu_9", "crest_fighter", "vip_playa", "hazard", "aurastar"];
    const GAMES = ["Crash 🚀", "Mines 💣", "Plinko 🎯", "Dice 🎲", "Sportsbook ⚽", "Blackjack 🃏", "Roulette 🎰", "Predictions 📈"];

    const feedInterval = setInterval(() => {
      const isWin = Math.random() > 0.45;
      const user = NAMES[Math.floor(Math.random() * NAMES.length)] + "_" + Math.floor(Math.random() * 99);
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const amountVal = isWin 
        ? (Math.floor(Math.random() * 115000) + 1500) 
        : (Math.floor(Math.random() * 25000) + 200);

      const newFeed = {
        id: Date.now(),
        user,
        game,
        action: isWin ? "won 🏆" : "wagered 💸",
        amount: `₹${amountVal.toLocaleString()}`,
        time: "Just now",
        isWin
      };

      setLiveFeed(prev => [newFeed, ...prev.slice(0, 5)]);
    }, 2800);

    return () => {
      clearInterval(liveStatsInterval);
      clearInterval(leaderboardInterval);
      clearInterval(feedInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans pb-32 relative">
      
      {/* Dynamic Background Hype Glow */}
      <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-96 right-1/4 w-[300px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Stats Hype Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/80 border border-slate-200 rounded-2xl p-5 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Players</p>
            <p className="text-lg font-black text-slate-900 font-mono">{onlinePlayers.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Wager Volume (24h)</p>
            <p className="text-lg font-black text-green-600 font-mono">{formatCurrency(totalWageredToday)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Prizes Paid</p>
            <p className="text-lg font-black text-yellow-500 font-mono">₹4.85 Cr</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Fights Today</p>
            <p className="text-lg font-black text-slate-900 font-mono">1.82M+</p>
          </div>
        </div>
      </div>
      
      {/* Hero Header */}
      <div className="relative w-full h-[280px] sm:h-[350px] rounded-3xl overflow-hidden border border-slate-200 flex items-center justify-center text-center shadow-3xl">
        <div className="absolute inset-0 bg-slate-50">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000')] bg-cover bg-center opacity-15 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-slate-100 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.1)_0%,transparent_70%)]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center max-w-3xl px-4">
          <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-5 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-amber-500 font-black uppercase tracking-widest text-[10px]">AuraPlay Grand Arcade League</span>
          </motion.div>
          
          <motion.h1 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-6xl font-black text-slate-900 uppercase tracking-tighter transform -skew-x-3 mb-3">
            Dominancy & <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-600">Glory Fights</span>
          </motion.h1>
          
          <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Every wager, spin, and arcade match increases your score in real time. Climb to the Grandmaster tier, beat the platform record, and claim your share of massive tournament prizes.
          </motion.p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Tab bar navigation with Framer Motion indicators */}
          <div className="flex items-center gap-6 border-b border-slate-200 pb-0.5 relative">
            <button 
              onClick={() => setActiveTab("leaderboard")}
              className={`pb-4 px-2 text-xs font-black uppercase tracking-wider relative transition-colors ${activeTab === "leaderboard" ? "text-amber-500" : "text-slate-500 hover:text-slate-700"}`}
            >
              <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Global Leaderboard</span>
              {activeTab === "leaderboard" && <motion.div layoutId="tntTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />}
            </button>
            <button 
              onClick={() => setActiveTab("tournaments")}
              className={`pb-4 px-2 text-xs font-black uppercase tracking-wider relative transition-colors ${activeTab === "tournaments" ? "text-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <span className="flex items-center gap-2"><Sword className="w-4 h-4" /> Live Tournaments</span>
              {activeTab === "tournaments" && <motion.div layoutId="tntTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
            </button>
          </div>

          {/* Tab 1: Live Leaderboard with incrementing scores */}
          {activeTab === "leaderboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              
              <div className="flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                <span className="w-16 text-center">Rank</span>
                <span className="flex-1">Player</span>
                <span className="w-32 text-center hidden sm:block">Win Ratio</span>
                <span className="w-40 text-right">League Score</span>
              </div>
              
              <div className="space-y-3">
                {/* Dynamically Inject user inside leaderboard if ranked */}
                {isRanked && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center justify-between p-4.5 rounded-2xl border ${tierBorder} bg-slate-50 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/20 relative overflow-hidden`}
                  >
                    <div className="w-16 flex justify-center">
                      <span className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${tierColor}`}>
                        #{userRank}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 ${tierBorder} bg-white flex items-center justify-center`}>
                        <UserIcon className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-black text-lg sm:text-xl flex items-center gap-2">
                          You (Fighter)
                          <span className="text-[9px] bg-yellow-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">Your Rank</span>
                        </h3>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${tierBg} ${tierColor}`}>
                          {userTier}
                        </span>
                      </div>
                    </div>

                    <div className="w-32 justify-center hidden sm:flex">
                      <div className="flex items-center gap-1.5 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Target className="w-4 h-4 text-neon-green" />
                        <span className="text-slate-700 font-bold text-sm">70%</span>
                      </div>
                    </div>

                    <div className="w-40 text-right">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">{userScore.toLocaleString()}</span>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">RP Points</p>
                    </div>
                  </motion.div>
                )}

                {/* Render leaderboard players */}
                {leaderboard.map((player, idx) => (
                  <motion.div 
                    key={player.rank}
                    className={`flex items-center justify-between p-4 rounded-2xl border ${player.border} bg-white/80 shadow-lg hover:bg-white/[0.02] transition-colors group relative overflow-hidden`}
                  >
                    <div className="w-16 flex justify-center">
                      <span className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${player.color}`}>
                        #{player.rank}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 ${player.border}`}>
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-black text-lg sm:text-xl flex items-center gap-2">
                          {player.name} 
                          {idx === 0 && <CrownIcon />}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${player.bg} ${player.color}`}>
                            {player.tier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-32 justify-center hidden sm:flex relative z-10">
                      <div className="flex items-center gap-1.5 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Target className="w-4 h-4 text-neon-green" />
                        <span className="text-slate-700 font-bold text-sm">{player.winRate}</span>
                      </div>
                    </div>

                    <div className="w-40 text-right relative z-10">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">{player.score.toLocaleString()}</span>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">RP Points</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => alert("Leaderboards update automatically every 5s. Play casino games, predictions, or sportsbook bets to increase your score.")}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold uppercase tracking-wider rounded-xl border border-slate-200 transition-colors flex items-center gap-2 text-xs"
                >
                  Platform Rankings Verified <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Active Tournaments */}
          {activeTab === "tournaments" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 1, title: "Krunker Global Deathmatch", prize: "₹500,000", players: "12,450", endsIn: "2h 45m", gameId: "fps-1", image: "https://cdn.akamai.steamstatic.com/steam/apps/1087700/header.jpg" },
                { id: 2, title: "Hole.io City Smashers", prize: "₹250,000", players: "8,920", endsIn: "5h 12m", gameId: "action-1", image: "https://play-lh.googleusercontent.com/O3EdBG3DLjnRyizuznwg3FMiGcualZV-jPE83MhIRyFjQS1M5snCbBvU_09c9RUqpx9xJlwfrGx31iwTXYAQnmo" },
                { id: 3, title: "HexGL Speed Run Championship", prize: "₹100,000", players: "3,100", endsIn: "12h 30m", gameId: "driving-2", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80" },
              ].map((tourney, idx) => (
                <motion.div 
                  key={tourney.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden group hover:border-cyan-500/50 transition-colors shadow-2xl"
                >
                  <div className="h-44 relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className="bg-red-500 text-slate-900 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Now
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-slate-100 to-transparent z-10" />
                    <img src={tourney.image} alt={tourney.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  
                  <div className="p-6 relative z-20 -mt-6">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{tourney.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-white rounded-xl p-3 border border-slate-200">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Prize Pool</p>
                        <p className="text-lg font-black text-green-600 font-mono">{tourney.prize}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active Players</p>
                        <p className="text-lg font-black text-slate-900 font-mono flex items-center gap-1.5"><Users className="w-4 h-4 text-cyan-600" /> {tourney.players}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">
                        <span className="text-amber-500 uppercase mr-1">Ends in:</span> {tourney.endsIn}
                      </p>
                      <button 
                        onClick={() => router.push(`/casino/game/${tourney.gameId}`)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all hover:scale-105 active:scale-95"
                      >
                        Enter Fight
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-96 shrink-0 space-y-6">
          
          {/* Your Rank Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mb-6">
              <Crosshair className="w-4 h-4 text-cyan-500" /> Your Current Rank
            </h3>
            
            <div className="flex flex-col items-center justify-center text-center mb-6">
              {isRanked ? (
                <>
                  <div className={`w-20 h-20 rounded-2xl bg-yellow-500/10 border-2 ${tierBorder} flex items-center justify-center mb-3.5 shadow-lg relative overflow-hidden`}>
                    <Award className={`w-10 h-10 ${tierColor}`} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{userTier}</h4>
                  <p className="text-slate-600 font-bold text-xs mt-1">Platform Rank: #{userRank}</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center mb-3.5 shadow-lg">
                    <ShieldAlert className="w-8 h-8 text-slate-600 animate-pulse" />
                  </div>
                  <h4 className="text-xl font-black text-slate-500 uppercase tracking-tighter">Unranked Fighter</h4>
                  <p className="text-slate-500 font-bold text-xs mt-1">Play matches to unlock placement.</p>
                </>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-widest">Placement Progress</span>
                <span className="text-cyan-600 font-mono">{placementProgress} / 5</span>
              </div>
              <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-500" 
                  style={{ width: `${(placementProgress / 5) * 100}%` }}
                />
              </div>
              
              {!isRanked ? (
                <p className="text-[10px] text-slate-500 leading-normal text-center bg-white/40 border border-slate-200 p-2.5 rounded-lg mt-2">
                  Complete 5 rounds of arcade casino games, predictions, or sportsbook bets to receive your official rank tag.
                </p>
              ) : (
                <p className="text-[10px] text-green-500/80 leading-normal text-center bg-green-500/5 border border-green-500/10 p-2.5 rounded-lg mt-2 font-bold">
                  Ranked active! Your score and placement details update dynamically with every wager. Keep playing to reach Grandmaster.
                </p>
              )}

              <button 
                onClick={() => router.push("/casino")}
                className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 text-slate-900 font-black uppercase tracking-wider rounded-xl border border-slate-200 transition-colors text-xs"
              >
                Go to Arcade Lobby
              </button>
            </div>
          </div>

          {/* Real-time FOMO Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-purple-600" /> Platform Arena Activity
            </h3>
            
            <div className="space-y-3 min-h-[300px]">
              <AnimatePresence initial={false}>
                {liveFeed.map(feed => (
                  <motion.div 
                    key={feed.id}
                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border bg-white/40 text-[11px] font-bold",
                      feed.isWin ? "border-emerald-500/10" : "border-slate-200"
                    )}
                  >
                    <div>
                      <span className="text-slate-700 font-mono select-all">@{feed.user}</span>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        {feed.action} on <span className="text-slate-900">{feed.game}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-mono font-black",
                        feed.isWin ? "text-emerald-600" : "text-[#a855f7]"
                      )}>
                        {feed.amount}
                      </span>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{feed.time}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Winning Strategies */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-yellow-500" /> Pro Strategies
            </h3>
            <div className="space-y-4">
              {[
                { title: "Zone Control", desc: "Hold chokepoints in IO games to trap smaller players.", icon: <Target className="w-4 h-4 text-emerald-500" /> },
                { title: "RTP Volatility Spikes", desc: "Select slots during high volume platform hours.", icon: <Star className="w-4 h-4 text-purple-500" /> },
                { title: "Bait & Switch", desc: "Lure enemies into open areas before striking.", icon: <Crosshair className="w-4 h-4 text-amber-500" /> }
              ].map((strat, i) => (
                <div key={i} className="flex items-start gap-3.5 p-3 rounded-xl bg-white/40 border border-slate-200">
                  <div className="mt-0.5">{strat.icon}</div>
                  <div>
                    <h4 className="text-slate-900 font-bold text-xs">{strat.title}</h4>
                    <p className="text-slate-500 text-[10px] mt-1 leading-normal font-medium">{strat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Custom Crown svg icon component
function CrownIcon() {
  return (
    <svg className="w-4.5 h-4.5 text-yellow-600 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 4h20v2H2z" />
      <path d="m2 8 3 11h14l3-11-5 4-5-8-5 8z" />
    </svg>
  );
}

// User mock avatar placeholder component fallback
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
