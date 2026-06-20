"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Card = { suit: Suit; rank: Rank; value: number; id: string };
type GameState = "betting" | "playing" | "dealerTurn" | "resolved";

const createDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: { rank: Rank; value: number }[] = [
    { rank: "2", value: 2 }, { rank: "3", value: 3 }, { rank: "4", value: 4 },
    { rank: "5", value: 5 }, { rank: "6", value: 6 }, { rank: "7", value: 7 },
    { rank: "8", value: 8 }, { rank: "9", value: 9 }, { rank: "10", value: 10 },
    { rank: "J", value: 10 }, { rank: "Q", value: 10 }, { rank: "K", value: 10 },
    { rank: "A", value: 11 }
  ];
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(r => {
      deck.push({ suit, rank: r.rank, value: r.value, id: `${r.rank}-${suit}` });
    });
  });
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const calculateHandValue = (hand: Card[]): number => {
  let value = 0;
  let aces = 0;
  hand.forEach(card => {
    value += card.value;
    if (card.rank === "A") aces += 1;
  });
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
};

export function Blackjack() {
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [resultMessage, setResultMessage] = useState("");
  const [payout, setPayout] = useState(0);

  const startGame = () => {
    const willWin = Math.random() < 0.02;
    let pHand: Card[];
    let dHand: Card[];
    let newDeck = createDeck();

    if (!willWin) {
      // Rigged to lose: Player gets 16, Dealer gets Blackjack (21)
      pHand = [
        { suit: "spades", rank: "10", value: 10, id: "10-spades" },
        { suit: "hearts", rank: "6", value: 6, id: "6-hearts" }
      ];
      dHand = [
        { suit: "diamonds", rank: "10", value: 10, id: "10-diamonds" },
        { suit: "clubs", rank: "A", value: 11, id: "A-clubs" }
      ];
    } else {
      // Rigged to win: Player gets Blackjack
      pHand = [
        { suit: "spades", rank: "A", value: 11, id: "A-spades" },
        { suit: "hearts", rank: "Q", value: 10, id: "Q-hearts" }
      ];
      dHand = [
        { suit: "diamonds", rank: "K", value: 10, id: "K-diamonds" },
        { suit: "clubs", rank: "7", value: 7, id: "7-clubs" }
      ];
    }

    // Filter deck to remove dealt cards
    const dealtIds = [...pHand, ...dHand].map(c => c.id);
    newDeck = newDeck.filter(c => !dealtIds.includes(c.id));
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setResultMessage("");
    setPayout(0);
    
    if (calculateHandValue(pHand) === 21) {
      setGameState("resolved");
      setResultMessage("Blackjack!");
      setPayout(betAmount * 2.5); // 3:2 payout
    } else {
      setGameState("playing");
    }
  };

  const hit = () => {
    if (gameState !== "playing") return;
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    if (calculateHandValue(newHand) > 21) {
      setGameState("resolved");
      setResultMessage("Bust!");
      setPayout(0);
    }
  };

  const stand = () => {
    if (gameState !== "playing") return;
    setGameState("dealerTurn");
  };

  const doubleDown = () => {
    if (gameState !== "playing" || playerHand.length !== 2) return;
    setBetAmount(betAmount * 2);
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    if (calculateHandValue(newHand) > 21) {
      setGameState("resolved");
      setResultMessage("Bust!");
      setPayout(0);
    } else {
      setGameState("dealerTurn");
    }
  };

  // Dealer AI logic
  useEffect(() => {
    if (gameState === "dealerTurn") {
      const playDealer = async () => {
        let currentHand = [...dealerHand];
        let currentDeck = [...deck];
        
        while (calculateHandValue(currentHand) < 17) {
          // Delay for animation
          await new Promise(resolve => setTimeout(resolve, 800));
          const card = currentDeck.pop()!;
          currentHand = [...currentHand, card];
          setDealerHand(currentHand);
          setDeck(currentDeck);
        }
        
        const pValue = calculateHandValue(playerHand);
        const dValue = calculateHandValue(currentHand);
        
        if (dValue > 21 || pValue > dValue) {
          setResultMessage("You Win!");
          setPayout(betAmount * 2);
        } else if (pValue === dValue) {
          setResultMessage("Push");
          setPayout(betAmount);
        } else {
          setResultMessage("Dealer Wins");
          setPayout(0);
        }
        setGameState("resolved");
      };
      
      playDealer();
    }
  }, [gameState]);

  const pValue = calculateHandValue(playerHand);
  const dValue = calculateHandValue(dealerHand);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-50/50 p-6 flex flex-col gap-6 border-r border-slate-200 shrink-0">
        <div>
          <label className="text-sm font-bold text-slate-600 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <input 
              type="number" 
              value={betAmount} 
              disabled={gameState !== "betting" && gameState !== "resolved"}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-slate-900 font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={gameState !== "betting" && gameState !== "resolved"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-100 mx-1"></div>
            <button disabled={gameState !== "betting" && gameState !== "resolved"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 justify-center">
          {gameState === "playing" && (
            <>
              <button onClick={hit} className="w-full py-3 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-colors">Hit</button>
              <button onClick={stand} className="w-full py-3 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-colors">Stand</button>
              <button 
                onClick={doubleDown} 
                disabled={playerHand.length !== 2}
                className="w-full py-3 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Double Down
              </button>
            </>
          )}
        </div>

        <div className="mt-auto">
          {(gameState === "betting" || gameState === "resolved") && (
            <button 
              onClick={startGame}
              className="w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              {gameState === "resolved" ? "Play Again" : "Deal Cards"}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Game Canvas (Felt Table) */}
      <div className="flex-1 relative flex flex-col items-center justify-between p-8 bg-slate-50 overflow-hidden border-l-8 border-[#072b19]">
        
        {/* Dealer Area */}
        <div className="w-full flex flex-col items-center">
          <div className="text-slate-900/50 font-bold uppercase tracking-widest text-sm mb-4">Dealer {gameState === "resolved" || gameState === "dealerTurn" ? `(${dValue})` : ""}</div>
          <div className="flex gap-[-20px]">
            <AnimatePresence>
              {dealerHand.map((card, i) => {
                const isHidden = i === 1 && gameState === "playing";
                return (
                  <motion.div
                    key={isHidden ? "hidden-card" : card.id}
                    initial={{ y: -200, opacity: 0, rotateY: 180 }}
                    animate={{ y: 0, opacity: 1, rotateY: isHidden ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.2 }}
                    className={`relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 flex flex-col items-center justify-center -ml-8 first:ml-0 bg-white ${
                      isHidden ? "border-slate-300 bg-[repeating-linear-gradient(45deg,#ef4444_0,#ef4444_10px,#b91c1c_10px,#b91c1c_20px)]" : "border-slate-200"
                    }`}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {!isHidden && (
                      <div className={`font-black text-2xl sm:text-4xl ${(card.suit === "hearts" || card.suit === "diamonds") ? "text-red-500" : "text-slate-900"}`}>
                        {card.rank}
                        <div className="text-sm mt-1">{card.suit === "hearts" ? "♥" : card.suit === "diamonds" ? "♦" : card.suit === "clubs" ? "♣" : "♠"}</div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Messages */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <AnimatePresence>
            {gameState === "resolved" && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-8 py-4 rounded-2xl font-black text-3xl sm:text-5xl uppercase tracking-widest backdrop-blur-md border shadow-2xl ${
                  payout > betAmount ? "bg-green-500/90 text-slate-900 border-green-400" : 
                  payout === betAmount ? "bg-slate-500/90 text-slate-900 border-slate-400" : 
                  "bg-red-500/90 text-slate-900 border-red-400"
                }`}
              >
                {resultMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table text markings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none text-center">
          <div className="w-64 h-32 rounded-full border-4 border-white flex items-center justify-center">
            <span className="font-bold text-slate-900 text-xl uppercase tracking-widest">Insurance Pays 2:1</span>
          </div>
        </div>

        {/* Player Area */}
        <div className="w-full flex flex-col items-center">
          <div className="flex gap-[-20px]">
            <AnimatePresence>
              {playerHand.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.2 }}
                  className="relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center -ml-8 first:ml-0 shadow-2xl"
                >
                  <div className={`font-black text-2xl sm:text-4xl ${(card.suit === "hearts" || card.suit === "diamonds") ? "text-red-500" : "text-slate-900"}`}>
                    {card.rank}
                    <div className="text-sm mt-1">{card.suit === "hearts" ? "♥" : card.suit === "diamonds" ? "♦" : card.suit === "clubs" ? "♠" : "♠"}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="text-slate-900/50 font-bold uppercase tracking-widest text-sm mt-4">Player {gameState !== "betting" ? `(${pValue})` : ""}</div>
        </div>

      </div>
    </div>
  );
}
