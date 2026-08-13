"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { PaymentSettings, BtcAddressConfig } from "@/lib/paymentConfig";
import { adminUpdatePaymentSettingsAction, adminUploadPaymentQrAction } from "../actions";
import { 
  Coins, Smartphone, CreditCard, Bitcoin, ShieldCheck, 
  Save, RefreshCw, CheckCircle, AlertTriangle, Eye, ArrowLeft,
  Upload, Trash2, Plus, Check, ToggleLeft, ToggleRight, X, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

interface Props {
  initialSettings: PaymentSettings;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function ClientPaymentSettingsDashboard({ initialSettings }: Props) {
  const currentUser = useTradingStore(state => state.currentUser);
  const adminEmail = currentUser?.username || currentUser?.email || "admin";

  const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
  const [formData, setFormData] = useState<PaymentSettings>(initialSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null); // 'upi' or btcAddress id
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // New BTC Address temp form state
  const [newBtcLabel, setNewBtcLabel] = useState("");
  const [newBtcAddress, setNewBtcAddress] = useState("");
  const [newBtcQrUrl, setNewBtcQrUrl] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'upi' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("Image size exceeds 3MB limit.", "error");
      return;
    }

    setIsUploading(target);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await adminUploadPaymentQrAction(
          reader.result as string, 
          target === 'upi' ? 'upi-qr' : `btc-qr-${target}`,
          adminEmail
        );
        
        if (res.success && res.url) {
          showToast("QR Image uploaded successfully!", "success");
          if (target === 'upi') {
            setFormData(prev => ({
              ...prev,
              upiQrImageUrl: res.url
            }));
          } else if (target === 'new-btc') {
            setNewBtcQrUrl(res.url);
          } else {
            setFormData(prev => ({
              ...prev,
              btcAddresses: prev.btcAddresses.map(addr => 
                addr.id === target ? { ...addr, qrImageUrl: res.url } : addr
              )
            }));
          }
        } else {
          showToast(res.error || "Upload failed", "error");
        }
      } catch {
        showToast("Error processing file upload", "error");
      } finally {
        setIsUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add new BTC address config
  const handleAddBtcAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newBtcLabel.trim();
    const address = newBtcAddress.trim();

    if (!label || !address) {
      showToast("Label and BTC address are required.", "error");
      return;
    }

    const newConfig: BtcAddressConfig = {
      id: `btc_${Date.now()}`,
      label,
      address,
      qrImageUrl: newBtcQrUrl || undefined,
      isActive: formData.btcAddresses.length === 0 // Active if first
    };

    setFormData(prev => ({
      ...prev,
      btcAddresses: [...prev.btcAddresses, newConfig]
    }));

    setNewBtcLabel("");
    setNewBtcAddress("");
    setNewBtcQrUrl("");
    showToast("Added new Bitcoin address to registry.", "success");
  };

  // Delete BTC address config
  const handleDeleteBtcAddress = (id: string) => {
    setFormData(prev => {
      const filtered = prev.btcAddresses.filter(addr => addr.id !== id);
      // Auto-activate another one if deleted active
      const wasActive = prev.btcAddresses.find(addr => addr.id === id)?.isActive;
      if (wasActive && filtered.length > 0) {
        filtered[0].isActive = true;
      }
      return {
        ...prev,
        btcAddresses: filtered
      };
    });
    showToast("Removed Bitcoin address config.", "success");
  };

  // Toggle active status for BTC address (single active schema)
  const handleToggleBtcActive = (id: string) => {
    setFormData(prev => ({
      ...prev,
      btcAddresses: prev.btcAddresses.map(addr => ({
        ...addr,
        isActive: addr.id === id
      }))
    }));
    showToast("Switched active Bitcoin receiver.", "success");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await adminUpdatePaymentSettingsAction(formData, adminEmail);
      if (res.success) {
        showToast("Configurations saved & published live!", "success");
        setSettings(formData);
      } else {
        showToast(res.error || "Failed to update configurations.", "error");
      }
    } catch {
      showToast("Network error executing update.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const activeBtcAddress = formData.btcAddresses.find(addr => addr.isActive) || formData.btcAddresses[0];

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-slate-50 text-slate-900">
      
      {/* Toast Alert list */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
            t.type === 'success' ? 'bg-emerald-100 border-emerald-500/30 text-emerald-700' :
            'bg-rose-100 border-rose-500/30 text-rose-700'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-600" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Cyber gradient lights */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[380px] h-[380px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none" />

      {/* Header bar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 opacity-60 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <Coins className="w-7 h-7 text-teal-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase">Gateway Settings</h1>
              <span className="text-[9px] font-black text-teal-600 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 tracking-widest uppercase">Billion Dollar Setup</span>
            </div>
            <p className="text-xs text-slate-600 font-medium tracking-wide uppercase mt-1">Configure active deposit QR codes, UPI IDs, Crypto addresses, and bank wire information.</p>
          </div>
        </div>

        <Link 
          href="/admin"
          className="px-4 py-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Side: Configuration Forms (col-span 7) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* UPI Gateway Card */}
          <div className="bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
              <Smartphone className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">UPI Gateway & custom QR Code</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Toggle dynamic QR generator vs static uploaded QR codes.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">General UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="e.g. aurabet@okaxis"
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">UPI QR Display Mode</label>
                  <select
                    name="upiQrType"
                    value={formData.upiQrType}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-teal-500/80 transition-colors cursor-pointer"
                  >
                    <option value="dynamic">Dynamic QR Generator (Default)</option>
                    <option value="custom">Custom Uploaded QR Image</option>
                  </select>
                </div>
              </div>

              {formData.upiQrType === 'custom' && (
                <div className="p-4 bg-slate-50/40 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Upload Custom UPI QR Image</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-teal-500/40 rounded-xl py-6 px-4 bg-slate-50 hover:bg-slate-50/30 transition-all cursor-pointer group text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'upi')}
                        className="hidden"
                      />
                      {isUploading === 'upi' ? (
                        <RefreshCw className="w-5 h-5 text-teal-600 animate-spin mb-1.5" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-600 group-hover:text-teal-600 transition-colors mb-1.5" />
                      )}
                      <span className="text-[10px] text-slate-600 group-hover:text-slate-700 font-medium">Click to upload custom QR Code</span>
                      <span className="text-[8px] text-slate-600 mt-0.5">PNG or JPG up to 3MB</span>
                    </label>
                    
                    {formData.upiQrImageUrl ? (
                      <div className="relative w-24 h-24 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center border border-slate-200 group">
                        <img 
                          src={formData.upiQrImageUrl} 
                          alt="Custom UPI QR" 
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, upiQrImageUrl: "" }))}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-slate-900 rounded-full p-0.5 shadow-md cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center text-slate-600 text-[10px] font-bold uppercase shrink-0">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">GPay UPI ID</label>
                  <input
                    type="text"
                    name="gpayId"
                    value={formData.gpayId}
                    onChange={handleInputChange}
                    placeholder="e.g. gpay@UPI"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">PhonePe UPI ID</label>
                  <input
                    type="text"
                    name="phonepeId"
                    value={formData.phonepeId}
                    onChange={handleInputChange}
                    placeholder="e.g. phonepe@UPI"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500/80 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bitcoin Wallet Manager Card */}
          <div className="bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
              <Bitcoin className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Multi-Bitcoin Address registry</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Configure cold storage rotation list and upload custom QR codes.</p>
              </div>
            </div>

            {/* List of configured addresses */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block pl-1">Configured Receivers</span>
              {formData.btcAddresses.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  No Bitcoin addresses configured yet.
                </div>
              ) : (
                formData.btcAddresses.map((addr) => (
                  <div key={addr.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">{addr.label}</span>
                        {addr.isActive && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest animate-pulse-glow">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleBtcActive(addr.id)}
                          className="text-[10px] font-black uppercase text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          {addr.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteBtcAddress(addr.id)}
                          className="text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2">
                      <div className="flex-1 bg-white/40 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-mono text-amber-500 font-bold truncate">
                        {addr.address}
                      </div>

                      {/* Custom QR code for individual BTC address */}
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="bg-slate-50 hover:bg-slate-850 border border-slate-200 text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, addr.id)}
                            className="hidden"
                          />
                          <Upload className="w-3.5 h-3.5" />
                          QR Image
                        </label>

                        {addr.qrImageUrl ? (
                          <div className="relative w-9 h-9 bg-white p-0.5 rounded border border-slate-200 shrink-0">
                            <img src={addr.qrImageUrl} alt="Btc QR" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  btcAddresses: prev.btcAddresses.map(a => a.id === addr.id ? { ...a, qrImageUrl: undefined } : a)
                                }));
                              }}
                              className="absolute -top-1 -right-1 bg-red-600 text-slate-900 rounded-full p-0.5 scale-75"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest bg-slate-50/60 border border-slate-200 px-2 py-2 rounded shrink-0">
                            Auto QR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form to add a new address */}
            <div className="p-4 bg-slate-50/20 border border-slate-200/80 rounded-xl space-y-4">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><Plus className="w-4 h-4 text-amber-600" /> Registry New Receiver Wallet</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Private Wallet Label (e.g. VIP Vault)"
                    value={newBtcLabel}
                    onChange={(e) => setNewBtcLabel(e.target.value)}
                    className="w-full bg-white/80 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="BTC Wallet Address"
                    value={newBtcAddress}
                    onChange={(e) => setNewBtcAddress(e.target.value)}
                    className="w-full bg-white/80 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                {/* Optional Custom QR image upload for the new BTC Address */}
                <div className="flex items-center gap-2">
                  <label className="bg-white/60 border border-slate-200 hover:border-slate-200 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'new-btc')}
                      className="hidden"
                    />
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    Upload QR Image
                  </label>
                  
                  {newBtcQrUrl && (
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      QR Staged
                      <button type="button" onClick={() => setNewBtcQrUrl("")} className="text-slate-600 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddBtcAddress}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md cursor-pointer transition shrink-0 self-end"
                >
                  Add to Registry
                </button>
              </div>
            </div>

          </div>

          {/* Bank Wire Details Card */}
          <div className="bg-white/45 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">IMPS / Bank Details</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Bank transfer instructions for card/wire selections.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="e.g. State Bank of India"
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Account Holder Name</label>
                <input
                  type="text"
                  name="bankHolderName"
                  value={formData.bankHolderName}
                  onChange={handleInputChange}
                  placeholder="e.g. AuraBet Operations Pvt Ltd"
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Account Number</label>
                <input
                  type="text"
                  name="bankAccountNo"
                  value={formData.bankAccountNo}
                  onChange={handleInputChange}
                  placeholder="e.g. 999888777666"
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">IFSC Code</label>
                <input
                  type="text"
                  name="bankIfsc"
                  value={formData.bankIfsc}
                  onChange={handleInputChange}
                  placeholder="e.g. SBIN0001234"
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" /> Save payment configurations
                </>
              )}
            </button>
          </div>

        </form>

        {/* Right Side: Visual Live Mockup Preview (col-span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/60 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Eye className="w-16 h-16 text-slate-900" />
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6">
              <Eye className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Live Client Preview Mockup</h3>
            </div>

            <p className="text-[10px] text-slate-600 leading-normal mb-6 uppercase tracking-wider font-semibold">
              This preview shows how payment details are loaded inside the player's secure Cashier modal when choosing payment methods.
            </p>

            <div className="space-y-6 bg-slate-50/60 border border-slate-200 p-5 rounded-2xl">
              
              {/* UPI Preview Box */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">UPI / QR SCAN METHOD</span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="bg-white p-1 rounded-lg shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden border border-slate-200">
                    {formData.upiQrType === 'custom' && formData.upiQrImageUrl ? (
                      <img 
                        src={formData.upiQrImageUrl} 
                        alt="Uploaded UPI QR" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`upi://pay?pa=${formData.upiId}&pn=AuraBet&am=1000&cu=INR`)}`}
                        alt="Mock QR"
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <div className="text-left space-y-1 min-w-0 flex-1">
                    <span className="text-[9px] text-slate-600 font-bold block">Dynamic Address:</span>
                    <span className="font-mono text-xs text-emerald-600 font-bold block truncate">{formData.upiId}</span>
                    <div className="flex gap-2.5 text-[8px] text-slate-600 font-bold mt-1">
                      <span>GPay: {formData.gpayId.split('@')[0]}</span>
                      <span>PhonePe: {formData.phonepeId.split('@')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bitcoin Address Preview */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">BITCOIN WALLET ADDRESS (ACTIVE)</span>
                {activeBtcAddress ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="bg-white p-1 rounded-lg shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden border border-slate-200">
                      {activeBtcAddress.qrImageUrl ? (
                        <img 
                          src={activeBtcAddress.qrImageUrl} 
                          alt="Uploaded BTC QR" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(activeBtcAddress.address)}`}
                          alt="Auto QR"
                          className="w-full h-full"
                        />
                      )}
                    </div>
                    <div className="text-left space-y-1 min-w-0 flex-1">
                      <span className="text-[9px] text-slate-600 font-bold block">{activeBtcAddress.label}:</span>
                      <span className="font-mono text-[10px] text-amber-500 font-bold block truncate">{activeBtcAddress.address}</span>
                      <span className="text-[8px] text-slate-600 block">Auto QR generator will fall back if custom QR is unassigned.</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center text-xs text-slate-600 font-bold italic">
                    No active Bitcoin addresses configured.
                  </div>
                )}
              </div>

              {/* Bank Transfer Details Preview */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">BANK WIRE METHOD</span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-[9px] uppercase">Bank:</span>
                    <span className="text-slate-700 font-bold">{formData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-[9px] uppercase">Account:</span>
                    <span className="text-slate-800 font-bold">{formData.bankAccountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-[9px] uppercase">IFSC:</span>
                    <span className="text-slate-800 font-bold">{formData.bankIfsc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-[9px] uppercase">Holder:</span>
                    <span className="text-slate-700 font-bold">{formData.bankHolderName}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
