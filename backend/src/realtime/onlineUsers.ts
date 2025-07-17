import { Socket } from 'socket.io';
import { prisma } from '../lib/db';

interface OnlineUser {
  userId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  socketId: string;
  connectedAt: Date;
}

class OnlineUsersService {
  private onlineUsers = new Map<string, OnlineUser>(); // socketId -> user info
  private userSockets = new Map<string, string[]>(); // userId -> socketIds[]

  /**
   * Add a user to the online users list
   */
  addUser(socket: Socket, user: { id: string; username: string; discriminator: string; avatar?: string }) {
    const onlineUser: OnlineUser = {
      userId: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
      socketId: socket.id,
      connectedAt: new Date(),
    };

    this.onlineUsers.set(socket.id, onlineUser);
    
    // Track multiple sockets per user (in case of multiple tabs/devices)
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, []);
    }
    this.userSockets.get(user.id)!.push(socket.id);

    // Update user status in database
    this.updateUserStatus(user.id, 'online');

    console.log(`User ${user.username}#${user.discriminator} is now online`);
  }

  /**
   * Remove a user from the online users list
   */
  removeUser(socketId: string) {
    const user = this.onlineUsers.get(socketId);
    if (!user) return;

    this.onlineUsers.delete(socketId);
    
    // Remove socket from user's socket list
    const userSocketIds = this.userSockets.get(user.userId);
    if (userSocketIds) {
      const updatedSocketIds = userSocketIds.filter(id => id !== socketId);
      if (updatedSocketIds.length === 0) {
        // User has no more active connections
        this.userSockets.delete(user.userId);
        this.updateUserStatus(user.userId, 'offline');
        console.log(`User ${user.username}#${user.discriminator} is now offline`);
      } else {
        this.userSockets.set(user.userId, updatedSocketIds);
      }
    }
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): OnlineUser[] {
    // Return unique users (not sockets)
    const uniqueUsers = new Map<string, OnlineUser>();
    
    for (const [socketId, user] of this.onlineUsers) {
      if (!uniqueUsers.has(user.userId)) {
        uniqueUsers.set(user.userId, user);
      }
    }
    
    return Array.from(uniqueUsers.values());
  }

  /**
   * Get online users for a specific server
   */
  async getOnlineUsersForServer(serverId: string): Promise<OnlineUser[]> {
    const onlineUsers = this.getOnlineUsers();
    const onlineUserIds = onlineUsers.map(user => user.userId);
    
    // Get server members who are online
    const serverMembers = await prisma.serverMember.findMany({
      where: {
        serverId,
        userId: { in: onlineUserIds }
      },
      include: {
        user: true
      }
    });

    const serverMemberIds = serverMembers.map(member => member.userId);
    return onlineUsers.filter(user => serverMemberIds.includes(user.userId));
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get user's socket IDs
   */
  getUserSocketIds(userId: string): string[] {
    return this.userSockets.get(userId) || [];
  }

  /**
   * Update user status in database
   */
  private async updateUserStatus(userId: string, status: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status }
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}

// Export singleton instance
export const onlineUsersService = new OnlineUsersService(); 