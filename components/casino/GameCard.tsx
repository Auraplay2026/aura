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
  // Extract category from ID to determine badge color
  const category = id.split('-')[0];
  let badgeColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (category === "fps") badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
  if (category === "driving" || category === "racing") badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (category === "action") badgeColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
  if (category === "aaa" || category === "3d") badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (category === "orig" || category === "originals") badgeColor = "bg-neon-green/20 text-neon-green border-neon-green/30";
  
  // Format players with 'k' suffix
  const formattedPlayers = players ? (players > 1000 ? (players / 1000).toFixed(1) + 'k' : players) : null;

  return (
    <Link href={`/casino/game/${id}`} className="group relative block w-full aspect-[2/3] rounded-3xl overflow-hidden bg-[#0a0f1c] isolation-auto transition-all duration-700 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:-translate-y-2 border border-slate-800/50">
      
      {/* Premium Animated Border Wrapper */}
      <div className="absolute inset-0 border-2 border-transparent rounded-3xl z-20 transition-all duration-500 group-hover:border-neon-purple/50 group-hover:shadow-[inset_0_0_30px_rgba(168,85,247,0.2)] pointer-events-none" />
      
      {/* Background Image with Cinematic Zoom & Dark Overlay */}
      <img 
        src={image} 
        alt={title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 group-hover:rotate-1"
      />
      
      {/* Heavy Dark Gradient Overlay (Bottom up) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/80 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-100" />
      
      {/* Hover Overlay: Premium Glassmorphism and Inner Glow */}
      <div className="absolute inset-0 bg-[#0a0f1c]/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center pointer-events-none z-10">
        
        {/* Metallic Shine Sweep */}
        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:animate-glare mix-blend-overlay" />

        {/* Glowing Play Button Effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-neon-purple/30 animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute w-20 h-20 rounded-full border border-neon-green/30 animate-[spin_3s_linear_infinite_reverse] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-100" />
        </div>

        <div className="relative w-16 h-16 rounded-full bg-neon-purple border border-purple-400 flex items-center justify-center backdrop-blur-xl transform scale-50 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_30px_rgba(168,85,247,0.6)]">
          <Play className="w-6 h-6 text-white ml-1 fill-white drop-shadow-md" />
        </div>
      </div>

      {/* Badges / Top Stats */}
      <div className="absolute top-4 w-full px-4 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-2">
          {isNew && (
            <span className="flex items-center gap-1 w-max px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse">
              <Sparkles className="w-3 h-3" /> New
            </span>
          )}
          <span className={cn("w-max px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-md shadow-sm", badgeColor)}>
            {category}
          </span>
        </div>

        {rtp && (
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/50 shadow-sm">
            <TrendingUp className="w-3 h-3 text-neon-green" />
            <span className="text-[10px] font-black text-white">{rtp}%</span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="absolute bottom-0 w-full p-5 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <div className="w-8 h-1 bg-gradient-to-r from-neon-purple to-transparent rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <h3 className="text-white font-black text-sm sm:text-base tracking-wide leading-tight line-clamp-2 drop-shadow-md">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mt-3">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            {provider}
          </p>
          {formattedPlayers && (
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 shadow-sm backdrop-blur-sm">
              <Users className="w-3 h-3 text-neon-purple" />
              <span className="text-[10px] font-black">{formattedPlayers}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
