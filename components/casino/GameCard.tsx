"use client";
import Link from "next/link";
import { Play, TrendingUp, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameCardProps {
  id: string;
  title: string;
  provider: string;
  image: string;
  isNew?: boolean;
  rtp?: number;
  players?: number;
}

export function GameCard({ id, title, provider, image, isNew, rtp, players }: GameCardProps) {
  // Extract category from ID to determine badge color (Light theme adaptations)
  const category = id.split('-')[0];
  let badgeColor = "bg-blue-50 text-blue-600 border-blue-100";
  if (category === "fps") badgeColor = "bg-rose-50 text-rose-600 border-rose-100";
  if (category === "driving" || category === "racing") badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (category === "action") badgeColor = "bg-purple-50 text-purple-600 border-purple-100";
  if (category === "aaa" || category === "3d") badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
  if (category === "orig" || category === "originals") badgeColor = "bg-slate-900 text-white border-slate-700";
  
  // Format players with 'k' suffix
  const formattedPlayers = players ? (players > 1000 ? (players / 1000).toFixed(1) + 'k' : players) : null;

  return (
    <Link href={`/casino/game/${id}`} className="group relative block w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-slate-100 isolation-auto transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 border border-slate-200/50">
      
      {/* Background Image */}
      <img 
        src={image} 
        alt={title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      
      {/* Light Glass Overlay for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-90 transition-opacity duration-500" />
      
      {/* Hover Overlay: Premium Glassmorphism Play Button */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center pointer-events-none z-10">
        <div className="relative w-16 h-16 rounded-full bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center backdrop-blur-md transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-400 ease-out">
          <Play className="w-6 h-6 text-slate-900 ml-1 fill-slate-900" />
        </div>
      </div>

      {/* Badges / Top Stats */}
      <div className="absolute top-4 w-full px-4 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-2">
          {isNew && (
            <span className="flex items-center gap-1 w-max px-2.5 py-1 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" /> New
            </span>
          )}
          <span className={cn("w-max px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border shadow-sm backdrop-blur-md", badgeColor)}>
            {category}
          </span>
        </div>

        {rtp && (
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-slate-100">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-900">{rtp}%</span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="absolute bottom-0 w-full p-5 z-20 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <h3 className="text-white font-black text-lg sm:text-xl tracking-tight leading-tight line-clamp-2 drop-shadow-sm">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.15em] drop-shadow-sm">
            {provider}
          </p>
          {formattedPlayers && (
            <div className="flex items-center gap-1.5 text-slate-900 bg-white/90 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-400 delay-75 shadow-sm backdrop-blur-md">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-black">{formattedPlayers}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
