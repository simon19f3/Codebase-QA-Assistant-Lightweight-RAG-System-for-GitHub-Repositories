import Link from "next/link";
import { Terminal, History, Home } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-6 left-0 right-0 mx-auto max-w-6xl px-4 z-50">
      <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-sm rounded-2xl p-4 flex items-center justify-between gap-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-2.5 rounded-xl border border-emerald-200">
            <Terminal className="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Codebase AI</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Next.js • FastAPI
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex gap-2">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-white/50 rounded-lg transition-all"
          >
            <Home size={16} /> <span className="hidden sm:inline">Home</span>
          </Link>
          <Link 
            href="/history" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-white/50 rounded-lg transition-all"
          >
            <History size={16} /> <span className="hidden sm:inline">History</span>
          </Link>
        </nav>

      </div>
    </header>
  );
}