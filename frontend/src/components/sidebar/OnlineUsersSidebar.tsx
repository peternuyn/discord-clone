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
    <div className={`w-full h-full bg-gray-800 border-l border-gray-700 p-4 lg:p-6 flex-shrink-0 overflow-y-auto ${className || ''}`}>
      <h4 className="text-gray-400 text-xs lg:text-sm font-semibold mb-3">ONLINE — {isLoading ? '...' : onlineUsers.length}</h4>
      {error && (
        <div className="text-red-400 text-xs mb-2">{error}</div>
      )}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="w-6 h-6 lg:w-8 lg:h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 lg:h-5 w-24 lg:w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-gray-500 text-xs">No users online</div>
        ) : (
          onlineUsers.map((user: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="relative flex-shrink-0">
                <Avatar className="w-6 h-6 lg:w-8 lg:h-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 border-gray-800 ${getStatusColor('online')}`} />
              </div>
              <div className="flex items-center space-x-1 min-w-0 flex-1">
                {/* Optionally show role icon if available: getRoleIcon(user.role) */}
                <span className="text-gray-300 text-sm lg:text-base truncate">{user.username}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsersSidebar; 