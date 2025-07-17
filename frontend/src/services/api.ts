import { LoginRequest, RegisterRequest, AuthResponse, ApiError } from '@/types/auth';

/**
 * Base URL for API requests, defaults to localhost in development
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Service class for handling API requests
 */
class ApiService {
  /**
   * Makes an HTTP request to the API
   * @param endpoint - API endpoint to call
   * @param options - Fetch options for the request
   * @returns Promise with the response data
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  /**
   * Logs in a user
   * @param credentials - User login credentials
   * @returns Promise with auth response containing user data and token
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Registers a new user
   * @param userData - New user registration data
   * @returns Promise with auth response containing user data and token
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Logs out the current user
   * @returns Promise with logout confirmation message
   */
  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Gets the currently logged in user
   * @returns Promise with current user data
   */
  async getCurrentUser(): Promise<{ user: AuthResponse['user'] }> {
    return this.request<{ user: AuthResponse['user'] }>('/auth/me');
  }

  /**
   * Gets all servers for the current user
   * @returns Promise with array of user's servers
   */
  async getUserServers(): Promise<any[]> {
    return this.request<any[]>('/servers');
  }

  /**
   * Creates a new server
   * @param serverData - Server creation data (name, description, icon)
   * @returns Promise with created server data
   */
  async createServer(serverData: { name: string; description: string; icon: string }): Promise<any> {
    return this.request<any>('/servers', {
      method: 'POST',
      body: JSON.stringify(serverData),
    });
  }

  /**
   * Updates an existing server
   * @param serverId - ID of server to update
   * @param data - Updated server data
   * @returns Promise with updated server data
   */
  async updateServer(serverId: string, data: { name: string; description: string; icon: string }): Promise<any> {
    return this.request<any>(`/servers/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Quits/leaves a server
   * @param serverId - ID of server to quit
   */
  async quitServer(serverId: string): Promise<void> {
    await this.request<any>(`/servers/${serverId}/quit`, {
      method: 'POST',
    });
  }

  /**
   * Deletes a server
   * @param serverId - ID of server to delete
   */
  async deleteServer(serverId: string): Promise<void> {
    await this.request<any>(`/servers/${serverId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Gets a specific channel
   * @param channelId - ID of channel to fetch
   * @returns Promise with channel data
   */
  async getChannel(channelId: string): Promise<any> {
    return this.request<any>(`/channels/${channelId}`);
  }

  /**
   * Creates a new channel in a server
   * @param serverId - ID of server to create channel in
   * @param data - Channel creation data (name, type)
   * @returns Promise with created channel data
   */
  async createChannel(serverId: string, data: { name: string; type: string }): Promise<any> {
    return this.request<any>(`/channels/server/${serverId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Updates an existing channel
   * @param channelId - ID of channel to update
   * @param data - Updated channel data
   * @returns Promise with updated channel data
   */
  async updateChannel(channelId: string, data: { name?: string; type?: string }): Promise<any> {
    return this.request<any>(`/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletes a channel
   * @param channelId - ID of channel to delete
   */
  async deleteChannel(channelId: string): Promise<void> {
    await this.request<any>(`/channels/${channelId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Gets messages for a channel
   * @param channelId - ID of channel to get messages from
   * @param limit - Number of messages to fetch (default: 100)
   * @param offset - Number of messages to skip (default: 0)
   * @returns Promise with paginated messages response
   */
  async getChannelMessages(channelId: string, limit: number = 100, offset: number = 0): Promise<{
    messages: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    return this.request<{
      messages: any[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(`/channels/${channelId}/messages?limit=${limit}&offset=${offset}`);
  }

  /**
   * Creates a new message in a channel
   * @param channelId - ID of channel to create message in
   * @param content - Content of the message
   * @returns Promise with created message data
   */
  async createMessage(channelId: string, content: string): Promise<any> {
    return this.request<any>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Online Users API
  async getOnlineUsers() {
    const response = await fetch(`${API_BASE_URL}/users/online`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch online users');
    }
    
    return response.json();
  }

  async getOnlineUsersForServer(serverId: string) {
    const response = await fetch(`${API_BASE_URL}/users/online/server/${serverId}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch online users for server');
    }
    
    return response.json();
  }

  async isUserOnline(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/online/${userId}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check user online status');
    }
    
    return response.json();
  }

  /**
   * Adds a reaction to a message
   * @param messageId - ID of message to react to
   * @param emoji - Emoji to add as reaction
   * @returns Promise with reaction data
   */
  async addReaction(messageId: string, emoji: string): Promise<any> {
    return this.request<any>(`/channels/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  /**
   * Removes a reaction from a message
   * @param messageId - ID of message to remove reaction from
   * @param emoji - Emoji to remove
   * @returns Promise with updated message data
   */
  async removeReaction(messageId: string, emoji: string): Promise<any> {
    return this.request<any>(`/channels/messages/${messageId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ emoji }),
    });
  }
}

export const apiService = new ApiService(); 