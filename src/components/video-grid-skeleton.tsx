const SKELETON_ITEMS = Array.from({ length: 12 }, (_, i) => i);

export function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {SKELETON_ITEMS.map((i) => (
        <VideoCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col space-y-2 animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-video rounded-lg bg-gray-200" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
      </div>

      {/* Channel name skeleton */}
      <div className="h-3 w-1/2 rounded bg-gray-200" />

      {/* Metadata skeleton */}
      <div className="h-3 w-2/3 rounded bg-gray-200" />
    </div>
  );
}
