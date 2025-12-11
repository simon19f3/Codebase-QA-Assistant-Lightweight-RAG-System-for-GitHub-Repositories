export interface RepoStats {
  files_count: number;
  chunks_count: number;
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