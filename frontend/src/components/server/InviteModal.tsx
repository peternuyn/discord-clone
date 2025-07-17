import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, Link, Users } from 'lucide-react';
import { toast } from 'sonner';

interface InviteModalProps {
  server: any;
  isOpen: boolean;
  onClose: () => void;
  onInviteCreated: (invite: any) => void;
}

export default function InviteModal({ server, isOpen, onClose, onInviteCreated }: InviteModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [singleUse, setSingleUse] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdInvite, setCreatedInvite] = useState<any>(null);

  const handleCreateInvite = async () => {
    if (!server?.id) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId: server.id,
          singleUse,
          expiresAt: expiresAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create invite');
      }

      const invite = await response.json();
      setCreatedInvite(invite);
      onInviteCreated(invite);
      toast.success('Invite created successfully!');
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to create invite');
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = async () => {
    if (!createdInvite) return;

    const inviteLink = `${window.location.origin}/invite/${createdInvite.code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy invite link');
    }
  };

  const resetForm = () => {
    setSingleUse(false);
    setExpiresAt('');
    setCreatedInvite(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Link className="w-5 h-5" />
            Invite People to {server?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create an invite link to share with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!createdInvite ? (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="single-use" className="text-gray-300">
                  Single-use invite
                </Label>
                <Switch
                  id="single-use"
                  checked={singleUse}
                  onCheckedChange={setSingleUse}
                />
              </div>

              <div>
                <Label htmlFor="expires-at" className="text-gray-300">
                  Expires at (optional)
                </Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                {singleUse ? 'This invite can only be used once' : 'This invite can be used multiple times'}
              </div>

              <Button 
                onClick={handleCreateInvite} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Invite'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Invite Link</span>
                  <Badge variant={singleUse ? "destructive" : "default"}>
                    {singleUse ? 'Single Use' : 'Multi Use'}
                  </Badge>
                </div>
                <div className="bg-gray-600 rounded p-2 text-sm font-mono text-white break-all">
                  {`${window.location.origin}/invite/${createdInvite.code}`}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={copyInviteLink} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 