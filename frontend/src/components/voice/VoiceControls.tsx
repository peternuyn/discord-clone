'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mic, MicOff, Headphones, HeadphoneOff, Settings, Volume2 } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface VoiceControlsProps {
  className?: string;
}

export function VoiceControls({ className = '' }: VoiceControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [inputVolume, setInputVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(70);
  const { socket } = useSocket();

  const handleToggleMute = () => {
    if (!socket) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    socket.emit('voice:updateState', { isMuted: newMutedState });
  };

  const handleToggleDeafen = () => {
    if (!socket) return;
    
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    
    socket.emit('voice:updateState', { isDeafened: newDeafenedState });
  };

  const handleInputVolumeChange = (value: number[]) => {
    setInputVolume(value[0]);
    // TODO: Implement actual input volume control
  };

  const handleOutputVolumeChange = (value: number[]) => {
    setOutputVolume(value[0]);
    // TODO: Implement actual output volume control
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-2 p-2 bg-gray-800 rounded-lg ${className}`}>
        {/* Mute Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleToggleMute}
              className={`w-8 h-8 rounded-md transition-all duration-200 ${
                isMuted 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMuted ? 'Unmute' : 'Mute'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Deafen Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleToggleDeafen}
              className={`w-8 h-8 rounded-md transition-all duration-200 ${
                isDeafened 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isDeafened ? 'Undeafen' : 'Deafen'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Settings Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice Settings</p>
              </TooltipContent>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" side="top">
            <div className="space-y-4">
              <h4 className="font-medium text-white">Voice Settings</h4>
              
              {/* Input Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Input Volume</span>
                  <span className="text-sm text-gray-400">{inputVolume}%</span>
                </div>
                <Slider
                  value={[inputVolume]}
                  onValueChange={handleInputVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Output Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Output Volume</span>
                  <span className="text-sm text-gray-400">{outputVolume}%</span>
                </div>
                <Slider
                  value={[outputVolume]}
                  onValueChange={handleOutputVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Device Selection (placeholder) */}
              <div className="space-y-2">
                <span className="text-sm text-gray-300">Input Device</span>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                  <option>Default Microphone</option>
                  <option>Microphone 1</option>
                  <option>Microphone 2</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-300">Output Device</span>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white">
                  <option>Default Speakers</option>
                  <option>Headphones</option>
                  <option>Speakers</option>
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Volume Indicator */}
        <div className="flex items-center space-x-1">
          <Volume2 className="w-3 h-3 text-gray-400" />
          <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-400 rounded-full transition-all duration-200"
              style={{ width: `${outputVolume}%` }}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 