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
      className="group flex flex-col space-y-2 rounded-lg transition-transform hover:scale-[1.02]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="flex-1 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900 group-hover:text-primary">
          {video.title}
        </h3>
        <p className="text-xs text-gray-600">{video.channelName}</p>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{formatNumber(video.viewCount)} views</span>
          <span>•</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
