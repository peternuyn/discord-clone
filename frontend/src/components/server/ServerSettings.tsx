import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Link, LogOut } from 'lucide-react';
import InviteModal from './InviteModal';
import InviteList from './InviteList';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface ServerSettingsProps {
  server: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; icon: string }) => void;
  onDelete: () => void;
}

export default function ServerSettings({ server, isOpen, onClose, onSave, onDelete }: ServerSettingsProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: server?.name || '',
    description: server?.description || '',
    icon: server?.icon || '🎮',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteList, setShowInviteList] = useState(false);

  // this useEffect sets the form to the server's name, description, and icon, when we want to edit the server
  useEffect(() => {
    setForm({
      name: server?.name || '',
      description: server?.description || '',
      icon: server?.icon || '🎮',
    });
  }, [server, isOpen]);

  /**
   * Handles the change of the input fields
   * @param e The event object
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handles the saving of the server's details
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    await onSave(form);
    setIsSaving(false);
    onClose();
  };

  // Helper function to determine user's role in the server
  const getUserRole = () => {
    if (!server || !user) return null;
    
    // Check if user is the owner
    if (server.ownerId === user.id) return 'owner';
    
    // Check if user is a member and get their role
    const member = server.members?.find((m: any) => m.userId === user.id);
    return member?.role || null;
  };

  const userRole = getUserRole();
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || isOwner;
  const canDelete = isOwner || isAdmin;
  const canQuit = !isOwner; // Owners can't quit, they must delete

  /**
   * Handles quitting the server
   */
  const handleQuit = async (): Promise<void> => {
    if (!server?.id) return;
    
    setIsQuitting(true);
    try {
      await apiService.quitServer(server.id);
      toast.success('Successfully left the server');
      onClose();
      // Refresh the page or update the server list
      window.location.reload();
    } catch (error) {
      console.error('Error quitting server:', error);
      toast.error('Failed to leave server');
    } finally {
      setIsQuitting(false);
    }
  };

  /**
   * Handles the deletion of the server's details
   */
  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Server Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Edit your server details below. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {isAdmin ? (
            <>
              <div>
                <label className="block text-gray-300 mb-1">Server Name</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter a new server name"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Description</label>
                <Input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter server description"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Icon</label>
                <Input
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  className="bg-gray-700 border-gray-600 text-white w-16 text-center text-2xl"
                  maxLength={2}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400">Only server owners and admins can edit server settings.</p>
            </div>
          )}
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowInviteModal(true)}
                className="flex-1"
              >
                <Link className="w-4 h-4 mr-2" />
                Invite People
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInviteList(true)}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                View Invites
              </Button>
            </div>
            <div className={`flex gap-2 ${!isAdmin ? 'justify-center' : ''}`}>
              {canQuit ? (
                <Button 
                  variant="destructive" 
                  onClick={handleQuit} 
                  disabled={isQuitting} 
                  className={isAdmin ? "flex-1" : "w-full"}
                >
                  <LogOut className="w-4 h-4 mr-2" /> 
                  Leave Server
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={isDeleting} 
                  className={isAdmin ? "flex-1" : "w-full"}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> 
                  Delete Server
                </Button>
              )}
              {isAdmin && (
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Invite Modal */}
      <InviteModal
        server={server}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteCreated={(invite) => {
          console.log('Invite created:', invite);
        }}
      />
      
      {/* Invite List */}
      <InviteList
        server={server}
        isOpen={showInviteList}
        onClose={() => setShowInviteList(false)}
      />
    </Dialog>
  );
} 