"use client";

import { useEffect } from "react";
import { Shield, ShieldAlert, Monitor, Smartphone, CheckCircle2, MapPin, Clock } from "lucide-react";
import { useTradingStore } from "@/lib/store";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

function maskIP(ip: string): string {
  if (!ip) return "Unknown";
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xx.xx`;
  }
  return ip;
}

export default function ActivityLogPage() {
  const { currentUser, activityLogs, fetchActivityLogs } = useTradingStore();

  useEffect(() => {
    if (currentUser) {
      fetchActivityLogs();
    }
  }, [currentUser, fetchActivityLogs]);

  const displayLogs = activityLogs || [];

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
        
        {displayLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            No activity logs found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayLogs.map(log => (
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
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatTimeAgo(log.timestamp)}</span>
                  <span className="text-xs font-mono text-slate-400 mt-1">{maskIP(log.ip)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
