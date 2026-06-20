const fs = require('fs');

const path = 'f:/bet/betmatrix-ui/app/(public)/casino/game/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

const startStr = '{/* Game UI Simulation */}';
const endStr = '</div> {/* End Main Content Col */}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find boundaries');
    process.exit(1);
}

const preContent = content.substring(0, startIdx);

const closingStr = '            </AnimatePresence>\n          </motion.div>\n        </div> {/* End Main Content Col */}';
const closingIdx = content.indexOf(closingStr);

if (closingIdx === -1) {
    console.error('Could not find closing string');
    process.exit(1);
}

const postContent = content.substring(closingIdx);

const replacement = `{/* Game UI Simulation - Top 1% Stake Style */}
                  <div className="relative z-10 w-full h-full flex flex-col md:flex-row overflow-hidden">
                    
                    {/* LEFT SIDEBAR (Premium Command Center) */}
                    {tutorialDismissed && (
                      <div className="w-full md:w-[320px] lg:w-[350px] bg-white md:bg-slate-50 border-t md:border-t-0 md:border-r border-slate-200 flex flex-col order-2 md:order-1 relative z-20 shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.05)]">
                        {isCloudRenting ? (
                          <div className="p-4 md:p-6 flex flex-col gap-6 h-full justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Instance Cost</span>
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-[#a855f7]" />
                                <span className="text-xl font-black text-slate-900">₹{STAKE_PRESETS[1]}</span>
                                <span className="text-xs text-slate-500 font-bold">/ hour</span>
                              </div>
                            </div>
                            <button 
                              onClick={handlePlay}
                              disabled={isSpinning || isSessionActive}
                              className={\`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all \${isSessionActive ? 'bg-slate-200 text-slate-400' : isSpinning ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 hover:scale-[1.02] shadow-lg shadow-yellow-500/20'}\`}
                            >
                              {isSessionActive ? "Active" : isSpinning ? "Booting..." : "Rent Instance"}
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
                            
                            {/* Bet Amount Control */}
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bet Amount</span>
                                <span className="text-xs font-black text-slate-900">₹{betAmount.toLocaleString()}</span>
                              </div>
                              
                              <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-neon-purple focus-within:border-neon-purple transition-all">
                                <div className="flex items-center pl-3 pr-2 bg-slate-50 border-r border-slate-200 h-12">
                                  <span className="text-slate-400 font-bold">₹</span>
                                </div>
                                <input 
                                  type="number" 
                                  value={betAmount} 
                                  onChange={(e) => setBetAmount(Number(e.target.value))}
                                  className="flex-1 bg-transparent border-none text-slate-900 font-black text-sm p-3 h-12 focus:outline-none focus:ring-0"
                                />
                                <div className="flex items-center bg-slate-50 border-l border-slate-200 h-12">
                                  <button onClick={() => setBetAmount(prev => prev / 2)} className="px-3 h-full text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-r border-slate-200 transition-colors">1/2</button>
                                  <button onClick={() => setBetAmount(prev => prev * 2)} className="px-3 h-full text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">2x</button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {STAKE_PRESETS.map((amount) => (
                                  <button
                                    key={amount}
                                    onClick={() => setBetAmount(amount)}
                                    className={\`py-2 rounded-lg font-black text-[10px] transition-all \${betAmount === amount ? \\\`bg-gradient-to-br \${theme.buttonGradient} text-slate-900 shadow-md\\\` : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}\`}
                                  >
                                    ₹{amount}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-200 md:border-none md:pt-0">
                              <button 
                                onClick={handlePlay}
                                disabled={isSpinning}
                                className={\`w-full py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-widest transition-all \${isSpinning ? 'bg-slate-200 text-slate-400 border-2 border-slate-200 scale-95' : \\\`bg-gradient-to-br \${theme.buttonGradient} text-slate-900 shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] active:scale-95\\\`}\`}
                              >
                                {isSpinning ? "PLAYING..." : game.title.toLowerCase().includes("slot") ? "SPIN" : "BET"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RIGHT AREA (Game Canvas) */}
                    <div className="flex-1 flex flex-col relative z-10 order-1 md:order-2 overflow-hidden bg-[#0f1923] p-2 md:p-6 md:pl-8">
                      
                      {/* Header Overlay */}
                      <div className="w-full flex justify-between items-center z-20 mb-4 bg-white/5 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-3">
                          <img src={game.image} className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover shadow-md shrink-0 border border-white/10" />
                          <div className="flex-1">
                            <p className="text-slate-900 font-black text-xs md:text-sm uppercase tracking-wider leading-none truncate max-w-[150px] sm:max-w-none">{game.title}</p>
                            <p className="text-cyan-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                              </span>
                              {isCloudRenting ? "Cloud Stream" : "Live Betting"}
                            </p>
                          </div>
                        </div>

                        {/* Multiplayer Toggle Mode */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] md:text-xs font-black uppercase text-slate-300 hidden sm:inline">Lobby</span>
                          </div>
                          <button 
                            onClick={() => setIsMultiplayer(!isMultiplayer)}
                            className={cn(
                              "relative w-10 h-5 md:w-12 md:h-6 rounded-full p-1 transition-colors duration-300 shrink-0",
                              isMultiplayer ? "bg-neon-green" : "bg-slate-100"
                            )}
                          >
                            <motion.div 
                              layout
                              className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full"
                              style={{ marginLeft: isMultiplayer ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '20px' : '24px') : '0px' }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Central Canvas Area */}
                      <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row gap-6 relative z-10">
                        
                        <div className="flex-1 h-full flex items-center justify-center relative bg-[#0a0f16] rounded-3xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
                          {!isCloudRenting ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {renderEngine()}

                              {/* Win Overlay */}
                              <AnimatePresence>
                                {winAmount !== null && !isSpinning && (
                                  <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }} 
                                    exit={{ scale: 1.5, opacity: 0 }} 
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl"
                                  >
                                    <motion.h2 
                                      animate={isMegaWin ? { scale: [1, 1.2, 1] } : {}}
                                      transition={{ repeat: Infinity, duration: 1 }}
                                      className={\`text-4xl sm:text-7xl font-black uppercase tracking-tighter transform -skew-x-6 drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] \${isMegaWin ? \\\`text-\${theme.primaryColor} bg-clip-text text-transparent bg-gradient-to-b \${theme.buttonGradient}\\\` : 'text-slate-900'}\`}
                                    >
                                      {isMegaWin ? "MEGA WIN!" : "EPIC WIN!"}
                                    </motion.h2>
                                    <motion.div 
                                      className="text-5xl md:text-8xl font-black text-neon-yellow mt-4 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] font-mono tracking-tighter"
                                    >
                                      ₹<RollingCounter target={winAmount} />
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Low Balance Overlay */}
                              <AnimatePresence>
                                {balance < betAmount && !isSpinning && (
                                  <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(12px)" }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-3xl border border-red-500/30">
                                    <div className="text-center p-8 max-w-md">
                                      <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-wider">Low Balance</h2>
                                      <p className="text-slate-300 mb-8 font-medium text-lg">Your balance (₹{balance.toLocaleString()}) is insufficient for a ₹{betAmount.toLocaleString()} bet.</p>
                                      <button 
                                        onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                        className={\`w-full py-5 mb-3 bg-gradient-to-r \${theme.buttonGradient} text-slate-900 font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105 active:scale-95\`}
                                      >
                                        Deposit to Continue
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            isSessionActive ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                {renderEngine()}
                                {/* Rental countdown HUD */}
                                <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-right z-30 shadow-lg pointer-events-none">
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Session Time Left</p>
                                  <p className="text-neon-yellow font-mono font-black text-base flex items-center justify-end gap-1.5 mt-0.5">
                                    <Clock className="w-4 h-4 text-neon-yellow animate-pulse" />
                                    {formatTime(sessionTimeLeft)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                              >
                                <Gamepad2 className="w-16 h-16 text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-wide">Premium Cloud Streaming</h2>
                                <p className="text-slate-300 text-sm font-medium mb-6">
                                  Rent <span className="text-slate-900 font-bold">{game.title}</span> for cloud-native gaming at 60 FPS, with saves synced instantly to your profile.
                                </p>

                                <div className="bg-white/40 border border-white/10 rounded-2xl p-4 mb-6">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hourly Rental Rate</span>
                                    <span className="text-base font-black text-neon-green">₹{game.hourlyRate}/hr</span>
                                  </div>

                                  <div className="flex items-center gap-2 justify-center">
                                    {[1, 3, 5, 10].map(hrs => (
                                      <button
                                        key={hrs}
                                        onClick={() => { setSelectedHours(hrs); setCustomHoursVal(""); }}
                                        className={\`px-3 py-1.5 rounded-xl font-black text-xs transition-all border
                                          \${selectedHours === hrs && !customHoursVal
                                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                            : "bg-white/50 text-slate-300 border-white/20 hover:border-white/50"
                                          }\`}
                                      >
                                        {hrs}h
                                      </button>
                                    ))}
                                    {/* Custom Hours Input */}
                                    <input 
                                      type="number"
                                      placeholder="Custom hrs"
                                      min="1"
                                      max="24"
                                      value={customHoursVal}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setCustomHoursVal(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= 24) {
                                          setSelectedHours(val);
                                        }
                                      }}
                                      className="w-24 px-2 py-1.5 rounded-xl bg-white/50 border border-white/20 focus:border-cyan-400 focus:outline-none text-slate-900 text-center text-xs font-black placeholder:text-slate-500 font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mb-6 px-1">
                                  <span className="text-sm text-slate-400 font-bold">Total Cost ({selectedHours} hrs)</span>
                                  <span className="text-2xl font-black text-slate-900 font-mono">₹{rentCost.toLocaleString()}</span>
                                </div>

                                {isDemoLimitReached ? (
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-950 font-black uppercase text-sm tracking-wider shadow-lg transition-all"
                                  >
                                    Deposit & Activate
                                  </button>
                                ) : balance < rentCost ? (
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 text-slate-900 font-black uppercase text-sm tracking-wider shadow-lg transition-all"
                                  >
                                    Insufficient Funds
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleRent}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 font-black uppercase text-sm tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                  >
                                    Rent & Stream Game
                                  </button>
                                )}
                              </motion.div>
                            )
                          )}
                        </div>

                        {/* Multiplayer Lobby Side Panel */}
                        {isMultiplayer && (
                          <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="w-full md:w-[280px] shrink-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[500px]"
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <span className="text-slate-900 font-black text-xs uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse" />
                                Lobby #91A-STAKE
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono font-bold">4/8 Active</span>
                            </div>
                            
                            {/* List of mock players */}
                            <div className="space-y-3 flex-1 overflow-y-auto">
                              <div className="flex justify-between items-center bg-white/20 p-2.5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">U1</div>
                                  <span className="text-slate-300 font-bold text-xs">CryptoWhale</span>
                                </div>
                                <span className="text-neon-green text-[10px] font-black font-mono">₹1,500</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/20 p-2.5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">U2</div>
                                  <span className="text-slate-300 font-bold text-xs">WagerGod</span>
                                </div>
                                <span className="text-neon-green text-[10px] font-black font-mono">₹4,200</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/20 p-2.5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">ME</div>
                                  <span className="text-slate-900 font-black text-xs">You</span>
                                </div>
                                <span className="text-neon-yellow text-[10px] font-black font-mono font-bold">₹{balance.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Chat</span>
                              <div className="bg-white/30 rounded-xl p-2 h-32 overflow-y-auto text-[10px] space-y-2 font-medium custom-scrollbar">
                                <p className="text-slate-300"><span className="text-cyan-400 font-bold">CryptoWhale</span>: lets win this round guys</p>
                                <p className="text-slate-300"><span className="text-purple-400 font-bold">WagerGod</span>: going high stake next spin</p>
                                <p className="text-slate-500 italic">User joined the channel</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
`;

const newContent = preContent + replacement + '\n' + postContent;

fs.writeFileSync(path, newContent, 'utf-8');
console.log('Rewrite successful');
