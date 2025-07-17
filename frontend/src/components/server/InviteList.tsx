import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Trash2, Link, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Invite {
  id: string;
  code: string;
  singleUse: boolean;
  used: boolean;
  expiresAt: string | null;
  createdAt: string;
  usedAt?: string;
  usedBy?: {
    username: string;
    discriminator: string;
  };
}

interface InviteListProps {
  server: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteList({ server, isOpen, onClose }: InviteListProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && server?.id) {
      fetchInvites();
    }
  }, [isOpen, server?.id]);

  const fetchInvites = async () => {
    if (!server?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/invites/server/${server.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invites');
      }
      const data = await response.json();
      setInvites(data);
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast.error('Failed to load invites');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = async (code: string) => {
    const inviteLink = `${window.location.origin}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy invite link');
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invite');
      }
      
      setInvites(invites.filter(invite => invite.id !== inviteId));
      toast.success('Invite deleted');
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast.error('Failed to delete invite');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Link className="w-5 h-5" />
            Invites for {server?.name}
          </h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading invites...</div>
          ) : invites.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No invites found. Create your first invite!
            </div>
          ) : (
            invites.map((invite) => (
              <Card key={invite.id} className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm bg-gray-600 px-2 py-1 rounded text-white">
                          {invite.code}
                        </code>
                        <Badge variant={invite.singleUse ? "destructive" : "default"}>
                          {invite.singleUse ? 'Single Use' : 'Multi Use'}
                        </Badge>
                        {invite.used && (
                          <Badge variant="secondary">Used</Badge>
                        )}
                        {isExpired(invite.expiresAt) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Created: {formatDate(invite.createdAt)}
                        </div>
                        
                        {invite.expiresAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Expires: {formatDate(invite.expiresAt)}
                            {isExpired(invite.expiresAt) && (
                              <span className="text-red-400">(Expired)</span>
                            )}
                          </div>
                        )}
                        
                        {invite.used && invite.usedAt && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Used: {formatDate(invite.usedAt)}
                            {invite.usedBy && (
                              <span>by {invite.usedBy.username}#{invite.usedBy.discriminator}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(invite.code)}
                        disabled={invite.used || isExpired(invite.expiresAt)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteInvite(invite.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 