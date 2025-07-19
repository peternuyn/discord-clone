import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MessageCircle, 
  Users, 
  Sparkles, 
  Rocket,
  Star,
  Zap,
  Heart
} from 'lucide-react';
import { Separator } from '../ui/separator';

interface GetStartedCardProps {
  onCreateServer: () => void;
}

export default function GetStartedCard({ onCreateServer }: GetStartedCardProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Discord Clone! 🎉
          </h1>
          
          <p className="text-xl text-gray-300 mb-6">
            Ready to start your journey? Let's create your first server and connect with friends!
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              New User
            </Badge>
            <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-500/30">
              <Rocket className="w-3 h-3 mr-1" />
              Get Started
            </Badge>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-gray-800/50 border-gray-700 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-white mb-2">
              Let's get started by adding your first server
            </CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Create a server to organize your communities, share ideas, and stay connected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-lg bg-gray-700/30 border border-gray-600/30 hover:border-purple-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600/30 transition-colors">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Text Channels</h3>
                <p className="text-gray-400 text-sm">
                  Create organized text channels for different topics and discussions
                </p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gray-700/30 border border-gray-600/30 hover:border-purple-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600/30 transition-colors">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Voice Channels</h3>
                <p className="text-gray-400 text-sm">
                  Set up voice channels for real-time conversations and collaboration
                </p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gray-700/30 border border-gray-600/30 hover:border-purple-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600/30 transition-colors">
                  <Heart className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Community</h3>
                <p className="text-gray-400 text-sm">
                  Build communities around shared interests, projects, or hobbies
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4">
              <Button 
                onClick={onCreateServer}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Server
              </Button>
              
              <p className="text-gray-500 text-sm">
                It only takes a few seconds to get started! 🚀
              </p>
            </div>

            {/* Tips */}
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                Quick Tips
              </h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-start">
                  <Star className="w-3 h-3 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                  Choose a memorable name and icon for your server
                </li>
                <li className="flex items-start">
                  <Star className="w-3 h-3 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                  Start with a general channel for introductions
                </li>
                <li className="flex items-start">
                  <Star className="w-3 h-3 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                  Invite friends to join and start chatting!
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Separator className="mt-20 bg-purple-700/50" />
        {/* Footer */}
        <div className="text-center mt-8">
          <img src="/logo.png" alt="Discord Clone" className="inline-flex items-center justify-center w-max h-max"/>
          <p className="text-gray-500 text-sm">
            Need help? Check out our documentation or contact support
          </p>
        </div>
      </div>
    </div>
  );
} 