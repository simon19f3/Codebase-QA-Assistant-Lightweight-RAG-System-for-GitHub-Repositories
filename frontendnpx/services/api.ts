import axios from 'axios';
import { RepoStats } from '@/types';

const API_BASE = "http://127.0.0.1:8000/api";

// Define the response shape for the chat endpoint
interface ChatResponse {
  answer: string;
}

export const api = {
  /**
   * Sends the GitHub URL to the backend for downloading and indexing.
   */
  loadRepo: async (githubUrl: string): Promise<RepoStats> => {
    try {
      const response = await axios.post<RepoStats>(`${API_BASE}/load-repo`, { 
        github_url: githubUrl 
      });
      return response.data;
    } catch (error: any) {
      // Extract the specific error message from the backend if available
      const message = error.response?.data?.detail || error.message;
      throw new Error(message);
    }
  },

  /**
   * Sends a user query to the backend and returns the AI's answer.
   */
  chat: async (query: string): Promise<string> => {
    try {
      const response = await axios.post<ChatResponse>(`${API_BASE}/chat`, { 
        query: query 
      });
      return response.data.answer;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(message);
    }
  }
};