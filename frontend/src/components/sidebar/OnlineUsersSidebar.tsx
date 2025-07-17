import React from 'react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface OnlineUsersSidebarProps {
  serverId?: string;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'idle': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const OnlineUsersSidebar: React.FC<OnlineUsersSidebarProps> = ({ serverId, className }) => {
  const { onlineUsers, isLoading, error } = useOnlineUsers({ serverId });

  return (
    <div className={`w-60 bg-gray-800 border-l border-gray-700 p-4 flex-shrink-0 ${className || ''}`}>
      <h4 className="text-gray-400 text-xs font-semibold mb-3">ONLINE — {isLoading ? '...' : onlineUsers.length}</h4>
      {error && (
        <div className="text-red-400 text-xs mb-2">{error}</div>
      )}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-gray-500 text-xs">No users online</div>
        ) : (
          onlineUsers.map((user: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="relative">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor('online')}`} />
              </div>
              <div className="flex items-center space-x-1">
                {/* Optionally show role icon if available: getRoleIcon(user.role) */}
                <span className="text-gray-300 text-sm">{user.username}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsersSidebar; 