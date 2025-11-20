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
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">Featured Videos</h1>
            <p className="text-lg text-gray-600">Discover amazing content curated just for you</p>
          </div>
          <Suspense fallback={<VideoGridSkeleton />}>
            <VideoFeed />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
