# Voice Chat Implementation - Phase 1

## Overview

This document describes the Phase 1 implementation of voice chat functionality for the Discord clone. Phase 1 focuses on the basic voice infrastructure including backend voice room management and frontend voice channel UI.

## What's Implemented

### Backend Components

#### 1. Database Schema Updates
- **VoiceState Model**: Tracks user voice states (muted, deafened, speaking, current channel)
- **Channel Model**: Added `maxParticipants` field for voice channels
- **Relationships**: Proper relationships between users, channels, and voice states

#### 2. Voice Room Manager (`backend/src/realtime/voiceRoomManager.ts`)
- **Room Management**: Tracks active voice channels and participants
- **Join/Leave Logic**: Handles users joining and leaving voice channels
- **State Updates**: Manages mute, deafen, and speaking states
- **Permission Checks**: Verifies server membership before allowing voice access
- **Database Integration**: Syncs voice states with the database

#### 3. Socket.IO Integration (`backend/src/realtime/socketServer.ts`)
- **Voice Events**: Added voice-specific Socket.IO events
  - `voice:join` - Join a voice channel
  - `voice:leave` - Leave current voice channel
  - `voice:updateState` - Update mute/deafen/speaking state
- **Real-time Updates**: Broadcasts voice state changes to all participants
- **Error Handling**: Proper error responses for voice operations

#### 4. Voice API Routes (`backend/src/routes/voice.ts`)
- `GET /api/voice/channels/:channelId/participants` - Get voice channel participants
- `GET /api/voice/user/state` - Get current user's voice state
- `GET /api/voice/servers/:serverId/channels` - Get all voice channels for a server

### Frontend Components

#### 1. Voice Channel Component (`frontend/src/components/voice/VoiceChannel.tsx`)
- **Visual Indicators**: Shows voice channel status, participant count, speaking indicators
- **Join/Leave Buttons**: Interactive buttons to join or leave voice channels
- **Participant List**: Displays current participants with their states
- **Real-time Updates**: Listens for voice events and updates UI accordingly

#### 2. Voice Controls Component (`frontend/src/components/voice/VoiceControls.tsx`)
- **Mute/Unmute**: Toggle microphone mute state
- **Deafen/Undeafen**: Toggle audio output mute state
- **Volume Controls**: Input and output volume sliders
- **Settings Panel**: Device selection and audio preferences
- **Visual Feedback**: Shows current audio states with icons

#### 3. Socket Hook (`frontend/src/hooks/useSocket.ts`)
- **Connection Management**: Handles Socket.IO connection lifecycle
- **Event Handling**: Provides socket instance for voice events
- **Error Handling**: Manages connection errors and reconnection

#### 4. Dashboard Integration
- **Voice Channel List**: Updated server sidebar to use new VoiceChannel component
- **Voice Controls**: Added VoiceControls to user info bar
- **Real-time Updates**: Integrated voice events with existing Socket.IO setup

## Features

### ✅ Implemented
- Join/leave voice channels
- Mute/unmute microphone
- Deafen/undeafen (mute incoming audio)
- Real-time participant updates
- Voice state persistence in database
- Permission-based access control
- Visual indicators for voice states
- Speaking indicators (placeholder)
- Participant count display

### 🔄 Partially Implemented
- Voice activity detection (UI ready, backend logic needed)
- Volume controls (UI ready, actual audio control needed)
- Device selection (UI ready, WebRTC integration needed)

### ❌ Not Yet Implemented (Phase 2)
- WebRTC peer-to-peer connections
- Actual audio streaming
- Voice activity detection (audio analysis)
- Screen sharing
- Voice effects and filters
- Push-to-talk functionality

## Usage

### Joining a Voice Channel
1. Navigate to a server with voice channels
2. Click the headphones icon next to a voice channel
3. The channel will highlight and show participant list
4. Voice controls will appear in the user info bar

### Voice Controls
- **Microphone Button**: Toggle mute/unmute
- **Headphones Button**: Toggle deafen/undeafen
- **Settings Button**: Access volume controls and device selection

### Real-time Features
- See other participants join/leave in real-time
- View mute/deafen states of other users
- Speaking indicators (when implemented)
- Participant count updates

## Technical Details

### Socket Events

#### Client to Server
- `voice:join` - Join a voice channel
- `voice:leave` - Leave current voice channel
- `voice:updateState` - Update voice state (mute, deafen, speaking)

#### Server to Client
- `voice:joined` - Confirmation of joining voice channel
- `voice:left` - Confirmation of leaving voice channel
- `voice:userJoined` - Another user joined the channel
- `voice:userLeft` - Another user left the channel
- `voice:stateUpdate` - Another user's state changed
- `voice:error` - Error message for voice operations

### Database Schema

```sql
-- Voice states table
CREATE TABLE voice_states (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  channel_id TEXT,
  is_muted BOOLEAN DEFAULT FALSE,
  is_deafened BOOLEAN DEFAULT FALSE,
  is_speaking BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
);

-- Updated channels table
ALTER TABLE channels ADD COLUMN max_participants INTEGER;
```

## Testing

### Manual Testing Steps
1. Start both backend and frontend servers
2. Create or join a server with voice channels
3. Test joining/leaving voice channels
4. Test mute/deafen functionality
5. Test with multiple users (different browsers/tabs)
6. Verify real-time updates work correctly

### API Testing
```bash
# Get voice channel participants
curl -H "Cookie: token=YOUR_TOKEN" http://localhost:5000/api/voice/channels/CHANNEL_ID/participants

# Get user voice state
curl -H "Cookie: token=YOUR_TOKEN" http://localhost:5000/api/voice/user/state

# Get server voice channels
curl -H "Cookie: token=YOUR_TOKEN" http://localhost:5000/api/voice/servers/SERVER_ID/channels
```

## Next Steps (Phase 2)

1. **WebRTC Implementation**
   - Set up peer-to-peer connections
   - Implement audio stream handling
   - Add ICE candidate exchange

2. **Audio Processing**
   - Voice activity detection
   - Audio level monitoring
   - Echo cancellation and noise suppression

3. **Advanced Features**
   - Screen sharing
   - Voice effects
   - Push-to-talk
   - Voice channel permissions

4. **Performance Optimizations**
   - Connection pooling
   - Bandwidth management
   - Audio compression

## Files Modified/Created

### Backend
- `prisma/schema.prisma` - Added VoiceState model
- `src/realtime/voiceRoomManager.ts` - Voice room management
- `src/realtime/socketServer.ts` - Voice Socket.IO events
- `src/routes/voice.ts` - Voice API endpoints
- `src/index.ts` - Added voice routes

### Frontend
- `src/components/voice/VoiceChannel.tsx` - Voice channel component
- `src/components/voice/VoiceControls.tsx` - Voice controls component
- `src/hooks/useSocket.ts` - Socket.IO hook
- `src/app/dashboard/page.tsx` - Integrated voice components

## Dependencies

### Backend
- No new dependencies required (uses existing Socket.IO and Prisma)

### Frontend
- No new dependencies required (uses existing UI components and Socket.IO client) 