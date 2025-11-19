'use client';

import { formatDate, formatNumber } from '@/lib/utils';
import type { Video } from '@/types';

interface VideoPlayerProps {
  video: Video;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Video player */}
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      {/* Video info */}
      <div className="mt-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
        <div className="flex items-center space-x-3 rounded-lg border p-4">
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{video.channelName}</h2>
            {video.categoryName && <p className="text-sm text-gray-600">{video.categoryName}</p>}
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{video.description}</p>
          </div>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.tags.slice(0, 10).map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
