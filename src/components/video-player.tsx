'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber } from '@/lib/utils';
import { PlaylistManager } from '@/lib/playlist-manager';
import { useAudioOnly } from '@/lib/audio-only-context';
import type { Video } from '@/types';

// YouTube API types
declare global {
  interface Window {
    YT: any;
    youtubePlayer: any;
    Vimeo: any;
    vimeoPlayer: any;
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
  const playerRef = useRef<any>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const vimeoContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Update player status based on audio-only mode
  useLayoutEffect(() => {
    isMountedRef.current = true;
    setPlayerStatus(isAudioOnly ? 'initializing' : 'idle');
    return () => {
      isMountedRef.current = false;
    };
  }, [isAudioOnly]);

  // Platform abstraction for player control
  const getPlayer = () => {
    return playerRef.current;
  };

  // API loaders
  const loadYouTubeAPI = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).YT && (window as any).YT.Player) {
        resolve();
        return;
      }

      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const checkReady = () => {
          if ((window as any).YT && (window as any).YT.Player) resolve();
          else setTimeout(checkReady, 100);
        };
        checkReady();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onload = () => {
        const checkReady = () => {
          if ((window as any).YT && (window as any).YT.Player) resolve();
          else setTimeout(checkReady, 100);
        };
        checkReady();
      };
      script.onerror = () => reject(new Error('Failed to load YouTube API'));
      document.head.appendChild(script);
      setTimeout(() => reject(new Error('YouTube API loading timeout')), 10000);
    });
  };

  const loadVimeoAPI = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).Vimeo && (window as any).Vimeo.Player) {
        resolve();
        return;
      }

      if (document.querySelector('script[src*="vimeo.com/api/player.js"]')) {
        const checkReady = () => {
          if ((window as any).Vimeo && (window as any).Vimeo.Player) resolve();
          else setTimeout(checkReady, 100);
        };
        checkReady();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = () => {
        const checkReady = () => {
          if ((window as any).Vimeo && (window as any).Vimeo.Player) resolve();
          else setTimeout(checkReady, 100);
        };
        checkReady();
      };
      script.onerror = () => reject(new Error('Failed to load Vimeo API'));
      document.head.appendChild(script);
      setTimeout(() => reject(new Error('Vimeo API loading timeout')), 10000);
    });
  };

  // Player initialization
  useEffect(() => {
    let active = true;

    if (!isAudioOnly) {
      if (playerRef.current) {
        try {
          if (playerRef.current.destroy) playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying player:', e);
        }
        playerRef.current = null;
      }
      return;
    }

    const initPlayer = async () => {
      try {
        if (video.platform === 'youtube') {
          await loadYouTubeAPI();
          if (!active || !youtubeContainerRef.current) return;

          // Cleanup previous instance if any
          if (playerRef.current) {
            try { playerRef.current.destroy(); } catch (e) { }
          }

          playerRef.current = new (window as any).YT.Player(youtubeContainerRef.current, {
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
                if (!active) {
                  try { event.target.destroy(); } catch (e) { }
                  return;
                }
                setPlayerStatus('ready');
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(dur);
              },
              onStateChange: (event: any) => {
                if (!active) return;
                const newIsPlaying = event.data === 1; // 1 = playing
                setIsPlaying(newIsPlaying);
                if (event.data === 1 && duration === 0) {
                  const dur = event.target.getDuration();
                  if (dur && dur > 0) setDuration(dur);
                }
              },
              onError: (event: any) => {
                if (!active) return;
                console.error('YouTube player error:', event.data);
                setPlayerStatus('error');
              }
            }
          });
        } else if (video.platform === 'vimeo') {
          await loadVimeoAPI();
          if (!active || !vimeoContainerRef.current) return;

          // Cleanup previous instance if any
          if (playerRef.current) {
            try { playerRef.current.destroy(); } catch (e) { }
          }

          const player = new (window as any).Vimeo.Player(vimeoContainerRef.current, {
            id: video.id,
            width: 1,
            height: 1,
            autopause: false,
            muted: false
          });

          playerRef.current = player;

          player.ready().then(() => {
            if (!active) return;
            setPlayerStatus('ready');
            player.getDuration().then((dur: number) => {
              if (active && dur && dur > 0) setDuration(dur);
            });
          }).catch((error: any) => {
            if (!active) return;
            console.error('Vimeo player ready error:', error);
            setPlayerStatus('error');
          });

          player.on('play', () => active && setIsPlaying(true));
          player.on('pause', () => active && setIsPlaying(false));
          player.on('ended', () => active && setIsPlaying(false));
          player.on('error', (error: any) => {
            if (!active) return;
            console.error('Vimeo player error:', error);
            setPlayerStatus('error');
          });
        }
      } catch (error) {
        if (active) {
          console.error('Failed to initialize player:', error);
          setPlayerStatus('error');
        }
      }
    };

    initPlayer();

    return () => {
      active = false;
      if (playerRef.current) {
        try {
          if (playerRef.current.destroy) playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [isAudioOnly, video.id, video.platform]);

  // Update current time while playing
  useEffect(() => {
    if (!isPlayerReady || !isPlaying) return;

    const updateTime = async () => {
      try {
        const player = getPlayer();
        if (!player) return;

        if (video.platform === 'youtube' && player.getCurrentTime) {
          const current = player.getCurrentTime();
          if (current !== undefined && current >= 0) {
            setCurrentTime(current);
          }
        } else if (video.platform === 'vimeo' && player.getCurrentTime) {
          const current = await player.getCurrentTime();
          if (current !== undefined && current >= 0) {
            setCurrentTime(current);
          }
        }
      } catch (error) {
        console.error('Error updating current time:', error);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying, video.platform]);

  const sendCommand = (action: string, value?: any) => {
    if (!isPlayerReady) {
      console.warn('Player not ready');
      return;
    }

    const player = getPlayer();
    if (!player) {
      console.warn(`${video.platform} player not found`);
      return;
    }

    try {
      if (video.platform === 'youtube') {
        switch (action) {
          case 'play': player.playVideo(); break;
          case 'pause': player.pauseVideo(); break;
          case 'seek': player.seekTo(value, true); break;
          case 'setVolume': player.setVolume(value * 100); break;
        }
      } else if (video.platform === 'vimeo') {
        switch (action) {
          case 'play': player.play(); break;
          case 'pause': player.pause(); break;
          case 'seek': player.setCurrentTime(value); break;
          case 'setVolume': player.setVolume(value); break;
        }
      }
    } catch (error) {
      console.error(`Error sending command to ${video.platform} player:`, error);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      sendCommand('pause');
    } else {
      sendCommand('play');
    }
  };

  const handleSeek = (time: number) => {
    sendCommand('seek', time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    sendCommand('setVolume', newVolume);
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
        <div key="audio-player" style={{ position: 'relative', width: '100%', height: '300px', borderRadius: '12px', backgroundColor: '#1f2937', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {video.platform === 'youtube' ? (
            <>
              {/* Invisible YouTube player for audio playback */}
              <div
                ref={youtubeContainerRef}
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
            </>
          ) : video.platform === 'vimeo' ? (
            <>
              {/* Invisible Vimeo player for audio playback */}
              <div
                ref={vimeoContainerRef}
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
            </>
          ) : (
            <div style={{ color: 'white', textAlign: 'center' }}>
              <p>Audio-only mode is not yet supported for {video.platform}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Please disable audio-only mode to watch the video</p>
            </div>
          )}

          {/* Audio Controls (Shared for both platforms) */}
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
        <div key="video-player" style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#000000' }}>
          <iframe
            src={video.platform === 'vimeo'
              ? `https://player.vimeo.com/video/${video.id}?badge=0&autopause=0&player_id=0&app_id=58479`
              : `https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`
            }
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
