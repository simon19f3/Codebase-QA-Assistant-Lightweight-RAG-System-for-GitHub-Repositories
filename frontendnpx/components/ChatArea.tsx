import { useEffect, useRef } from "react";
import { Send, Loader2, Bot } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { ChatMessage } from "@/types";

interface ChatAreaProps {
  chatHistory: ChatMessage[];
  loadingChat: boolean;
  query: string;
  setQuery: (q: string) => void;
  handleSendChat: () => void;
  repoLoaded: boolean;
}

export default function ChatArea({
  chatHistory,
  loadingChat,
  query,
  setQuery,
  handleSendChat,
  repoLoaded,
}: ChatAreaProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loadingChat]);

  return (
    <section className="lg:col-span-3 flex flex-col h-[75vh] bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden relative">
      
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
              <Bot size={48} className="text-slate-300" />
            </div>
            <p className="font-medium text-lg">Ready to assist.</p>
            <p className="text-sm">Load a repository to verify code logic.</p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => <MessageBubble key={idx} message={msg} />)
        )}

        {loadingChat && (
          <div className="flex gap-4 animate-in">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-emerald-700" />
            </div>
            <div className="bg-white/80 border border-white/60 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={18} />
              <span className="text-slate-400 text-sm font-medium">Processing...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 border-t border-white/40 backdrop-blur-md">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder={
              repoLoaded
                ? "Ask a question about the code..."
                : "Waiting for repository..."
            }
            disabled={!repoLoaded || loadingChat}
            className="flex-1 bg-white/50 border border-slate-200 rounded-xl pl-5 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition shadow-inner text-slate-700 placeholder:text-slate-400"
          />
          <button
            onClick={handleSendChat}
            disabled={!repoLoaded || loadingChat || !query.trim()}
            className="absolute right-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white p-2.5 rounded-lg transition-all shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}