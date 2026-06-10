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
  if (category === "fps") badgeColor = "bg-red-500/20 text-red-400 border-red-500/30";
  if (category === "driving" || category === "racing") badgeColor = "bg-green-500/20 text-green-400 border-green-500/30";
  if (category === "action") badgeColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
  if (category === "aaa" || category === "3d") badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  
  // Format players with 'k' suffix
  const formattedPlayers = players ? (players > 1000 ? (players / 1000).toFixed(1) + 'k' : players) : null;

  return (
    <Link href={`/casino/game/${id}`} className="group relative block w-full aspect-[2/3] rounded-2xl overflow-hidden bg-[#0a0f1d] isolation-auto transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2">
      
      {/* Premium Animated Border Wrapper */}
      <div className="absolute inset-0 border border-slate-800/80 rounded-2xl z-20 transition-all duration-500 group-hover:border-white/30 group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] pointer-events-none" />
      
      {/* Background Image with Cinematic Zoom */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-out group-hover:scale-110 group-hover:rotate-2"
        style={{ backgroundImage: `url(${image})` }}
      />
      
      {/* Default Overlay Gradient (Bottom up) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-[#050914]/50 to-transparent opacity-95 transition-opacity duration-700 group-hover:opacity-100" />
      
      {/* Hover Overlay: Premium Glassmorphism and Inner Glow */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center pointer-events-none z-10">
        
        {/* Metallic Shine Sweep */}
        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:animate-glare mix-blend-overlay" />

        {/* Glowing Orbit Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-white/20 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute w-20 h-20 rounded-full border border-neon-cyan/40 animate-reverse-spin opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-100" />
        </div>

        <div className="relative w-16 h-16 rounded-full bg-white/10 border border-white/30 flex items-center justify-center backdrop-blur-xl transform scale-50 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_50px_rgba(255,255,255,0.3)]">
          <Play className="w-6 h-6 text-white ml-1 fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
      </div>

      {/* Badges / Top Stats */}
      <div className="absolute top-4 w-full px-4 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-2">
          {isNew && (
            <span className="flex items-center gap-1 w-max px-2.5 py-1 bg-gradient-to-r from-neon-yellow to-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-md shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse-slow">
              <Sparkles className="w-3 h-3" /> New
            </span>
          )}
          <span className={cn("w-max px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border backdrop-blur-md shadow-lg", badgeColor)}>
            {category}
          </span>
        </div>

        {rtp && (
          <div className="flex items-center gap-1.5 bg-[#050914]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-lg">
            <TrendingUp className="w-3 h-3 text-neon-green" />
            <span className="text-[10px] font-black text-white">{rtp}%</span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="absolute bottom-0 w-full p-5 z-20 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <div className="w-8 h-1 bg-gradient-to-r from-neon-purple to-transparent rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <h3 className="text-white font-bold text-sm sm:text-base tracking-tight leading-tight line-clamp-2 drop-shadow-xl">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mt-3">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {provider}
          </p>
          {formattedPlayers && (
            <div className="flex items-center gap-1.5 text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
              <Users className="w-3 h-3 text-neon-purple" />
              <span className="text-[10px] font-black">{formattedPlayers}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
