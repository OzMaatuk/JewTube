'use client';

import { useState } from 'react';
import { formatDate, formatDuration, formatNumber } from '@/lib/utils';
import { PlaylistManager } from '@/lib/playlist-manager';
import type { Video } from '@/types';
import Link from 'next/link';

interface VideoCardProps {
  video: Video;
  showRemoveFromPlaylist?: boolean;
  onRemoveFromPlaylist?: (videoId: string) => void;
  playlistId?: string;
  playlistIndex?: number;
}

export function VideoCard({ video, showRemoveFromPlaylist, onRemoveFromPlaylist, playlistId, playlistIndex }: VideoCardProps) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState(() => PlaylistManager.getPlaylists());

  const handleAddToPlaylist = (playlistId: string) => {
    PlaylistManager.addVideoToPlaylist(playlistId, video.id);
    setShowPlaylistMenu(false);
    // Could add a toast notification here
  };

  const handleRemoveFromPlaylist = () => {
    if (onRemoveFromPlaylist) {
      onRemoveFromPlaylist(video.id);
    }
  };

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s',
        border: '1px solid #f3f4f6',
        transform: 'translateY(0)',
        minHeight: '200px',
        position: 'relative',
      }}
    >
      <Link
        href={playlistId && playlistIndex !== undefined ? `/video/${video.id}?playlist=${playlistId}&index=${playlistIndex}` : `/video/${video.id}`}
        style={{
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {/* Video info */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' }}>
          <h3
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '18px', fontWeight: 'bold', lineHeight: '1.25', color: '#1f2937', transition: 'color 0.2s' }}
          >
            {video.title}
          </h3>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{video.channelName}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
            <span>{formatNumber(video.viewCount || 0)} views</span>
            <span suppressHydrationWarning>{formatDate(video.publishedAt)}</span>
          </div>
          {video.duration > 0 && (
            <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
      </Link>

      {/* Playlist actions */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
        {showRemoveFromPlaylist ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveFromPlaylist();
            }}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Remove from playlist"
          >
            ✕
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPlaylistMenu(!showPlaylistMenu);
                setPlaylists(PlaylistManager.getPlaylists());
              }}
              style={{
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Add to playlist"
            >
              +
            </button>
            {showPlaylistMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToPlaylist(playlist.id);
                      }}
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
        )}
      </div>
    </div>
  );
}
