
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
    
    if (!message.trim() || !isAuthenticated || !user) return;
    
    addMessage({
      id: Date.now().toString(),
      sender: user.username,
      content: message,
      timestamp: new Date(),
      isSystem: false,
    });
    
    setMessage("");
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
            />
            <Button type="submit" size="icon" disabled={!message.trim()}>
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
