"use client";

import { Shield, ShieldAlert, Monitor, Smartphone, CheckCircle2, MapPin, Clock } from "lucide-react";
import { useTradingStore } from "@/lib/store";

export default function ActivityLogPage() {
  const { currentUser } = useTradingStore();

  // Mock activity log data for UI purposes
  const mockLogs = [
    { id: 1, action: "Successful Login", device: "Chrome / Windows 11", location: "Bangalore, IN", ip: "103.44.xx.xx", time: "Just now", type: 'success' },
    { id: 2, action: "Account Context Switched", device: "Chrome / Windows 11", location: "Bangalore, IN", ip: "103.44.xx.xx", time: "2 hours ago", type: 'info' },
    { id: 3, action: "Withdrawal Requested", device: "Safari / iOS 17", location: "Bangalore, IN", ip: "103.44.xx.xx", time: "1 day ago", type: 'info' },
    { id: 4, action: "Failed Login Attempt", device: "Firefox / Unknown", location: "Moscow, RU", ip: "45.12.xx.xx", time: "3 days ago", type: 'danger' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Activity Log
          </h1>
          <p className="text-slate-500 font-medium mt-2">Monitor account access, security events, and active sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4 hover:shadow-sm transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-1">Account Secure</h3>
            <p className="text-sm text-emerald-700 font-medium leading-relaxed">We haven't detected any unauthorized access to your account. 2FA is currently active.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-red-500" /> Current Session
            </h3>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded">Active</span>
          </div>
          <div className="text-sm text-slate-500 font-medium flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Bangalore, IN</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Started 2h ago</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-500" /> Recent Security Events
          </h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {mockLogs.map(log => (
            <div key={log.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  log.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                  log.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-red-100 text-red-600'
                }`}>
                  {log.type === 'danger' ? <ShieldAlert className="w-5 h-5" /> : 
                   log.device.includes('iOS') || log.device.includes('Android') ? <Smartphone className="w-5 h-5" /> : 
                   <Monitor className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${log.type === 'danger' ? 'text-red-600' : 'text-slate-900'}`}>{log.action}</h4>
                  <div className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {log.device}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {log.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.time}</span>
                <span className="text-xs font-mono text-slate-400 mt-1">{log.ip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
