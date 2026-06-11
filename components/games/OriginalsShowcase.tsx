"use client";
import { useState } from "react";
import { Dice } from "@/components/games/Dice";
import { Limbo } from "@/components/games/Limbo";
import { Crash } from "@/components/games/Crash";
import { Mines } from "@/components/games/Mines";
import { MissionUncrossable } from "@/components/games/MissionUncrossable";
import { Keno } from "@/components/games/Keno";
import { Blackjack } from "@/components/games/Blackjack";
import { Coinflip } from "@/components/games/Coinflip";
import { Wheel } from "@/components/games/Wheel";
import { Roulette } from "@/components/games/Roulette";
import { Plinko } from "@/components/games/Plinko";
import { Gamepad2 } from "lucide-react";

type GameId = "dice" | "limbo" | "crash" | "mines" | "mission" | "keno" | "blackjack" | "coinflip" | "wheel" | "roulette" | "plinko";

export function OriginalsShowcase() {
  const [activeGame, setActiveGame] = useState<GameId>("dice");

  const renderGame = () => {
    switch (activeGame) {
      case "dice": return <Dice />;
      case "limbo": return <Limbo />;
      case "crash": return <Crash />;
      case "mines": return <Mines />;
      case "mission": return <MissionUncrossable />;
      case "keno": return <Keno />;
      case "blackjack": return <Blackjack />;
      case "coinflip": return <Coinflip />;
      case "wheel": return <Wheel />;
      case "roulette": return <Roulette />;
      case "plinko": return <Plinko />;
      default: return <Dice />;
    }
  };

  const games: { id: GameId; name: string }[] = [
    { id: "dice", name: "Dice" },
    { id: "limbo", name: "Limbo" },
    { id: "crash", name: "Crash" },
    { id: "mines", name: "Mines" },
    { id: "mission", name: "Tower" },
    { id: "keno", name: "Keno" },
    { id: "blackjack", name: "Blackjack" },
    { id: "coinflip", name: "Coinflip" },
    { id: "wheel", name: "Wheel" },
    { id: "roulette", name: "Roulette" },
    { id: "plinko", name: "Plinko" },
  ];

  return (
    <div className="flex flex-col w-full text-slate-800 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Gamepad2 className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
            <span className="w-2 h-10 bg-neon-purple rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"></span>
            AuraPlay Originals
          </h1>
          <p className="text-slate-600 max-w-2xl text-lg">
            Experience our exclusive, provably fair in-house games. Fully playable mathematical simulations demonstrating our industry-leading house edge.
          </p>
        </div>
      </div>

      {/* Game Selector */}
      <div className="flex flex-wrap gap-2">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
              activeGame === game.id 
                ? "bg-slate-700 text-slate-900 shadow-lg" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>

      {/* Active Game Container */}
      <div className="w-full">
        {renderGame()}
      </div>

    </div>
  );
}
