const fs = require('fs');

const pathL = 'f:/bet/AURA/components/casino/engines/roulette/LightningRoulette.tsx';
const pathZ = 'f:/bet/AURA/components/casino/engines/roulette/ZeroFreeRoulette.tsx';
const pathD = 'f:/bet/AURA/components/casino/engines/roulette/DoubleBallRoulette.tsx';
const pathM = 'f:/bet/AURA/components/casino/engines/roulette/MultiWheelRoulette.tsx';

let lCode = fs.readFileSync(pathL, 'utf-8');
lCode = lCode.replace(
  'import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, EUROPEAN_CONFIG } from "@/lib/roulette-math";',
  'import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, LIGHTNING_CONFIG } from "@/lib/roulette-math";'
);
lCode = lCode.replace(
  'const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);',
  'const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);\n  const [lightningNumbers, setLightningNumbers] = useState<Record<number, number>>({});'
);
lCode = lCode.replace(
  /const result = EUROPEAN_NUMBERS\[targetIdx\];\s*const segmentAngle = 360 \/ EUROPEAN_NUMBERS\.length;\s*const finalWheelRotation = 1800 \+ \(360 - \(targetIdx \* segmentAngle\)\);\s*setRotation\(finalWheelRotation\);/,
  `const result = EUROPEAN_NUMBERS[targetIdx];
    const segmentAngle = 360 / EUROPEAN_NUMBERS.length;
    const finalWheelRotation = 1800 + (360 - (targetIdx * segmentAngle));
    
    const numLightning = Math.floor(Math.random() * 5) + 1;
    const newLightning: Record<number, number> = {};
    const multipliers = [50, 100, 200, 300, 400, 500];
    const availableNumbers = EUROPEAN_NUMBERS.map(n => n.n);
    for (let i = 0; i < numLightning; i++) {
      const rndIdx = Math.floor(Math.random() * availableNumbers.length);
      const num = availableNumbers.splice(rndIdx, 1)[0];
      const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
      newLightning[num] = mult;
    }
    setLightningNumbers(newLightning);

    setRotation(finalWheelRotation);`
);
lCode = lCode.replace(
  /const \{ totalWon \} = evaluateRoulettePayouts\(bets, result, EUROPEAN_CONFIG\);/,
  `const { totalWon } = evaluateRoulettePayouts(bets, result, LIGHTNING_CONFIG, newLightning);`
);
lCode = lCode.replace(
  /Emerald Roulette/g,
  '⚡ Lightning Roulette'
);
lCode = lCode.replace(
  /from-\[\#0b3a20\] via-\[\#052112\] to-\[\#010e08\]/g,
  'from-zinc-800 via-zinc-900 to-black'
);
lCode = lCode.replace(
  /bg-\[\#02130a\]\/80/g,
  'bg-zinc-950/80'
);
lCode = lCode.replace(
  /border-emerald-500\/20/g,
  'border-yellow-500/20'
);
lCode = lCode.replace(
  /bg-slate-950 hover:bg-slate-900 text-slate-100/g,
  'bg-zinc-900 hover:bg-zinc-800 text-slate-100'
);
// Vertical zero cell
lCode = lCode.replace(
  /bg-emerald-700\/90 hover:bg-emerald-600 text-white flex items-center justify-center font-black font-mono text-base select-none cursor-pointer relative border-b border-yellow-500\/20 transition-colors"\s*>\s*<span>0<\/span>/,
  `bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-black font-mono text-base select-none cursor-pointer relative border-b border-yellow-500/20 transition-colors"
        >
          <span className="z-10">0</span>
          {lightningNumbers[0] && (
            <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
              <span className="text-yellow-400 font-black text-[10px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
                {lightningNumbers[0]}x
              </span>
            </div>
          )}`
);
// Horizontal zero cell
lCode = lCode.replace(
  /bg-emerald-700\/90 hover:bg-emerald-600 text-white flex items-center justify-center font-black font-mono text-xl select-none cursor-pointer relative transition-colors"\s*>\s*<span>0<\/span>/,
  `bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-black font-mono text-xl select-none cursor-pointer relative transition-colors"
                  >
                    <span className="z-10">0</span>
                    {lightningNumbers[0] && (
                      <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
                        <span className="text-yellow-400 font-black text-[10px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
                          {lightningNumbers[0]}x
                        </span>
                      </div>
                    )}`
);
// Regular cell horizontal
lCode = lCode.replace(
  /<span className="font-mono font-black">{n}<\/span>\s*\{renderCellChip\(\`num-\$\{n\}\`\)\}/,
  `<span className="font-mono font-black z-10">{n}</span>
        {lightningNumbers[n] && (
          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
            <span className="text-yellow-400 font-black text-[10px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
              {lightningNumbers[n]}x
            </span>
          </div>
        )}
        {renderCellChip(\`num-\${n}\`)}`
);
// Regular cell vertical
lCode = lCode.replace(
  /<span className="font-mono">{n}<\/span>\s*\{renderCellChip\(\`num-\$\{n\}\`\)\}/,
  `<span className="font-mono z-10">{n}</span>
                {lightningNumbers[n] && (
                  <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
                    <span className="text-yellow-400 font-black text-[8px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
                      {lightningNumbers[n]}x
                    </span>
                  </div>
                )}
                {renderCellChip(\`num-\${n}\`)}`
);
fs.writeFileSync(pathL, lCode);

let zCode = fs.readFileSync(pathZ, 'utf-8');
zCode = zCode.replace(
  'import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, EUROPEAN_CONFIG } from "@/lib/roulette-math";',
  'import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, ZERO_FREE_CONFIG } from "@/lib/roulette-math";'
);
zCode = zCode.replace(
  'const NUMBERS: NumberConfig[] = [',
  'const ZERO_FREE_NUMBERS: NumberConfig[] = EUROPEAN_NUMBERS.filter(n => n.n !== 0);\n\nconst NUMBERS: NumberConfig[] = ['
);
zCode = zCode.replace(
  /const targetIdx = Math\.floor\(Math\.random\(\) \* EUROPEAN_NUMBERS\.length\);\s*const result = EUROPEAN_NUMBERS\[targetIdx\];\s*const segmentAngle = 360 \/ EUROPEAN_NUMBERS\.length;/,
  `const targetIdx = Math.floor(Math.random() * ZERO_FREE_NUMBERS.length);
    const result = ZERO_FREE_NUMBERS[targetIdx];
    const segmentAngle = 360 / ZERO_FREE_NUMBERS.length;`
);
zCode = zCode.replace(
  /evaluateRoulettePayouts\(bets, result, EUROPEAN_CONFIG\)/,
  'evaluateRoulettePayouts(bets, result, ZERO_FREE_CONFIG)'
);
zCode = zCode.replace(
  /Emerald Roulette/g,
  'Zero-Free Roulette'
);
zCode = zCode.replace(
  /from-\[\#0b3a20\] via-\[\#052112\] to-\[\#010e08\]/g,
  'from-slate-50 via-slate-100 to-slate-200'
);
// Remove zero cell from vertical
zCode = zCode.replace(
  /\{\/\* Row 1: Zero Cell.*?<\/button>/s,
  `{/* Zero Cell Removed */}`
);
// Remove zero cell from horizontal
zCode = zCode.replace(
  /\{\/\* 0 Cell \*\/\}[\s\S]*?\{renderCellChip\("num-0"\)\}\s*<\/button>/,
  `{/* Zero Cell Removed */}`
);
fs.writeFileSync(pathZ, zCode);

let dCode = fs.readFileSync(pathD, 'utf-8');
dCode = dCode.replace(
  'import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, EUROPEAN_CONFIG } from "@/lib/roulette-math";',
  'import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, EUROPEAN_CONFIG, isWinningBet } from "@/lib/roulette-math";'
);
dCode = dCode.replace(
  'const [winningNumber, setWinningNumber] = useState<NumberConfig | null>(null);',
  'const [winningNumbers, setWinningNumbers] = useState<NumberConfig[]>([]);\n  const [targetIndices, setTargetIndices] = useState<number[]>([]);'
);
dCode = dCode.replace(
  /const targetIdx = Math\.floor\(Math\.random\(\) \* EUROPEAN_NUMBERS\.length\);\s*const result = EUROPEAN_NUMBERS\[targetIdx\];\s*const segmentAngle = 360 \/ EUROPEAN_NUMBERS\.length;\s*const finalWheelRotation = 1800 \+ \(360 - \(targetIdx \* segmentAngle\)\);\s*setRotation\(finalWheelRotation\);/,
  `const targetIdx1 = Math.floor(Math.random() * EUROPEAN_NUMBERS.length);
    const targetIdx2 = Math.floor(Math.random() * EUROPEAN_NUMBERS.length);
    const result1 = EUROPEAN_NUMBERS[targetIdx1];
    const result2 = EUROPEAN_NUMBERS[targetIdx2];
    const segmentAngle = 360 / EUROPEAN_NUMBERS.length;
    const finalWheelRotation = 1800 + (360 - (targetIdx1 * segmentAngle));
    
    setTargetIndices([targetIdx1, targetIdx2]);
    setRotation(finalWheelRotation);`
);
dCode = dCode.replace(
  /setWinningNumber\(result\);\s*setPrevBets\(bets\);\s*\/\/ Evaluate true payout using our math engine\s*const \{ totalWon \} = evaluateRoulettePayouts\(bets, result, EUROPEAN_CONFIG\);\s*\/\/ Simulate VIP winnings correctly based on true RNG outcome\s*processVIPWinnings\(result\);/,
  `setWinningNumbers([result1, result2]);
      setPrevBets(bets);

      let totalWon = 0;
      for (const [cellId, amount] of Object.entries(bets)) {
        const win1 = isWinningBet(cellId, result1);
        const win2 = isWinningBet(cellId, result2);
        if (cellId.startsWith("num-")) {
          if (win1 && win2) totalWon += amount * 35;
          else if (win1 || win2) totalWon += amount * 18;
        } else {
          if (win1 && win2) {
            if (cellId.startsWith("doz-") || cellId.startsWith("col-")) totalWon += amount * 8;
            else totalWon += amount * 3;
          }
        }
      }

      processVIPWinnings(result1);`
);
dCode = dCode.replace(
  /Emerald Roulette/g,
  'Double Ball Roulette'
);
dCode = dCode.replace(
  /from-\[\#0b3a20\] via-\[\#052112\] to-\[\#010e08\]/g,
  'from-sky-800 via-sky-900 to-[#020a14]'
);
dCode = dCode.replace(
  /bg-\[\#02130a\]\/80/g,
  'bg-sky-950/80'
);
dCode = dCode.replace(
  /border-emerald-500\/20/g,
  'border-sky-500/20'
);
// replace result overlay
dCode = dCode.replace(
  /\{\!isSpinning && winningNumber && \([\s\S]*?<\/AnimatePresence>/,
  `{!isSpinning && winningNumbers.length === 2 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute -top-4 z-40 flex items-center gap-4"
                      >
                        {winningNumbers.map((wn, idx) => (
                          <div key={idx} className={\`px-4 py-1.5 rounded-full border shadow-2xl flex items-center gap-2 \${
                            wn.color === "red" 
                              ? "bg-rose-700/90 border-rose-500 text-white" 
                              : wn.color === "black" 
                                ? "bg-slate-900/90 border-slate-700 text-slate-100" 
                                : "bg-emerald-600/90 border-emerald-400 text-white"
                          }\`}>
                            <span className="text-[10px] font-black tracking-widest uppercase">BALL {idx + 1}</span>
                            <span className="text-sm font-black font-mono px-2 py-0.5 rounded bg-black/30">
                              {wn.n}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>`
);
// replace balls on wheel
dCode = dCode.replace(
  /\{\/\* Ball animation \*\/\}[\s\S]*?\{\/\* Landed ball \*\/\}[\s\S]*?<\/AnimatePresence>/,
  `{/* Ball animation */}
                      {isSpinning && (
                        <>
                          <motion.div
                            animate={{ rotate: ballRotateKeyframes }}
                            transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full pointer-events-none z-20"
                          >
                            <motion.div 
                              animate={{ y: ballYKeyframes, scale: ballScaleKeyframes }}
                              transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                              className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1),inset_-1px_-1px_2px_rgba(0,0,0,0.3)]"
                            />
                          </motion.div>
                          <motion.div
                            animate={{ rotate: ballRotateKeyframes.map(r => r - 120) }}
                            transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full pointer-events-none z-30"
                          >
                            <motion.div 
                              animate={{ y: ballYKeyframes, scale: ballScaleKeyframes }}
                              transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                              className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sky-100 shadow-[0_0_8px_rgba(56,189,248,1),inset_-1px_-1px_2px_rgba(0,0,0,0.3)]"
                            />
                          </motion.div>
                        </>
                      )}

                      {/* Landed balls */}
                      <AnimatePresence>
                        {!isSpinning && winningNumbers.length === 2 && targetIndices.length === 2 && (
                          <>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-0 rounded-full pointer-events-none z-30"
                              style={{ transform: "rotate(0deg)" }}
                            >
                              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#fcfbf9] shadow-[0_0_6px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] z-30" />
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-0 rounded-full pointer-events-none z-30"
                              style={{ transform: \`rotate(\${(targetIndices[1] - targetIndices[0]) * (360 / EUROPEAN_NUMBERS.length)}deg)\` }}
                            >
                              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#fcfbf9] shadow-[0_0_6px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] z-30" />
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>`
);
// replace win overlay check
dCode = dCode.replace(
  /\{showWinOverlay && winningNumber && \!isSpinning && \(/,
  '{showWinOverlay && winningNumbers.length === 2 && !isSpinning && ('
);
dCode = dCode.replace(
  /<span>Number landed:<\/span>[\s\S]*?<\/span>/,
  `<span>Numbers landed:</span>
                  <div className="flex gap-1">
                    {winningNumbers.map((wn, idx) => (
                      <span key={idx} className={\`font-mono font-black px-2 py-0.5 rounded-full text-[9px] \${
                        wn.color === "red" 
                          ? "bg-rose-700 text-white" 
                          : wn.color === "black" 
                            ? "bg-slate-900 text-slate-200" 
                            : "bg-emerald-600 text-white"
                      }\`}>
                        {wn.n}
                      </span>
                    ))}
                  </div>`
);
fs.writeFileSync(pathD, dCode);

// MultiWheelRoulette.tsx
let mCode = fs.readFileSync(pathM, 'utf-8');
mCode = mCode.replace(
  'const [rotation, setRotation] = useState(0);',
  'const [rotations, setRotations] = useState<number[]>([0, 0, 0, 0]);'
);
mCode = mCode.replace(
  'const [winningNumber, setWinningNumber] = useState<NumberConfig | null>(null);',
  'const [winningNumbers, setWinningNumbers] = useState<NumberConfig[]>([]);'
);
mCode = mCode.replace(
  /const targetIdx = Math\.floor\(Math\.random\(\) \* EUROPEAN_NUMBERS\.length\);\s*const result = EUROPEAN_NUMBERS\[targetIdx\];\s*const segmentAngle = 360 \/ EUROPEAN_NUMBERS\.length;\s*const finalWheelRotation = 1800 \+ \(360 - \(targetIdx \* segmentAngle\)\);\s*setRotation\(finalWheelRotation\);/,
  `const targetIdxList = Array(4).fill(0).map(() => Math.floor(Math.random() * EUROPEAN_NUMBERS.length));
    const results = targetIdxList.map(idx => EUROPEAN_NUMBERS[idx]);
    const segmentAngle = 360 / EUROPEAN_NUMBERS.length;
    const finalRotations = targetIdxList.map(idx => 1800 + (360 - (idx * segmentAngle)));

    setRotations(finalRotations);`
);
mCode = mCode.replace(
  /setWinningNumber\(result\);\s*setPrevBets\(bets\);\s*\/\/ Evaluate true payout using our math engine\s*const \{ totalWon \} = evaluateRoulettePayouts\(bets, result, EUROPEAN_CONFIG\);\s*\/\/ Simulate VIP winnings correctly based on true RNG outcome\s*processVIPWinnings\(result\);/,
  `setWinningNumbers(results);
      setPrevBets(bets);

      let totalWon = 0;
      for (const result of results) {
        totalWon += evaluateRoulettePayouts(bets, result, EUROPEAN_CONFIG).totalWon;
      }

      processVIPWinnings(results[0]);`
);
mCode = mCode.replace(
  /Emerald Roulette/g,
  'Multi-Wheel Roulette'
);
mCode = mCode.replace(
  /from-\[\#0b3a20\] via-\[\#052112\] to-\[\#010e08\]/g,
  'from-zinc-800 via-zinc-900 to-black'
);
mCode = mCode.replace(
  /bg-\[\#02130a\]\/80/g,
  'bg-zinc-950/80'
);
mCode = mCode.replace(
  /border-emerald-500\/20/g,
  'border-zinc-500/20'
);
mCode = mCode.replace(
  /<div className="relative flex flex-col items-center justify-center shrink-0 py-2">[\s\S]*?\{showWinOverlay && winningNumber && \!isSpinning && \(/,
  `<div className="relative grid grid-cols-2 gap-4 shrink-0 p-4 max-w-4xl w-full mx-auto">
                  {/* We map 4 wheels */}
                  {[0, 1, 2, 3].map(wIdx => (
                    <div key={wIdx} className="relative flex flex-col items-center justify-center">
                      <AnimatePresence>
                        {!isSpinning && winningNumbers[wIdx] && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className={\`absolute -top-4 z-40 px-3 py-1 rounded-full border shadow-2xl flex items-center gap-2 \${
                              winningNumbers[wIdx].color === "red" 
                                ? "bg-rose-700/90 border-rose-500 text-white" 
                                : winningNumbers[wIdx].color === "black" 
                                  ? "bg-slate-900/90 border-slate-700 text-slate-100" 
                                  : "bg-emerald-600/90 border-emerald-400 text-white"
                            }\`}
                          >
                            <span className="text-[8px] font-black tracking-widest uppercase">W\${wIdx + 1}</span>
                            <span className="text-xs font-black font-mono px-1 py-0.5 rounded bg-black/30">
                              {winningNumbers[wIdx].n}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="relative w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 aspect-square flex items-center justify-center select-none perspective-[1000px]">
                        <div 
                          className="relative w-[95%] h-[95%] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.9)] transform-style-3d"
                          style={{ transform: "rotateX(55deg)" }}
                        >
                          <div className="absolute -inset-2 rounded-full border-[4px] border-amber-950 bg-gradient-to-br from-amber-800 to-amber-950 flex items-center justify-center" />
                          <motion.div
                            animate={isSpinning ? { rotate: rotations[wIdx] } : { rotate: rotations[wIdx] % 360 }}
                            transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
                            className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.95)]"
                          >
                            {NUMBERS.map((num, i) => {
                              const angle = (360 / NUMBERS.length) * i;
                              const numColor = num.color === "green" 
                                ? "bg-emerald-600 text-white" 
                                : num.color === "red" 
                                  ? "bg-rose-700 text-white" 
                                  : "bg-slate-900 text-slate-100";
                              
                              return (
                                <div
                                  key={\`seg-\${i}\`}
                                  className="absolute top-0 left-1/2 w-3 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-0.5"
                                  style={{ transform: \`rotate(\${angle}deg)\` }}
                                >
                                  <div className={\`w-2 h-4 flex items-start justify-center pt-[1px] rounded-sm \${numColor}\`}>
                                    <span className="text-[5px] font-black font-mono leading-none">{num.n}</span>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-700 shadow-lg" />
                          </motion.div>
                          {isSpinning && (
                            <motion.div
                              animate={{ rotate: ballRotateKeyframes }}
                              transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                              className="absolute inset-0 rounded-full pointer-events-none z-30"
                            >
                              <motion.div 
                                animate={{ y: ballYKeyframes.map(y => y * 0.6), scale: ballScaleKeyframes.map(s => s * 0.8) }}
                                transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                                className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-md"
                              />
                            </motion.div>
                          )}
                          <AnimatePresence>
                            {!isSpinning && winningNumbers[wIdx] && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 rounded-full pointer-events-none z-30"
                                style={{ transform: "rotate(0deg)" }}
                              >
                                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#fcfbf9] shadow-md z-30" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mt-6 animate-pulse text-center">
                  Tap anywhere to return to board
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Betting Board & Controls */}
          <div className="w-full flex flex-col gap-4 overflow-visible">
            
            {/* Horizontal Felt Board for Desktop / Tablet */}
            <div className="hidden md:block w-full bg-[#03140a]/40 border border-emerald-500/10 rounded-2xl p-2.5 relative shadow-inner overflow-x-auto scrollbar-thin">
              <div className="min-w-[620px] relative">
                
                {/* Numbers Grid (horizontally aligned) */}
                <div className="grid grid-cols-14 border border-zinc-500/20 rounded-xl overflow-hidden bg-slate-950/40">
                  
                  {/* 0 Cell */}
                  <button
                    disabled={isSpinning}
                    onClick={() => placeBet("num-0")}
                    className="row-span-3 h-full border-r border-zinc-500/20 bg-zinc-700/90 hover:bg-zinc-600 text-white flex items-center justify-center font-black font-mono text-xl select-none cursor-pointer relative transition-colors"
                  >
                    <span>0</span>
                    {renderCellChip("num-0")}
                  </button>

                  {/* 12 columns of 3 rows */}
                  {Array.from({ length: 12 }).map((_, colIdx) => {
                    const nums = [
                      (colIdx * 3) + 3,
                      (colIdx * 3) + 2,
                      (colIdx * 3) + 1
                    ];
                    return (
                      <div key={\`col-\${colIdx}\`} className="flex flex-col border-r border-zinc-500/20">
                        {nums.map(n => renderNumberCell(n))}
                      </div>
                    );
                  })}

                  {/* 2 to 1 columns */}
                  <div className="flex flex-col">
                    {["col-3", "col-2", "col-1"].map((col, idx) => (
                      <button
                        key={col}
                        disabled={isSpinning}
                        onClick={() => placeBet(col)}
                        className="h-12 border-b border-zinc-500/20 last:border-b-0 bg-zinc-950/80 hover:bg-zinc-900 text-slate-400 flex items-center justify-center font-black text-xs uppercase cursor-pointer select-none transition-all relative active:scale-95"
                      >
                        <span>2:1</span>
                        {renderCellChip(col)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dozens Row */}
                <div className="grid grid-cols-14 border-x border-b border-zinc-500/20 rounded-b-xl overflow-hidden bg-zinc-950/40 mt-1">
                  <div className="col-span-1" />
                  {[
                    { id: "doz-1", label: "1st 12" },
                    { id: "doz-2", label: "2nd 12" },
                    { id: "doz-3", label: "3rd 12" }
                  ].map(doz => (
                    <button
                      key={doz.id}
                      disabled={isSpinning}
                      onClick={() => placeBet(doz.id)}
                      className="col-span-4 h-10 border-r border-zinc-500/20 bg-zinc-950/60 hover:bg-zinc-900/80 flex items-center justify-center font-black text-xs text-slate-200 uppercase cursor-pointer select-none transition-all relative active:scale-95"
                    >
                      <span>{doz.label}</span>
                      {renderCellChip(doz.id)}
                    </button>
                  ))}
                  <div className="col-span-1" />
                </div>

                {/* Even/Odd Red/Black outside bets */}
                <div className="grid grid-cols-14 border-x border-b border-zinc-500/20 rounded-b-xl overflow-hidden bg-zinc-950/50 mt-1">
                  <div className="col-span-1" />
                  {[
                    { id: "low", label: "1-18", btnClass: "bg-zinc-950/70 hover:bg-zinc-900 text-slate-200" },
                    { id: "even", label: "EVEN", btnClass: "bg-zinc-950/70 hover:bg-zinc-900 text-slate-200" },
                    { id: "red", label: "RED", btnClass: "bg-rose-700/90 hover:bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.2)]" },
                    { id: "black", label: "BLACK", btnClass: "bg-slate-950 hover:bg-slate-900 text-slate-100 shadow-[inset_0_0_6px_rgba(255,255,255,0.05)]" },
                    { id: "odd", label: "ODD", btnClass: "bg-zinc-950/70 hover:bg-zinc-900 text-slate-200" },
                    { id: "high", label: "19-36", btnClass: "bg-zinc-950/70 hover:bg-zinc-900 text-slate-200" }
                  ].map(out => (
                    <button
                      key={out.id}
                      disabled={isSpinning}
                      onClick={() => placeBet(out.id)}
                      className={\`col-span-2 h-10 border-r border-zinc-500/20 last:border-r-0 flex items-center justify-center font-black text-xs cursor-pointer select-none transition-all relative active:scale-95 \${out.btnClass}\`}
                    >
                      <span>{out.label}</span>
                      {renderCellChip(out.id)}
                    </button>
                  ))}
                  <div className="col-span-1" />
                </div>

              </div>
            </div>

            {/* Vertical Felt Board for Mobile */}
            <div className="block md:hidden w-full relative">
              {renderVerticalBoard()}
            </div>

            {/* Betting Controls: Action buttons only */}
            <div className="w-full flex flex-col gap-3 mt-2 pb-2">
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 bg-[#020e08]/60 border border-zinc-500/15 rounded-xl p-1.5 shadow-md flex-1">
                  <button 
                    onClick={undoLastBet} 
                    disabled={isSpinning || betHistory.length === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-zinc-500/20 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-zinc-950/40 text-slate-400 hover:bg-zinc-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Undo
                  </button>
                  <button 
                    onClick={doubleAllBets} 
                    disabled={isSpinning || totalBetsSum === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-zinc-500/20 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-zinc-950/40 text-slate-400 hover:bg-zinc-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Double
                  </button>
                  <button 
                    onClick={repeatLastBets} 
                    disabled={isSpinning || Object.keys(prevBets).length === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-zinc-500/20 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-zinc-950/40 text-slate-400 hover:bg-zinc-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Repeat
                  </button>
                  <button 
                    onClick={clearAllBets} 
                    disabled={isSpinning || totalBetsSum === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-zinc-500/20 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-zinc-950/40 text-slate-400 hover:bg-zinc-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>



      </div>

      {/* 3. Victory Grand Overlay */}
      <AnimatePresence>
        {showWinOverlay && winningNumbers.length === 4 && !isSpinning && (`
);
mCode = mCode.replace(
  /<span>Number landed:<\/span>[\s\S]*?<\/span>/,
  `<span>Numbers landed:</span>
                  <div className="flex gap-1">
                    {winningNumbers.map((wn, idx) => (
                      <span key={idx} className={\`font-mono font-black px-2 py-0.5 rounded-full text-[9px] \${
                        wn.color === "red" 
                          ? "bg-rose-700 text-white" 
                          : wn.color === "black" 
                            ? "bg-slate-900 text-slate-200" 
                            : "bg-emerald-600 text-white"
                      }\`}>
                        {wn.n}
                      </span>
                    ))}
                  </div>`
);
fs.writeFileSync(pathM, mCode);

console.log("Done");
