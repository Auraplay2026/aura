"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, Trophy, Zap, Gamepad2, TrendingUp, ShieldCheck, Flame, Star, 
  Activity, Crown, Percent, Gift, ChevronRight, ChevronLeft, X, CheckCircle2, AlertCircle 
} from "lucide-react";
import { getGamesByCategory } from "@/lib/games";
import { ARCADE_GAMES } from "@/lib/arcade-games";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";
import { useTradingStore } from "@/lib/store";

interface LiveMatch {
  id: string;
  sport: "cricket" | "soccer" | "tennis";
  title: string;
  status: string;
  selections: {
    name: string;
    back: number;
    lay: number;
  }[];
}

const LIVE_MATCHES_DATA: LiveMatch[] = [
  {
    id: "m1",
    sport: "cricket",
    title: "RCB vs CSK (IPL Live)",
    status: "14.2 Overs • Target 186",
    selections: [
      { name: "Royal Challengers Bangalore", back: 1.90, lay: 1.91 },
      { name: "Chennai Super Kings", back: 1.96, lay: 1.97 }
    ]
  },
  {
    id: "m2",
    sport: "soccer",
    title: "Manchester City vs Real Madrid",
    status: "72' • 2 - 1",
    selections: [
      { name: "Manchester City", back: 2.10, lay: 2.12 },
      { name: "Real Madrid", back: 3.40, lay: 3.45 }
    ]
  },
  {
    id: "m3",
    sport: "tennis",
    title: "Novak Djokovic vs Carlos Alcaraz",
    status: "Set 3 • 4-4 (30-30)",
    selections: [
      { name: "Novak Djokovic", back: 1.75, lay: 1.76 },
      { name: "Carlos Alcaraz", back: 2.10, lay: 2.12 }
    ]
  }
];

const CAROUSEL_SLIDES = [
  {
    id: 1,
    title: "AuraPlay Exchange",
    subtitle: "Get Your Online ID",
    accent: "5% BONUS ON FIRST DEPOSIT",
    bgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-red-950 via-slate-900 to-slate-900",
    buttonText: "Register Now",
    link: "/promotions"
  },
  {
    id: 2,
    title: "Live Sports Arena",
    subtitle: "Unmatched Betting Margins",
    accent: "BET LIVE ON CRICKET, SOCCER, & TENNIS",
    bgUrl: "https://images.unsplash.com/photo-1518605368461-1e128014792c?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-purple-900 via-slate-900 to-slate-900",
    buttonText: "Enter Sportsbook",
    link: "/sportsbook"
  },
  {
    id: 3,
    title: "Instant Arcade Hub",
    subtitle: "Play Premium Games",
    accent: "NEON SURFER, SUGAR CASCADE & ZEN ARCHERY",
    bgUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-emerald-900 via-slate-900 to-slate-900",
    buttonText: "Play Instants",
    link: "/arcade"
  }
];

export default function GlobalHomepage() {
  const featuredCasino = getGamesByCategory("slots").slice(0, 8);
  const featuredArcade = ARCADE_GAMES.slice(0, 4);
  const originals = getGamesByCategory("originals").slice(0, 4);
  const liveDealers = getGamesByCategory("live").slice(0, 4);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progressActive, setProgressActive] = useState(false);
  
  // Betslip state
  const { isLoggedIn, balance, placeSportsBet } = useTradingStore();
  const [selectedBet, setSelectedBet] = useState<{
    matchTitle: string;
    selectionName: string;
    odds: number;
    type: "back" | "lay";
  } | null>(null);
  const [stake, setStake] = useState<string>("500");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [betError, setBetError] = useState("");

  // Slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Progress bar reset on slide change
  useEffect(() => {
    setProgressActive(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgressActive(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [currentSlide]);

  const handlePlaceBet = async () => {
    if (!isLoggedIn) {
      setBetError("Please log in to place wagers.");
      // Open auth login modal
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }));
      return;
    }

    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setBetError("Invalid stake amount.");
      return;
    }

    if (stakeNum > balance) {
      setBetError("Insufficient balance.");
      return;
    }

    setIsPlacingBet(true);
    setBetError("");
    
    try {
      if (selectedBet) {
        // Zustand action
        placeSportsBet(
          selectedBet.matchTitle,
          selectedBet.selectionName,
          selectedBet.odds,
          stakeNum
        );
        setBetSuccess(true);
        setTimeout(() => {
          setSelectedBet(null);
          setBetSuccess(false);
        }, 1500);
      }
    } catch (err) {
      setBetError("Failed to place bet. Please try again.");
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-20 w-full overflow-hidden px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* 1. TOP PROMO BANNER CAROUSEL */}
      <div className="relative w-full rounded-md overflow-hidden aspect-[4/1] md:aspect-[6/1] lg:aspect-[8/1] flex items-center bg-slate-900 shadow-sm group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${CAROUSEL_SLIDES[currentSlide].gradient} z-10`} />
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-30 mix-blend-luminosity z-0" 
              style={{ backgroundImage: `url('${CAROUSEL_SLIDES[currentSlide].bgUrl}')` }}
            />
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent to-slate-900 z-10" />
            
            <div className="relative z-20 flex items-center justify-between w-full px-6 md:px-12">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-black tracking-widest uppercase text-sm md:text-base">
                    {CAROUSEL_SLIDES[currentSlide].title}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase italic">
                  {CAROUSEL_SLIDES[currentSlide].subtitle}
                </h2>
                <div className="mt-2 inline-block px-4 py-1 border-2 border-yellow-400 text-yellow-400 font-bold text-xs md:text-sm w-max uppercase tracking-wider">
                  {CAROUSEL_SLIDES[currentSlide].accent}
                </div>
              </div>
              <Link href={CAROUSEL_SLIDES[currentSlide].link} className="hidden md:flex bg-yellow-400 text-slate-900 font-black px-6 py-3 rounded uppercase items-center gap-2 hover:bg-yellow-300 transition-colors cursor-pointer shadow-md">
                {CAROUSEL_SLIDES[currentSlide].buttonText} <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {CAROUSEL_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === index ? 'bg-yellow-400 w-6' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-24 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full"
            style={{
              width: progressActive ? '100%' : '0%',
              transition: progressActive ? 'width 6s linear' : 'none',
            }}
          />
        </div>

        {/* Arrow Navigation */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
          className="absolute left-4 z-20 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
          className="absolute right-4 z-20 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. SECOND ROW: SPORTS LIVE MATCHES (60%) & BLOG (40%) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* SPORTS LIVE ODDS WIDGET */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Live Exchange Matches</h3>
            </div>
            <Link href="/sportsbook" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1 transition-colors">
              Full Sportsbook <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {LIVE_MATCHES_DATA.map((match) => (
              <div key={match.id} className="border border-slate-100 rounded p-3 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 truncate max-w-[220px] sm:max-w-none">{match.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{match.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {match.selections.map((sel, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 rounded px-3 py-1.5 shadow-sm">
                      <span className="text-[11px] font-bold text-slate-800 truncate pr-2">{sel.name.split(" ").slice(-1)[0]}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setSelectedBet({ matchTitle: match.title, selectionName: sel.name, odds: sel.back, type: 'back' })}
                          className="w-12 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded text-center text-emerald-800 transition-colors"
                        >
                          <span className="block text-[8px] font-black uppercase text-emerald-700/80 leading-none">Back</span>
                          <span className="text-xs font-black font-mono leading-none">{sel.back.toFixed(2)}</span>
                        </button>
                        <button 
                          onClick={() => setSelectedBet({ matchTitle: match.title, selectionName: sel.name, odds: sel.lay, type: 'lay' })}
                          className="w-12 py-1 bg-pink-100 hover:bg-pink-200 border border-pink-200 rounded text-center text-pink-800 transition-colors"
                        >
                          <span className="block text-[8px] font-black uppercase text-pink-700/80 leading-none">Lay</span>
                          <span className="text-xs font-black font-mono leading-none">{sel.lay.toFixed(2)}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOG BANNER */}
        <Link href="/blog" className="md:col-span-2 relative w-full rounded-md overflow-hidden aspect-[16/9] md:aspect-auto md:h-auto bg-gradient-to-br from-yellow-400 to-amber-500 group cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-300 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="bg-red-600 text-white font-black text-6xl md:text-7xl italic tracking-tighter px-6 py-2 rounded-xl shadow-xl transform -rotate-2 mb-4 border-4 border-white">
              BLOG
            </div>
            <p className="text-slate-900 font-black uppercase tracking-widest text-sm mb-6 bg-white px-3 py-1 rounded">News | Sporting Info | Etc.</p>
            
            <div className="flex justify-center gap-4 text-slate-900 w-full bg-slate-900/10 p-3 rounded-lg">
              <div className="flex flex-col items-center gap-1"><Trophy className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Cricket</span></div>
              <div className="flex flex-col items-center gap-1"><Activity className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Tennis</span></div>
              <div className="flex flex-col items-center gap-1"><Star className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Football</span></div>
            </div>
          </div>
        </Link>

      </div>

      {/* 3. THIRD ROW: PROVIDERS (33% each) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Betradar */}
        <Link href="/casino?provider=betradar" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-rose-950 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <h3 className="text-3xl font-black text-white tracking-tighter mb-1">bet<span className="text-rose-400">radar</span></h3>
          </div>
        </Link>

        {/* Evolution */}
        <Link href="/casino?provider=evolution" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-purple-900 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <Flame className="w-8 h-8 text-white" />
               <h3 className="text-3xl font-black text-white tracking-tighter">Evolution</h3>
             </div>
          </div>
        </Link>

        {/* SmartSoft */}
        <Link href="/casino?provider=smartsoft" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-slate-900 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518331647614-7a1f04cd34ce?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">S</div>
               <h3 className="text-3xl font-black text-white tracking-tighter">SmartSoft</h3>
             </div>
          </div>
        </Link>

      </div>

      <div className="h-6" /> {/* Spacer */}

      {/* 4. AURA ORIGINALS */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">AuraPlay Originals</h2>
          </div>
          <Link href="/casino/originals" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {originals.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </motion.section>

      {/* 5. PREMIUM CASINO FEATURED */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Premium Slots</h2>
          </div>
          <Link href="/casino/slots" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
            Enter Casino
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredCasino.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </motion.section>

      {/* 6. ARCADE HUB FEATURED */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.15 }} className="w-full mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Instant Arcade</h2>
          </div>
          <Link href="/arcade" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
            View All Games
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredArcade.map(game => (
            <Link key={game.id} href={`/arcade/game/${game.id}`} className="group block relative rounded-md overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-full p-4">
                <h3 className="font-black text-white truncate text-base group-hover:text-yellow-400 transition-colors">{game.title}</h3>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest truncate">{game.provider}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* 7. LIVE DEALERS */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Live Dealers</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {liveDealers.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </motion.section>

      {/* 8. LIVE ACTION FEED & ACTIVITY */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.25 }} className="w-full mt-8 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Platform Activity & Live Wins</h2>
        </div>
        <LiveActionFeed />
      </motion.section>

      {/* 9. QUICK BET SLIP MODAL */}
      <AnimatePresence>
        {selectedBet && (
          <>
            {/* Dim Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBet(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            >
              {/* Slip Card */}
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-red-600" /> Quick Wager Slip
                  </span>
                  <button onClick={() => setSelectedBet(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{selectedBet.matchTitle}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">{selectedBet.selectionName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${selectedBet.type === 'back' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'}`}>
                      {selectedBet.type} @ {selectedBet.odds.toFixed(2)}
                    </span>
                  </div>

                  {betSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-black">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Bet Placed Successfully!
                    </div>
                  ) : (
                    <>
                      {betError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded flex items-center gap-2 text-xs font-semibold">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {betError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Stake Amount (₹)</label>
                        <input 
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold font-mono focus:outline-none focus:border-red-600 transition-colors"
                        />
                      </div>

                      {/* Quick Stake Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {["100", "500", "1000", "5000"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setStake(s)}
                            className={`py-1.5 border rounded text-xs font-bold font-mono transition-colors ${stake === s ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
                          >
                            ₹{s}
                          </button>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Est. Return</span>
                        <span className="text-slate-900 font-mono text-sm">
                          ₹{((parseFloat(stake) || 0) * selectedBet.odds).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={handlePlaceBet}
                        disabled={isPlacingBet}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-all ${
                          selectedBet.type === 'back' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                            : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20'
                        } disabled:opacity-50`}
                      >
                        {isPlacingBet ? "Processing..." : "Confirm Wager"}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
