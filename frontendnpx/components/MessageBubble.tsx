import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 animate-in ${isUser ? "justify-end" : "justify-start"}`}>
      
      {/* Bot Icon */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-emerald-100">
          <Bot size={16} className="text-emerald-700" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-[85%] rounded-2xl p-5 shadow-sm text-sm ${
          isUser
            ? "bg-emerald-600 text-white rounded-tr-sm"
            : "bg-white/90 text-slate-700 border border-white/60 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="leading-relaxed">{message.text}</p>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={16} className="text-slate-500" />
        </div>
      )}
    </div>
  );
}