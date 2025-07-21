'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  X, 
  Settings, 
  MessageCircle, 
  AtSign, 
  Heart, 
  Users, 
  Crown,
  Shield,
  Volume2,
  VolumeX,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Notification {
  id: string;
  type: 'mention' | 'message' | 'reaction' | 'server' | 'friend' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  user?: {
    username: string;
    avatar: string;
  };
  server?: {
    name: string;
    icon: string;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'You were mentioned',
    message: '@peter_dev check out this new feature!',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    user: {
      username: 'alice_dev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
    },
    server: {
      name: 'Tech Community',
      icon: '💻'
    }
  },
  {
    id: '2',
    type: 'reaction',
    title: 'New reaction',
    message: 'bob_coder reacted to your message with ❤️',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    user: {
      username: 'bob_coder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
    }
  },
  {
    id: '3',
    type: 'server',
    title: 'Server update',
    message: 'You were promoted to moderator in Gaming Hub',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    read: true,
    server: {
      name: 'Gaming Hub',
      icon: '🎮'
    }
  },
  {
    id: '4',
    type: 'friend',
    title: 'Friend request',
    message: 'charlie_gamer sent you a friend request',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    user: {
      username: 'charlie_gamer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'
    }
  },
  {
    id: '5',
    type: 'system',
    title: 'System notification',
    message: 'Your account has been verified successfully',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true
  }
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    sound: true,
    desktop: true,
    mentions: true,
    reactions: true,
    serverUpdates: true,
    friendRequests: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return <AtSign className="w-4 h-4 text-blue-400" />;
      case 'message': return <MessageCircle className="w-4 h-4 text-green-400" />;
      case 'reaction': return <Heart className="w-4 h-4 text-red-400" />;
      case 'server': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'friend': return <Users className="w-4 h-4 text-purple-400" />;
      case 'system': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'mention': return 'border-l-blue-500 bg-blue-500/10';
      case 'message': return 'border-l-green-500 bg-green-500/10';
      case 'reaction': return 'border-l-red-500 bg-red-500/10';
      case 'server': return 'border-l-yellow-500 bg-yellow-500/10';
      case 'friend': return 'border-l-purple-500 bg-purple-500/10';
      case 'system': return 'border-l-gray-500 bg-gray-500/10';
      default: return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Simulate new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'mention',
          title: 'New mention',
          message: 'You were mentioned in a channel',
          timestamp: new Date(),
          read: false,
          user: {
            username: 'user_' + Math.floor(Math.random() * 1000),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
          }
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 hover:text-yellow-500 transition-all duration-200 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-in zoom-in-50 duration-200"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications ({unreadCount} unread)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-md bg-gray-800 border-gray-700 p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-lg font-semibold">Notifications</DialogTitle>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark all as read</p>
                  </TooltipContent>
                </Tooltip>
                <Dialog>
                  <DialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notification settings</p>
                      </TooltipContent>
                    </Tooltip>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Notification Settings</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Customize your notification preferences
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                        <div className="space-y-0.5">
                          <Label className="text-gray-300 font-medium">Sound notifications</Label>
                          <p className="text-sm text-gray-400">Play sounds for new notifications</p>
                        </div>
                        <Switch 
                          checked={settings.sound}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sound: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                        <div className="space-y-0.5">
                          <Label className="text-gray-300 font-medium">Desktop notifications</Label>
                          <p className="text-sm text-gray-400">Show desktop notifications</p>
                        </div>
                        <Switch 
                          checked={settings.desktop}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, desktop: checked }))}
                        />
                      </div>
                      <Separator className="bg-gray-600" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                          <span className="text-gray-300 font-medium">Mentions</span>
                          <Switch 
                            checked={settings.mentions}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, mentions: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                          <span className="text-gray-300 font-medium">Reactions</span>
                          <Switch 
                            checked={settings.reactions}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reactions: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                          <span className="text-gray-300 font-medium">Server updates</span>
                          <Switch 
                            checked={settings.serverUpdates}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, serverUpdates: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                          <span className="text-gray-300 font-medium">Friend requests</span>
                          <Switch 
                            checked={settings.friendRequests}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, friendRequests: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="h-96 px-6">
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">You are all caught up!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`group relative p-4 rounded-lg border border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer ${
                      !notification.read ? getNotificationColor(notification.type) : 'hover:bg-gray-700/50'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {notification.user ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.user.avatar} />
                            <AvatarFallback className="bg-gray-600 text-white font-medium">
                              {notification.user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-white">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(notification.timestamp)}</span>
                                {notification.server && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">{notification.server.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete button - appears on hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 p-0 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 