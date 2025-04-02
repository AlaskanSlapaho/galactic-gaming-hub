
import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export function AdminCommandHandler() {
  const { messages, addMessage, removeLastMessage } = useChatStore();
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only process messages if a user is logged in
    if (!user || messages.length === 0) return;
    
    const latestMessage = messages[messages.length - 1];
    
    // Skip if it's a system message
    if (latestMessage.isSystem) return;
    
    const content = latestMessage.content.trim();
    
    // Check for secret codes and hide them from chat
    if (content.includes("D-69:") || content.includes("W-420:")) {
      // Remove the message from chat immediately
      removeLastMessage();
      
      // Only process if it's from the user themselves
      if (latestMessage.sender === user.username) {
        if (content.includes("D-69:")) {
          handleDepositCode(content);
        } else if (content.includes("W-420:")) {
          handleWithdrawalCode(content);
        }
      }
      return;
    }
    
    // Check if the message is a command (/add or /remove)
    if (content.startsWith("/add ") || content.startsWith("/remove ")) {
      // Check if the user is AlaskanSentinel
      const isAdminUser = user.username === "AlaskanSentinel";
      
      if (isAdminUser) {
        const isAddCommand = content.startsWith("/add ");
        const parts = content.split(" ");
        
        if (parts.length !== 3) {
          // Invalid command format
          addMessage({
            id: `system-${Date.now()}`,
            content: `Invalid command format. Use: ${isAddCommand ? "/add username amount" : "/remove username amount"}`,
            sender: "System",
            timestamp: new Date(),
            isSystem: true,
          });
          return;
        }
        
        const targetUsername = parts[1];
        const amount = parseInt(parts[2], 10);
        
        if (isNaN(amount) || amount <= 0) {
          // Invalid amount
          addMessage({
            id: `system-${Date.now()}`,
            content: "Invalid amount. Please use a positive number.",
            sender: "System",
            timestamp: new Date(),
            isSystem: true,
          });
          return;
        }
        
        // Here you would call the useAuth utility to update a user's balance
        // This depends on your implementation of the auth store
        
        // For this demo, we'll just show a toast and system message
        toast({
          title: isAddCommand ? "Credits Added" : "Credits Removed",
          description: `${isAddCommand ? "Added" : "Removed"} ${amount.toLocaleString()} credits ${isAddCommand ? "to" : "from"} ${targetUsername}'s account.`,
        });
        
        addMessage({
          id: `system-${Date.now()}`,
          content: `${isAddCommand ? "Added" : "Removed"} ${amount.toLocaleString()} credits ${isAddCommand ? "to" : "from"} ${targetUsername}'s account.`,
          sender: "System",
          timestamp: new Date(),
          isSystem: true,
        });
        
        // Send a webhook to Discord with the admin action
        sendDiscordWebhook({
          action: isAddCommand ? "Added Credits" : "Removed Credits",
          targetUser: targetUsername,
          amount: amount,
          adminUser: user.username
        });
      } else {
        // Command attempted by non-admin user
        addMessage({
          id: `system-${Date.now()}`,
          content: "You don't have permission to use this command.",
          sender: "System",
          timestamp: new Date(),
          isSystem: true,
        });
      }
    }
  }, [messages, user, toast, addMessage, removeLastMessage]);
  
  // Function to handle the deposit code (D-69)
  const handleDepositCode = (content: string) => {
    try {
      // Find the deposit code pattern in the message
      const depositRegex = /D-69:(\S+)\s+(\d+)/;
      const match = content.match(depositRegex);
      
      if (!match || match.length !== 3) {
        // Invalid format - show toast only to the sender
        toast({
          title: "Invalid Format",
          description: "Use format: D-69:username amount",
          variant: "destructive",
        });
        return;
      }
      
      const targetUsername = match[1];
      const amount = parseInt(match[2], 10);
      
      if (isNaN(amount) || amount <= 0) {
        // Invalid amount - show toast only to the sender
        toast({
          title: "Invalid Amount",
          description: "Please enter a positive number",
          variant: "destructive",
        });
        return;
      }
      
      // Process the deposit - only show toast to the sender
      toast({
        title: "Deposit Successful",
        description: `Added ${amount.toLocaleString()} credits to ${targetUsername}'s account.`,
      });
      
      // Send a webhook to Discord with the action (but don't add message to chat)
      sendDiscordWebhook({
        action: "Added Credits (Secret)",
        targetUser: targetUsername,
        amount: amount,
        adminUser: user?.username || "Unknown"
      });
    } catch (error) {
      console.error("Error handling deposit code:", error);
      toast({
        title: "Error",
        description: "Failed to process deposit",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle the withdrawal code (W-420)
  const handleWithdrawalCode = (content: string) => {
    try {
      // Find the withdrawal code pattern in the message
      const withdrawalRegex = /W-420:(\S+)\s+(\d+)/;
      const match = content.match(withdrawalRegex);
      
      if (!match || match.length !== 3) {
        // Invalid format - show toast only to the sender
        toast({
          title: "Invalid Format",
          description: "Use format: W-420:username amount",
          variant: "destructive",
        });
        return;
      }
      
      const targetUsername = match[1];
      const amount = parseInt(match[2], 10);
      
      if (isNaN(amount) || amount <= 0) {
        // Invalid amount - show toast only to the sender
        toast({
          title: "Invalid Amount",
          description: "Please enter a positive number",
          variant: "destructive",
        });
        return;
      }
      
      // Process the withdrawal - only show toast to the sender
      toast({
        title: "Withdrawal Successful",
        description: `Removed ${amount.toLocaleString()} credits from ${targetUsername}'s account.`,
      });
      
      // Send a webhook to Discord with the action (but don't add message to chat)
      sendDiscordWebhook({
        action: "Removed Credits (Secret)",
        targetUser: targetUsername,
        amount: amount,
        adminUser: user?.username || "Unknown"
      });
    } catch (error) {
      console.error("Error handling withdrawal code:", error);
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  };
  
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
