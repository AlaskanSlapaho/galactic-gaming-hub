
// Discord integration service

interface DiscordCredentials {
  clientId: string;
  clientSecret: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  balance?: number;
}

class DiscordService {
  private credentials: DiscordCredentials = {
    clientId: '1357044451410972801',
    clientSecret: 'IsWkgoskTe5jIYMm_XHU-Q3ayanMbuv5'
  };
  
  private redirectUri = `${window.location.origin}/auth/callback`;
  private tokenStorageKey = "discord_access_token";
  private userStorageKey = "discord_user";
  
  // Generate OAuth2 login URL
  getAuthUrl(): string {
    // Make sure the redirect_uri is URL encoded and matches exactly what's registered in Discord
    const encodedRedirectUri = encodeURIComponent(this.redirectUri);
    
    const params = new URLSearchParams({
      client_id: this.credentials.clientId,
      redirect_uri: this.redirectUri, // Discord requires non-encoded URI in the params
      response_type: 'code',
      scope: 'identify'
    });
    
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }
  
  // Exchange code for access token
  async getToken(code: string): Promise<string | null> {
    try {
      // In a real implementation, this would be handled by a backend
      // For this demo, we'll simulate a successful token exchange
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem(this.tokenStorageKey, mockToken);
      return mockToken;
    } catch (error) {
      console.error("Error getting Discord token:", error);
      return null;
    }
  }
  
  // Get current user from Discord
  async getCurrentUser(): Promise<DiscordUser | null> {
    try {
      // Check if we have a cached user
      const cachedUser = localStorage.getItem(this.userStorageKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      
      // In a real implementation, this would call the Discord API
      // For this demo, we'll create a mock user without a balance
      const mockUser: DiscordUser = {
        id: `${Math.floor(Math.random() * 1000000)}`,
        username: "DiscordUser",
        discriminator: "0000",
        avatar: "",
        // No balance for new users
      };
      
      // Cache the user
      localStorage.setItem(this.userStorageKey, JSON.stringify(mockUser));
      return mockUser;
    } catch (error) {
      console.error("Error getting Discord user:", error);
      return null;
    }
  }
  
  // Check if the user is authenticated with Discord
  isAuthenticated(): boolean {
    return localStorage.getItem(this.tokenStorageKey) !== null;
  }
  
  // Log out from Discord
  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }

  // Check user's Discord credits
  async checkUserCredits(discordUserId: string): Promise<number | null> {
    try {
      // In a real implementation, this would make an API call to your Discord bot
      // For now, we'll return 0 for a new user
      
      const user = await this.getCurrentUser();
      if (user && user.balance !== undefined) {
        return user.balance;
      }
      
      // Default to 0 credits for new users
      return 0;
    } catch (error) {
      console.error("Error checking Discord credits:", error);
      return null;
    }
  }

  // Transfer credits from Discord to casino
  async depositCredits(discordUserId: string, amount: number): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call to your Discord bot
      
      // Update the cached user balance
      const user = await this.getCurrentUser();
      if (user) {
        user.balance = (user.balance || 0) - amount;
        localStorage.setItem(this.userStorageKey, JSON.stringify(user));
      }
      
      return true;
    } catch (error) {
      console.error("Error depositing credits:", error);
      return false;
    }
  }

  // Transfer credits from casino to Discord
  async withdrawCredits(discordUserId: string, amount: number): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call to your Discord bot
      
      // Update the cached user balance
      const user = await this.getCurrentUser();
      if (user) {
        user.balance = (user.balance || 0) + amount;
        localStorage.setItem(this.userStorageKey, JSON.stringify(user));
      }
      
      return true;
    } catch (error) {
      console.error("Error withdrawing credits:", error);
      return false;
    }
  }
  
  // Get Discord balance
  async getDiscordBalance(): Promise<number | null> {
    const user = await this.getCurrentUser();
    return user?.balance || 0; // Return 0 if balance is undefined
  }
}

// Export a singleton instance
export const discordService = new DiscordService();
