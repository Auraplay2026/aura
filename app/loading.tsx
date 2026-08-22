export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="relative flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-slate-200 rounded-full border-t-amber-500 border-r-indigo-500 animate-spin shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
        <div className="mt-4 text-slate-500 font-bold uppercase tracking-[0.15em] text-xs animate-pulse flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Loading
        </div>
      </div>
    </div>
  );
}
