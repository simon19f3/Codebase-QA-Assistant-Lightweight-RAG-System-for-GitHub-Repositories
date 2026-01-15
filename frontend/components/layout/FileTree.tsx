import { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

interface TreeNode {
  [key: string]: TreeNode | null;
}

interface FileTreeProps {
  data: TreeNode;
  level?: number;
}

const FileTree: React.FC<FileTreeProps> = ({ data, level = 0 }) => {
  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      {Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).map(([name, node]) => {
        const isDirectory = node !== null;
        
        if (isDirectory) {
          return <FolderNode key={name} name={name} node={node!} level={level} />;
        } else {
          return (
            <div key={name} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[var(--surface-hover)] cursor-default">
              <File size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
              <span className="text-sm truncate">{name}</span>
            </div>
          );
        }
      })}
    </div>
  );
};

interface FolderNodeProps {
  name: string;
  node: TreeNode;
  level: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({ name, node, level }) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-open first 2 levels

  return (
    <div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[var(--surface-hover)] cursor-pointer"
      >
        {isOpen ? <ChevronDown size={14} className="flex-shrink-0" /> : <ChevronRight size={14} className="flex-shrink-0" />}
        <Folder size={14} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{name}</span>
      </div>
      {isOpen && <FileTree data={node} level={level + 1} />}
    </div>
  );
};

export default FileTree;