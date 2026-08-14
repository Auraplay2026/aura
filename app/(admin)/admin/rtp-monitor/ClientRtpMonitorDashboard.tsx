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
  const adminEmail = currentUser?.username || currentUser?.email || "admin";

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

      {/* Header Bar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Sliders className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Game Win & Payout Settings</h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Control how much players win and turn individual games or deposit methods on/off.</p>
          </div>
        </div>
      </header>

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* House Edge Widget */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Company House Profit Edge</h3>
                <p className="text-xs text-slate-500 mt-0.5">How much percentage the platform keeps on average across casino games (Mines, Dice, Plinko, etc.).</p>
              </div>
            </div>
            <div className="bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl text-center">
              <span className="font-mono text-base font-black text-amber-800">{houseEdge.toFixed(1)}%</span>
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
              />
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest shrink-0 font-mono">0% to 15%</span>
            </div>
            
            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              💡 <strong>Simple Explanation:</strong> A 3% to 5% house edge means players get fair odds and regular payouts while the platform keeps a steady 3% - 5% profit margin. Changes take effect instantly on all live games.
            </p>
          </div>

          {/* Win Rates & Strategy Frequency configuration */}
          <div className="border-t border-slate-200 mt-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Demo / Practice Win Chance</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Win rate for guests playing in demo mode</p>
                </div>
                <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">{demoWinRate}%</span>
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0 font-mono">0% - 100%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Real Money Win Chance</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Win rate for players playing with real money</p>
                </div>
                <span className="font-mono text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200">{realWinRate}%</span>
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0 font-mono">0% - 100%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Test Bet Activity Rate</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Seconds between background simulated bets</p>
                </div>
                <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200">{strategyFrequency}s</span>
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0 font-mono">5s - 300s</span>
              </div>
            </div>
          </div>
          
          {/* Maintenance Mode / Global Kill Switch */}
          <div className="border-t border-slate-200 mt-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-rose-600" />
                Temporary Website Maintenance Switch
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-normal max-w-2xl">
                Turning this ON displays a friendly "Under Maintenance" message to all regular visitors while you perform updates or testing. You (Admin) can still log in and view the site normally.
              </p>
            </div>
            
            <button
              onClick={handleMaintenanceToggle}
              disabled={isProcessing}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none shrink-0 shadow-sm ${
                maintenanceMode
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              {maintenanceMode ? "Turn Off Maintenance (Go Live)" : "Turn On Maintenance Mode"}
            </button>
          </div>
        </div>

        {/* Game Switches Widget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Turn Games On / Off</h3>
              <p className="text-xs text-slate-500 mt-0.5">Temporarily disable specific games for players.</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(config.games).map(([gameId, game]) => (
              <div key={gameId} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition">
                <div className="flex items-center gap-2.5">
                  {getGameIcon(gameId)}
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{game.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${!game.disabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <button
                    onClick={() => handleGameStatusToggle(gameId, game.disabled)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !game.disabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !game.disabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Channels Widget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Turn Deposit Methods On / Off</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enable or disable UPI, Bank Transfer, or Crypto deposits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(config.paymentMethods).map(([methodId, method]) => (
              <div key={methodId} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-xs">
                    {getPaymentIcon(methodId)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">{method.name}</span>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">{methodId === 'upi' ? 'UPI & QR Code' : methodId === 'bank' ? 'Direct Bank Transfer' : 'Crypto Wallet'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${!method.disabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <button
                    onClick={() => handlePaymentStatusToggle(methodId, method.disabled)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !method.disabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !method.disabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 mt-6">
            ⚠️ <strong>Admin Note:</strong> Disabling a payment method hides it from players when they open the Cashier. Any pending deposit requests currently waiting for your review can still be approved or rejected normally.
          </p>
        </div>

      </div>

    </div>
  );
}
