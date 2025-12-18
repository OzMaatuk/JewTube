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
      }}
      className="hover:shadow-2xl hover:-translate-y-2"
    >
      {/* Video icon */}
      <div className="flex items-center justify-center h-32 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-5xl">🎥</div>
      </div>

      {/* Video info */}
      <div className="p-4 space-y-3">
        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-gray-900 transition-colors hover:text-blue-600">
          {video.title}
        </h3>
        <p className="text-sm font-medium text-gray-700">{video.channelName}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatNumber(video.viewCount)} views</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        {video.duration > 0 && (
          <div className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
    </Link>
  );
}
