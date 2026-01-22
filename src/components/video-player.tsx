'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber } from '@/lib/utils';
import { PlaylistManager } from '@/lib/playlist-manager';
import { useAudioOnly } from '@/lib/audio-only-context';
import type { Video } from '@/types';

// YouTube API types
declare global {
  interface Window {
    YT: any;
  }
}

interface VideoPlayerProps {
  video: Video;
  playlistId?: string;
  currentIndex?: number;
}

export function VideoPlayer({ video, playlistId, currentIndex }: VideoPlayerProps) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState(() => PlaylistManager.getPlaylists());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'initializing' | 'ready' | 'error'>('idle');
  const isPlayerReady = playerStatus === 'ready';
  const isInitializing = playerStatus === 'initializing';
  const apiLoadError = playerStatus === 'error';

  const router = useRouter();
  const { isAudioOnly } = useAudioOnly();

  // Update player status based on audio-only mode
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayerStatus(isAudioOnly ? 'initializing' : 'idle');
  }, [isAudioOnly]);

  // YouTube iframe API integration
  useEffect(() => {
    if (!isAudioOnly) {
      // Cleanup player when switching away from audio-only mode
      const player = (window as any).youtubePlayer;
      if (player && player.destroy) {
        player.destroy();
      }
      return;
    }

    // Load YouTube IFrame Player API if not already loaded
    const loadYouTubeAPI = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).YT && (window as any).YT.Player) {
          resolve();
          return;
        }

        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          // Script is already loading, wait for it
          const checkReady = () => {
            if ((window as any).YT && (window as any).YT.Player) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onload = () => {
          const checkReady = () => {
            if ((window as any).YT && (window as any).YT.Player) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        };
        script.onerror = () => reject(new Error('Failed to load YouTube API'));
        document.head.appendChild(script);

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('YouTube API loading timeout')), 10000);
      });
    };

    // Load API and create invisible player
    loadYouTubeAPI().then(() => {
      try {
        // Create an invisible YouTube player
        const player = new (window as any).YT.Player('youtube-audio-player', {
          height: '1',
          width: '1',
          videoId: video.id,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onReady: (event: any) => {
              setPlayerStatus('ready');
              (window as any).youtubePlayer = event.target;
              // Set initial duration
              const dur = event.target.getDuration();
              if (dur && dur > 0) {
                setDuration(dur);
              }
            },
            onStateChange: (event: any) => {
              const newIsPlaying = event.data === 1; // 1 = playing
              setIsPlaying(newIsPlaying);

              // Update duration if not set yet
              if (event.data === 1 && duration === 0) { // 1 = playing
                const dur = event.target.getDuration();
                if (dur && dur > 0) {
                  setDuration(dur);
                }
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              setPlayerStatus('error');
            }
          }
        });
      } catch (error) {
        console.error('Failed to create YouTube player:', error);
        setPlayerStatus('error');
      }
    }).catch((error) => {
      console.error('Failed to load YouTube API:', error);
      setPlayerStatus('error');
    });

    return () => {
      // Cleanup player
      const player = (window as any).youtubePlayer;
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [isAudioOnly, video.id]);

  // Update current time while playing
  useEffect(() => {
    if (!isPlayerReady || !isPlaying) return;

    const updateTime = () => {
      try {
        const player = (window as any).youtubePlayer;
        if (player && player.getCurrentTime) {
          const current = player.getCurrentTime();
          if (current !== undefined && current >= 0) {
            setCurrentTime(current);
          }
        }
      } catch (error) {
        console.error('Error updating current time:', error);
      }
    };

    // Update immediately
    updateTime();

    // Update every 500ms while playing
    const interval = setInterval(updateTime, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying]);

  const sendToYouTube = (action: string, value?: any) => {
    if (!isPlayerReady || !(window as any).youtubePlayer) {
      console.warn('YouTube player not ready');
      return;
    }

    try {
      const player = (window as any).youtubePlayer;
      switch (action) {
        case 'playVideo':
          player.playVideo();
          break;
        case 'pauseVideo':
          player.pauseVideo();
          break;
        case 'stopVideo':
          player.stopVideo();
          break;
        case 'seekTo':
          player.seekTo(value, true);
          break;
        case 'setVolume':
          player.setVolume(value);
          break;
        default:
          console.warn('Unknown YouTube action:', action);
      }
    } catch (error) {
      console.error('Error sending command to YouTube player:', error);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      sendToYouTube('pauseVideo');
    } else {
      sendToYouTube('playVideo');
    }
  };

  const handleSeek = (time: number) => {
    sendToYouTube('seekTo', time);
    setCurrentTime(time); // Update UI immediately
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    sendToYouTube('setVolume', newVolume * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      {/* Video/Audio player */}
      {isAudioOnly ? (
        <div style={{ position: 'relative', width: '100%', height: '300px', borderRadius: '12px', backgroundColor: '#1f2937', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {/* Invisible YouTube player for audio playback */}
          <div
            id="youtube-audio-player"
            style={{
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1
            }}
          />

          {/* Audio Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '400px' }}>
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={!isPlayerReady || apiLoadError}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: (isPlayerReady && !apiLoadError) ? '#3b82f6' : '#6b7280',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: (isPlayerReady && !apiLoadError) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                opacity: (isPlayerReady && !apiLoadError) ? 1 : 0.6,
              }}
              onMouseOver={(e) => {
                if (isPlayerReady && !apiLoadError) (e.target as HTMLElement).style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                if (isPlayerReady && !apiLoadError) (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
              }}
            >
              {apiLoadError ? '❌' : (isInitializing ? '⏳' : (isPlaying ? '⏸️' : '▶️'))}
            </button>

            {/* Progress Bar */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '400px' }}>
              <span style={{ fontSize: '14px', color: '#9ca3af', minWidth: '40px' }}>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                disabled={!isPlayerReady}
                style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '3px',
                  background: '#374151',
                  outline: 'none',
                  cursor: isPlayerReady ? 'pointer' : 'not-allowed',
                  opacity: isPlayerReady ? 1 : 0.6,
                }}
              />
              <span style={{ fontSize: '14px', color: '#9ca3af', minWidth: '40px' }}>{formatTime(duration)}</span>
            </div>

            {/* Volume Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '200px' }}>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                disabled={!isPlayerReady}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: '#374151',
                  outline: 'none',
                  cursor: isPlayerReady ? 'pointer' : 'not-allowed',
                  opacity: isPlayerReady ? 1 : 0.6,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#000000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}

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
            <span>{formatNumber(video.viewCount || 0)} views</span>
            <span>•</span>
            <span suppressHydrationWarning>{formatDate(video.publishedAt)}</span>
            {video.likeCount && video.likeCount > 0 && (
              <>
                <span>•</span>
                <span>👍 {formatNumber(video.likeCount)}</span>
              </>
            )}
            <span>•</span>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowPlaylistMenu(!showPlaylistMenu);
                  setPlaylists(PlaylistManager.getPlaylists());
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#e5e7eb')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = '#f3f4f6')}
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
