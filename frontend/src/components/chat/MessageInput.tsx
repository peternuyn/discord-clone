'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, 
  Paperclip, 
  Mic, 
  Send, 
  Image, 
  File, 
  Video, 
  Music,
  AtSign,
  Hash,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  ListOrdered
} from 'lucide-react';

interface MessageInputProps {
  channelName: string;
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢'
];

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯'];

export function MessageInput({ channelName, onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    
    if (message.length > 0) {
      setIsTyping(true);
      onTyping(true);
      
      typingTimer = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
      onTyping(false);
    }

    return () => clearTimeout(typingTimer);
  }, [message, onTyping]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const addFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);
    
    // Reset cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
      }
    }, 0);
  };

  return (
    <TooltipProvider>
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {/* Typing Indicator */}
        {isTyping && (
          <div className="mb-2 flex items-center space-x-2 text-sm text-gray-400 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>peter_dev is typing...</span>
          </div>
        )}

        <div className="flex items-end space-x-2">
          {/* Formatting Tools */}
          <div className="flex items-center space-x-1">
            <Popover open={showFormatting} onOpenChange={setShowFormatting}>
              <PopoverTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Bold className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Formatting</p>
                  </TooltipContent>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-gray-800 border-gray-600">
                <div className="grid grid-cols-4 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFormatting('bold')}
                    className="text-gray-300 hover:text-white"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFormatting('italic')}
                    className="text-gray-300 hover:text-white"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFormatting('code')}
                    className="text-gray-300 hover:text-white"
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFormatting('quote')}
                    className="text-gray-300 hover:text-white"
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* File Upload */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>

            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add emoji</p>
                  </TooltipContent>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2 bg-gray-800 border-gray-600">
                <div className="space-y-2">
                  <div className="flex space-x-1 mb-2">
                    {quickReactions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="p-2 hover:bg-gray-700 rounded transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${channelName}`}
              className="min-h-[44px] max-h-[120px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 resize-none pr-12"
              rows={1}
            />
            
            {/* Voice Recording Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                  className={`absolute right-2 bottom-2 ${
                    isRecording 
                      ? 'text-red-400 hover:text-red-300 animate-pulse' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? 'Stop recording' : 'Voice message'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Send Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center space-x-2 text-red-400 animate-in slide-in-from-bottom-2 duration-200">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording voice message...</span>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
              Stop
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 