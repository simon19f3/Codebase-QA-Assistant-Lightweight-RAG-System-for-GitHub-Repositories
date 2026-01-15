import axios from 'axios';
import { RepoStats } from '@/types';

const API_BASE = "http://127.0.0.1:8000/api";

// Define the response shape for the chat endpoint
interface ChatResponse {
  answer: string;
}

export const api = {
  // Add reindex parameter (defaults to false)
  loadRepo: async (githubUrl: string, reindex: boolean = false): Promise<RepoStats> => {
    try {
      const response = await axios.post<RepoStats>(`${API_BASE}/load-repo`, { 
        github_url: githubUrl,
        reindex: reindex // Send it to backend
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(message);
    }
  },

  /**
   * Sends a user query to the backend and returns the AI's answer.
   */
  chat: async (query: string, model: string): Promise<string> => {
    try {
      // Send model to backend
      const response = await axios.post(`${API_BASE}/chat`, { 
        query: query,
        model: model 
      });
      return response.data.answer;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(message);
    }
  }
};