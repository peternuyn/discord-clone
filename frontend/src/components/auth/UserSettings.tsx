'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Volume2, 
  Eye, 
  EyeOff,
  Save,
  Camera
} from 'lucide-react';

export function UserSettings() {
  const [settings, setSettings] = useState({
    username: 'peter_dev',
    email: 'peter@example.com',
    status: 'online',
    theme: 'dark',
    notifications: {
      mentions: true,
      directMessages: true,
      serverMessages: false,
      sound: true,
    },
    privacy: {
      showStatus: true,
      allowDMs: true,
      showActivity: true,
    },
    appearance: {
      compactMode: false,
      showTimestamps: true,
      showUserAvatars: true,
    },
    audio: {
      inputVolume: 80,
      outputVolume: 70,
      echoCancellation: true,
      noiseSuppression: true,
    }
  });

  const handleSettingChange = (category: keyof typeof settings, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, any>),
        [setting]: value
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=peter" />
          <AvatarFallback>PD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-white">User Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Settings</span>
              </CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={settings.username}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={settings.status} onValueChange={(value) => setSettings(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="dnd">Do Not Disturb</SelectItem>
                    <SelectItem value="offline">Invisible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mention Notifications</Label>
                    <p className="text-sm text-gray-400">Get notified when someone mentions you</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.mentions}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'mentions', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Direct Messages</Label>
                    <p className="text-sm text-gray-400">Receive notifications for DMs</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.directMessages}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'directMessages', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-gray-400">Play sounds for notifications</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.sound}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'sound', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy Settings</span>
              </CardTitle>
              <CardDescription>Control your privacy and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Online Status</Label>
                    <p className="text-sm text-gray-400">Let others see when you are online</p>
                  </div>
                  <Switch 
                    checked={settings.privacy.showStatus}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'showStatus', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Direct Messages</Label>
                    <p className="text-sm text-gray-400">Let others send you DMs</p>
                  </div>
                  <Switch 
                    checked={settings.privacy.allowDMs}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'allowDMs', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance Settings</span>
              </CardTitle>
              <CardDescription>Customize how Discord looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <RadioGroup value={settings.theme} onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark">Dark</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="compact" 
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('appearance', 'compactMode', checked)}
                  />
                  <Label htmlFor="compact">Compact Mode</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="timestamps" 
                    checked={settings.appearance.showTimestamps}
                    onCheckedChange={(checked) => handleSettingChange('appearance', 'showTimestamps', checked)}
                  />
                  <Label htmlFor="timestamps">Show Timestamps</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5" />
                <span>Audio Settings</span>
              </CardTitle>
              <CardDescription>Configure your audio preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Volume</Label>
                  <Slider 
                    value={[settings.audio.inputVolume]} 
                    onValueChange={([value]) => handleSettingChange('audio', 'inputVolume', value)}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>0%</span>
                    <span>{settings.audio.inputVolume}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Output Volume</Label>
                  <Slider 
                    value={[settings.audio.outputVolume]} 
                    onValueChange={([value]) => handleSettingChange('audio', 'outputVolume', value)}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>0%</span>
                    <span>{settings.audio.outputVolume}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Echo Cancellation</Label>
                    <p className="text-sm text-gray-400">Reduce echo in voice calls</p>
                  </div>
                  <Switch 
                    checked={settings.audio.echoCancellation}
                    onCheckedChange={(checked) => handleSettingChange('audio', 'echoCancellation', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Noise Suppression</Label>
                    <p className="text-sm text-gray-400">Reduce background noise</p>
                  </div>
                  <Switch 
                    checked={settings.audio.noiseSuppression}
                    onCheckedChange={(checked) => handleSettingChange('audio', 'noiseSuppression', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 