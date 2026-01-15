import Link from "next/link";
import { Terminal, History, Menu } from "lucide-react"; // Import Menu
import ThemeToggle from "../common/ThemeToggle";

interface HeaderProps {
  onMenuClick?: () => void; // New prop to handle click
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="w-full flex items-center justify-between p-4 text-slate-700 dark:text-slate-200 border-b border-transparent md:border-none">
      
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        
        {/* Mobile Menu Button (Hidden on Desktop) */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Title / Breadcrumbs */}
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">Codebase AI</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <span className="flex items-center gap-2">
             <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Beta</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <Link href="/history" className="hover:bg-slate-700 dark:hover:bg-white/10 p-2 rounded-lg transition-colors" title="History">
          <History size={20} />
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
}