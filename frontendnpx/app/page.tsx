"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // <--- 1. Import useRouter
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { RepoStats, ChatMessage, HistoryItem } from "@/types";
import { api } from "@/services/api";

export default function Home() {
  const router = useRouter(); // <--- 2. Initialize router
  const searchParams = useSearchParams();
  
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoLoaded, setRepoLoaded] = useState(false);
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);

  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // --- Handlers ---

  // 3. New Chat Function
  const handleNewChat = () => {
    // Clear state
    setRepoUrl("");
    setRepoLoaded(false);
    setRepoStats(null);
    setChatHistory([]);
    setQuery("");
    
    // Clear URL params (remove ?repo=...)
    router.replace("/");
  };

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
           setRepoStats({ 
             files_count: existingItem.files, 
             chunks_count: 0 
           });
           // Note: We don't set repoLoaded=true here automatically
           // forcing the user to click "Load" ensures the backend indexes it fresh.
        }
      }
    }
  }, [searchParams]);

  // ... (Keep existing useEffect for saving chat history) ...
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

  // ... (Keep addToHistory, handleLoadRepo, handleSendChat) ...
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

  const handleLoadRepo = async () => {
    if (!repoUrl) return;
    setLoadingRepo(true);
    try {
      const data = await api.loadRepo(repoUrl);
      setRepoLoaded(true);
      setRepoStats(data);
      addToHistory(repoUrl, data);
      
      if (chatHistory.length === 0) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "bot",
            text: `**System Ready.** \n\nSuccessfully indexed:\n* **${data.files_count}** Files\n* **${data.chunks_count}** Chunks\n\nAsk me anything about the codebase!`,
          },
        ]);
      } else {
         setChatHistory((prev) => [
          ...prev,
          { role: "bot", text: `_Repository re-indexed. You can continue the conversation._` }
        ]);
      }
    } catch (err: any) {
      alert("Error loading repo: " + err.message);
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleSendChat = async () => {
    if (!query.trim()) return;
    const userMsg: ChatMessage = { role: "user", text: query };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuery("");
    setLoadingChat(true);
    try {
      const answer = await api.chat(query);
      setChatHistory((prev) => [...prev, { role: "bot", text: answer }]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", text: "**Error:** " + err.message },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <Header />
      <div className="h-28"></div>
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Sidebar
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          loadingRepo={loadingRepo}
          handleLoadRepo={handleLoadRepo}
          repoLoaded={repoLoaded}
          repoStats={repoStats}
          onNewChat={handleNewChat} // <--- 4. Pass the handler here
        />
        <ChatArea
          chatHistory={chatHistory}
          loadingChat={loadingChat}
          query={query}
          setQuery={setQuery}
          handleSendChat={handleSendChat}
          repoLoaded={repoLoaded}
        />
      </main>
    </div>
  );
}