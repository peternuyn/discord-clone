'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Shield, 
  Users, 
  Calendar, 
  MapPin, 
  MessageCircle, 
  Heart, 
  Star,
  Edit,
  Camera,
  Settings,
  LogOut,
  User,
  Activity,
  Award,
  Clock
} from 'lucide-react';

interface UserProfileProps {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    role: 'owner' | 'admin' | 'moderator' | 'member';
    joinedAt: Date;
    lastSeen: Date;
    bio?: string;
    location?: string;
    badges: string[];
    stats: {
      messagesSent: number;
      reactionsGiven: number;
      serversJoined: number;
      timeSpent: number; // in hours
    };
  };
}

/**
 * 2. Interactive User Profile (UserProfile.tsx)
 * Animated avatar hover with scale and upload overlay
 * Status indicators with colored dots
 * Tabbed interface (Overview, Activity, Badges, Stats)
 * Progress bars for user statistics
 * Activity timeline with hover effects
 * Badge showcase with grid layout
 * Role-based icons and colors

 */

export function UserProfile({ user }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Crown className="w-4 h-4 text-purple-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-500';
      case 'admin': return 'text-purple-500';
      case 'moderator': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const formatTimeSpent = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <div className="relative h-32 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end space-x-4">
                <div className="relative group">
                  <Avatar className="w-20 h-20 border-4 border-gray-800 group-hover:scale-105 transition-transform duration-200">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-lg">{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-gray-800 ${getStatusColor(user.status)}`}></div>
                  
                  {/* Avatar Upload Overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-white">
                          <Camera className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Change Avatar</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Upload a new profile picture
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                            <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-400">Click to upload or drag and drop</p>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowAvatarUpload(false)}>
                              Cancel
                            </Button>
                            <Button>Upload</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                    {getRoleIcon(user.role)}
                    <Badge variant="secondary" className="text-xs">
                      #{user.discriminator}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span className={`capitalize ${getStatusColor(user.status).replace('bg-', 'text-')}`}>
                      {user.status}
                    </span>
                    <span className={`capitalize ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit profile</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">About</CardTitle>
              </CardHeader>
              <CardContent>
                {user.bio ? (
                  <p className="text-gray-300">{user.bio}</p>
                ) : (
                  <p className="text-gray-400 italic">No bio set</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Joined</span>
                  </div>
                  <p className="text-white font-medium">
                    {user.joinedAt.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Last seen</span>
                  </div>
                  <p className="text-white font-medium">
                    {user.lastSeen.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Sent a message in #general</span>
                    <span className="text-xs text-gray-400 ml-auto">2m ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">Reacted to a message</span>
                    <span className="text-xs text-gray-400 ml-auto">5m ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Joined Gaming Hub server</span>
                    <span className="text-xs text-gray-400 ml-auto">1h ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {user.badges.map((badge, index) => (
                    <div key={index} className="text-center p-3 rounded bg-gray-700 hover:bg-gray-600 transition-colors">
                      <div className="text-2xl mb-1">{badge}</div>
                      <p className="text-xs text-gray-400">Badge {index + 1}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Messages Sent</span>
                      <span className="text-white">{user.stats.messagesSent.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(user.stats.messagesSent / 1000 * 100, 100)} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Reactions Given</span>
                      <span className="text-white">{user.stats.reactionsGiven.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(user.stats.reactionsGiven / 500 * 100, 100)} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Servers Joined</span>
                      <span className="text-white">{user.stats.serversJoined}</span>
                    </div>
                    <Progress value={Math.min(user.stats.serversJoined / 10 * 100, 100)} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Time Spent</span>
                      <span className="text-white">{formatTimeSpent(user.stats.timeSpent)}</span>
                    </div>
                    <Progress value={Math.min(user.stats.timeSpent / 100 * 100, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
} 