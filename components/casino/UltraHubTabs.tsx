"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameCard } from "./GameCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  games: any[];
}

interface UltraHubTabsProps {
  categories: Category[];
}

export function UltraHubTabs({ categories }: UltraHubTabsProps) {
  const [activeTab, setActiveTab] = useState(categories[0].id);
  const activeCategory = categories.find(c => c.id === activeTab);

  return (
    <section className="space-y-6 pt-6 relative bg-white">
      <div className="absolute inset-0 bg-blue-50/50 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-wider uppercase">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm border border-blue-200/50 text-blue-600">
            🌌
          </span>
          The Ultra Hub
        </h2>
        <Link href={`/casino/${activeTab}`} className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 group bg-slate-50 hover:bg-slate-100 px-5 py-2 rounded-full border border-slate-200 shadow-sm shrink-0">
          Explore Hub 
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-600" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar pb-3 gap-3 px-1 snap-x">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all border snap-start ${
              activeTab === cat.id 
                ? "bg-blue-600 text-slate-900 border-blue-600 shadow-md scale-105" 
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {cat.icon}
            {cat.title}
          </button>
        ))}
      </div>

      {/* Grid / Horizontal Scroll */}
      <div className="relative group min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex overflow-x-auto gap-4 md:gap-6 custom-scrollbar pb-6 pt-2 px-1 scroll-smooth snap-x"
          >
            {activeCategory?.games.map((game) => (
              <div key={game.id} className="min-w-[160px] md:min-w-[200px] lg:min-w-[220px] snap-start shrink-0">
                <GameCard {...game} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
        
        {/* Fade masks */}
        <div className="absolute top-0 bottom-6 right-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-6 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
