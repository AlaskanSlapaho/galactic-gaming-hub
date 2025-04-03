
import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export function AdminCommandHandler() {
  const { messages, addMessage, removeLastMessage } = useChatStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only process messages if a user is logged in
    if (!user || messages.length === 0) return;
    
    const latestMessage = messages[messages.length - 1];
    
    // Skip if it's a system message
    if (latestMessage.isSystem) return;
    
    const content = latestMessage.content.trim();
    
    // Check for admin code trigger
    if (content === "CapnHook" && latestMessage.sender === user.username) {
      // Remove the trigger message
      removeLastMessage();
      
      // Generate a random verification code
      const verificationCode = Math.random().toString(36).substring(2, 10);
      
      // Send webhook to Discord with the code
      sendDiscordWebhook({
        action: "Admin Panel Access Request",
        targetUser: "N/A",
        amount: 0,
        adminUser: user.username,
        verificationCode: verificationCode
      });
      
      // Store the verification code in localStorage
      localStorage.setItem("admin_verification_code", verificationCode);
      
      // Show toast only to the requesting user
      toast({
        title: "Verification Code Sent",
        description: "Check the Discord webhook for your verification code.",
      });
      
      return;
    }
    
    // Check if the message is a verification code
    if (content.match(/^[a-zA-Z0-9]{8}$/) && latestMessage.sender === user.username) {
      // Remove the code message from chat immediately
      removeLastMessage();
      
      // Get the stored verification code
      const storedCode = localStorage.getItem("admin_verification_code");
      
      if (content === storedCode) {
        // Valid code, navigate to admin panel
        navigate("/admin");
        
        // Show success toast
        toast({
          title: "Admin Access Granted",
          description: "You now have access to the admin panel.",
        });
      } else {
        // Invalid code
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "The verification code you entered is incorrect.",
        });
      }
      
      return;
    }
    
    // Check if the message is an admin command (/add or /remove)
    if ((content.startsWith("/add ") || content.startsWith("/remove ")) && latestMessage.sender === user.username) {
      // Check if the user is an admin
      const isAdminUser = user.isAdmin;
      
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
          adminUser: user.username,
          verificationCode: null
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
  }, [messages, user, toast, addMessage, removeLastMessage, navigate]);
  
  // Function to send webhook to Discord
  const sendDiscordWebhook = async (data: {
    action: string;
    targetUser: string;
    amount: number;
    adminUser: string;
    verificationCode: string | null;
  }) => {
    try {
      const webhookUrl = "https://discord.com/api/webhooks/1356874831215329352/lQetOKRgKaZfrCznaL1QpM_MvqWNaa5NQ-18tWfqBd7cV3L88ZH_6u8njNTHG-h3Yy0Y";
      
      let content = `**Admin Action**\nAction: ${data.action}\nAdmin: ${data.adminUser}`;
      
      if (data.targetUser !== "N/A") {
        content += `\nTarget User: ${data.targetUser}`;
      }
      
      if (data.amount > 0) {
        content += `\nAmount: ${data.amount.toLocaleString()} credits`;
      }
      
      if (data.verificationCode) {
        content += `\nVerification Code: \`${data.verificationCode}\``;
      }
      
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
    } catch (error) {
      console.error("Failed to send Discord webhook:", error);
    }
  };
  
  // This is a utility component with no UI
  return null;
}
