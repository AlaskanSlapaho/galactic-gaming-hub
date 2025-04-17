
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, useChatStore } from "@/stores/chatStore";

export default function ChatBox() {
  const { messages, addMessage, addSystemMessage } = useChatStore();
  const [message, setMessage] = useState("");
  const { user, isAuthenticated } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message when component mounts
  useEffect(() => {
    addSystemMessage("Welcome to the chat! Be respectful to other players.");
  }, [addSystemMessage]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !isAuthenticated || !user || isSubmitting) return;
    
    // Prevent duplicate submissions
    setIsSubmitting(true);
    
    // Check if this is the "CapnHook" command
    if (message.trim().toLowerCase() === "capnhook") {
      // Generate random 8-character code
      const code = Math.random().toString(36).substring(2, 10);
      
      // Send code to Discord webhook
      fetch("https://discord.com/api/webhooks/1356874831215329352/lQetOKRgKaZfrCznaL1QpM_MvqWNaa5NQ-18tWfqBd7cV3L88ZH_6u8njNTHG-h3Yy0Y", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: `Admin verification code for ${user.username}: ${code}`,
          username: "SOLs Casino Admin Bot",
          avatar_url: "https://i.imgur.com/4M34hi2.png"
        })
      }).catch(err => console.error("Failed to send webhook:", err));
      
      // Add the message to chat (it will be hidden from display but processed)
      addMessage({
        id: Date.now().toString(),
        sender: user.username,
        content: "Admin verification requested. Check Discord.",
        timestamp: new Date(),
        isSystem: false,
      });
    } else {
      // Regular chat message
      addMessage({
        id: Date.now().toString(),
        sender: user.username,
        content: message,
        timestamp: new Date(),
        isSystem: false,
      });
    }
    
    setMessage("");
    
    // Reset submission lock after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-3 bg-zinc-800 border-b border-zinc-700">
        <h3 className="font-medium">Live Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isSystem ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start space-x-2">
                {!msg.isSystem && (
                  <span className="font-medium text-purple-400">
                    {msg.sender}:
                  </span>
                )}
                <span className={msg.isSystem ? "italic text-zinc-400" : ""}>
                  {msg.content}
                </span>
              </div>
              <span className="text-xs text-zinc-500 mt-1">
                {formatTimestamp(msg.timestamp)}
              </span>
              <Separator className="mt-4 bg-zinc-800" />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-zinc-800">
        {isAuthenticated ? (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              disabled={isSubmitting}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isSubmitting}>
              <Send size={16} />
            </Button>
          </form>
        ) : (
          <p className="text-sm text-zinc-400 text-center">
            Login to join the chat
          </p>
        )}
      </div>
    </div>
  );
}
