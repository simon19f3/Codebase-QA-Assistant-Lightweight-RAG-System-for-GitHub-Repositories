import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Loader2, Database, Plus, RefreshCw, Cpu, 
  Files, ChevronDown, ChevronRight, File as FileIcon, Folder 
} from "lucide-react";
import { RepoStats } from "@/types";
import FileTree from "./FileTree"; 

// --- TYPES ---
interface SidebarProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  loadingRepo: boolean;
  handleLoadRepo: (reindex?: boolean) => void;
  repoLoaded: boolean;
  repoStats: RepoStats | null;
  onNewChat: () => void;
  onClose?: () => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

interface TreeNode {
  [key: string]: TreeNode | null;
}

// --- HELPER COMPONENT: RECURSIVE FILE ITEM ---
const FileTreeItem = ({ name, node, level }: { name: string, node: TreeNode | null, level: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node !== null;

  return (
    <div style={{ paddingLeft: `${level * 12}px` }}>
      <div 
        onClick={() => isFolder && setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md text-sm cursor-pointer select-none transition-colors
          hover:bg-[var(--surface-hover)]
          ${!isFolder ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground)] font-medium'}
        `}
      >
        {isFolder ? (
          isOpen ? <ChevronDown size={14} className="flex-shrink-0" /> : <ChevronRight size={14} className="flex-shrink-0" />
        ) : (
          <span className="w-3.5 flex-shrink-0" /> // Spacer for alignment
        )}
        
        {isFolder ? (
          <Folder size={14} className="text-blue-400 flex-shrink-0" />
        ) : (
          <FileIcon size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
        )}
        
        <span className="truncate">{name}</span>
      </div>
      
      {/* Recursive rendering for children */}
      {isFolder && isOpen && node && (
        <div>
          {Object.entries(node).sort(([a], [b]) => a.localeCompare(b)).map(([childName, childNode]) => (
            <FileTreeItem key={childName} name={childName} node={childNode} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function Sidebar({
  repoUrl,
  setRepoUrl,
  loadingRepo,
  handleLoadRepo,
  repoLoaded,
  repoStats,
  onNewChat,
  onClose,
  selectedModel,
  setSelectedModel
}: SidebarProps) {
  
  // State for UI toggles
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Models List
  const models = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "deepseek-coder", name: "DeepSeek Coder" },
    { id: "deepseek-chat", name: "DeepSeek V3" },
    { id: "grok-2-latest", name: "Grok 2" },
  ];

  // --- LOGIC 1: Process File Paths into Tree ---
  const fileTree = useMemo(() => {
    if (!repoStats?.file_paths) return {};
    
    const root: TreeNode = {};
    
    repoStats.file_paths.forEach(path => {
      // Normalize Windows slashes
      let cleanPath = path.replace(/\\/g, '/');
      
      // Split path
      const parts = cleanPath.split('/');
      
      // Filter out the first 2 parts (usually 'downloaded_repos' and 'RepoName')
      // to show a clean structure starting from the actual source root
      const relevantParts = parts.length > 2 ? parts.slice(2) : parts;

      let current = root;
      relevantParts.forEach((part, index) => {
        if (index === relevantParts.length - 1) {
          current[part] = null; // Mark as file (null children)
        } else {
          current[part] = current[part] || {}; // Create folder if missing
          current = current[part] as TreeNode;
        }
      });
    });

    return root;
  }, [repoStats]);

  // --- LOGIC 2: Auto-Resize Repo Input ---
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
      textarea.style.overflowY = textarea.scrollHeight > 100 ? "auto" : "hidden";
    }
  };

  useEffect(() => { adjustHeight(); }, [repoUrl]);

  // --- LOGIC 3: Actions ---
  const handleAction = (action: () => void) => {
    action();
    if (onClose) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAction(() => handleLoadRepo(false));
    }
  };

  return (
    <div className="flex flex-col h-full p-3 bg-[var(--surface-muted)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* 1. New Chat Button */}
       <button 
        onClick={() => handleAction(onNewChat)}
        className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all mb-4 flex-shrink-0 border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--primary)] bg-[var(--surface)] text-[var(--foreground)]"
      >
        <Plus size={16} /> New chat
      </button>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-0 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent pr-1">
        
        {/* Model Selector */}
        <div className="px-1">
          <h2 className="text-xs font-semibold uppercase mb-2 px-2 text-[var(--foreground-muted)]">
            Model
          </h2>
          <div className="relative">
             <div className="absolute left-3 top-2.5 text-[var(--foreground-muted)]">
               <Cpu size={14} />
             </div>
             <select 
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value)}
               className="
                 w-full bg-[var(--surface)] border border-[var(--border)] 
                 rounded-md pl-9 pr-3 py-2 text-sm appearance-none
                 focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]
                 cursor-pointer
               "
             >
               {models.map(m => (
                 <option key={m.id} value={m.id}>{m.name}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Repository Input */}
        <div className="px-1">
          <h2 className="text-xs font-semibold uppercase mb-2 px-2 text-[var(--foreground-muted)]">
            Repository
          </h2>
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="user/repo"
              rows={1}
              className="
                w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm 
                focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]
                placeholder:text-[var(--foreground-muted)]
                resize-none overflow-hidden
                scrollbar-thin scrollbar-thumb-[var(--border)]
              "
              style={{ minHeight: "38px", maxHeight: "100px" }}
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(() => handleLoadRepo(false))}
                disabled={loadingRepo || !repoUrl}
                className="
                  flex-1 py-2 rounded-md text-sm font-medium transition-all
                  bg-[var(--primary)] hover:opacity-90 text-black
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex justify-center items-center gap-2
                "
              >
                {loadingRepo ? <Loader2 className="animate-spin" size={14} /> : "Load"}
              </button>

              <button
                onClick={() => handleAction(() => handleLoadRepo(true))}
                disabled={loadingRepo || !repoUrl}
                title="Force Re-index (Fresh Download)"
                className="
                  px-3 rounded-md transition-all border border-[var(--border)]
                  bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)]
                  disabled:opacity-50
                "
              >
                <RefreshCw size={16} className={loadingRepo ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats & File Tree */}
        {repoLoaded && repoStats && (
           <div className="px-1">
             <div className="mb-2 px-2 flex items-center justify-between text-[var(--foreground-muted)]">
                <h2 className="text-xs font-semibold uppercase">Context</h2>
             </div>

             <div className="space-y-1">
               {/* Toggle Button */}
               <button 
                 onClick={() => setIsFilesOpen(!isFilesOpen)}
                 className="
                   w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium
                   bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)]
                   border border-[var(--border)] transition-colors
                 "
               >
                 <div className="flex items-center gap-2">
                   <Files size={14} className="text-[var(--primary)]" />
                   <span>{repoStats.files_count} Files</span>
                 </div>
                 <ChevronDown size={14} className={`transition-transform duration-200 ${isFilesOpen ? 'rotate-180' : ''}`} />
               </button>

               {/* File Tree List */}
               {isFilesOpen && (
                 <div className="
                   mt-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] 
                   max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border)]
                 ">
                   {Object.entries(fileTree).length > 0 ? (
                     Object.entries(fileTree).map(([name, node]) => (
                       <FileTreeItem key={name} name={name} node={node} level={0} />
                     ))
                   ) : (
                     <p className="text-xs text-[var(--foreground-muted)] p-2">No files listed.</p>
                   )}
                 </div>
               )}
             </div>
           </div>
        )}
      </div>

      {/* 3. Footer */}
      <div className="pt-3 border-t border-[var(--border)] mt-auto flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded bg-[var(--primary)] flex items-center justify-center text-black font-bold text-xs">AI</div>
            <div className="text-sm font-medium text-[var(--foreground)]">User</div>
        </div>
      </div>

    </div>
  );
}