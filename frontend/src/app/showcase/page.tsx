'use client';

import { useState } from 'react';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { NotificationCenter } from '@/components/chat/NotificationCenter';
import { UserSettings } from '@/components/auth/UserSettings';
import { UserProfile } from '@/components/auth/UserProfile';
import { ServerManagement } from '@/components/sidebar/ServerManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Bell, 
  Settings, 
  User, 
  Server, 
  Sparkles,
  Play,
  Pause
} from 'lucide-react';

const mockUser = {
  id: '1',
  username: 'peter_dev',
  discriminator: '1234',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peter',
  status: 'online' as const,
  role: 'owner' as const,
  joinedAt: new Date('2023-01-15'),
  lastSeen: new Date(),
  bio: 'Full-stack developer building amazing Discord clones! 🚀',
  location: 'San Francisco, CA',
  badges: ['🎯', '🔥', '⭐'],
  stats: {
    messagesSent: 15420,
    reactionsGiven: 8920,
    serversJoined: 15,
    timeSpent: 1240
  }
};

const mockReactions = [
  { emoji: '👍', count: 3, users: [{ username: 'alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' }] },
  { emoji: '❤️', count: 5, users: [{ username: 'bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' }] },
  { emoji: '🔥', count: 2, users: [{ username: 'charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie' }] }
];

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState('components');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
  };

  const handleTyping = (isTyping: boolean) => {
    console.log('Typing:', isTyping);
  };

  const handleReactionAdd = (emoji: string) => {
    console.log('Reaction added:', emoji);
  };

  const handleReactionRemove = (emoji: string) => {
    console.log('Reaction removed:', emoji);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-8 h-8 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">Discord Clone Showcase</h1>
              </div>
              <Badge variant="secondary" className="bg-purple-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Interactive Demo
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="animations">Animations</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Message Input Component */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>Enhanced Message Input</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MessageInput 
                    channelName="general"
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                  />
                </CardContent>
              </Card>

              {/* Message Reactions Component */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Message Reactions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 mb-4">This is a sample message with reactions below:</p>
                    <MessageReactions 
                      reactions={mockReactions}
                      onReactionAdd={handleReactionAdd}
                      onReactionRemove={handleReactionRemove}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* User Profile Component */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>User Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserProfile user={mockUser} />
                </CardContent>
              </Card>

              {/* Server Management Component */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Server className="w-5 h-5" />
                    <span>Server Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ServerManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="animations" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hover Animations */}
              <Card className="bg-gray-800 border-gray-700 group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Hover Effects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
                      <p className="text-gray-300">Hover me for color change</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer">
                      <p className="text-gray-300">Hover me for scale effect</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg hover:rotate-1 transition-transform duration-200 cursor-pointer">
                      <p className="text-gray-300">Hover me for rotation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading Animations */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Loading States</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Transition Animations */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Transitions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setIsAnimating(!isAnimating)}
                      className="w-full transition-all duration-300 hover:scale-105"
                    >
                      {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isAnimating ? 'Stop' : 'Start'} Animation
                    </Button>
                    <div className={`p-4 bg-gray-700 rounded-lg transition-all duration-500 ${
                      isAnimating ? 'bg-purple-600 scale-105' : ''
                    }`}>
                      <p className="text-gray-300">Animated element</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interactive Elements */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Interactive Elements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-300">Click the notification bell to see the notification center in action!</p>
                    <div className="flex justify-center">
                      <NotificationCenter />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Settings */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Settings Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-300">Explore the comprehensive settings panel with tabs and switches.</p>
                    <Button 
                      onClick={() => setActiveTab('features')}
                      className="w-full"
                    >
                      View Settings Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              {/* User Settings Component */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Complete User Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserSettings />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 