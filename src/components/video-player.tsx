'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber } from '@/lib/utils';
import { PlaylistManager } from '@/lib/playlist-manager';
import type { Video } from '@/types';

interface VideoPlayerProps {
  video: Video;
  playlistId?: string;
  currentIndex?: number;
}

export function VideoPlayer({ video, playlistId, currentIndex }: VideoPlayerProps) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState(() => PlaylistManager.getPlaylists());
  const router = useRouter();

  const handleAddToPlaylist = (playlistId: string) => {
    PlaylistManager.addVideoToPlaylist(playlistId, video.id);
    setShowPlaylistMenu(false);
    // Could add a toast notification here
  };

  const handleNextVideo = () => {
    if (!playlistId || currentIndex === undefined) return;
    
    const playlist = PlaylistManager.getPlaylistById(playlistId);
    if (!playlist) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.videos.length) {
      const nextVideoId = playlist.videos[nextIndex];
      router.push(`/video/${nextVideoId}?playlist=${playlistId}&index=${nextIndex}`);
    }
  };

  const handlePreviousVideo = () => {
    if (!playlistId || currentIndex === undefined || currentIndex === 0) return;
    
    const playlist = PlaylistManager.getPlaylistById(playlistId);
    if (!playlist) return;
    
    const prevIndex = currentIndex - 1;
    const prevVideoId = playlist.videos[prevIndex];
    router.push(`/video/${prevVideoId}?playlist=${playlistId}&index=${prevIndex}`);
  };
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Video player */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#000000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      {/* Video info */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', lineHeight: '1.3' }}>{video.title}</h1>
          {playlistId && currentIndex !== undefined && (
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              Playing from playlist • Video {currentIndex + 1} of {PlaylistManager.getPlaylistById(playlistId)?.videos.length || 0}
            </p>
          )}
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
            <span>{formatNumber(video.viewCount)} views</span>
            <span>•</span>
            <span>{formatDate(video.publishedAt)}</span>
            {video.likeCount && video.likeCount > 0 && (
              <>
                <span>•</span>
                <span>👍 {formatNumber(video.likeCount)}</span>
              </>
            )}
          </div>
        </div>

        {/* Channel info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: '600', color: '#1f2937' }}>{video.channelName}</h2>
            {video.categoryName && <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{video.categoryName}</p>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Playlist navigation */}
          {playlistId && currentIndex !== undefined && (
            <>
              <button
                onClick={handlePreviousVideo}
                disabled={currentIndex === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: currentIndex === 0 ? '#e5e7eb' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  if (currentIndex !== 0) (e.target as HTMLElement).style.backgroundColor = '#4b5563';
                }}
                onMouseOut={(e) => {
                  if (currentIndex !== 0) (e.target as HTMLElement).style.backgroundColor = '#6b7280';
                }}
              >
                ⏮️ Previous
              </button>
              <button
                onClick={handleNextVideo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#059669')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = '#10b981')}
              >
                Next ⏭️
              </button>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowPlaylistMenu(!showPlaylistMenu);
                setPlaylists(PlaylistManager.getPlaylists());
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = '#3b82f6')}
            >
              <span>+</span>
              Add to Playlist
            </button>
            {showPlaylistMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  minWidth: '200px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {playlists.filter(playlist => !playlist.videos.includes(video.id)).length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                    No playlists available
                  </div>
                ) : (
                  playlists.filter(playlist => !playlist.videos.includes(video.id)).map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                      onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#f3f4f6')}
                      onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = 'transparent')}
                    >
                      {playlist.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
            <h3 style={{ marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#374151' }}>{video.description}</p>
          </div>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {video.tags.slice(0, 10).map((tag) => (
              <span key={tag} style={{ borderRadius: '9999px', backgroundColor: '#f3f4f6', padding: '4px 12px', fontSize: '12px', color: '#374151' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
