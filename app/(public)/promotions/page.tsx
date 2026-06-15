"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, ArrowRight, Star, Flame, Trophy, Coins, Shield, Clock, Zap, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Make sure all images exist or use reliable fallbacks.
const PROMOTIONS = [
  {
    id: "mega-drop",
    title: "₹1,00,00,000 Mega Drop",
    description: "Play any Pragmatic Play slot to win random daily cash drops.",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&q=80",
    category: "Casino",
    tags: ["Hot", "Ending Soon"],
    prizePool: "₹1,00,00,000",
    color: "from-yellow-500/80 to-yellow-900/80",
  },
  {
    id: "welcome",
    title: "200% Welcome Package",
    description: "Your first deposit matched up to ₹1,00,000 instantly.",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80",
    category: "All",
    tags: ["New Players"],
    prizePool: "₹1,00,000 Max",
    color: "from-purple-500/80 to-purple-900/80",
  },
  {
    id: "nba-cashback",
    title: "NBA Finals Cashback",
    description: "Get 20% cashback on all net losses during the NBA Finals series.",
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80",
    category: "Sports",
    tags: ["Live Event"],
    prizePool: "20% Cashback",
    color: "from-orange-500/80 to-red-900/80",
  },
  {
    id: "crypto-boost",
    title: "Crypto Deposit Boost",
    description: "Deposit via BTC or ETH and get a 10% wager-free bonus.",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
    category: "Casino",
    tags: ["Crypto"],
    prizePool: "Unlimited",
    color: "from-cyan-500/80 to-blue-900/80",
  },
  {
    id: "multiplier-race",
    title: "1000x Multiplier Race",
    description: "Hit the highest multiplier on Hacksaw games to win the weekly prize.",
    image: "https://images.unsplash.com/photo-1518605368461-1ee7c5320d75?w=800&q=80",
    category: "Casino",
    tags: ["Tournament"],
    prizePool: "₹5,00,000",
    color: "from-green-500/80 to-emerald-900/80",
  },
  {
    id: "vip-level",
    title: "VIP Level-Up Bonus",
    description: "Reach Silver Tier this week for an exclusive mystery box drop.",
    image: "https://images.unsplash.com/photo-1623406327382-747d6e4df908?w=800&q=80",
    category: "VIP",
    tags: ["Exclusive"],
    prizePool: "Mystery Box",
    color: "from-indigo-500/80 to-slate-900/80",
  },
  {
    id: "friday-reload",
    title: "Weekly Friday Reload",
    description: "Start the weekend right with a 50% reload bonus up to ₹50,000.",
    image: "https://images.unsplash.com/photo-1595304300624-9df033b092fb?w=800&q=80",
    category: "Casino",
    tags: ["Weekly"],
    prizePool: "₹50,000",
    color: "from-pink-500/80 to-rose-900/80",
  },
  {
    id: "pl-payout",
    title: "EPL Early Payout",
    description: "If your team goes 2 goals ahead, your bet is paid as a winner immediately.",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
    category: "Sports",
    tags: ["Hot"],
    prizePool: "Early Win",
    color: "from-blue-500/80 to-indigo-900/80",
  }
];

const CATEGORIES = ["All", "Casino", "Sports", "VIP"];

export default function PromotionsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 35, secs: 59 });
  const [optedIn, setOptedIn] = useState<Record<string, boolean>>({});
  const [heroOptedIn, setHeroOptedIn] = useState(false);
  const [showTerms, setShowTerms] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fake countdown timer for the hero section
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, mins, secs } = prev;
        secs--;
        if (secs < 0) { secs = 59; mins--; }
        if (mins < 0) { mins = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredPromos = activeCategory === "All" 
    ? PROMOTIONS 
    : PROMOTIONS.filter(p => p.category === activeCategory || p.category === "All");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8 pb-32">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-10">

        {/* Hero Section / Main Hook */}
        <div className="relative w-full h-[400px] sm:h-[500px] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-200 group cursor-pointer">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80')" }}
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          
          <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center max-w-3xl z-10">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 w-max shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <Flame className="w-4 h-4" /> Global Event Live
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tight mb-4 drop-shadow-2xl">
              Win a Custom <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Lamborghini</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 font-medium mb-8 max-w-xl text-shadow-sm">
              Wager on any AuraPlay Originals to earn tickets. 1 Ticket = 1 Entry. The biggest giveaway in crypto casino history ends soon.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <button 
                onClick={() => {
                  if (!heroOptedIn) {
                    setHeroOptedIn(true);
                    setToast("🎉 You're in! You'll earn tickets on every AuraPlay Originals wager.");
                    setTimeout(() => setToast(null), 4000);
                  } else {
                    router.push('/casino/originals');
                  }
                }}
                className={cn(
                  "font-black text-lg px-8 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-2",
                  heroOptedIn 
                    ? "bg-green-500 hover:bg-green-400 text-slate-900 shadow-[0_0_30px_rgba(34,197,94,0.4)]" 
                    : "bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
                )}
              >
                {heroOptedIn ? (<><CheckCircle2 className="w-5 h-5" /> Opted In — Play Now</>) : (<>Opt In Now <ArrowRight className="w-5 h-5" /></>)}
              </button>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Ends In</span>
                <div className="flex gap-2">
                  {[
                    { label: "D", val: timeLeft.days },
                    { label: "H", val: timeLeft.hours },
                    { label: "M", val: timeLeft.mins },
                    { label: "S", val: timeLeft.secs }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center justify-center bg-white/60 backdrop-blur-md border border-slate-200 rounded-lg w-12 h-12">
                      <span className="text-lg font-black text-slate-900 leading-none font-mono">{unit.val.toString().padStart(2, '0')}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Navbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-16 z-20 bg-slate-50/80 backdrop-blur-xl py-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto w-full custom-scrollbar pb-2 sm:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border",
                  activeCategory === cat 
                    ? "bg-white text-slate-950 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Promos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPromos.map((promo, idx) => (
              <motion.div
                key={promo.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 flex flex-col cursor-pointer"
              >
                {/* Promo Image Header */}
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b2a] to-transparent z-10" />
                  <img src={promo.image} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  
                  {/* Floating Tags */}
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    {promo.tags.map((tag, i) => (
                      <span key={i} className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                        tag === "Hot" ? "bg-red-500 text-slate-900" : 
                        tag === "Crypto" ? "bg-cyan-500 text-slate-900" :
                        tag === "Ending Soon" ? "bg-orange-500 text-slate-900" :
                        "bg-slate-900/20 backdrop-blur-md text-slate-900 border border-white/20"
                      )}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Category Pill */}
                  <div className="absolute top-4 right-4 z-20 bg-white/60 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-700">
                    {promo.category}
                  </div>
                </div>

                {/* Promo Body */}
                <div className="p-6 flex flex-col flex-1 relative z-20 -mt-6">
                  
                  {/* Prize Pool Badge */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30 w-max px-3 py-1.5 rounded-lg mb-4 shadow-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-black text-yellow-500 tracking-wide">{promo.prizePool}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-yellow-500 transition-colors">
                    {promo.title}
                  </h3>
                  <p className="text-slate-600 text-sm font-medium mb-6 line-clamp-2">
                    {promo.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button 
                      onClick={() => setShowTerms(showTerms === promo.id ? null : promo.id)}
                      className="text-xs font-bold text-slate-500 flex items-center gap-1 group-hover:text-slate-900 transition-colors hover:underline"
                    >
                      <Clock className="w-3.5 h-3.5" /> {showTerms === promo.id ? 'Hide Terms' : 'Read Terms'}
                    </button>
                    {optedIn[promo.id] ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-black text-green-600 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20"><CheckCircle2 className="w-4 h-4" /> Joined</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push('/account/balance');
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all"
                        >
                          Deposit
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOptedIn(prev => ({ ...prev, [promo.id]: true }));
                          setToast(`✅ Opted in! Deposit real money to activate ${promo.title}.`);
                          setTimeout(() => setToast(null), 4000);
                        }}
                        className="font-bold text-sm px-5 py-2 rounded-xl bg-slate-50 group-hover:bg-white text-slate-700 group-hover:text-black hover:scale-105 transition-all shadow-sm"
                      >
                        Opt In
                      </button>
                    )}
                  </div>
                  
                  {/* Expandable Terms */}
                  <AnimatePresence>
                    {showTerms === promo.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed space-y-2">
                          <p>• Minimum wager of ₹100 required per qualifying bet.</p>
                          <p>• This promotion cannot be combined with other active bonuses.</p>
                          <p>• AuraPlay reserves the right to modify or cancel this promotion at any time.</p>
                          <p>• Winnings from promotional offers may be subject to a 1x playthrough requirement.</p>
                          <p>• Must be 18+ to participate. Responsible gambling rules apply.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-50 border border-[#7148ff]/50 text-slate-900 font-bold text-sm px-8 py-4 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(113,72,255,0.2)] flex items-center gap-3"
          >
            {toast}
            <button onClick={() => setToast(null)} className="text-slate-600 hover:text-slate-900 ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
