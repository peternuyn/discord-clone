'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, X, Hash, Volume2, Settings, Crown } from 'lucide-react';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateServer: (serverData: { name: string; description: string; icon: string }) => void;
}

export default function CreateServerModal({ isOpen, onClose, onCreateServer }: CreateServerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🎮', // Default icon
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const serverIcons = [
    '🎮', '💻', '🎵', '🎨', '📚', '🏀', '⚽', '🎯', '🔥', '⭐', '💎', '🌟',
    '🎪', '🎭', '🎨', '📷', '🎬', '🎤', '🎧', '🎹', '🎸', '🥁', '🎺', '🎻'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Server name is required');
      setIsLoading(false);
      return;
    }

    if (formData.name.length < 3) {
      setError('Server name must be at least 3 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await onCreateServer(formData);
      onClose();
      setFormData({ name: '', description: '', icon: '🎮' });
    } catch (error) {
      setError('Failed to create server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleIconSelect = (icon: string) => {
    setFormData({
      ...formData,
      icon,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Create a Server</DialogTitle>
          <DialogDescription className="text-gray-400">
            Give your new server a personality with a name and an icon. You can always change it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Server Icon Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Server Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {serverIcons.map((icon, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleIconSelect(icon)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                    formData.icon === icon
                      ? 'bg-purple-600 ring-2 ring-purple-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Server Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              Server Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter server name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
              maxLength={50}
            />
          </div>

          {/* Server Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-300">
              Server Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="What is your server about?"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full h-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500 resize-none"
              maxLength={200}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Server'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 