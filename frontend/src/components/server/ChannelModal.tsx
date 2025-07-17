import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  channelType: string; // Required prop for channel type
  initialData?: {
    name: string;
    type: string;
    id: string;
  };
  onSubmit: (data: { name: string; type: string; id?: string }) => void;
  serverId?: string;
}

export default function ChannelModal({
  isOpen,
  onClose,
  mode,
  channelType,
  initialData,
  onSubmit,
  serverId
}: ChannelModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: channelType,
    id: ''
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name,
          type: initialData.type,
          id: initialData.id
        });
      } else {
        setFormData({
          name: '',
          type: channelType,
          id: ''
        });
      }
    }
  }, [isOpen, mode, initialData, channelType]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === 'create' ? `Create ${channelType.charAt(0).toUpperCase() + channelType.slice(1)} Channel` : 'Edit Channel'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-gray-300 mb-1">Channel Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Enter channel name"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 