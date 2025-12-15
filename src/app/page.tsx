'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, GridLayout, ParticipantTile, useTracks, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  participantName: string;
}

function StudioView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  // Filter out the host's own video (viewer identity)
  const guestTracks = tracks.filter(
    track => !track.participant.identity.startsWith('viewer-')
  );

  if (guestTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Animated icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <svg className="w-24 h-24 text-purple-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Main message */}
        <h2 className="text-3xl font-bold text-white mb-3 text-center">
          Aguardando Convidados...
        </h2>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
          Nenhum convidado ON AIR no momento
        </p>

        {/* Status indicator */}
        <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">Conectado ao LiveKit</span>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center max-w-lg">
          <p className="text-sm text-gray-500 mb-2">Para adicionar convidados:</p>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Envie convites pelo Dashboard</li>
            <li>2. Aguarde o convidado aceitar</li>
            <li>3. Mova o convidado para ON AIR</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <GridLayout
      tracks={guestTracks}
      style={{
        width: '1920px',
        height: '1080px',
        background: 'transparent',
      }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}

export default function StudioOutput() {
  const [token, setToken] = useState<LiveKitTokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get userId from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');

    if (!userIdParam) {
      setError('Missing userId parameter. Use: ?userId=YOUR_USER_ID');
      return;
    }

    setUserId(userIdParam);
    getViewerToken(userIdParam);
  }, []);

  const getViewerToken = async (userIdParam: string) => {
    try {
      const response = await axios.post<LiveKitTokenResponse>(
        `${API_BASE_URL}/livekit/token/viewer`,
        {
          viewerId: `viewer-obs-${Date.now()}`,
          userId: userIdParam
        }
      );
      setToken(response.data);
    } catch (err) {
      console.error('Error getting viewer token:', err);
      setError('Failed to connect to stream');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="text-red-400 text-2xl font-bold mb-4">{error}</div>
        {!userId && (
          <div className="text-gray-400 text-sm text-center max-w-md">
            <p className="mb-2">Para usar o Studio Output, adicione seu userId na URL:</p>
            <p className="text-blue-400 font-mono">http://localhost:3002/?userId=1</p>
            <p className="mt-4 text-xs text-gray-500">Você encontra seu userId no Dashboard após fazer login</p>
          </div>
        )}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="text-white text-xl">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black">
      <div style={{ width: '1920px', height: '1080px', background: 'transparent' }}>
        <LiveKitRoom
          video={false}
          audio={false}
          token={token.token}
          serverUrl={token.wsUrl}
          data-lk-theme="default"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          onDisconnected={() => {
            console.log('Disconnected from LiveKit');
            setTimeout(getViewerToken, 3000); // Auto-reconnect after 3s
          }}
          onError={(error) => {
            console.error('LiveKit error:', error);
            setError('Connection error');
          }}
        >
          <StudioView />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
