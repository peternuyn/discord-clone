"use client";
import React from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Server {
  id: string;
  name: string;
  icon: string;
}

interface ServerSidebarProps {
  servers: Server[];
  selectedServer: Server | null;
  onServerSelect: (server: Server) => void;
  onAddServer: () => void;
}

const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  selectedServer,
  onServerSelect,
  onAddServer
}) => {
  return (
    <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
      {/* Home Server */}
      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
        <MessageCircle className="w-6 h-6 text-white" />
      </div>
      <Separator className="w-8 bg-gray-600" />
      {/* Server List */}
      {servers.map((server) => (
        <div
          key={server.id}
          onClick={() => onServerSelect(server)}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
            selectedServer?.id === server.id
              ? 'bg-purple-600 rounded-2xl'
              : 'bg-gray-700 hover:bg-gray-600 hover:rounded-2xl'
          }`}
        >
          <span className="text-xl">{server.icon || '🟣'}</span>
        </div>
      ))}
      {/* Add Server */}
      <div
        className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
        onClick={onAddServer}
      >
        <Plus className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );
};

export default ServerSidebar; 