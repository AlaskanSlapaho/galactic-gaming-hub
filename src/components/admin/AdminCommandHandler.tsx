
import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export function AdminCommandHandler() {
  const { messages } = useChatStore();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only process messages if the user is an admin
    if (!isAdmin || !user || messages.length === 0) return;
    
    const latestMessage = messages[messages.length - 1];
    
    // Skip if it's a system message or from the admin themselves
    if (latestMessage.isSystem || latestMessage.sender === user.username) return;
    
    const content = latestMessage.content.trim();
    
    // Process admin commands
    if (content.startsWith("/addcredits") || content.startsWith("/removecredits")) {
      const isAddCommand = content.startsWith("/addcredits");
      const parts = content.split(" ");
      
      if (parts.length !== 3) {
        // Invalid command format
        return;
      }
      
      const targetUsername = parts[1];
      const amount = parseInt(parts[2], 10);
      
      if (isNaN(amount) || amount <= 0) {
        // Invalid amount
        return;
      }
      
      // Here you would normally call an API to update the user's balance
      // For this demo, we'll just show a toast
      
      toast({
        title: isAddCommand ? "Credits Added" : "Credits Removed",
        description: `${isAddCommand ? "Added" : "Removed"} ${amount.toLocaleString()} credits ${isAddCommand ? "to" : "from"} ${targetUsername}'s account.`,
      });
      
      // Send a webhook to Discord with the admin action
      sendDiscordWebhook({
        action: isAddCommand ? "Added Credits" : "Removed Credits",
        targetUser: targetUsername,
        amount: amount,
        adminUser: user.username
      });
    }
  }, [messages, isAdmin, user, toast]);
  
  // Function to send webhook to Discord
  const sendDiscordWebhook = async (data: {
    action: string;
    targetUser: string;
    amount: number;
    adminUser: string;
  }) => {
    try {
      const randomCode = Math.random().toString(36).substring(2, 10);
      
      const webhookUrl = "https://discord.com/api/webhooks/1356874831215329352/lQetOKRgKaZfrCznaL1QpM_MvqWNaa5NQ-18tWfqBd7cV3L88ZH_6u8njNTHG-h3Yy0Y";
      
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `**Admin Action**\nAction: ${data.action}\nTarget User: ${data.targetUser}\nAmount: ${data.amount.toLocaleString()} credits\nAdmin: ${data.adminUser}\nVerification Code: \`${randomCode}\``,
        }),
      });
      
      // Store the verification code somewhere, like in memory for this demo
      // In a real app, this would be stored in a database
      localStorage.setItem("admin_verification_code", randomCode);
      
    } catch (error) {
      console.error("Failed to send Discord webhook:", error);
    }
  };
  
  // This is a utility component with no UI
  return null;
}
