import { Github, Loader2, Database, PlusCircle } from "lucide-react";
import { RepoStats } from "@/types";

interface SidebarProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  loadingRepo: boolean;
  handleLoadRepo: () => void;
  repoLoaded: boolean;
  repoStats: RepoStats | null;
  onNewChat: () => void; // <--- 1. Add this new prop
}

export default function Sidebar({
  repoUrl,
  setRepoUrl,
  loadingRepo,
  handleLoadRepo,
  repoLoaded,
  repoStats,
  onNewChat, // <--- 2. Destructure it
}: SidebarProps) {
  return (
    <aside className="lg:col-span-1">
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 sticky top-32">
        
        {/* 3. Update Header Area to include New Chat Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Github size={14} /> Repository Setup
          </h2>
          
          <button 
            onClick={onNewChat}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition border border-emerald-200"
            title="Reset and start new chat"
          >
            <PlusCircle size={12} /> New
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 ml-1 mb-1 block">
              GitHub URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition shadow-inner"
            />
          </div>

          <button
            onClick={handleLoadRepo}
            disabled={loadingRepo || !repoUrl}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200/50 transition-all flex justify-center items-center gap-2 active:scale-95"
          >
            {loadingRepo ? <Loader2 className="animate-spin" size={18} /> : "Load Repository"}
          </button>
        </div>

        {repoLoaded && repoStats && (
          <div className="mt-6 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-xs text-emerald-800 animate-in">
            <div className="flex items-center gap-2 mb-3 font-bold text-emerald-700">
              <Database size={14} /> Index Status
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                <span>Files Scanned</span>
                <span className="font-mono font-bold">{repoStats.files_count}</span>
              </div>
              <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                <span>Total Chunks</span>
                <span className="font-mono font-bold">{repoStats.chunks_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}