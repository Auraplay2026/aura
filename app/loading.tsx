export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020205] bg-opacity-80 backdrop-blur-sm">
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-slate-800 rounded-full border-t-neon-purple border-r-indigo-500 animate-spin shadow-[0_0_30px_rgba(168,85,247,0.5)]"></div>
        <div className="mt-6 text-slate-300 font-bold uppercase tracking-[0.2em] text-sm animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-purple"></span>
          Loading Sector
        </div>
      </div>
    </div>
  );
}
