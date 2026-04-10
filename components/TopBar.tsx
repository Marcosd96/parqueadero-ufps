import Link from "next/link";

export default function TopBar() {
  return (
    <header className="flex justify-between items-center w-full px-6 py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/15 dark:border-slate-800/15 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 text-blue-700">
          <span className="material-symbols-outlined">local_parking</span>
          <span className="font-[var(--font-headline)] font-bold text-slate-900 tracking-tight">
            Zone Map
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-[var(--font-label)] text-[0.875rem] hover:text-slate-800 cursor-pointer transition-all">
          <span className="material-symbols-outlined">gate</span>
          <span>Gate Control</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-full text-[0.75rem] font-bold">
          <span className="w-2 h-2 bg-[var(--color-error)] rounded-full" />
          New Alert
        </div>
        <div className="text-[0.75rem] font-[var(--font-label)] text-slate-400">
          System Status:{" "}
          <span className="text-[var(--color-primary)] font-bold">Operational</span>
        </div>
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          <button className="text-slate-500 hover:text-[var(--color-primary)] transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="flex items-center gap-2">
            <img
              alt="Administrator Avatar"
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqrra-PZI-FS2wPTUcB6vHdFkHftRCe4_ms0RaEe5FeLEyWkDZtnvnukYX6jn9CjcRJPOGcITiouOE6eKUvV6L8gRv3rO6sfN4Vr09rVtwj0_eiaklVPtrbjA-7pFmAYXlbgND7zs8FdHJ7tPdEFRR1VXBNq7KiBMMdMkaTSpyprwbwOCCaTiEYvYlShGUMRT390Ylh-waG4TSGa6CNw7scZbtnS-FQVUzl-69o43Jdu7sdjWyens8blol-JGOrT7tAk5vj5m0hyL-"
            />
            <span className="material-symbols-outlined text-slate-400">account_circle</span>
          </div>
        </div>
      </div>
    </header>
  );
}
