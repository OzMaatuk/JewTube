import { formatDate, formatDuration, formatNumber } from '@/lib/utils';
import type { Video } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      href={`/video/${video.id}`}
      className="video-card-link group block rounded-xl p-3 shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200" style={{ position: 'relative' }}>
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="mt-3 space-y-2 px-1">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
          {video.title}
        </h3>
        <p className="text-sm font-medium text-gray-700">{video.channelName}</p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{formatNumber(video.viewCount)} views</span>
          <span>•</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
