"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { Volume2, VolumeX, Sparkles, RefreshCw, Hand, Plus, Zap, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";

interface BlackjackVIPEngineProps {
  isPlaying: boolean;
  onComplete: (multiplierOrWon: number | boolean, won?: boolean) => void;
  gameId?: string;
  gameTitle?: string;
}

interface Card {
  val: string;
  suit: string;
  color: string;
  score: number;
  faceDown?: boolean;
}

interface TableTheme {
  feltBg: string;
  feltPatternColor: string;
  radialGrad: string;
  goldBorderColor: string;
  cardBackBg: string;
  cardBackIconColor: string;
  shoeBg: string;
  glowColor: string;
  displayName: string;
  subName: string;
  particleColor: string;
  textColor: string;
  buttonClass: string;
  feltOverlayClass: string;
}

const THEMES: Record<string, TableTheme> = {
  lightning: {
    feltBg: "from-[#110d05] via-[#1a1409] to-[#090704]",
    feltPatternColor: "rgba(245, 158, 11, 0.08)",
    radialGrad: "bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.18),_transparent_75%)]",
    goldBorderColor: "border-amber-500/25",
    cardBackBg: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    cardBackIconColor: "text-amber-450 animate-pulse",
    shoeBg: "from-amber-600 via-amber-800 to-black border-amber-500/40",
    glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    displayName: "Lightning Blackjack 3D",
    subName: "GOLD MULTIPLIERS • ELECTRO VELVET FELT",
    particleColor: "from-amber-400 to-yellow-500",
    textColor: "text-amber-400",
    buttonClass: "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    feltOverlayClass: "border-amber-500/10"
  },
  classic: {
    feltBg: "from-[#0b2b1a] via-[#05170d] to-[#010503]",
    feltPatternColor: "rgba(16, 185, 129, 0.08)",
    radialGrad: "bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_75%)]",
    goldBorderColor: "border-emerald-600/30",
    cardBackBg: "bg-gradient-to-br from-red-600 via-red-800 to-red-950 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    cardBackIconColor: "text-red-400",
    shoeBg: "from-emerald-700 via-yellow-900 to-black border-emerald-600/40",
    glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    displayName: "Monte Carlo Classic",
    subName: "VIP CLUB RULES • DEEP EMERALD FELT",
    particleColor: "from-emerald-400 to-green-500",
    textColor: "text-emerald-400",
    buttonClass: "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    feltOverlayClass: "border-emerald-500/10"
  },
  cyberpunk: {
    feltBg: "from-[#240c0c] via-[#1a0808] to-[#0a0303]",
    feltPatternColor: "rgba(239, 68, 68, 0.08)",
    radialGrad: "bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.18),_transparent_75%)]",
    goldBorderColor: "border-red-500/25",
    cardBackBg: "bg-gradient-to-br from-red-500 via-rose-600 to-rose-950 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    cardBackIconColor: "text-red-500 animate-pulse",
    shoeBg: "from-red-600 via-rose-800 to-black border-red-500/40",
    glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
    displayName: "Neo-Tokyo Blackjack",
    subName: "SYNTHETIC WAGERS • CRIMSON HOLO FELT",
    particleColor: "from-red-400 to-rose-500",
    textColor: "text-red-550",
    buttonClass: "border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    feltOverlayClass: "border-red-500/10"
  },
  platinum: {
    feltBg: "from-[#0c1524] via-[#0b101c] to-[#04060b]",
    feltPatternColor: "rgba(255, 255, 255, 0.06)",
    radialGrad: "bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.12),_transparent_75%)]",
    goldBorderColor: "border-blue-500/20",
    cardBackBg: "bg-gradient-to-br from-blue-600 via-blue-800 to-blue-950 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]",
    cardBackIconColor: "text-blue-400 animate-pulse",
    shoeBg: "from-slate-600 via-slate-800 to-black border-slate-500/40",
    glowColor: "shadow-[0_0_20px_rgba(37,99,235,0.25)]",
    displayName: "VIP Blackjack Elite",
    subName: "BLACKJACK PAYS 3 TO 2 • INSURANCE PAYS 2 TO 1",
    particleColor: "from-blue-400 to-indigo-500",
    textColor: "text-amber-400",
    buttonClass: "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    feltOverlayClass: "border-amber-500/10"
  }
};

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = [
  { val: "A", score: 11 },
  { val: "2", score: 2 },
  { val: "3", score: 3 },
  { val: "4", score: 4 },
  { val: "5", score: 5 },
  { val: "6", score: 6 },
  { val: "7", score: 7 },
  { val: "8", score: 8 },
  { val: "9", score: 9 },
  { val: "10", score: 10 },
  { val: "J", score: 10 },
  { val: "Q", score: 10 },
  { val: "K", score: 10 },
];

export function BlackjackVIPEngine({ isPlaying, onComplete, gameId, gameTitle }: BlackjackVIPEngineProps) {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<"betting" | "dealing" | "player-turn" | "dealer-turn" | "resolved">("betting");
  const [resultMsg, setResultMsg] = useState("");
  const [betCountdown, setBetCountdown] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  
  // Side Bet Options
  const [sideBets, setSideBets] = useState({
    pairs: false,  // Perfect Pairs (25:1)
    three: false,  // 21+3 Side Bet (100:1)
  });

  // Track the predetermined outcome and active bets
  const isWinRef = useRef<boolean>(false);
  const sideBetsRef = useRef(sideBets);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    sideBetsRef.current = sideBets;
  }, [sideBets]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const getTheme = () => {
    const title = (gameTitle || "").toLowerCase();
    const id = (gameId || "").toLowerCase();
    if (title.includes("lightning") || id.includes("light")) return THEMES.lightning;
    if (title.includes("classic") || title.includes("monte") || id.includes("classic")) return THEMES.classic;
    if (title.includes("cyber") || title.includes("neo") || title.includes("tokyo") || id.includes("cyber")) return THEMES.cyberpunk;
    return THEMES.platinum; // default
  };
  const theme = getTheme();
  const getThemeBackKey = (): "gold" | "dark" | "red" | "blue" => {
    const title = (gameTitle || "").toLowerCase();
    const id = (gameId || "").toLowerCase();
    if (title.includes("lightning") || id.includes("light")) return "gold";
    if (title.includes("classic") || title.includes("monte") || id.includes("classic")) return "dark";
    if (title.includes("cyber") || title.includes("neo") || title.includes("tokyo") || id.includes("cyber")) return "red";
    return "blue";
  };
  const themeBackKey = getThemeBackKey();

  // Audio utility
  const playSound = (type: "deal" | "flip" | "win" | "lose" | "chip") => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "deal") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === "flip") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(420, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === "win") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.55);
      } else if (type === "lose") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === "chip") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      }
    } catch (e) {
      console.warn("Audio Context blocked or failed to initialize", e);
    }
  };

  // Sparkles/Gold particles engine
  const triggerGoldExplosion = () => {
    playSound("win");
    const newParticles = Array.from({ length: 48 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 100 - 50,
      color: Math.random() > 0.5 ? "from-yellow-400 to-amber-500" : "from-amber-300 to-yellow-500",
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1800);
  };

  // Idle countdown loop
  useEffect(() => {
    if (isPlaying) return;
    const timer = setInterval(() => {
      setBetCountdown(prev => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Dynamic helper to resolve initial values
  const getRandomCard = (forceVal?: string): Card => {
    const targetValObj = forceVal 
      ? VALUES.find(v => v.val === forceVal) || VALUES[Math.floor(Math.random() * VALUES.length)]
      : VALUES[Math.floor(Math.random() * VALUES.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const isRed = ["♥", "♦"].includes(suit);
    return {
      val: targetValObj.val,
      suit,
      color: isRed ? "text-rose-500" : "text-slate-200",
      score: targetValObj.score
    };
  };

  // Run the round when parent flags isPlaying = true
  useEffect(() => {
    if (!isPlaying) {
      setPlayerHand([]);
      setDealerHand([]);
      setPhase("betting");
      setResultMsg("");
      return;
    }

    // Determine math outcome early
    const outcome = calculateGameOutcome("TABLE");
    isWinRef.current = outcome.isWin;

    // Start Deal sequence
    setPhase("dealing");
    
    // Initial Hand Generation
    let pCard1: Card;
    let pCard2: Card;
    let dCard1: Card;
    let dCard2: Card;

    const currentSideBets = sideBetsRef.current;

    // 1. Check for Perfect Pairs side-bet hit (15% odds)
    if (currentSideBets.pairs && Math.random() < 0.15) {
      const matchValObj = VALUES[Math.floor(Math.random() * VALUES.length)];
      const suit1 = SUITS[Math.floor(Math.random() * SUITS.length)];
      const sameSuit = Math.random() < 0.5;
      const suit2 = sameSuit ? suit1 : SUITS.filter(s => s !== suit1)[Math.floor(Math.random() * 3)];
      
      pCard1 = { val: matchValObj.val, suit: suit1, color: ["♥", "♦"].includes(suit1) ? "text-rose-500" : "text-slate-200", score: matchValObj.score };
      pCard2 = { val: matchValObj.val, suit: suit2, color: ["♥", "♦"].includes(suit2) ? "text-rose-500" : "text-slate-200", score: matchValObj.score };
    } else {
      pCard1 = getRandomCard();
      pCard2 = getRandomCard();
      // Ensure player initial is not a pair if side-bet active but did not hit
      if (pCard1.val === pCard2.val && currentSideBets.pairs) {
        pCard2 = getRandomCard(VALUES.filter(v => v.val !== pCard1.val)[Math.floor(Math.random() * 12)].val);
      }
    }

    // 2. Check for 21+3 side-bet hit (15% odds)
    if (currentSideBets.three && Math.random() < 0.15) {
      // Force Flush or Straight combo
      const matchSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
      const isRed = ["♥", "♦"].includes(matchSuit);
      const c1 = VALUES[4]; // 5
      const c2 = VALUES[5]; // 6
      const c3 = VALUES[6]; // 7
      pCard1 = { val: c1.val, suit: matchSuit, color: isRed ? "text-rose-500" : "text-slate-200", score: c1.score };
      pCard2 = { val: c2.val, suit: matchSuit, color: isRed ? "text-rose-500" : "text-slate-200", score: c2.score };
      dCard1 = { val: c3.val, suit: matchSuit, color: isRed ? "text-rose-500" : "text-slate-200", score: c3.score };
    } else {
      dCard1 = getRandomCard();
    }

    // Generate remaining dealer starting hands
    if (isWinRef.current) {
      // Player natural BJ or strong hand
      const roll = Math.random();
      if (roll < 0.35) {
        // Natural Blackjack
        pCard1 = getRandomCard("A");
        pCard2 = getRandomCard("10");
        dCard1 = getRandomCard("9");
        dCard2 = getRandomCard("9");
      } else {
        pCard1 = getRandomCard("10");
        pCard2 = getRandomCard("9");
        dCard1 = getRandomCard("8");
        dCard2 = getRandomCard("9");
      }
    } else {
      // Player stiff hand, dealer strong
      pCard1 = getRandomCard("10");
      pCard2 = getRandomCard("6");
      dCard1 = getRandomCard("9");
      dCard2 = getRandomCard("10");
    }

    dCard2.faceDown = true;

    // Distribute cards with physical feel pauses
    setTimeout(() => {
      setPlayerHand([pCard1]);
      playSound("deal");
    }, 300);

    setTimeout(() => {
      setDealerHand([dCard1]);
      playSound("deal");
    }, 700);

    setTimeout(() => {
      setPlayerHand([pCard1, pCard2]);
      playSound("deal");
    }, 1100);

    setTimeout(() => {
      setDealerHand([dCard1, dCard2]);
      playSound("deal");

      // Dealing phase completed
      setTimeout(() => {
        const pScore = getBlackjackScore([pCard1, pCard2]);
        if (pScore === 21) {
          // Natural Blackjack!
          setPhase("dealer-turn");
          revealHoleCardAndPlay(pCard1, pCard2);
        } else {
          setPhase("player-turn");
        }
      }, 600);
    }, 1500);

  }, [isPlaying]);

  const getBlackjackScore = (hand: Card[]) => {
    let sum = hand.reduce((acc, c) => {
      if (c.faceDown) return acc;
      return acc + c.score;
    }, 0);
    
    let aceCount = hand.filter(c => !c.faceDown && c.val === "A").length;
    while (sum > 21 && aceCount > 0) {
      sum -= 10;
      aceCount--;
    }
    return sum;
  };

  // Player Hits
  const handleHit = () => {
    if (phase !== "player-turn") return;
    playSound("deal");

    // Adaptive card drawing based on win status
    let nextCard: Card;
    const currentScore = getBlackjackScore(playerHand);

    if (isWinRef.current) {
      // Deal a small safe card that won't bust the player
      const maxAllowed = 21 - currentScore;
      if (maxAllowed >= 2) {
        const safeValues = VALUES.filter(v => v.score <= maxAllowed);
        const randValObj = safeValues.length > 0 ? safeValues[Math.floor(Math.random() * safeValues.length)] : VALUES[VALUES.length - 1];
        nextCard = getRandomCard(randValObj.val);
      } else {
        nextCard = getRandomCard("A");
      }
    } else {
      // Deal a card that busts the player
      const bustRequired = 22 - currentScore;
      const bustValues = VALUES.filter(v => v.score >= bustRequired);
      const randValObj = bustValues.length > 0 ? bustValues[Math.floor(Math.random() * bustValues.length)] : VALUES[0];
      nextCard = getRandomCard(randValObj.val);
    }

    const updatedHand = [...playerHand, nextCard];
    setPlayerHand(updatedHand);

    const newScore = getBlackjackScore(updatedHand);
    if (newScore > 21) {
      setPhase("resolved");
      resolveOutcome(updatedHand, dealerHand);
    } else if (newScore === 21) {
      setPhase("dealer-turn");
      revealHoleCardAndPlay(updatedHand[0], updatedHand[1], updatedHand);
    }
  };

  // Player Stands
  const handleStand = () => {
    if (phase !== "player-turn") return;
    setPhase("dealer-turn");
    revealHoleCardAndPlay(playerHand[0], playerHand[1], playerHand);
  };

  // Player Double Down
  const handleDoubleDown = () => {
    if (phase !== "player-turn") return;
    playSound("deal");

    // Draw exactly one card
    let nextCard: Card;
    const currentScore = getBlackjackScore(playerHand);

    if (isWinRef.current) {
      const maxAllowed = 21 - currentScore;
      const safeValues = VALUES.filter(v => v.score <= maxAllowed);
      const randValObj = safeValues.length > 0 ? safeValues[Math.floor(Math.random() * safeValues.length)] : VALUES[12];
      nextCard = getRandomCard(randValObj.val);
    } else {
      const bustRequired = 22 - currentScore;
      const bustValues = VALUES.filter(v => v.score >= bustRequired);
      const randValObj = bustValues.length > 0 ? bustValues[Math.floor(Math.random() * bustValues.length)] : VALUES[0];
      nextCard = getRandomCard(randValObj.val);
    }

    const updatedHand = [...playerHand, nextCard];
    setPlayerHand(updatedHand);

    setTimeout(() => {
      setPhase("dealer-turn");
      revealHoleCardAndPlay(updatedHand[0], updatedHand[1], updatedHand);
    }, 600);
  };

  // Dealer plays their turn
  const revealHoleCardAndPlay = (pCard1: Card, pCard2: Card, finalPlayerHand?: Card[]) => {
    playSound("flip");
    
    // Reveal dealer face down card
    setDealerHand(prev => {
      const revealed: Card[] = prev.map(c => ({ ...c, faceDown: false }));
      const pHand = finalPlayerHand || [pCard1, pCard2];
      
      // Run dealer drawing loop dynamically
      setTimeout(() => {
        let currentDealerHand = [...revealed];
        const pScore = getBlackjackScore(pHand);

        const drawLoop = () => {
          const dScore = getBlackjackScore(currentDealerHand);
          
          // Dealer stands on soft 17 or higher
          if (dScore >= 17) {
            setPhase("resolved");
            resolveOutcome(pHand, currentDealerHand);
            return;
          }

          // Generate next dealer card dynamically
          let nextDCard: Card;
          if (isWinRef.current) {
            // Force dealer bust, or make dealer stand lower than player
            if (dScore + 10 > 21) {
              nextDCard = getRandomCard("10"); // Bust dealer!
            } else {
              nextDCard = getRandomCard();
            }
          } else {
            // Draw a card to beat the player
            const targetScore = pScore + 1;
            const needed = targetScore - dScore;
            if (needed <= 11) {
              const matchingValue = VALUES.find(v => v.score === needed);
              nextDCard = getRandomCard(matchingValue?.val || "10");
            } else {
              nextDCard = getRandomCard("10");
            }
          }

          currentDealerHand.push(nextDCard);
          setDealerHand([...currentDealerHand]);
          playSound("deal");

          setTimeout(drawLoop, 700);
        };

        drawLoop();
      }, 700);

      return revealed;
    });
  };

  // Resolve wagers and calculate payout multiplier
  const resolveOutcome = (pHand: Card[], dHand: Card[]) => {
    const pScore = getBlackjackScore(pHand);
    const dScore = getBlackjackScore(dHand);
    const currentSideBets = sideBetsRef.current;

    let mainResult = "lose"; // lose | win | push | blackjack
    let sideBetsPayout = 0;

    // Check Main Blackjack Outcome
    if (pScore > 21) {
      mainResult = "lose";
    } else if (dScore > 21) {
      mainResult = pScore === 21 && pHand.length === 2 ? "blackjack" : "win";
    } else if (pScore > dScore) {
      mainResult = pScore === 21 && pHand.length === 2 ? "blackjack" : "win";
    } else if (pScore === dScore) {
      mainResult = "push";
    } else {
      mainResult = "lose";
    }

    // Check Side-Bet Outcomes
    // 1. Perfect Pairs (25:1, 12:1, 6:1)
    if (currentSideBets.pairs && pHand.length >= 2) {
      const c1 = pHand[0];
      const c2 = pHand[1];
      if (c1.val === c2.val) {
        if (c1.suit === c2.suit) {
          sideBetsPayout += 25; // Perfect Pair
        } else if (
          (["♠", "♣"].includes(c1.suit) && ["♠", "♣"].includes(c2.suit)) ||
          (["♥", "♦"].includes(c1.suit) && ["♥", "♦"].includes(c2.suit))
        ) {
          sideBetsPayout += 12; // Colored Pair
        } else {
          sideBetsPayout += 6; // Mixed Pair
        }
      }
    }

    // 2. 21+3 Side Bet (100:1, 40:1, 30:1, 10:1, 5:1)
    if (currentSideBets.three && pHand.length >= 2 && dHand.length >= 1) {
      const cards = [pHand[0], pHand[1], dHand[0]];
      const isFlush = cards.every(c => c.suit === cards[0].suit);
      
      const valuesSorted = cards.map(c => VALUES.findIndex(v => v.val === c.val)).sort((a, b) => a - b);
      const isStraight = valuesSorted[2] - valuesSorted[1] === 1 && valuesSorted[1] - valuesSorted[0] === 1;
      
      const isThreeOfAKind = cards[0].val === cards[1].val && cards[1].val === cards[2].val;

      if (isThreeOfAKind && isFlush) {
        sideBetsPayout += 100; // Suited Triple
      } else if (isStraight && isFlush) {
        sideBetsPayout += 40; // Straight Flush
      } else if (isThreeOfAKind) {
        sideBetsPayout += 30; // Three of a Kind
      } else if (isStraight) {
        sideBetsPayout += 10; // Straight
      } else if (isFlush) {
        sideBetsPayout += 5; // Flush
      }
    }

    // Calculate final payout proportions
    // Let's assume Main Bet represents 70% of total wager, and side bets represent 15% each if active
    let mainWagerProp = 1.0;
    let pairsWagerProp = 0;
    let threeWagerProp = 0;

    if (currentSideBets.pairs && currentSideBets.three) {
      mainWagerProp = 0.70;
      pairsWagerProp = 0.15;
      threeWagerProp = 0.15;
    } else if (currentSideBets.pairs) {
      mainWagerProp = 0.85;
      pairsWagerProp = 0.15;
    } else if (currentSideBets.three) {
      mainWagerProp = 0.85;
      threeWagerProp = 0.15;
    }

    // Resolve Main Multipliers
    let mainMultiplier = 0;
    if (mainResult === "win") mainMultiplier = 2.0;
    else if (mainResult === "blackjack") mainMultiplier = 2.5; // 3 to 2
    else if (mainResult === "push") mainMultiplier = 1.0; // Return main bet portion

    // Calculate overall round multiplier returned to parent store
    const totalMultiplier = (mainWagerProp * mainMultiplier) + 
                            (pairsWagerProp * (sideBetsPayout > 0 ? sideBetsPayout + 1 : 0)) + 
                            (threeWagerProp * (sideBetsPayout > 0 ? sideBetsPayout + 1 : 0));

    // Display appropriate screen message
    let finalMsg = "";
    if (mainResult === "blackjack") {
      finalMsg = "Blackjack! 🏆";
      triggerGoldExplosion();
    } else if (mainResult === "win") {
      finalMsg = "Player Wins!";
      triggerGoldExplosion();
    } else if (mainResult === "push") {
      finalMsg = "Push (Refund)";
      playSound("deal");
    } else {
      finalMsg = "Dealer Wins";
      playSound("lose");
    }

    if (sideBetsPayout > 0) {
      finalMsg += ` (+Side Bet Win!)`;
    }

    setResultMsg(finalMsg);

    setTimeout(() => {
      // Completed, return payout to parent store
      const won = totalMultiplier > 0;
      onCompleteRef.current(totalMultiplier, won);
    }, 1800);
  };

  const playerScore = getBlackjackScore(playerHand);
  const dealerScore = getBlackjackScore(dealerHand);
  return (
    <div className={cn("w-full h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br rounded-3xl border border-white/10 shadow-2xl relative flex flex-col items-center justify-between p-2.5 sm:p-4 overflow-hidden select-none", theme.feltBg)}>
      
      {/* Premium casino table felt background texture */}
      <div 
        className="absolute inset-0 z-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(${theme.feltPatternColor} 1.5px, transparent 0),
            radial-gradient(${theme.feltPatternColor} 1.5px, transparent 0)
          `,
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px"
        }}
      />
      <div className={cn("absolute inset-0 pointer-events-none", theme.radialGrad)} />

      {/* Table border arcs */}
      <div className={cn("absolute inset-2 sm:inset-4 rounded-[2rem] border-[1.5px] pointer-events-none z-10", theme.feltOverlayClass)} />

      {/* Live HUD Header */}
      <div className="relative z-20 w-full flex justify-between items-center bg-white/40 backdrop-blur-md px-3 py-1.5 sm:py-2 rounded-2xl border border-white/5 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-black text-slate-350 tracking-widest uppercase">{theme.displayName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-slate-400 hover:text-slate-900"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VIP Text banner (Hidden on mobile to maximize card and button space) */}
      <div className="text-center opacity-30 select-none my-1 sm:my-2 z-10 hidden sm:block">
        <h2 className={cn("font-serif font-black text-lg sm:text-2xl tracking-[0.3em] uppercase drop-shadow-md", theme.textColor)}>
          {theme.displayName}
        </h2>
        <span className="text-slate-400 text-[8px] sm:text-[9px] font-black tracking-[0.4em] block mt-0.5">
          {theme.subName}
        </span>
      </div>

      {/* Table Felt Areas & Card slots (Always side-by-side to save massive vertical space) */}
      <div className="relative z-10 w-full flex flex-row gap-4 sm:gap-6 md:gap-16 justify-center items-center flex-1 my-2 sm:my-4">
        
        {/* Dealer Section */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white/45 border border-white/5 px-2.5 py-0.5 rounded-full text-slate-300 font-black text-[9px] tracking-wider uppercase">
            <span>Dealer</span>
            {dealerHand.length > 0 && (
              <span className="text-amber-400 font-mono font-bold">({dealerScore})</span>
            )}
          </div>
          <div className="flex gap-[-20px] min-h-[90px] sm:min-h-[130px] justify-center items-center">
            {dealerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ x: 200, y: -200, opacity: 0, rotate: 45, scale: 0.6 }}
                animate={{ x: 0, y: 0, opacity: 1, rotate: card.faceDown ? 0 : idx === 0 ? -4 : 4, scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 13 }}
                style={{ marginLeft: idx > 0 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? "-18px" : "-24px") : "0px" }}
              >
                <PremiumCard
                  val={card.val}
                  suit={card.suit}
                  faceDown={card.faceDown}
                  themeBack={themeBackKey}
                  className="w-14 h-21 sm:w-20 sm:h-30"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Player Section */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-blue-400 font-black text-[9px] tracking-wider uppercase shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <span>Player</span>
            {playerHand.length > 0 && (
              <span className="text-yellow-400 font-mono font-bold">({playerScore})</span>
            )}
          </div>
          <div className="flex gap-[-20px] min-h-[90px] sm:min-h-[130px] justify-center items-center">
            {playerHand.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ x: 200, y: -200, opacity: 0, rotate: 45, scale: 0.6 }}
                animate={{ x: 0, y: 0, opacity: 1, rotate: idx === 0 ? -4 : 4, scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 13 }}
                style={{ marginLeft: idx > 0 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? "-18px" : "-24px") : "0px" }}
              >
                <PremiumCard
                  val={card.val}
                  suit={card.suit}
                  themeBack={themeBackKey}
                  className="w-14 h-21 sm:w-20 sm:h-30"
                />
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Gold Particles Explosion Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.4, x: 0, y: 100 }}
            animate={{ 
              opacity: 0, 
              scale: Math.random() * 0.8 + 0.5, 
              x: p.x, 
              y: p.y - 120, 
              rotate: Math.random() * 360 
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn("absolute left-1/2 top-1/2 w-3.5 h-3.5 rounded bg-gradient-to-br shadow-[0_0_10px_rgba(245,158,11,0.5)]", theme.particleColor)}
          />
        ))}
      </div>

      {/* Premium Betting felt slots (Only shown in betting/idle phase) */}
      <div className="relative z-20 w-full max-w-sm mx-auto flex justify-center items-center gap-4 sm:gap-6 my-1.5 sm:my-2">
        {/* Left: Perfect Pairs */}
        <div className="flex flex-col items-center gap-1">
          <button
            disabled={phase !== "betting"}
            onClick={() => {
              setSideBets(prev => ({ ...prev, pairs: !prev.pairs }));
              playSound("chip");
            }}
            className={cn(
              "w-11 h-11 sm:w-14 sm:h-14 rounded-full border-[1.5px] border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 relative shadow-inner select-none",
              sideBets.pairs 
                ? "border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105" 
                : "border-slate-700 bg-white/40 hover:border-amber-500/40"
            )}
          >
            {sideBets.pairs ? (
              <div className="flex flex-col items-center justify-center leading-none">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce" />
                <span className="text-[7px] sm:text-[7.5px] font-black text-amber-300 mt-0.5">25:1</span>
              </div>
            ) : (
              <span className="text-[7.5px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Pairs</span>
            )}
          </button>
          <span className="text-[7px] sm:text-[7.5px] font-black uppercase text-slate-500 tracking-wider">Perfect Pairs</span>
        </div>

        {/* Center: Main Hand */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-14 h-14 sm:w-18 sm:h-18 rounded-full border-2 flex items-center justify-center relative shadow-inner select-none",
              phase === "betting" 
                ? "border-amber-400 bg-amber-400/5 shadow-[0_0_20px_rgba(245,158,11,0.25)]" 
                : "border-blue-500/80 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            )}
          >
            <div className="flex flex-col items-center justify-center leading-none">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-pulse" />
              <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-350 mt-0.5 sm:mt-1 uppercase tracking-wider">Main Bet</span>
            </div>
          </div>
          <span className="text-[7.5px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest">Main Seat</span>
        </div>

        {/* Right: 21+3 */}
        <div className="flex flex-col items-center gap-1">
          <button
            disabled={phase !== "betting"}
            onClick={() => {
              setSideBets(prev => ({ ...prev, three: !prev.three }));
              playSound("chip");
            }}
            className={cn(
              "w-11 h-11 sm:w-14 sm:h-14 rounded-full border-[1.5px] border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 relative shadow-inner select-none",
              sideBets.three 
                ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105" 
                : "border-slate-700 bg-white/40 hover:border-emerald-500/40"
            )}
          >
            {sideBets.three ? (
              <div className="flex flex-col items-center justify-center leading-none">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-bounce" />
                <span className="text-[7px] sm:text-[7.5px] font-black text-emerald-300 mt-0.5">100:1</span>
              </div>
            ) : (
              <span className="text-[7.5px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">21+3</span>
            )}
          </button>
          <span className="text-[7px] sm:text-[7.5px] font-black uppercase text-slate-500 tracking-wider">21+3 Side</span>
        </div>
      </div>

      {/* Premium Dealer card shoe dispenser silhouette (Hidden on mobile to save space) */}
      <div className={cn("hidden sm:flex absolute top-4 right-6 w-16 h-12 bg-gradient-to-br rounded-lg border shadow-[0_10px_20px_rgba(0,0,0,0.8)] items-center justify-center z-15 pointer-events-none opacity-85 overflow-hidden", theme.shoeBg)}>
        <div className="w-full h-2 bg-white border-b border-white/10 transform rotate-12 translate-y-1" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/10" />
      </div>

      {/* Decision HUD & Controls */}
      <div className="relative z-30 w-full max-w-md bg-white/60 backdrop-blur-xl p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/5 shadow-2xl flex flex-col gap-2 sm:gap-3 items-center">
        
        {/* Status message */}
        <div className="text-center">
          {phase === "betting" && (
            <span className="text-[9px] sm:text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Place wagers and toggle side bets to begin
            </span>
          )}
          {phase === "dealing" && (
            <span className="text-[9px] sm:text-[9.5px] font-black text-amber-400 uppercase tracking-widest leading-none animate-pulse">
              Dealer dealing cards...
            </span>
          )}
          {phase === "player-turn" && (
            <span className="text-[9.5px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-wider leading-none">
              Your turn • Hit or Stand?
            </span>
          )}
          {phase === "dealer-turn" && (
            <span className="text-[9.5px] sm:text-[10px] font-black text-yellow-400 uppercase tracking-wider leading-none animate-pulse">
              Dealer's turn...
            </span>
          )}
          {phase === "resolved" && resultMsg && (
            <span className={cn(
              "text-base sm:text-lg font-black uppercase tracking-widest drop-shadow",
              resultMsg.includes("Wins") || resultMsg.includes("Blackjack") ? "text-amber-400" :
              resultMsg.includes("Push") ? "text-slate-350" : "text-rose-500"
            )}>
              {resultMsg}
            </span>
          )}
        </div>

        {/* Action Buttons Panel */}
        <div className="w-full flex gap-2 justify-center">
          {phase === "player-turn" ? (
            <>
              {/* Stand Button */}
              <button
                onClick={handleStand}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-black text-[9.5px] sm:text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-97"
              >
                <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Stand</span>
              </button>

              {/* Hit Button */}
              <button
                onClick={handleHit}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 font-black text-[9.5px] sm:text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-97"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Hit</span>
              </button>

              {/* Double Down Button */}
              <button
                disabled={playerHand.length > 2}
                onClick={handleDoubleDown}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-black text-[9.5px] sm:text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] active:scale-97 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Double</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center py-2 sm:py-4 text-slate-500 font-black text-[9.5px] sm:text-[10px] uppercase tracking-widest gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
              <span>Awaiting Next Bet Lock</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
