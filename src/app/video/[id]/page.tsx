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

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const contentService = getContentService();
  const video = await contentService.getVideoById(resolvedParams.id);

  if (!video) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <VideoPlayer video={video} />
        </div>
      </main>
      <Footer />
    </>
  );
}
