
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { discordService } from '@/services/discord';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function DiscordAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithDiscord } = useAuth();
  
  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      
      if (code) {
        try {
          // Get token
          const token = await discordService.getToken(code);
          if (!token) {
            throw new Error('Failed to obtain token');
          }
          
          // Get user
          const discordUser = await discordService.getCurrentUser();
          if (!discordUser) {
            throw new Error('Failed to get user profile');
          }
          
          // Login to our app with Discord
          await loginWithDiscord(discordUser);
          
          toast.success('Successfully logged in with Discord');
          navigate('/');
        } catch (error) {
          console.error('Authentication error:', error);
          toast.error('Failed to authenticate with Discord');
          navigate('/');
        }
      } else {
        toast.error('Authentication was cancelled or failed');
        navigate('/');
      }
    };
    
    handleAuth();
  }, [location, navigate, loginWithDiscord]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating with Discord...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
      </div>
    </div>
  );
}
