"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  val: string;
  suit: string;
  faceDown?: boolean;
  className?: string;
  themeBack?: "default" | "gold" | "blue" | "red" | "dark";
}

// Normalized Suit Type & Color
export type SuitType = "spade" | "heart" | "diamond" | "club";

export function getSuitDetails(suitInput: string): { type: SuitType; symbol: string; colorClass: string; isRed: boolean } {
  const norm = suitInput.trim().toLowerCase();
  if (norm.includes("spade") || norm.includes("♠") || norm.includes("s")) {
    return { type: "spade", symbol: "♠", colorClass: "text-slate-900", isRed: false };
  }
  if (norm.includes("heart") || norm.includes("♥") || norm.includes("h")) {
    return { type: "heart", symbol: "♥", colorClass: "text-rose-600", isRed: true };
  }
  if (norm.includes("diamond") || norm.includes("♦") || norm.includes("d")) {
    return { type: "diamond", symbol: "♦", colorClass: "text-amber-600", isRed: true };
  }
  // Default to club
  return { type: "club", symbol: "♣", colorClass: "text-emerald-950", isRed: false };
}

// Vector Suit SVGs for crisp, clean, responsive rendering
export function SuitIcon({ type, className }: { type: SuitType; className?: string }) {
  if (type === "spade") {
    return (
      <svg viewBox="0 0 24 24" className={cn("fill-current", className)}>
        <path d="M12 2C11.5 2 5.5 8.2 5.5 12.3c0 3.2 2.6 5.8 5.8 5.8c.2 0 .4 0 .6-.1c.1 0 .3.1.5.1c3.2 0 5.8-2.6 5.8-5.8c0-4.1-6-10.3-6.4-10.3z M12 17v4.5c-1 0-1.5.5-1.5 1h5c0-.5-.5-1-1.5-1V17h-2z" />
      </svg>
    );
  }
  if (type === "heart") {
    return (
      <svg viewBox="0 0 24 24" className={cn("fill-current", className)}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c1.74 0 3.41.81 4.5 2.09C18.58 5.42 21 8.5 21 12.33c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  if (type === "diamond") {
    return (
      <svg viewBox="0 0 24 24" className={cn("fill-current", className)}>
        <path d="M12 2L3.5 12L12 22L20.5 12L12 2z" />
      </svg>
    );
  }
  // Club
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)}>
      <path d="M12 2a3.5 3.5 0 00-3.5 3.5c0 .7.2 1.4.6 2a3.5 3.5 0 00-3.1 3.5c0 1.9 1.6 3.5 3.5 3.5c.3 0 .6 0 .9-.1c.3 0 .6.1.9.1a3.5 3.5 0 003.5-3.5a3.5 3.5 0 00-3.1-3.5c.4-.6.6-1.3.6-2A3.5 3.5 0 0012 2z M12 14v4.5c-1 0-1.5.5-1.5 1h5c0-.5-.5-1-1.5-1V14h-2z" />
    </svg>
  );
}

export function PremiumCard({ val, suit, faceDown = false, className, themeBack = "default" }: PremiumCardProps) {
  const { type, colorClass, isRed } = getSuitDetails(suit);
  const normalizedVal = val.toUpperCase().trim();

  // Card Back styling
  const getCardBack = () => {
    let backColor = "from-red-700 via-red-800 to-red-950 border-red-500/30";
    let patternColor = "text-red-400/25";
    
    if (themeBack === "gold") {
      backColor = "from-amber-600 via-yellow-700 to-amber-950 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
      patternColor = "text-amber-400/30";
    } else if (themeBack === "blue") {
      backColor = "from-blue-700 via-blue-800 to-blue-950 border-blue-500/30";
      patternColor = "text-blue-400/20";
    } else if (themeBack === "dark") {
      backColor = "from-slate-800 via-slate-900 to-black border-slate-700/40";
      patternColor = "text-yellow-600/10";
    } else if (themeBack === "red") {
      backColor = "from-rose-800 via-red-900 to-red-950 border-rose-600/30";
      patternColor = "text-rose-500/20";
    }

    return (
      <div className={cn("w-full h-full rounded-2xl bg-gradient-to-br p-2.5 flex flex-col justify-between border-2 select-none shadow-[0_8px_16px_rgba(0,0,0,0.65)]", backColor)}>
        {/* Ornate Gold Filigree Back Pattern */}
        <div className="w-full h-full border border-white/10 rounded-xl relative overflow-hidden flex items-center justify-center">
          <div className={cn("absolute inset-0 grid grid-cols-6 grid-rows-8 opacity-20 pointer-events-none", patternColor)}>
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-current/20 flex items-center justify-center text-[7px] font-serif rotate-45 select-none">
                ♠
              </div>
            ))}
          </div>
          {/* Inner Golden Crest */}
          <div className="relative w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/35 shadow-inner">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-900/40 animate-pulse">
              <path fill="currentColor" d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6z" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  // Render illustrations for K, Q, J, Joker
  const renderCenterArtwork = () => {
    const artColor = isRed ? "text-red-500/25" : "text-slate-800/20";
    if (normalizedVal === "K") {
      return (
        <div className={cn("absolute inset-x-4 inset-y-6 border border-current rounded flex flex-col items-center justify-center p-1", artColor)}>
          {/* King Crown & Portrait Crest */}
          <svg viewBox="0 0 24 24" className="w-10 h-10 mb-0.5">
            <path fill="currentColor" d="M2 4l3 3 7-5 7 5 3-3v14H2V4zm18 12V8.9l-5.3-3.8-2.7 1.9-2.7-1.9L4 8.9V16h16zm-4-4v2H8v-2h8z" />
          </svg>
          <span className="text-[7.5px] font-black uppercase tracking-wider scale-95 opacity-60">KING</span>
          {/* Dual-headed mirror border indicator */}
          <div className="w-full border-b border-dashed border-current/30 my-1" />
          <svg viewBox="0 0 24 24" className="w-10 h-10 rotate-180 mt-0.5">
            <path fill="currentColor" d="M2 4l3 3 7-5 7 5 3-3v14H2V4zm18 12V8.9l-5.3-3.8-2.7 1.9-2.7-1.9L4 8.9V16h16zm-4-4v2H8v-2h8z" />
          </svg>
        </div>
      );
    }
    if (normalizedVal === "Q") {
      return (
        <div className={cn("absolute inset-x-4 inset-y-6 border border-current rounded flex flex-col items-center justify-center p-1", artColor)}>
          {/* Queen Crown & Scepter Emblem */}
          <svg viewBox="0 0 24 24" className="w-9 h-9 mb-0.5">
            <path fill="currentColor" d="M12 2a4 4 0 00-4 4c0 1.2.5 2.3 1.3 3.1l-3 4.5A2 2 0 008 17h8a2 2 0 001.7-3.4l-3-4.5c.8-.8 1.3-1.9 1.3-3.1a4 4 0 00-4-4zm0 2a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2zm-3 8h6l2 3H7l2-3zm-1 5h8v2H8v-2z" />
          </svg>
          <span className="text-[7.5px] font-black uppercase tracking-wider scale-95 opacity-60">QUEEN</span>
          <div className="w-full border-b border-dashed border-current/30 my-1" />
          <svg viewBox="0 0 24 24" className="w-9 h-9 rotate-180 mt-0.5">
            <path fill="currentColor" d="M12 2a4 4 0 00-4 4c0 1.2.5 2.3 1.3 3.1l-3 4.5A2 2 0 008 17h8a2 2 0 001.7-3.4l-3-4.5c.8-.8 1.3-1.9 1.3-3.1a4 4 0 00-4-4zm0 2a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2zm-3 8h6l2 3H7l2-3zm-1 5h8v2H8v-2z" />
          </svg>
        </div>
      );
    }
    if (normalizedVal === "J") {
      return (
        <div className={cn("absolute inset-x-4 inset-y-6 border border-current rounded flex flex-col items-center justify-center p-1", artColor)}>
          {/* Jack Knight Helmet Silhouette */}
          <svg viewBox="0 0 24 24" className="w-9 h-9 mb-0.5">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2V15h2v2.5zm1.5-4.5h-5v-1h5v1zm1.5-3h-8V9h8v1z" />
          </svg>
          <span className="text-[7.5px] font-black uppercase tracking-wider scale-95 opacity-60">JACK</span>
          <div className="w-full border-b border-dashed border-current/30 my-1" />
          <svg viewBox="0 0 24 24" className="w-9 h-9 rotate-180 mt-0.5">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2V15h2v2.5zm1.5-4.5h-5v-1h5v1zm1.5-3h-8V9h8v1z" />
          </svg>
        </div>
      );
    }
    if (normalizedVal === "A") {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center p-4">
            <SuitIcon type={type} className={cn("w-14 h-14 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]", colorClass)} />
            {/* Ornate Gold Crown atop the Ace badge */}
            <svg viewBox="0 0 24 24" className="absolute -top-1 w-6 h-6 text-amber-500/70">
              <path fill="currentColor" d="M2 19h20v2H2v-2zm3-3h14v-2H5v-2zm7-9l-4 4H5V5l5 2 2-5 2 5 5-2v4h-3l-4-4z" />
            </svg>
          </div>
        </div>
      );
    }
    if (normalizedVal === "JK" || normalizedVal === "JOKER") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-12 h-12 text-purple-600/70">
            <path fill="currentColor" d="M12 2c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L3.35 19.3c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l2.69-2.69C9.03 18.78 10.47 19 12 19c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" />
          </svg>
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-1">JOKER</span>
        </div>
      );
    }

    // Grid Layouts for Numeric Cards (2 to 10)
    const num = parseInt(normalizedVal);
    if (!isNaN(num) && num >= 2 && num <= 10) {
      const positions: { top: string; left: string; rotate?: boolean }[] = [];
      if (num === 2) {
        positions.push({ top: "20%", left: "50%" }, { top: "80%", left: "50%", rotate: true });
      } else if (num === 3) {
        positions.push({ top: "20%", left: "50%" }, { top: "50%", left: "50%" }, { top: "80%", left: "50%", rotate: true });
      } else if (num === 4) {
        positions.push(
          { top: "25%", left: "30%" }, { top: "25%", left: "70%" },
          { top: "75%", left: "30%", rotate: true }, { top: "75%", left: "70%", rotate: true }
        );
      } else if (num === 5) {
        positions.push(
          { top: "25%", left: "30%" }, { top: "25%", left: "70%" },
          { top: "50%", left: "50%" },
          { top: "75%", left: "30%", rotate: true }, { top: "75%", left: "70%", rotate: true }
        );
      } else if (num === 6) {
        positions.push(
          { top: "25%", left: "30%" }, { top: "25%", left: "70%" },
          { top: "50%", left: "30%" }, { top: "50%", left: "70%" },
          { top: "75%", left: "30%", rotate: true }, { top: "75%", left: "70%", rotate: true }
        );
      } else if (num === 7) {
        positions.push(
          { top: "25%", left: "30%" }, { top: "25%", left: "70%" },
          { top: "37.5%", left: "50%" },
          { top: "50%", left: "30%" }, { top: "50%", left: "70%" },
          { top: "75%", left: "30%", rotate: true }, { top: "75%", left: "70%", rotate: true }
        );
      } else if (num === 8) {
        positions.push(
          { top: "25%", left: "30%" }, { top: "25%", left: "70%" },
          { top: "37.5%", left: "50%" },
          { top: "50%", left: "30%" }, { top: "50%", left: "70%" },
          { top: "62.5%", left: "50%", rotate: true },
          { top: "75%", left: "30%", rotate: true }, { top: "75%", left: "70%", rotate: true }
        );
      } else if (num === 9) {
        positions.push(
          { top: "20%", left: "30%" }, { top: "20%", left: "70%" },
          { top: "40%", left: "30%" }, { top: "40%", left: "70%" },
          { top: "50%", left: "50%" },
          { top: "60%", left: "30%", rotate: true }, { top: "60%", left: "70%", rotate: true },
          { top: "80%", left: "30%", rotate: true }, { top: "80%", left: "70%", rotate: true }
        );
      } else if (num === 10) {
        positions.push(
          { top: "20%", left: "30%" }, { top: "20%", left: "70%" },
          { top: "32.5%", left: "50%" },
          { top: "45%", left: "30%" }, { top: "45%", left: "70%" },
          { top: "55%", left: "30%", rotate: true }, { top: "55%", left: "70%", rotate: true },
          { top: "67.5%", left: "50%", rotate: true },
          { top: "80%", left: "30%", rotate: true }, { top: "80%", left: "70%", rotate: true }
        );
      }

      return (
        <div className="absolute inset-x-4 inset-y-6 pointer-events-none">
          {positions.map((pos, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `translate(-50%, -50%) ${pos.rotate ? "rotate(180deg)" : ""}`
              }}
            >
              <SuitIcon type={type} className={cn("w-3 h-3.5", colorClass)} />
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (faceDown) {
    return getCardBack();
  }

  return (
    <div
      className={cn(
        "w-20 h-28 sm:w-24 sm:h-36 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-amber-50/20 border border-slate-200/90 shadow-[0_10px_20px_rgba(0,0,0,0.55),_0_2px_4px_rgba(0,0,0,0.15)] flex flex-col justify-between p-2 relative font-serif select-none overflow-hidden",
        className
      )}
    >
      {/* Linen Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:3px_3px] pointer-events-none" />
      
      {/* Inner Decorative Frame */}
      <div className={cn("absolute inset-1 rounded-xl border border-dashed pointer-events-none", isRed ? "border-red-500/10" : "border-slate-800/10")} />

      {/* Top Left Indicator */}
      <div className="flex flex-col items-center leading-none z-10">
        <span className={cn("font-black text-sm sm:text-base tracking-tighter", colorClass)}>{normalizedVal}</span>
        <SuitIcon type={type} className={cn("w-3 h-3 mt-0.5", colorClass)} />
      </div>

      {/* Central Illustration Area */}
      {renderCenterArtwork()}

      {/* Bottom Right Indicator */}
      <div className="flex flex-col items-center leading-none self-end rotate-180 z-10">
        <span className={cn("font-black text-sm sm:text-base tracking-tighter", colorClass)}>{normalizedVal}</span>
        <SuitIcon type={type} className={cn("w-3 h-3 mt-0.5", colorClass)} />
      </div>
    </div>
  );
}
