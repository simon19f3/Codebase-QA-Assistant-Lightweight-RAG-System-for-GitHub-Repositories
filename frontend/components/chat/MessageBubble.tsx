import ReactMarkdown from "react-markdown";
import { Bot, User, RefreshCw, MessageSquareQuote } from "lucide-react";
import { ChatMessage } from "@/types";
import MermaidDiagram from "../visualization/MermaidDiagram"; // Ensure this file exists in components folder

interface MessageBubbleProps {
  message: ChatMessage;
  onResend?: () => void;
  onQuote?: () => void;
}

export default function MessageBubble({ message, onResend, onQuote }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 group ${isUser ? "justify-end" : "justify-start"}`}>
      
      {/* --- BOT AVATAR --- */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0 mt-0.5 text-black shadow-sm">
          <Bot size={18} />
        </div>
      )}

      {/* --- MESSAGE CONTENT --- */}
      <div
        className={`
          relative max-w-[90%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm overflow-hidden
          ${isUser 
            ? "bg-[var(--surface)] text-[var(--foreground)] rounded-tr-sm border border-[var(--border)]" 
            : "text-[var(--foreground)] rounded-tl-sm w-full" 
          }
        `}
      >
        {isUser ? (
          // User messages are simple text
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          // Bot messages support Markdown & Mermaid
          <div className="markdown-content">
          <ReactMarkdown 
            
            components={{
              // Override the default code block renderer
              code(props) {
                const { children, className, node, ...rest } = props;
                
                // Check if the language is 'mermaid'
                const match = /language-(\w+)/.exec(className || "");
                const isMermaid = match && match[1] === "mermaid";

                if (isMermaid) {
                  // Render the fancy Diagram component
                  return (
                    <div className="my-4 w-full flex justify-center">
                      <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
                    </div>
                  );
                }

                // Otherwise render standard code
                return (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.text}
          </ReactMarkdown>
          </div>
        )}
      </div>

      {/* --- ACTION BUTTONS (Hover State) --- */}
      <div className="flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
        
        {/* Resend Button (Only for User messages) */}
        {isUser && onResend && (
          <button 
            onClick={onResend} 
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] transition-colors" 
            title="Resend this message"
          >
            <RefreshCw size={14} />
          </button>
        )}

        {/* Quote Button (Only for Bot messages) */}
        {!isUser && onQuote && (
          <button 
            onClick={onQuote} 
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] transition-colors" 
            title="Quote & Reply"
          >
            <MessageSquareQuote size={14} />
          </button>
        )}
      </div>

      {/* --- USER AVATAR --- */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[var(--border)]">
          <User size={18} className="text-[var(--foreground-muted)]" />
        </div>
      )}
    </div>
  );
}