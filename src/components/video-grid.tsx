import type { Video } from '@/types';
import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: Video[];
  showRemoveFromPlaylist?: boolean;
  onRemoveFromPlaylist?: (videoId: string) => void;
}

export function VideoGrid({ videos, showRemoveFromPlaylist, onRemoveFromPlaylist }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', backgroundColor: 'white', padding: '64px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>No videos available</h2>
        <p style={{ color: '#6b7280' }}>Check back later for new content.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          showRemoveFromPlaylist={showRemoveFromPlaylist}
          onRemoveFromPlaylist={onRemoveFromPlaylist}
        />
      ))}
    </div>
  );
}
