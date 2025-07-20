import { apiService } from "@/services/api";
import { useState } from "react";




export function useChatReactions(selectedChannel: any, setSelectedChannel: any, user: any) {
  const [messageCache, setMessageCache] = useState<Record<string, any[]>>({});
  const [messages, setMessages] = useState<any[]>([]);


  // Event handler functions
  const handleNewMessage = (msg: any) => {
    const newMessage = { ...msg, timestamp: new Date(msg.createdAt) };
    setMessageCache(prev => ({
      ...prev,
      [msg.channelId]: [...(prev[msg.channelId] || []), newMessage]
    }));
    
    if (msg.channelId === selectedChannel?.id) {
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedChannel?.id || !user) return;

    // Create optimistic message with a unique temp ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempId,
      content: message,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: 'online' as const,
      },
      timestamp: new Date(),
      reactions: [],
      isOptimistic: true, // Flag to identify optimistic messages
    };

    // Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send to server
      const newMessage = await apiService.createMessage(selectedChannel.id, message);
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...newMessage, timestamp: new Date(newMessage.createdAt) } : msg
      ));
      
      // Update cache
      setMessageCache(prev => ({
        ...prev,
        [selectedChannel.id]: (prev[selectedChannel.id] || []).map(msg => 
          msg.id === tempId ? { ...newMessage, timestamp: new Date(newMessage.createdAt) } : msg
        )
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // You could show a toast notification here
    }
  };

  const handleTyping = (isTyping: boolean) => {
    // console.log('Typing:', isTyping);
  };

  const handleReactionAdd = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    // Optimistically update UI
    setMessages((prev: any[]) =>
      prev.map((msg: any) => {
        if (msg.id !== messageId) return msg;
        const existing = msg.reactions.find((r: any) => r.emoji === emoji);
        if (existing) {
          // Add current user to users array if not already present
          if (!existing.users.some((u: any) => u.id === user.id)) {
            return {
              ...msg,
              reactions: msg.reactions.map((r: any) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, { id: user.id, username: user.username, avatar: user.avatar }] }
                  : r
              ),
            };
          }
          return msg;
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              {
                emoji,
                count: 1,
                users: [{ id: user.id, username: user.username, avatar: user.avatar }],
              },
            ],
          };
        }
      })
    );

    // Also update message cache optimistically
    setMessageCache(prev => {
      const updatedCache = { ...prev };
      Object.keys(updatedCache).forEach(channelId => {
        const channelMessages = updatedCache[channelId] || [];
        const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
          const msg = channelMessages[messageIndex];
          const existing = msg.reactions.find((r: any) => r.emoji === emoji);
          
          if (existing) {
            if (!existing.users.some((u: any) => u.id === user.id)) {
              updatedCache[channelId] = channelMessages.map((msg, index) => 
                index === messageIndex 
                  ? {
                      ...msg,
                      reactions: msg.reactions.map((r: any) =>
                        r.emoji === emoji
                          ? { ...r, count: r.count + 1, users: [...r.users, { id: user.id, username: user.username, avatar: user.avatar }] }
                          : r
                      )
                    }
                  : msg
              );
            }
          } else {
            updatedCache[channelId] = channelMessages.map((msg, index) => 
              index === messageIndex 
                ? {
                    ...msg,
                    reactions: [
                      ...msg.reactions,
                      {
                        emoji,
                        count: 1,
                        users: [{ id: user.id, username: user.username, avatar: user.avatar }],
                      },
                    ]
                  }
                : msg
            );
          }
        }
      });
      return updatedCache;
    });

    try {
      const res = await apiService.addReaction(messageId, emoji);
      // The socket event will handle the real-time update, so we don't need to manually update here
      console.log('Reaction added successfully:', res);
    } catch (error) {
      console.error('Error adding reaction:', error);
      // Rollback: remove the optimistic reaction
      setMessages((prev: any[]) =>
        prev.map((msg: any) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            reactions: msg.reactions
              .map((r: any) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u.id !== user.id) }
                  : r
              )
              .filter((r: any) => r.count > 0),
          };
        })
      );
      
      // Also rollback message cache
      setMessageCache(prev => {
        const updatedCache = { ...prev };
        Object.keys(updatedCache).forEach(channelId => {
          const channelMessages = updatedCache[channelId] || [];
          const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
          
          if (messageIndex !== -1) {
            const msg = channelMessages[messageIndex];
            updatedCache[channelId] = channelMessages.map((msg, index) => 
              index === messageIndex 
                ? {
                    ...msg,
                    reactions: msg.reactions
                      .map((r: any) =>
                        r.emoji === emoji
                          ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u.id !== user.id) }
                          : r
                      )
                      .filter((r: any) => r.count > 0),
                  }
                : msg
            );
          }
        });
        return updatedCache;
      });
    }
  };

  const handleReactionRemove = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    // Optimistically update UI
    setMessages((prev: any[]) =>
      prev.map((msg: any) => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          reactions: msg.reactions
            .map((r: any) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u.id !== user.id) }
                : r
            )
            .filter((r: any) => r.count > 0),
        };
      })
    );

    // Also update message cache optimistically
    setMessageCache(prev => {
      const updatedCache = { ...prev };
      Object.keys(updatedCache).forEach(channelId => {
        const channelMessages = updatedCache[channelId] || [];
        const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
          const msg = channelMessages[messageIndex];
          updatedCache[channelId] = channelMessages.map((msg, index) => 
            index === messageIndex 
              ? {
                  ...msg,
                  reactions: msg.reactions
                    .map((r: any) =>
                      r.emoji === emoji
                        ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u.id !== user.id) }
                        : r
                    )
                    .filter((r: any) => r.count > 0),
                }
              : msg
          );
        }
      });
      return updatedCache;
    });

    try {
      const res = await apiService.removeReaction(messageId, emoji);
      // The socket event will handle the real-time update, so we don't need to manually update here
      console.log('Reaction removed successfully:', res);
    } catch (error) {
      console.error('Error removing reaction:', error);
      // Rollback: re-add the user's reaction
      setMessages((prev: any[]) =>
        prev.map((msg: any) => {
          if (msg.id !== messageId) return msg;
          const existing = msg.reactions.find((r: any) => r.emoji === emoji);
          if (existing) {
            return {
              ...msg,
              reactions: msg.reactions.map((r: any) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, { id: user.id, username: user.username, avatar: user.avatar }] }
                  : r
              ),
            };
          } else {
            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                {
                  emoji,
                  count: 1,
                  users: [{ id: user.id, username: user.username, avatar: user.avatar }],
                },
              ],
            };
          }
        })
      );
      
      // Also rollback message cache
      setMessageCache(prev => {
        const updatedCache = { ...prev };
        Object.keys(updatedCache).forEach(channelId => {
          const channelMessages = updatedCache[channelId] || [];
          const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
          
          if (messageIndex !== -1) {
            const msg = channelMessages[messageIndex];
            const existing = msg.reactions.find((r: any) => r.emoji === emoji);
            
            if (existing) {
              updatedCache[channelId] = channelMessages.map((msg, index) => 
                index === messageIndex 
                  ? {
                      ...msg,
                      reactions: msg.reactions.map((r: any) =>
                        r.emoji === emoji
                          ? { ...r, count: r.count + 1, users: [...r.users, { id: user.id, username: user.username, avatar: user.avatar }] }
                          : r
                      )
                    }
                  : msg
              );
            } else {
              updatedCache[channelId] = channelMessages.map((msg, index) => 
                index === messageIndex 
                  ? {
                      ...msg,
                      reactions: [
                        ...msg.reactions,
                        {
                          emoji,
                          count: 1,
                          users: [{ id: user.id, username: user.username, avatar: user.avatar }],
                        },
                      ]
                    }
                  : msg
              );
            }
          }
        });
        return updatedCache;
      });
    }
  };
  const handleReactionAdded = (data: any) => {
    console.log('Dashboard: Reaction added event received:', data);
    
    // Backend sends: { messageId, reactions: aggregatedReactions }
    // We need to find the channelId from the message cache
    setMessageCache(prev => {
      const updatedCache = { ...prev };
      
      // Find which channel contains this message
      Object.keys(updatedCache).forEach(channelId => {
        const channelMessages = updatedCache[channelId] || [];
        const messageIndex = channelMessages.findIndex(msg => msg.id === data.messageId);
        
        if (messageIndex !== -1) {
          // Update the message with new reactions
          updatedCache[channelId] = channelMessages.map((msg, index) => 
            index === messageIndex 
              ? { ...msg, reactions: data.reactions }
              : msg
          );
          
          // If this is the currently selected channel, update messages state too
          if (channelId === selectedChannel?.id) {
            setMessages(prev => prev.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, reactions: data.reactions }
                : msg
            ));
          }
        }
      });
      
      return updatedCache;
    });
  };

  const handleReactionRemoved = (data: any) => {
    console.log('Dashboard: Reaction removed event received:', data);
    
    // Backend sends: { messageId, reactions: aggregatedReactions }
    // We need to find the channelId from the message cache
    setMessageCache(prev => {
      const updatedCache = { ...prev };
      
      // Find which channel contains this message
      Object.keys(updatedCache).forEach(channelId => {
        const channelMessages = updatedCache[channelId] || [];
        const messageIndex = channelMessages.findIndex(msg => msg.id === data.messageId);
        
        if (messageIndex !== -1) {
          // Update the message with new reactions
          updatedCache[channelId] = channelMessages.map((msg, index) => 
            index === messageIndex 
              ? { ...msg, reactions: data.reactions }
              : msg
          );
          
          // If this is the currently selected channel, update messages state too
          if (channelId === selectedChannel?.id) {
            setMessages(prev => prev.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, reactions: data.reactions }
                : msg
            ));
          }
        }
      });
      
      return updatedCache;
    });
  };  

  return {
    messageCache,
    messages,
    selectedChannel,
    setMessages,
    setMessageCache,
    setSelectedChannel,
    handleNewMessage,
    handleReactionAdded,
    handleReactionRemoved,
    handleReactionAdd,
    handleReactionRemove,
    handleSendMessage,
    handleTyping,
  };
}