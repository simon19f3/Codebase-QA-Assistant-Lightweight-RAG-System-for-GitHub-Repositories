export interface RepoStats {
  files_count: number;
  chunks_count: number|string;
  summary?: string;
  file_paths?: string[];
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

// Add this new interface
export interface HistoryItem {
  url: string;
  date: string;
  files: number;
  chats: ChatMessage[]; // <--- New field to store conversation

}