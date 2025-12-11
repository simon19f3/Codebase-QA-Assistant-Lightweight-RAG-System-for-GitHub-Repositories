"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Github, Calendar, FileCode, ArrowRight, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import { HistoryItem } from "@/types"; // Import the shared type

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]); // Use the type

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

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <Header />
      <div className="h-28"></div>

      <main className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Repository History</h2>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
            >
              <Trash2 size={16} /> Clear List
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg">
            <p className="text-slate-400 text-lg">No history found.</p>
            <Link href="/" className="text-emerald-600 font-semibold hover:underline mt-2 inline-block">
              Load your first repository
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((item, idx) => (
              <div 
                key={idx} 
                className="group bg-white/70 backdrop-blur-sm border border-white/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all animate-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Repo Info */}
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-full mt-1">
                      <Github className="text-slate-700" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 break-all">
                        {item.url.replace("https://github.com/", "")}
                      </h3>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> 
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileCode size={12} /> 
                          {item.files} Files
                        </span>
                        {/* Show number of messages */}
                        <span className="flex items-center gap-1 text-emerald-600">
                          <MessageSquare size={12} /> 
                          {item.chats ? item.chats.length : 0} Msgs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link 
                    href={`/?repo=${encodeURIComponent(item.url)}`}
                    className="flex items-center justify-center gap-2 bg-white border border-emerald-200 text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition group-hover:border-emerald-400"
                  >
                    Continue Chat <ArrowRight size={16} />
                  </Link>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}