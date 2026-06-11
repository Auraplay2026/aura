import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center relative z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none -z-10" />
      
      <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
        <AlertTriangle className="w-12 h-12 text-neon-purple" />
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-6 uppercase tracking-widest">
        Sector Not Found
      </h2>
      
      <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
        The terminal you are trying to access doesn't exist, has been restricted, or is currently experiencing quantum interference.
      </p>
      
      <Link 
        href="/"
        className="bg-white hover:bg-slate-200 text-black font-black px-8 py-4 rounded-xl uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Return to Lobby
      </Link>
    </div>
  );
}
