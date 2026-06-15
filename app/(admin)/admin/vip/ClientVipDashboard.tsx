"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/userDb";
import { useTradingStore } from "@/lib/store";
import { Crown, Search, Edit2, AlertTriangle, CheckCircle, Save, X, DollarSign, Gift } from "lucide-react";
import { adminUpdateVip, adminCreditUser } from "../actions";
import { calculateVipLevel } from "@/lib/store";

interface ClientVipDashboardProps {
  initialUsers: UserProfile[];
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ClientVipDashboard({ initialUsers }: ClientVipDashboardProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Edit state
  const [editTotalWagered, setEditTotalWagered] = useState<number>(0);
  const [editManualLevel, setEditManualLevel] = useState<string>("Auto");
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleEditClick = (user: UserProfile) => {
    setEditingUser(user);
    setEditTotalWagered(user.totalWagered || 0);
    setEditManualLevel(user.manualVipLevel || "Auto");
  };

  const handleSave = async () => {
    if (!editingUser || !currentUser) return;
    try {
      setLoading(true);
      const res = await adminUpdateVip(editingUser.email, editTotalWagered, editManualLevel, currentUser.email);
      if (res.success) {
        showToast(`Successfully updated VIP status for ${editingUser.username}`, "success");
        // Opt: update local state or let server refresh
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(`Error: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Failed to update: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setEditingUser(null);
    }
  };

  const handleInjectReward = async (email: string, amount: number) => {
    if (!currentUser) return;
    if (!confirm(`Are you sure you want to inject a VIP Reward of ₹${amount} into ${email}?`)) return;

    try {
      setLoading(true);
      const res = await adminCreditUser(email, amount, currentUser.email);
      if (res.success) {
        showToast(`Injected ₹${amount} VIP Reward successfully`, "success");
      } else {
        showToast(`Error: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Injection failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            t.type === 'success' ? 'bg-emerald-100 border-emerald-500/30 text-emerald-700' :
            t.type === 'error' ? 'bg-rose-100 border-rose-500/30 text-rose-700' :
            'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-600" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />}
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" /> VIP System Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage user VIP ranks, wager volumes, and inject VIP rewards.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by username or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">User</th>
                <th className="p-4">Balance</th>
                <th className="p-4">Total Wagered</th>
                <th className="p-4">VIP Level</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const effectiveLevel = user.manualVipLevel || calculateVipLevel(user.totalWagered || 0);
                
                return (
                  <tr key={user.email} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{user.username}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-700">
                      ₹{user.realBalance.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-700">
                      ₹{(user.totalWagered || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                        effectiveLevel === 'Diamond' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        effectiveLevel === 'Platinum' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                        effectiveLevel === 'Gold' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        effectiveLevel === 'Silver' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                        'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {effectiveLevel} {user.manualVipLevel && <span className="ml-1 opacity-50 text-[9px]">(Manual)</span>}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleInjectReward(user.email, 5000)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition tooltip-trigger relative group"
                      >
                        <Gift className="w-4 h-4" />
                        <span className="absolute -top-8 right-0 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                          Inject ₹5k Reward
                        </span>
                      </button>
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Edit VIP: {editingUser.username}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Total Wagered (₹)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={editTotalWagered}
                    onChange={(e) => setEditTotalWagered(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Manual VIP Override</label>
                <select 
                  value={editManualLevel}
                  onChange={(e) => setEditManualLevel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                >
                  <option value="Auto">Auto (Calculated from wager)</option>
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Select "Auto" to let the system determine rank from total wagered.</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? <span className="animate-spin text-lg leading-none">↻</span> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
