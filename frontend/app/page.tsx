"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ChatArea from "@/components/chat/ChatArea";
import { RepoStats, ChatMessage, HistoryItem } from "@/types";
import { api } from "@/services/api";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- UI State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- App State ---
  // Initialize model from localStorage if available, otherwise default
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash"); 
  const [isModelLoaded, setIsModelLoaded] = useState(false); // To prevent hydration mismatch

  const [repoUrl, setRepoUrl] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoLoaded, setRepoLoaded] = useState(false);
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
  const [query, setQuery] = useState("");
  const [quotedText, setQuotedText] = useState(""); 
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // --- 1. Load Model Preference on Mount ---
  useEffect(() => {
    const savedModel = localStorage.getItem("selected_model");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    setIsModelLoaded(true);
  }, []);

  // --- 2. Save Model Preference when Changed ---
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("selected_model", model);
  };

  // --- Effects (Existing Logic) ---
  useEffect(() => {
    const repoParam = searchParams.get("repo");
    if (repoParam) {
      setRepoUrl(repoParam);
      const savedHistoryRaw = localStorage.getItem("repo_history");
      if (savedHistoryRaw) {
        const savedHistory: HistoryItem[] = JSON.parse(savedHistoryRaw);
        const existingItem = savedHistory.find(item => item.url === repoParam);

        if (existingItem) {
          if (existingItem.chats && existingItem.chats.length > 0) {
            setChatHistory(existingItem.chats);
          }
           setRepoStats({ files_count: existingItem.files, chunks_count: 0 });
        }
      }

      // Auto-load backend
      const autoLoad = async () => {
        setLoadingRepo(true);
        try {
          const data = await api.loadRepo(repoParam);
          setRepoLoaded(true);
          setRepoStats(data);
        } catch (err) {
          console.error("Auto-load failed", err);
        } finally {
          setLoadingRepo(false);
        }
      };
      autoLoad();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!repoUrl || chatHistory.length === 0) return;
    const savedHistoryRaw = localStorage.getItem("repo_history");
    let historyList: HistoryItem[] = savedHistoryRaw ? JSON.parse(savedHistoryRaw) : [];
    const index = historyList.findIndex(item => item.url === repoUrl);
    if (index !== -1) {
      historyList[index].chats = chatHistory;
      localStorage.setItem("repo_history", JSON.stringify(historyList));
    }
  }, [chatHistory, repoUrl]);

  // --- Handlers ---
  const handleNewChat = () => {
    setRepoUrl("");
    setRepoLoaded(false);
    setRepoStats(null);
    setChatHistory([]);
    setQuery("");
    router.replace("/");
    setIsMobileMenuOpen(false);
  };

  const addToHistory = (url: string, stats: RepoStats) => {
    const savedHistoryRaw = localStorage.getItem("repo_history");
    let historyList: HistoryItem[] = savedHistoryRaw ? JSON.parse(savedHistoryRaw) : [];
    const existingIndex = historyList.findIndex(item => item.url === url);
    if (existingIndex !== -1) {
      historyList[existingIndex].date = new Date().toISOString();
      historyList[existingIndex].files = stats.files_count;
    } else {
      const newItem: HistoryItem = {
        url,
        date: new Date().toISOString(),
        files: stats.files_count,
        chats: []
      };
      historyList = [newItem, ...historyList];
    }
    localStorage.setItem("repo_history", JSON.stringify(historyList));
  };
  const handleResend = async (messageToResend: ChatMessage) => {
    // Add the user message again to show it was resent
    setChatHistory(prev => [...prev, messageToResend]);
    setLoadingChat(true);

    try {
      const answer = await api.chat(messageToResend.text, selectedModel);
      setChatHistory(prev => [...prev, { role: "bot", text: answer }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: "bot", text: "**Error:** " + err.message }]);
    } finally {
      setLoadingChat(false);
    }
  };

  // NEW: Handler for Quote (Request #2)
  const handleQuote = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      const quotedText = `> ${selection.split('\n').join('\n> ')}\n\n`;
      setQuery(prev => quotedText + prev);
      // Focus the textarea
      document.querySelector('textarea')?.focus();
    } else {
      alert("Please select some text from the message to quote.");
    }
  };

    const handleLoadRepo = async (forceRefresh: boolean = false): Promise<void> => {
    if (!repoUrl) return;
    setLoadingRepo(true);

    if (forceRefresh) {
        setChatHistory(prev => [...prev, { role: 'bot', text: '`System`: _Starting fresh re-index & analysis... This may take a moment._' }]);
    }

    try {
      const data = await api.loadRepo(repoUrl, forceRefresh);
      setRepoLoaded(true);
      setRepoStats(data);
      
      // Don't add to history again if we are just reloading the same page
      // But update the internal tracking
      addToHistory(repoUrl, data);
      
      // --- LOGIC FIX: Always show summary if we have one and chat is empty ---
      if (data.summary && chatHistory.length === 0) {
         setChatHistory([{ role: "bot", text: `**Repository Analysis Complete.**\n\n${data.summary}` }]);
      } 
      // If force refresh, append it
      else if (forceRefresh && data.summary) {
         setChatHistory((prev) => [...prev, { role: "bot", text: `**Updated Analysis.**\n\n${data.summary}` }]);
      }

    } catch (err: any) {
      alert("Error loading repo: " + err.message);
    } finally {
      setLoadingRepo(false);
    }
  };
  const handleSendChat = async () => {
    if (!query.trim()) return;
    
    // Combine Quote + Query
    let finalPrompt = query;
    if (quotedText) {
      finalPrompt = `Context:\n> ${quotedText.replace(/\n/g, "\n> ")}\n\nQuestion:\n${query}`;
    }

    const userMsg: ChatMessage = { role: "user", text: finalPrompt }; // Display full prompt or just query? 
    // Usually better to show what was sent.
    
    setChatHistory((prev) => [...prev, userMsg]);
    setQuery("");
    setQuotedText(""); // Clear quote after sending
    setLoadingChat(true);

    try {
      const answer = await api.chat(finalPrompt, selectedModel);
      setChatHistory((prev) => [...prev, { role: "bot", text: answer }]);
    } catch (err: any) {
      setChatHistory((prev) => [...prev, { role: "bot", text: "**Error:** " + err.message }]);
    } finally {
      setLoadingChat(false);
    }
  };


  // Prevent rendering until we know the model state to avoid UI flicker
  if (!isModelLoaded) return null;

  return (
    <div className="flex h-screen w-full bg-[var(--background)] overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR */}
      <div className="hidden md:block w-[260px] flex-shrink-0 h-full border-r border-[var(--border)] bg-[var(--surface-muted)]">
        <Sidebar
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          loadingRepo={loadingRepo}
          handleLoadRepo={handleLoadRepo}
          repoLoaded={repoLoaded}
          repoStats={repoStats}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          setSelectedModel={handleModelChange} // Use the wrapper handler
        />
      </div>

      {/* 2. MOBILE SIDEBAR */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] h-full bg-white/95 dark:bg-[#171717]/95 backdrop-blur-xl border-r border-white/20 shadow-2xl animate-in slide-in-from-left-full duration-300">
            <Sidebar
              repoUrl={repoUrl}
              setRepoUrl={setRepoUrl}
              loadingRepo={loadingRepo}
              handleLoadRepo={handleLoadRepo}
              repoLoaded={repoLoaded}
              repoStats={repoStats}
              onNewChat={handleNewChat}
              onClose={() => setIsMobileMenuOpen(false)}
              selectedModel={selectedModel}
              setSelectedModel={handleModelChange} // Use the wrapper handler
            />
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[var(--background)]">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        
         <ChatArea
          chatHistory={chatHistory}
          loadingChat={loadingChat}
          query={query}
          setQuery={setQuery}
          handleSendChat={handleSendChat}
          repoLoaded={repoLoaded}
          quotedText={quotedText}
          setQuotedText={setQuotedText}
          handleResend={handleResend} // <--- MAKE SURE THIS IS HERE
        />
      </div>
      
    </div>
  );
}