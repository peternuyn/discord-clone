'use client';

import { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Smile, Plus } from 'lucide-react';

interface Reaction {
  emoji: string;
  count: number;
  users: Array<{
    username: string;
    avatar: string;
  }>;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionAdd: (emoji: string) => void;
  onReactionRemove: (emoji: string) => void;
}

export function MessageReactions({ reactions, onReactionAdd, onReactionRemove }: MessageReactionsProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Close picker on outside click or scroll
  useEffect(() => {
    if (!showReactionPicker) return;
    function handleClick(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowReactionPicker(false);
      }
    }
    function handleScroll() {
      setShowReactionPicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showReactionPicker]);

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 mt-2 relative">
        {reactions.map((reaction, index) => (
          <HoverCard key={index}>
            <HoverCardTrigger asChild>
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onReactionRemove(reaction.emoji);
                }}
              >
                {reaction.emoji} {reaction.count}
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Reacted with {reaction.emoji}</h4>
                <div className="space-y-1">
                  {reaction.users?.map((user, userIndex) => (
                    <div key={userIndex} className="flex items-center space-x-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-300">{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1 rounded hover:bg-gray-600 transition-colors"
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add reaction</p>
          </TooltipContent>
        </Tooltip>
        
        {showReactionPicker && (
          <div ref={pickerRef} className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-lg z-50" style={{ top: '1%', left: '0' }}>
            <div className="grid grid-cols-6 gap-1">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReactionAdd(emoji);
                    setShowReactionPicker(false);
                  }}
                  className="p-2 hover:bg-gray-700 rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 