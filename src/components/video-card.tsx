'use client';

import { formatDate, formatDuration, formatNumber } from '@/lib/utils';
import type { Video } from '@/types';
import Link from 'next/link';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      href={`/video/${video.id}`}
      style={{
        display: 'block',
        overflow: 'hidden',
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s',
        border: '1px solid #f3f4f6',
        transform: 'translateY(0)',
        minHeight: '200px',
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
          <span>{formatNumber(video.viewCount)} views</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        {video.duration > 0 && (
          <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
    </Link>
  );
}
