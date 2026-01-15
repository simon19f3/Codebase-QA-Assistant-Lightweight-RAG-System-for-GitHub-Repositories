"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Github, Calendar, FileCode, MessageSquare, ArrowRight, Clock } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { HistoryItem } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // --- UI State for Mobile Sidebar ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Sidebar State (Local) ---
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("repo_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your history?")) {
      localStorage.removeItem("repo_history");
      setHistory([]);
    }
  };

  // --- Handlers ---
  const handleNewChat = () => {
    router.push("/");
  };

  const handleSidebarLoad = () => {
    if (repoUrl) {
      router.push(`/?repo=${encodeURIComponent(repoUrl)}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--background)] overflow-hidden font-sans">
      
      {/* 1. DESKTOP SIDEBAR (Hidden on Mobile) */}
      <div className="hidden md:block w-[260px] flex-shrink-0 h-full border-r border-[var(--border)] bg-[var(--surface-muted)]">
        <Sidebar
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          loadingRepo={loadingRepo}
          handleLoadRepo={handleSidebarLoad}
          repoLoaded={false}
          repoStats={null}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>

      {/* 2. MOBILE SIDEBAR (Glass Overlay) - ADDED THIS */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar Panel */}
            <div className="relative w-[280px] h-full bg-white/95 dark:bg-[#171717]/95 backdrop-blur-xl border-r border-white/20 shadow-2xl animate-in slide-in-from-left-full duration-300">
            <Sidebar
              repoUrl={repoUrl}
              setRepoUrl={setRepoUrl}
              loadingRepo={loadingRepo}
              handleLoadRepo={handleSidebarLoad}
              repoLoaded={false}
              repoStats={null}
              onNewChat={handleNewChat}
              onClose={() => setIsMobileMenuOpen(false)}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT (Right Panel) */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header (Now wired up to open the menu) */}
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-thin">
          <div className="max-w-3xl mx-auto px-4 py-8">
            
            {/* Page Title & Actions */}
            <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <Clock className="text-[var(--foreground-muted)]" size={24} />
                <h1 className="text-2xl font-bold text-[var(--foreground)]">
                  Chat History
                </h1>
              </div>
              
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition"
                >
                  <Trash2 size={16} /> Clear all
                </button>
              )}
            </div>

            {/* Empty State */}
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4">
                  <Clock size={32} className="text-[var(--foreground-muted)]" />
                </div>
                <p className="text-[var(--foreground-muted)] text-lg">No history found.</p>
                <button 
                    onClick={() => router.push("/")}
                    className="mt-4 text-[var(--primary)] hover:underline font-medium"
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              /* History List */
              <div className="grid gap-4">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="
                      group relative p-5 rounded-2xl transition-all border
                      bg-[var(--surface)] border-[var(--border)] shadow-sm 
                      hover:border-[var(--primary)]
                    "
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Info */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                          <Github className="text-[var(--foreground)]" size={24} />
                        </div>
                        
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg text-[var(--foreground)] break-all leading-tight">
                            {item.url.replace("https://github.com/", "")}
                          </h3>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-[var(--foreground-muted)] font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> 
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCode size={12} /> 
                              {item.files} Files
                            </span>
                            <span className="flex items-center gap-1 text-[var(--primary)]">
                              <MessageSquare size={12} /> 
                              {item.chats ? item.chats.length : 0} Messages
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <Link 
                        href={`/?repo=${encodeURIComponent(item.url)}`}
                        className="
                          flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                          bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]
                          border border-[var(--border)]
                        "
                      >
                        Continue <ArrowRight size={16} />
                      </Link>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}