import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { VideoGrid } from '@/components/video-grid';
import { VideoGridSkeleton } from '@/components/video-grid-skeleton';
import { getContentService } from '@/lib/services';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function VideoFeed() {
  const contentService = getContentService();
  const videos = await contentService.getVideos({ page: 1, limit: 20 });

  return <VideoGrid videos={videos} />;
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom right, #eff6ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '48px', paddingBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Discover Amazing Videos</h1>
            <p style={{ fontSize: '20px', color: '#6b7280', maxWidth: '512px', margin: '0 auto' }}>Curated video content just for you</p>
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
