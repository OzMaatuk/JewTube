'use client';

import { formatDate, formatNumber } from '@/lib/utils';
import type { Video } from '@/types';

interface VideoPlayerProps {
  video: Video;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
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
