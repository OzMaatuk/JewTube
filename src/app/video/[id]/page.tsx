import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { VideoPlayer } from '@/components/video-player';
import { getContentService } from '@/lib/services';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // Disable static generation
export const revalidate = 600; // Revalidate every 10 minutes

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const contentService = getContentService();
  const video = await contentService.getVideoById(resolvedParams.id);

  if (!video) {
    return { title: 'Video Not Found' };
  }

  return {
    title: video.title,
    description: video.description.slice(0, 160),
    openGraph: {
      title: video.title,
      description: video.description.slice(0, 160),
      images: [{ url: video.thumbnailHigh || video.thumbnail }],
      type: 'video.other',
    },
  };
}

export default async function VideoPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>; 
  searchParams: Promise<{ playlist?: string; index?: string }> 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const contentService = getContentService();
  const video = await contentService.getVideoById(resolvedParams.id);

  if (!video) {
    notFound();
  }

  const playlistId = resolvedSearchParams.playlist;
  const currentIndex = resolvedSearchParams.index ? parseInt(resolvedSearchParams.index, 10) : undefined;

  return (
    <>
      <Header />
      <main style={{ flex: 1, background: 'linear-gradient(to bottom, #f0f9ff, #ffffff, #f0fdf4)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '32px', paddingBottom: '32px' }}>
          <VideoPlayer 
            video={video} 
            playlistId={playlistId} 
            currentIndex={currentIndex} 
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
