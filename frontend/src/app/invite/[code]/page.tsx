'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface InviteData {
  id: string;
  code: string;
  server: {
    id: string;
    name: string;
    description: string;
    icon: string;
    members: Array<{
      user: {
        username: string;
        discriminator: string;
        avatar: string;
      };
    }>;
  };
  singleUse: boolean;
  used: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = React.use(params);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchInviteData();
  }, [code]);

  const fetchInviteData = async () => {
    try {
      const response = await fetch(`/api/invites/${code}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Invite not found');
        } else if (response.status === 400) {
          const data = await response.json();
          setError(data.error || 'Invalid invite');
        } else {
          setError('Failed to load invite');
        }
        return;
      }
      
      const data = await response.json();
      setInvite(data);
    } catch (error) {
      console.error('Error fetching invite:', error);
      setError('Failed to load invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinServer = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to join this server');
      router.push('/login');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join server');
      }

      const result = await response.json();
      toast.success(`Successfully joined ${result.server.name}!`);
      router.push(`/dashboard?server=${result.server.id}`);
    } catch (error: any) {
      console.error('Error joining server:', error);
      toast.error(error.message || 'Failed to join server');
    } finally {
      setIsJoining(false);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Invalid Invite</h2>
            <p className="text-gray-400 mb-4">{error || 'This invite link is invalid or has expired.'}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">{invite.server.icon}</div>
          <CardTitle className="text-white text-xl">{invite.server.name}</CardTitle>
          {invite.server.description && (
            <p className="text-gray-400 text-sm">{invite.server.description}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Members</span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-white">{invite.server.members.length}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Invite Type</span>
            <Badge variant={invite.singleUse ? "destructive" : "default"}>
              {invite.singleUse ? 'Single Use' : 'Multi Use'}
            </Badge>
          </div>

          {invite.expiresAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Expires</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={isExpired(invite.expiresAt) ? "text-red-400" : "text-white"}>
                  {formatDate(invite.expiresAt)}
                </span>
              </div>
            </div>
          )}

          {invite.used && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">This invite has already been used</span>
              </div>
            </div>
          )}

          {isExpired(invite.expiresAt) && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">This invite has expired</span>
              </div>
            </div>
          )}

          <div className="pt-4">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <Button 
                  onClick={() => router.push('/login')} 
                  className="w-full"
                >
                  Log in to Join
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/register')}
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleJoinServer}
                disabled={isJoining || invite.used || isExpired(invite.expiresAt)}
                className="w-full"
              >
                {isJoining ? 'Joining...' : 'Join Server'}
              </Button>
            )}
          </div>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 