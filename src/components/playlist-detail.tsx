'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlaylistManager } from '@/lib/playlist-manager';
import { VideoGrid } from '@/components/video-grid';
import type { UserPlaylist, Video } from '@/types';

export function PlaylistDetail({ playlistId }: { playlistId: string }) {
  const [playlist, setPlaylist] = useState<UserPlaylist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPlaylist = async () => {
      const pl = PlaylistManager.getPlaylistById(playlistId);
      if (!pl) {
        router.push('/playlists');
        return;
      }
      setPlaylist(pl);

      if (pl.videos.length > 0) {
        // Fetch videos via API
        try {
          const response = await fetch(`/api/videos?ids=${pl.videos.join(',')}`);
          if (response.ok) {
            const data = await response.json();
            setVideos(data.videos || []);
          } else {
            console.error('Failed to fetch videos');
            setVideos([]);
          }
        } catch (error) {
          console.error('Error fetching videos:', error);
          setVideos([]);
        }
      }

      setLoading(false);
    };

    loadPlaylist();
  }, [playlistId, router]);

  const handleRemoveVideo = (videoId: string) => {
    PlaylistManager.removeVideoFromPlaylist(playlistId, videoId);
    setVideos(videos.filter(v => v.id !== videoId));
    setPlaylist(prev => prev ? { ...prev, videos: prev.videos.filter(id => id !== videoId) } : null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p>Playlist not found.</p>
        <Link href="/playlists" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
          Back to Playlists
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/playlists" style={{ color: '#3b82f6', textDecoration: 'underline', marginBottom: '16px', display: 'inline-block' }}>
          ← Back to Playlists
        </Link>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          {playlist.title}
        </h1>
        {playlist.description && (
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '16px' }}>
            {playlist.description}
          </p>
        )}
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          {playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}
        </p>
        {videos.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Link href={`/video/${videos[0].id}?playlist=${playlistId}&index=0`}>
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563eb')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = '#3b82f6')}
              >
                ▶️ Play All
              </button>
            </Link>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '24px' }}>
            This playlist is empty. Add some videos to get started!
          </p>
          <Link href="/search">
            <button
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Search for Videos
            </button>
          </Link>
        </div>
      ) : (
        <VideoGrid
          videos={videos}
          showRemoveFromPlaylist={true}
          onRemoveFromPlaylist={handleRemoveVideo}
          playlistId={playlistId}
        />
      )}
    </div>
  );
}