"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const SLIDES = [
  {
    id: "fps-1",
    badge: "Featured FPS",
    title: "KRUNKER 3D",
    highlight: "MASSIVE MULTIPLAYER",
    desc: "Drop into the arena and dominate the leaderboards in this high-octane WebGL shooter.",
    cta: "PLAY NOW",
    href: "/casino/game/fps-1",
    bgClass: "from-slate-950 via-slate-900 to-cyan-950/80",
    bgImage: "/games/carouselBackgroundImage-M3IwP0oo1.png",
    buttonClass: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
  },
  {
    id: "driving-1",
    badge: "Trending Simulator",
    title: "HEXGL F1 RACING",
    highlight: "NEXT-GEN SPEED",
    desc: "Push your reflexes to the absolute limit in the fastest WebGL racing experience ever built.",
    cta: "START ENGINE",
    href: "/casino/game/driving-1",
    bgClass: "from-slate-950 via-slate-900 to-red-950/80",
    bgImage: "/games/Carousel-backgound-240x360.png",
    buttonClass: "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
  },
  {
    id: "action-1",
    badge: "Classic Adventure",
    title: "TOMB RAIDER 3D",
    highlight: "THE OPENLARA PROJECT",
    desc: "Experience the legendary classic natively in your browser with fully unlocked 3D rendering.",
    cta: "ENTER THE TOMB",
    href: "/casino/game/action-1",
    bgClass: "from-slate-950 via-slate-900 to-emerald-950/80",
    bgImage: "/games/Carousel-backgound-240x360-v2.png",
    buttonClass: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
  }
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative w-full min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl group flex">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`absolute inset-0 bg-gradient-to-r ${slide.bgClass} flex items-center overflow-hidden`}
        >
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              src={slide.bgImage} 
              alt={slide.title} 
              className="w-full h-full object-cover opacity-30"
            />
            {/* Linear gradient fade out to the right */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgClass}`} />
          </div>

          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
          
          <div className="relative z-10 px-6 sm:px-12 md:px-16 w-full md:w-2/3 space-y-4 py-8">
            <motion.span 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-block px-4 py-1.5 bg-slate-900/10 text-slate-900 text-[10px] font-black rounded-full border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase tracking-widest backdrop-blur-md"
            >
              <span className="mr-2 inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              {slide.badge}
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter drop-shadow-2xl"
            >
              {slide.title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 filter drop-shadow-lg">
                {slide.highlight}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-slate-700 text-base sm:text-lg max-w-lg font-medium leading-relaxed drop-shadow-md"
            >
              {slide.desc}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="mt-8 pt-4"
            >
              <Link
                href={slide.href}
                className={`group relative overflow-hidden inline-flex items-center justify-center font-black py-3.5 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 ${slide.buttonClass} tracking-widest uppercase`}
              >
                <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:animate-glare mix-blend-overlay" />
                {slide.cta}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 right-8 flex items-center gap-3 z-20">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              idx === currentSlide ? "bg-white w-8" : "bg-slate-900/30 hover:bg-slate-900/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
