
import { create } from "zustand";

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem: boolean;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  addSystemMessage: (content: string) => void;
  removeLastMessage: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message].slice(-100) // Keep only the last 100 messages
    })),
  addSystemMessage: (content) => 
    set((state) => ({ 
      messages: [
        ...state.messages, 
        {
          id: Date.now().toString(),
          sender: "System",
          content,
          timestamp: new Date(),
          isSystem: true,
        }
      ].slice(-100) // Keep only the last 100 messages
    })),
  removeLastMessage: () =>
    set((state) => ({
      messages: state.messages.length > 0 
        ? state.messages.slice(0, -1) 
        : []
    })),
}));
