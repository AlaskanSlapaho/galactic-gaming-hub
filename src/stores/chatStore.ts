
import { create } from "zustand";
import { toast } from "sonner";

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

// Function to check if message should be hidden from chat
const shouldHideMessage = (content: string): boolean => {
  // Check for admin verification code
  return content.match(/^[a-zA-Z0-9]{8}$/) !== null;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => {
    // Check if this is an admin verification code
    if (shouldHideMessage(message.content)) {
      // Don't add the message to the chat, but show a toast notification to the sender
      toast.success("Command processed successfully", {
        position: "bottom-left",
        duration: 3000,
      });
      
      // If the code is valid, redirect to the admin panel
      const currentUser = JSON.parse(localStorage.getItem("galactic_ledgers_user") || "{}");
      if (currentUser && currentUser.username) {
        window.location.href = "/admin";
      }
      
      return;
    }
    
    // Handle "CapnHook" command
    if (message.content.toLowerCase() === "capnhook") {
      // Don't add the literal command to chat
      return;
    }
    
    set((state) => ({ 
      messages: [...state.messages, message].slice(-100) // Keep only the last 100 messages
    }));
  },
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
