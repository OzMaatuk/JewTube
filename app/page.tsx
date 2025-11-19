import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { VideoGrid } from '@/components/video-grid';
import { VideoGridSkeleton } from '@/components/video-grid-skeleton';
import { getContentService } from '@/lib/services';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic'; // Disable static generation
export const revalidate = 300; // Revalidate every 5 minutes (ISR)

async function VideoFeed() {
  const contentService = getContentService();
  const videos = await contentService.getVideos({ page: 1, limit: 20 });

  return <VideoGrid videos={videos} />;
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-3xl font-bold">Featured Videos</h1>
          <Suspense fallback={<VideoGridSkeleton />}>
            <VideoFeed />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
