import React from 'react';

export function VoiceAudioElements({ remoteStreams }: { remoteStreams: Record<string, MediaStream> }) {
  return (
    <>
        {Object.entries(remoteStreams).map(([userId, stream]) => (
            <audio
                key={userId}
                ref={el => { if (el) el.srcObject = stream; }}
                autoPlay
            />
        ))}
    </>
  );
}