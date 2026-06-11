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
  let badgeColor = "bg-blue-100 text-blue-600 border-blue-200";
  if (category === "fps") badgeColor = "bg-red-100 text-red-600 border-red-200";
  if (category === "driving" || category === "racing") badgeColor = "bg-green-100 text-green-600 border-green-200";
  if (category === "action") badgeColor = "bg-purple-100 text-purple-600 border-purple-200";
  if (category === "aaa" || category === "3d") badgeColor = "bg-amber-100 text-amber-600 border-amber-200";
  
  // Format players with 'k' suffix
  const formattedPlayers = players ? (players > 1000 ? (players / 1000).toFixed(1) + 'k' : players) : null;

  return (
    <Link href={`/casino/game/${id}`} className="group relative block w-full aspect-[2/3] rounded-2xl overflow-hidden bg-slate-50 isolation-auto transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border border-slate-200">
      
      {/* Premium Animated Border Wrapper */}
      <div className="absolute inset-0 border border-transparent rounded-2xl z-20 transition-all duration-500 group-hover:border-blue-400/30 group-hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] pointer-events-none" />
      
      {/* Background Image with Cinematic Zoom */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-out group-hover:scale-110 group-hover:rotate-1"
        style={{ backgroundImage: `url(${image})` }}
      />
      
      {/* Default Overlay Gradient (Bottom up) */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-transparent opacity-100 transition-opacity duration-700 group-hover:opacity-100" />
      
      {/* Hover Overlay: Premium Glassmorphism and Inner Glow */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center pointer-events-none z-10">
        
        {/* Metallic Shine Sweep */}
        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-[100%] group-hover:animate-glare mix-blend-overlay" />

        {/* Glowing Orbit Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-blue-200 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute w-20 h-20 rounded-full border border-blue-400/40 animate-reverse-spin opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-100" />
        </div>

        <div className="relative w-16 h-16 rounded-full bg-blue-600/90 border border-blue-400 flex items-center justify-center backdrop-blur-xl transform scale-50 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-lg">
          <Play className="w-6 h-6 text-slate-900 ml-1 fill-white drop-shadow-sm" />
        </div>
      </div>

      {/* Badges / Top Stats */}
      <div className="absolute top-4 w-full px-4 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-2">
          {isNew && (
            <span className="flex items-center gap-1 w-max px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-md animate-pulse-slow">
              <Sparkles className="w-3 h-3" /> New
            </span>
          )}
          <span className={cn("w-max px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border backdrop-blur-md shadow-sm", badgeColor)}>
            {category}
          </span>
        </div>

        {rtp && (
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-[10px] font-black text-slate-800">{rtp}%</span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="absolute bottom-0 w-full p-5 z-20 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <h3 className="text-slate-900 font-bold text-sm sm:text-base tracking-tight leading-tight line-clamp-2">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mt-3">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {provider}
          </p>
          {formattedPlayers && (
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 shadow-sm">
              <Users className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-black">{formattedPlayers}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
