
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
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      console.log('Discord auth callback received:', { code, error, errorDescription });
      
      if (error) {
        console.error('Discord auth error:', error, errorDescription);
        toast.error(`Authentication failed: ${errorDescription || error}`);
        navigate('/');
        return;
      }
      
      if (code) {
        try {
          console.log('Attempting to exchange code for token');
          // Get token
          const token = await discordService.getToken(code);
          if (!token) {
            throw new Error('Failed to obtain token');
          }
          
          console.log('Token obtained, getting user profile');
          // Get user
          const discordUser = await discordService.getCurrentUser();
          if (!discordUser) {
            throw new Error('Failed to get user profile');
          }
          
          console.log('User profile obtained, logging in');
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
