"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { WhatsAppConfig } from "@/lib/notificationService";
import { adminUpdateWhatsAppConfigAction, adminTestWhatsAppAction } from "../actions";
import { 
  MessageCircle, Save, RefreshCw, CheckCircle, AlertTriangle, Send, ArrowLeft,
  HelpCircle, Info, ToggleLeft, ToggleRight, Settings, Phone, Check, ShieldAlert
} from "lucide-react";
import Link from "next/link";

interface Props {
  initialConfig: WhatsAppConfig;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function ClientWhatsAppSettingsDashboard({ initialConfig }: Props) {
  const currentUser = useTradingStore(state => state.currentUser);
  const adminEmail = currentUser?.email || "admin@aurabet.io";

  const [config, setConfig] = useState<WhatsAppConfig>(initialConfig);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Testing WhatsApp state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Hello from AuraBet! Your test deposit confirmation is successful. 🚀");
  const [isTesting, setIsTesting] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setConfig(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const toggleEnabled = () => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
    showToast(`WhatsApp alerts globally ${!config.enabled ? 'Enabled' : 'Disabled'}.`, "success");
  };

  const toggleNotifyUser = () => {
    setConfig(prev => ({ ...prev, notifyUser: !prev.notifyUser }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await adminUpdateWhatsAppConfigAction(config, adminEmail);
      if (res.success) {
        showToast("WhatsApp configuration saved and deployed live!", "success");
      } else {
        showToast(res.error || "Failed to update configuration.", "error");
      }
    } catch {
      showToast("Network error executing update.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestSend = async () => {
    if (!testPhone || testPhone.trim().length < 10) {
      showToast("Please enter a valid phone number (include country code, e.g. +919876543210).", "error");
      return;
    }
    setIsTesting(true);
    try {
      const res = await adminTestWhatsAppAction(testPhone, testMessage, adminEmail);
      if (res.success) {
        showToast("Test message dispatched successfully!", "success");
      } else {
        showToast(res.error || "Failed to dispatch test message.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch test message.", "error");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-[#030307] text-slate-100 animate-fade-in">
      
      {/* Toast Alert list */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
            'bg-rose-950/80 border-rose-500/30 text-rose-300'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Background neon elements */}
      <div className="absolute top-[5%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[110px] pointer-events-none" />

      {/* Header bar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-widest uppercase">WhatsApp Automation</h1>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 tracking-widest uppercase">In-house CRM</span>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">Configure real-time WhatsApp confirmations for player deposits, approvals, and admin alerts.</p>
          </div>
        </div>

        <Link 
          href="/admin"
          className="px-4 py-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Global toggle banner */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${
        config.enabled 
          ? 'bg-emerald-950/20 border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.05)]' 
          : 'bg-slate-950/45 border-white/5'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
            <Settings className={`w-5 h-5 ${config.enabled && 'animate-spin-slow'}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">WhatsApp Business Automation Service</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {config.enabled 
                ? "Status: ACTIVE. All system deposit events will invoke the dispatch service to message users/admins." 
                : "Status: STANDBY. WhatsApp notification dispatch is offline. Other systems (Email, SMS) continue to function."
              }
            </p>
          </div>
        </div>

        <button
          onClick={toggleEnabled}
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/10 text-slate-200 transition-all cursor-pointer font-bold text-xs uppercase tracking-widest shrink-0"
        >
          {config.enabled ? (
            <>
              <ToggleRight className="w-7 h-7 text-emerald-400" />
              Service ON
            </>
          ) : (
            <>
              <ToggleLeft className="w-7 h-7 text-slate-500" />
              Service OFF
            </>
          )}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: configuration form (col-span 7) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* Provider Selection Card */}
          <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">WhatsApp Service Provider</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Select the backend gateway provider for WhatsApp Business API.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CallMeBot Selector */}
              <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                config.provider === 'callmebot' 
                  ? 'bg-emerald-500/5 border-emerald-500/40 text-white' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="callmebot"
                  checked={config.provider === 'callmebot'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">CallMeBot (Sandbox)</span>
                  {config.provider === 'callmebot' && <Check className="w-4.5 h-4.5 text-emerald-400" />}
                </div>
                <span className="text-[9px] text-slate-500 mt-2 font-medium">Free, simplest setup. Excellent for developer testing. No registration needed.</span>
              </label>

              {/* Meta Selector */}
              <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                config.provider === 'meta' 
                  ? 'bg-emerald-500/5 border-emerald-500/40 text-white' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="meta"
                  checked={config.provider === 'meta'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">Meta Cloud API</span>
                  {config.provider === 'meta' && <Check className="w-4.5 h-4.5 text-emerald-400" />}
                </div>
                <span className="text-[9px] text-slate-500 mt-2 font-medium">Official Business API. 1,000 free conversations per month. Fast & official.</span>
              </label>

              {/* Twilio Selector */}
              <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                config.provider === 'twilio' 
                  ? 'bg-emerald-500/5 border-emerald-500/40 text-white' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="twilio"
                  checked={config.provider === 'twilio'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">Twilio WhatsApp</span>
                  {config.provider === 'twilio' && <Check className="w-4.5 h-4.5 text-emerald-400" />}
                </div>
                <span className="text-[9px] text-slate-500 mt-2 font-medium">Robust enterprise SMS/WhatsApp gateway. Twilio credit rates apply.</span>
              </label>
            </div>
          </div>

          {/* Provider Specific Configuration Card */}
          <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <Settings className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Gateway Configuration Details</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Parameters required for your active WhatsApp service provider.</p>
              </div>
            </div>

            {/* Provider: CallMeBot */}
            {config.provider === 'callmebot' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wide">
                    <strong className="text-white block mb-1">CallMeBot activation instructions:</strong>
                    1. Save <strong className="text-white">+34 644 52 74 86</strong> in your WhatsApp contacts.<br />
                    2. Send message: <strong className="text-white">I allow callmebot to send me messages</strong> to that contact.<br />
                    3. The bot will instantly reply with your <strong className="text-white">API Key</strong>. Put it in the box below!
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">CallMeBot API Key</label>
                    <input
                      type="text"
                      name="callMeBotApiKey"
                      value={config.callMeBotApiKey}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sender/Admin Phone (Activated)</label>
                    <input
                      type="text"
                      name="callMeBotPhone"
                      value={config.callMeBotPhone}
                      onChange={handleInputChange}
                      placeholder="e.g. +919876543210"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Provider: Meta Cloud API */}
            {config.provider === 'meta' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-blue-950/15 border border-blue-500/10 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wide">
                    <strong className="text-white block mb-1">Meta Business Setup Information:</strong>
                    Get your Phone Number ID and Permanent Access Token from <strong className="text-white">developers.facebook.com</strong> &gt; WhatsApp Setup.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Phone Number ID</label>
                    <input
                      type="text"
                      name="metaPhoneNumberId"
                      value={config.metaPhoneNumberId}
                      onChange={handleInputChange}
                      placeholder="e.g. 10927891240182"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Permanent Access Token</label>
                    <input
                      type="password"
                      name="metaAccessToken"
                      value={config.metaAccessToken}
                      onChange={handleInputChange}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meta Template Name</label>
                    <input
                      type="text"
                      name="metaTemplateName"
                      value={config.metaTemplateName}
                      onChange={handleInputChange}
                      placeholder="e.g. deposit_notification"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Template Language</label>
                    <input
                      type="text"
                      name="metaTemplateLanguage"
                      value={config.metaTemplateLanguage}
                      onChange={handleInputChange}
                      placeholder="e.g. en"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Provider: Twilio */}
            {config.provider === 'twilio' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Twilio Account SID</label>
                    <input
                      type="text"
                      name="twilioAccountSid"
                      value={config.twilioAccountSid}
                      onChange={handleInputChange}
                      placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Twilio Auth Token</label>
                    <input
                      type="password"
                      name="twilioAuthToken"
                      value={config.twilioAuthToken}
                      onChange={handleInputChange}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Twilio WhatsApp From (e.g. Sandbox Number)</label>
                  <input
                    type="text"
                    name="twilioWhatsAppFrom"
                    value={config.twilioWhatsAppFrom}
                    onChange={handleInputChange}
                    placeholder="whatsapp:+14155238886"
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CRM Notification Targets Card */}
          <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <Phone className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Notification Channels</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Configure target recipients for notification alerts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Admin Alert Phone Number (Receive Deposit Requests)</label>
                <input
                  type="text"
                  name="adminWhatsAppNumber"
                  value={config.adminWhatsAppNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. +919876543210"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 p-3 bg-slate-900/30 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer select-none transition py-3 px-4 h-12">
                  <input
                    type="checkbox"
                    name="notifyUser"
                    checked={config.notifyUser}
                    onChange={toggleNotifyUser}
                    className="w-4 h-4 rounded border-white/10 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Notify Users directly</span>
                    <span className="text-[8px] text-slate-500 block">Sends approved/rejected alerts to user's WhatsApp number.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Configurations Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer h-14"
          >
            {isProcessing ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <>
                <Save className="w-4.5 h-4.5" /> Save CRM configurations
              </>
            )}
          </button>
        </form>

        {/* Right column: Interactive Testing Panel & Guidelines (col-span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive testing panel */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Send className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Manual CRM Sandbox Dispatcher</h3>
            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-wider leading-relaxed font-semibold">
              Test your configuration with a real-time manual dispatch. Make sure you have activated the sandbox phone number if using CallMeBot.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient Number (with country code)</label>
                <input
                  type="text"
                  placeholder="e.g. +919876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CRM Message Body</label>
                <textarea
                  placeholder="Type testing message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-colors resize-none font-medium"
                />
              </div>

              <button
                type="button"
                onClick={handleTestSend}
                disabled={isTesting}
                className="w-full bg-slate-900 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Dispatch Test Message
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CRM Notification templates */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Notification States</h3>
            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-wider leading-relaxed font-semibold">
              The system fires automated WhatsApp notifications at the following trigger points:
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/30 border border-white/5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-200 font-bold block uppercase">Deposit Request Received</span>
                  <span className="text-[8.5px] text-slate-500 block uppercase mt-0.5">Admin receives detailed alert with User phone, UTR and review URL.</span>
                </div>
                <span className="text-[8px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/10 font-bold uppercase tracking-wider shrink-0">Pending</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/30 border border-white/5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-200 font-bold block uppercase">Deposit Request Approved</span>
                  <span className="text-[8.5px] text-slate-500 block uppercase mt-0.5">User receives official confirmation with amount and wallet balance.</span>
                </div>
                <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase tracking-wider shrink-0">Credited</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/30 border border-white/5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-200 font-bold block uppercase">Withdrawal Completed</span>
                  <span className="text-[8.5px] text-slate-500 block uppercase mt-0.5">User receives a notification that their withdrawal has been sent.</span>
                </div>
                <span className="text-[8px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10 font-bold uppercase tracking-wider shrink-0">Processed</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
