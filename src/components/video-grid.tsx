import type { Video } from '@/types';
import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 shadow-sm">
        <div className="text-6xl mb-4">📹</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No videos available</h2>
        <p className="text-gray-600">Check back later for new content.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
