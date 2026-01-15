import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot, MessageSquareQuote, X } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { ChatMessage } from "@/types";

interface ChatAreaProps {
  chatHistory: ChatMessage[];
  loadingChat: boolean;
  query: string;
  setQuery: (q: string) => void;
  handleSendChat: () => void;
  repoLoaded: boolean;
  // Quote Props
  quotedText: string;
  setQuotedText: (text: string) => void;
  // Resend Prop
  handleResend: (msg: ChatMessage) => void; // <--- ADDED THIS
}

export default function ChatArea({
  chatHistory,
  loadingChat,
  query,
  setQuery,
  handleSendChat,
  repoLoaded,
  quotedText,
  setQuotedText,
  handleResend
}: ChatAreaProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- FLOATING QUOTE BUTTON STATE ---
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const [tempSelection, setTempSelection] = useState("");

  // --- 1. HANDLE TEXT SELECTION ---
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Calculate position relative to viewport, adjusted for container if needed
        if (rect.width > 0 && rect.height > 0) {
            setTempSelection(selection.toString());
            // Position 40px above the selection
            setSelectionRect({
                top: rect.top - 40, 
                left: rect.left + (rect.width / 2) - 60 
            });
        }
      } else {
        setSelectionRect(null);
      }
    };
    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  const confirmQuote = () => {
    setQuotedText(tempSelection);
    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
    textareaRef.current?.focus();
  };

  const handleManualQuote = () => {
     // Fallback for button click on message bubble
     const selection = window.getSelection()?.toString();
     if(selection) {
         setQuotedText(selection);
         textareaRef.current?.focus();
     } else {
         alert("Highlight some text to quote it.");
     }
  }

  // --- 2. SCROLL & RESIZE LOGIC ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loadingChat]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => { adjustHeight(); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-[var(--background)] relative" ref={chatContainerRef}>

      {/* --- FLOATING 'ASK CODEBASE' BUTTON --- */}
      {selectionRect && (
        <button
          onClick={confirmQuote}
          style={{ top: selectionRect.top, left: selectionRect.left }}
          className="
            fixed z-50 flex items-center gap-2 px-3 py-1.5 
            bg-[var(--foreground)] text-[var(--background)] 
            rounded-full shadow-lg text-xs font-bold animate-in fade-in zoom-in duration-200
            hover:scale-105 transition-transform cursor-pointer border border-[var(--border)]
          "
        >
          <MessageSquareQuote size={14} />
          Ask Codebase
        </button>
      )}

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[var(--surface)] border border-[var(--border)]">
                <Bot size={32} className="text-[var(--foreground)]" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                How can I help you today?
              </h2>
            </div>
          ) : (
            <div className="space-y-6">
              {chatHistory.map((msg, idx) => (
                <MessageBubble 
                  key={idx} 
                  message={msg} 
                  onResend={() => handleResend(msg)} // Pass Resend Logic
                  onQuote={handleManualQuote}      // Pass Quote Logic
                />
              ))}
              {loadingChat && (
                <div className="flex gap-4 items-center animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-black">
                    <Bot size={16} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                    <Loader2 className="animate-spin" size={14} />
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Input Area Wrapper */}
      <div className="w-full p-4 pt-2 bg-[var(--background)]">
        <div className="max-w-3xl mx-auto relative flex flex-col gap-2">
          
          {/* --- REPLY PREVIEW BOX --- */}
          {quotedText && (
            <div className="flex items-start justify-between p-3 rounded-xl bg-[var(--surface)] border-l-4 border-[var(--primary)] text-sm shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex-1 mr-4">
                <span className="text-[var(--foreground-muted)] font-bold text-xs uppercase mb-1 block">
                  Replying to context:
                </span>
                <p className="text-[var(--foreground)] line-clamp-2 italic opacity-80">
                  "{quotedText}"
                </p>
              </div>
              <button 
                onClick={() => setQuotedText("")}
                className="text-[var(--foreground-muted)] hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Textarea Container */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={handleKeyDown}
              placeholder={repoLoaded ? "Ask anything about the code…" : "Please load a repository first"}
              disabled={!repoLoaded || loadingChat}
              rows={1}
              className="
                w-full py-3 pl-4 pr-12 rounded-2xl text-base outline-none transition-all resize-none
                bg-[var(--surface)] border border-[var(--border)]
                text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]
                focus:border-[var(--primary)]
                disabled:opacity-50 
                
                /* SCROLLBAR STYLING - RESTORED */
                overflow-y-auto
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-track]:my-2
                [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-[var(--foreground-muted)]
              "
              style={{ minHeight: "52px", maxHeight: "200px" }}
            />

            <button
              onClick={handleSendChat}
              disabled={!repoLoaded || loadingChat || (!query.trim() && !quotedText)}
              className="
                absolute right-3 bottom-3 p-2 rounded-xl
                flex items-center justify-center transition-opacity
                bg-[var(--primary)] text-black
                hover:opacity-90
                disabled:opacity-30 disabled:cursor-not-allowed
              "
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--foreground-muted)] mt-2">
          Codebase AI can make mistakes. Check code context.
        </p>
      </div>

    </div>
  );
}