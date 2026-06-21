"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { SystemConfig } from "@/lib/systemConfig";
import { 
  adminUpdateGameStatus, adminUpdatePaymentStatus, adminUpdateHouseEdge, adminUpdateWinRates, adminUpdateStrategyFrequency, adminUpdateMaintenanceMode 
} from "../actions";
import { 
  Shield, Sliders, CheckCircle, AlertTriangle, Activity, DollarSign, RefreshCw,
  Dices, Bomb, HelpCircle, ArrowUpRight, Zap, Hash, Coins, Landmark
} from "lucide-react";

interface ClientRtpMonitorDashboardProps {
  initialSystemConfig: SystemConfig;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ClientRtpMonitorDashboard({ initialSystemConfig }: ClientRtpMonitorDashboardProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  const adminEmail = currentUser?.email || "twintubrovquattro@gmail.com";

  const [config, setConfig] = useState<SystemConfig>(initialSystemConfig);
  const [houseEdge, setHouseEdge] = useState(initialSystemConfig.houseEdge);
  const [demoWinRate, setDemoWinRate] = useState(initialSystemConfig.demoWinRate ?? 80);
  const [realWinRate, setRealWinRate] = useState(initialSystemConfig.realWinRate ?? 30);
  const [strategyFrequency, setStrategyFrequency] = useState(initialSystemConfig.strategyFrequency ?? 30);
  const [maintenanceMode, setMaintenanceMode] = useState(initialSystemConfig.maintenanceMode ?? false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Maintenance Mode toggle
  const handleMaintenanceToggle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const targetStatus = !maintenanceMode;
    try {
      const res = await adminUpdateMaintenanceMode(targetStatus, adminEmail);
      if (res.success && res.config) {
        showToast(`Maintenance Mode is now ${targetStatus ? 'Enabled' : 'Disabled'}`, "success");
        setMaintenanceMode(targetStatus);
        setConfig(res.config);
      } else {
        showToast(res.error || "Failed to update maintenance mode", "error");
      }
    } catch {
      showToast("Network error updating maintenance mode", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Game status toggle
  const handleGameStatusToggle = async (gameId: string, currentDisabled: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const targetStatus = !currentDisabled;
    try {
      const res = await adminUpdateGameStatus(gameId, targetStatus, adminEmail);
      if (res.success && res.config) {
        showToast(`Game '${res.config.games[gameId].name}' is now ${targetStatus ? 'Disabled' : 'Enabled'}`, "success");
        setConfig(res.config);
      } else {
        showToast(res.error || "Failed to update game status", "error");
      }
    } catch {
      showToast("Network error updating game status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment method status toggle
  const handlePaymentStatusToggle = async (methodId: string, currentDisabled: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const targetStatus = !currentDisabled;
    try {
      const res = await adminUpdatePaymentStatus(methodId, targetStatus, adminEmail);
      if (res.success && res.config) {
        showToast(`Payment Method '${res.config.paymentMethods[methodId].name}' is now ${targetStatus ? 'Disabled' : 'Enabled'}`, "success");
        setConfig(res.config);
      } else {
        showToast(res.error || "Failed to update payment status", "error");
      }
    } catch {
      showToast("Network error updating payment status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // House edge submission
  const handleHouseEdgeSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminUpdateHouseEdge(houseEdge, adminEmail);
      if (res.success && res.config) {
        showToast(`Successfully updated Global House Edge to ${houseEdge}%`, "success");
        setConfig(res.config);
      } else {
        showToast(res.error || "Failed to update house edge", "error");
        setHouseEdge(config.houseEdge);
      }
    } catch {
      showToast("Network error updating house edge", "error");
      setHouseEdge(config.houseEdge);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Win rate submission
  const handleWinRatesSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminUpdateWinRates(demoWinRate, realWinRate, adminEmail);
      if (res.success && res.config) {
        showToast(`Successfully updated win rates to Demo: ${demoWinRate}%, Real: ${realWinRate}%`, "success");
        setConfig(res.config);
      } else {
        showToast(res.error || "Failed to update win rates", "error");
        setDemoWinRate(config.demoWinRate ?? 80);
        setRealWinRate(config.realWinRate ?? 30);
      }
    } catch {
      showToast("Network error updating win rates", "error");
      setDemoWinRate(config.demoWinRate ?? 80);
      setRealWinRate(config.realWinRate ?? 30);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Strategy frequency submission
  const handleStrategyFrequencySubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminUpdateStrategyFrequency(strategyFrequency, adminEmail);
      if (res.success && res.config) {
        showToast(`Successfully updated Simulated Bet Frequency to ${strategyFrequency} seconds`, "success");
        setConfig(res.config);
      } else {
        showToast(res.error || "Failed to update strategy frequency", "error");
        setStrategyFrequency(config.strategyFrequency ?? 30);
      }
    } catch {
      showToast("Network error updating strategy frequency", "error");
      setStrategyFrequency(config.strategyFrequency ?? 30);
    } finally {
      setIsProcessing(false);
    }
  };

  // Match game IDs to respective Lucide icons
  const getGameIcon = (gameId: string) => {
    switch (gameId) {
      case 'dice': return <Dices className="w-4 h-4 text-indigo-600" />;
      case 'mines': return <Bomb className="w-4 h-4 text-rose-600" />;
      case 'plinko': return <HelpCircle className="w-4 h-4 text-emerald-600" />;
      case 'limbo': return <ArrowUpRight className="w-4 h-4 text-cyan-600" />;
      case 'crash': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'keno': return <Hash className="w-4 h-4 text-pink-600" />;
      case 'coinflip': return <Coins className="w-4 h-4 text-teal-600" />;
      case 'blackjack': return <Landmark className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  // Match payment channel IDs to icons
  const getPaymentIcon = (methodId: string) => {
    switch (methodId) {
      case 'upi': return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
      case 'bank': return <Landmark className="w-4 h-4 text-indigo-600" />;
      case 'crypto': return <Coins className="w-4 h-4 text-amber-600" />;
      default: return <DollarSign className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-slate-50 text-slate-900">
      
      {/* Toast Alert list */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
            t.type === 'success' ? 'bg-emerald-100 border-emerald-500/30 text-emerald-700' :
            t.type === 'error' ? 'bg-rose-100 border-rose-500/30 text-rose-700' :
            'bg-slate-50/80 border-slate-200 text-slate-700'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-600" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header bar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-60 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <Sliders className="w-7 h-7 text-amber-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase">System Controls (RTP)</h1>
            <p className="text-xs text-slate-600 font-medium tracking-wide uppercase mt-1">Configure global house margins and toggle game runtime registries.</p>
          </div>
        </div>
      </header>

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* House Edge Widget */}
        <div className="lg:col-span-3 bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Margin Configuration</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Adjust mathematical advantage on casino engine simulations.</p>
              </div>
            </div>
            <div className="bg-amber-500/15 border border-amber-500/30 px-4 py-2 rounded-xl text-center">
              <span className="font-mono text-base font-black text-amber-600">{houseEdge.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="15"
                step="0.1"
                value={houseEdge}
                onChange={(e) => setHouseEdge(parseFloat(e.target.value))}
                onMouseUp={handleHouseEdgeSubmit}
                onTouchEnd={handleHouseEdgeSubmit}
                disabled={isProcessing}
                className="w-full h-1.5 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest shrink-0">0% to 15%</span>
            </div>
            
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed max-w-2xl bg-white/[0.01] p-3 rounded-lg border border-white/[0.02]">
              💡 <strong>System Note:</strong> The global house edge modifies the payout coefficient return values for casino games (Mines, Dice, Plinko, etc.) in real-time. Changes are applied instantly to player rounds without requiring game registry restarts.
            </p>
          </div>
          {/* Win Rates & Strategy Frequency configuration */}
          <div className="border-t border-slate-200 mt-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Demo Account Win Frequency</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Controls winning probability for guest/demo simulators.</p>
                </div>
                <span className="font-mono text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">{demoWinRate}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={demoWinRate}
                  onChange={(e) => setDemoWinRate(parseInt(e.target.value))}
                  onMouseUp={handleWinRatesSubmit}
                  onTouchEnd={handleWinRatesSubmit}
                  disabled={isProcessing}
                  className="w-full h-1.5 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">0% to 100%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Real Account Win Frequency</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Controls winning probability for real money wagering.</p>
                </div>
                <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">{realWinRate}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={realWinRate}
                  onChange={(e) => setRealWinRate(parseInt(e.target.value))}
                  onMouseUp={handleWinRatesSubmit}
                  onTouchEnd={handleWinRatesSubmit}
                  disabled={isProcessing}
                  className="w-full h-1.5 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">0% to 100%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Simulated Bet Frequency</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Controls the interval between background hype bets/simulation wagers.</p>
                </div>
                <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">{strategyFrequency}s</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={strategyFrequency}
                  onChange={(e) => setStrategyFrequency(parseInt(e.target.value))}
                  onMouseUp={handleStrategyFrequencySubmit}
                  onTouchEnd={handleStrategyFrequencySubmit}
                  disabled={isProcessing}
                  className="w-full h-1.5 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">5s to 300s</span>
              </div>
            </div>
          </div>
          
          {/* Maintenance Mode / Global Kill Switch */}
          <div className="border-t border-slate-200 mt-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                Global Maintenance Mode (Platform Kill Switch)
              </h4>
              <p className="text-[10px] text-slate-600 font-medium mt-1 leading-normal max-w-2xl">
                Activating Maintenance Mode immediately blocks public access to games, sportsbook wagers, cashier checkouts, and trading markets. Administrators retain access to test features and monitor telemetry records.
              </p>
            </div>
            
            <button
              onClick={handleMaintenanceToggle}
              disabled={isProcessing}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none shrink-0 ${
                maintenanceMode
                  ? "bg-rose-600 hover:bg-rose-700 text-slate-900 shadow-lg shadow-rose-500/20"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              {maintenanceMode ? "Disable Maintenance (Go Live)" : "Enable Maintenance Mode"}
            </button>
          </div>
          </div>

        {/* Game Switches Widget */}
        <div className="bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Game Kill-Switches</h3>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Toggle runtime modules for specific categories.</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(config.games).map(([gameId, game]) => (
              <div key={gameId} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl transition">
                <div className="flex items-center gap-2.5">
                  {getGameIcon(gameId)}
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{game.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${!game.disabled ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`} />
                  <button
                    onClick={() => handleGameStatusToggle(gameId, game.disabled)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !game.disabled ? 'bg-indigo-500/80 hover:bg-indigo-500' : 'bg-slate-100'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !game.disabled ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Channels Widget */}
        <div className="bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-4">
            <DollarSign className="w-5 h-5 text-pink-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Payment Gateway Status</h3>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Enable or disable incoming transaction routes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(config.paymentMethods).map(([methodId, method]) => (
              <div key={methodId} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50/50 rounded-lg flex items-center justify-center border border-slate-200">
                    {getPaymentIcon(methodId)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{method.name}</span>
                    <span className="text-[9px] text-slate-600 font-semibold uppercase block mt-0.5">{methodId === 'upi' ? 'UPI and QR Code' : methodId === 'bank' ? 'Bank Wire Transfer' : 'BTC/USDT Crypto Wallet'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${!method.disabled ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`} />
                  <button
                    onClick={() => handlePaymentStatusToggle(methodId, method.disabled)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !method.disabled ? 'bg-pink-500/80 hover:bg-pink-500' : 'bg-slate-100'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !method.disabled ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 mt-6">
            ⚠️ <strong>Admin Notice:</strong> Disabling a payment channel immediately blocks customers from initiating deposit requests or selecting the channel for withdrawals. Transactions currently under "Processing" status are unaffected and can be processed manually.
          </p>
        </div>

      </div>

    </div>
  );
}
